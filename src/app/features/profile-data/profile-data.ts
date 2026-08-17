import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of } from 'rxjs';
import { AlertComponent } from '../../shared/components/alert/alert';
import { Icon } from '../../shared/components/icon/icon';
import { Toast, ToastType } from '../../shared/components/toast/toast';
import { AuthService } from '../../core/services/auth.service';
import { ProfileDataService } from '../../core/services/profile-data.service';
import { IconName } from '../../shared/components/icon/icon';
import {
  AddressData,
  AdministrativeData,
  BankAccountData,
  ContractData,
  FamilySituationData,
  PersonChargeData,
  PersonUrgentData,
  UserProfileData,
} from '../../core/models/profile-data';
import { Role } from '../../core/models/role';

type SectionKey = 'addresses' | 'bankAccount' | 'familySituation' | 'contract' | 'administrativeData' | 'dependents' | 'urgentContacts';

@Component({
  selector: 'app-profile-data',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, Toast, AlertComponent],
  templateUrl: './profile-data.html',
  styleUrl: './profile-data.css',
})
export class ProfileData {
  private authService = inject(AuthService);
  private profileDataService = inject(ProfileDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly Role = Role;

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  data = signal<UserProfileData | null>(null);
  selectedSection = signal<SectionKey>('addresses');
  targetUserId = signal<number | null>(null);
  readOnly = signal(false);

  // Onglet actif affiché dans le panneau principal (évite le scroll : une seule section visible à la fois)
  activeTab = signal<SectionKey>('addresses');
  // Contrôle l'ouverture de la modale d'ajout/modification
  modalOpen = signal(false);

readonly sectionTabs: { key: SectionKey; label: string; icon: IconName }[] = [
  { key: 'addresses', label: 'Adresse', icon: 'search' },
  { key: 'bankAccount', label: 'Banque', icon: 'briefcase' },
  { key: 'familySituation', label: 'Famille', icon: 'users' },
  { key: 'contract', label: 'Contrat', icon: 'file-text' },
  { key: 'administrativeData', label: 'Administratif', icon: 'file-text' },
  { key: 'dependents', label: 'À charge', icon: 'user' },
  { key: 'urgentContacts', label: 'Urgence', icon: 'bell' },
];

  addressForm = signal<AddressData>({});
  bankForm = signal<BankAccountData>({});
  familyForm = signal<FamilySituationData>({});
  contractForm = signal<ContractData>({});
  adminForm = signal<AdministrativeData>({});
  dependentForm = signal<PersonChargeData>({});
  urgentForm = signal<PersonUrgentData>({});
  bankDocumentFile = signal<File | null>(null);
  familyDocumentFile = signal<File | null>(null);
  contractDocumentFile = signal<File | null>(null);
  adminDocumentFile = signal<File | null>(null);
  documentPreviewUrls = signal<Record<string, string>>({});

  toastMessage = signal('');
  toastType = signal<ToastType>('success');
  toastVisible = signal(false);
  private toastTimeout?: ReturnType<typeof setTimeout>;

  alertVisible = signal(false);
  alertTitle = signal('');
  alertMessage = signal('');
  alertType = signal<'danger' | 'warning' | 'info'>('warning');
  private pendingDelete: (() => void) | null = null;

  constructor() {
    this.readOnly.set(this.router.url.includes('/dashboard/admin/'));
    const adminParam = this.route.snapshot.paramMap.get('id');
    const currentId = this.authService.currentUser()?.id ?? null;
    const resolvedId = adminParam ? Number(adminParam) : currentId;
    this.targetUserId.set(Number.isFinite(resolvedId as number) ? (resolvedId as number) : null);
    this.load();
  }

  user = computed(() => this.data()?.user ?? null);
  isAdminView = computed(() => this.readOnly());
  fullName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Profil utilisateur';
  });
  roleLabel = computed(() => this.user()?.role ?? '');
  sectionsFilled = computed(() => {
    const data = this.data();
    return [
      data?.addresses?.length ? 1 : 0,
      data?.bankAccount ? 1 : 0,
      data?.familySituation ? 1 : 0,
      data?.contract ? 1 : 0,
      data?.administrativeData?.length ? 1 : 0,
      data?.dependents?.length ? 1 : 0,
      data?.urgentContacts?.length ? 1 : 0,
    ].reduce((sum, value) => sum + value, 0);
  });
  summaryCards = computed(() => {
    const data = this.data();
    return {
      addresses: data?.addresses?.length ?? 0,
      dependents: data?.dependents?.length ?? 0,
      urgents: data?.urgentContacts?.length ?? 0,
      administrative: data?.administrativeData?.length ?? 0,
    };
  });
  addressItems = computed(() => this.data()?.addresses ?? []);
  administrativeItems = computed(() => this.data()?.administrativeData ?? []);
  dependentItems = computed(() => this.data()?.dependents ?? []);
  urgentItems = computed(() => this.data()?.urgentContacts ?? []);

  setActiveTab(key: SectionKey) {
    this.activeTab.set(key);
  }

  tabCount(key: SectionKey): number {
    const data = this.data();
    if (!data) return 0;
    switch (key) {
      case 'addresses':
        return data.addresses?.length ?? 0;
      case 'bankAccount':
        return data.bankAccount ? 1 : 0;
      case 'familySituation':
        return data.familySituation ? 1 : 0;
      case 'contract':
        return data.contract ? 1 : 0;
      case 'administrativeData':
        return data.administrativeData?.length ?? 0;
      case 'dependents':
        return data.dependents?.length ?? 0;
      case 'urgentContacts':
        return data.urgentContacts?.length ?? 0;
      default:
        return 0;
    }
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  showToast(message: string, type: ToastType = 'success', duration = 3000) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    this.toastTimeout = setTimeout(() => this.toastVisible.set(false), duration);
  }

  openAlert(title: string, message: string, type: 'danger' | 'warning' | 'info', onConfirm: () => void) {
    this.alertTitle.set(title);
    this.alertMessage.set(message);
    this.alertType.set(type);
    this.pendingDelete = onConfirm;
    this.alertVisible.set(true);
  }

  onAlertConfirm() {
    this.alertVisible.set(false);
    this.pendingDelete?.();
    this.pendingDelete = null;
  }

  onAlertCancel() {
    this.alertVisible.set(false);
    this.pendingDelete = null;
  }

  load() {
    const userId = this.targetUserId();
    if (!userId) {
      this.error.set('Utilisateur introuvable.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.profileDataService.getProfileData(userId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.data.set(response);
        this.patchFormsFromData(response);
        this.loadDocumentPreviews(response);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossible de charger les données du profil.');
      },
    });
  }

  selectSection(section: SectionKey) {
    this.selectedSection.set(section);
  }

  openCreate(section: SectionKey) {
    this.selectedSection.set(section);
    this.activeTab.set(section);
    this.resetForm(section);
    this.modalOpen.set(true);
  }

  openPrimaryAction(section: SectionKey) {
    const data = this.data();
    if (section === 'bankAccount' && data?.bankAccount) {
      this.openEdit(section, data.bankAccount);
      return;
    }
    if (section === 'familySituation' && data?.familySituation) {
      this.openEdit(section, data.familySituation);
      return;
    }
    if (section === 'contract' && data?.contract) {
      this.openEdit(section, data.contract);
      return;
    }
    this.openCreate(section);
  }

  openEdit(section: SectionKey, item: any) {
    this.selectedSection.set(section);
    this.activeTab.set(section);
    this.modalOpen.set(true);
    switch (section) {
      case 'addresses':
        this.addressForm.set({ ...item });
        break;
      case 'bankAccount':
        this.bankDocumentFile.set(null);
        this.bankForm.set({ ...item });
        break;
      case 'familySituation':
        this.familyDocumentFile.set(null);
        this.familyForm.set({ ...item });
        break;
      case 'contract':
        this.contractDocumentFile.set(null);
        this.contractForm.set({ ...item });
        break;
      case 'administrativeData':
        this.adminDocumentFile.set(null);
        this.adminForm.set({ ...item });
        break;
      case 'dependents':
        this.dependentForm.set({ ...item });
        break;
      case 'urgentContacts':
        this.urgentForm.set({ ...item });
        break;
    }
  }

  resetForm(section: SectionKey) {
    switch (section) {
      case 'addresses':
        this.addressForm.set({});
        break;
      case 'bankAccount':
        this.bankForm.set({});
        this.bankDocumentFile.set(null);
        break;
      case 'familySituation':
        this.familyForm.set({});
        this.familyDocumentFile.set(null);
        break;
      case 'contract':
        this.contractForm.set({});
        this.contractDocumentFile.set(null);
        break;
      case 'administrativeData':
        this.adminForm.set({});
        this.adminDocumentFile.set(null);
        break;
      case 'dependents':
        this.dependentForm.set({});
        break;
      case 'urgentContacts':
        this.urgentForm.set({});
        break;
    }
  }

  private patchFormsFromData(data: UserProfileData) {
    this.addressForm.set(data.addresses?.[0] ?? {});
    this.bankForm.set(data.bankAccount ?? {});
    this.familyForm.set(data.familySituation ?? {});
    this.contractForm.set(data.contract ?? {});
    this.adminForm.set(data.administrativeData?.[0] ?? {});
    this.dependentForm.set(data.dependents?.[0] ?? {});
    this.urgentForm.set(data.urgentContacts?.[0] ?? {});
    this.bankDocumentFile.set(null);
    this.familyDocumentFile.set(null);
    this.contractDocumentFile.set(null);
    this.adminDocumentFile.set(null);
  }

  private loadDocumentPreviews(data: UserProfileData) {
    const items: Array<[string, string | null | undefined]> = [
      [this.documentName(data.bankAccount?.documentLink), data.bankAccount?.documentLink],
      [this.documentName(data.familySituation?.documentLink), data.familySituation?.documentLink],
      [this.documentName(data.contract?.documentLink), data.contract?.documentLink],
      ...((data.administrativeData ?? []).map((item) => [this.documentName(item.documentLink), item.documentLink] as [string, string | null | undefined])),
    ];

    const requests = items
      .filter(([, documentLink]) => !!documentLink)
      .map(([key, documentLink]) =>
        this.profileDataService.getDocumentBlob(this.formatDocumentPath(documentLink!)).pipe(
          map((blob) => [key, URL.createObjectURL(blob)] as const),
          catchError(() => of([key, null] as const))
        )
      );

    if (!requests.length) {
      this.documentPreviewUrls.set({});
      return;
    }

    forkJoin(requests).subscribe({
      next: (entries) => {
        const nextUrls: Record<string, string> = {};
        for (const [key, url] of entries) {
          if (url) {
            nextUrls[key] = url;
          }
        }
        this.documentPreviewUrls.set(nextUrls);
      },
      error: () => {
        this.documentPreviewUrls.set({});
      },
    });
  }

  getSectionTitle(section: SectionKey): string {
    switch (section) {
      case 'addresses':
        return 'Adresse';
      case 'bankAccount':
        return 'Compte bancaire';
      case 'familySituation':
        return 'Situation familiale';
      case 'contract':
        return 'Contrat';
      case 'administrativeData':
        return 'Données administratives';
      case 'dependents':
        return 'Personne à charge';
      case 'urgentContacts':
        return 'Contact urgent';
      default:
        return '';
    }
  }

  getSectionDescription(section: SectionKey): string {
    switch (section) {
      case 'addresses':
        return 'Adresse principale et justificatif.';
      case 'bankAccount':
        return 'Informations bancaires pour les virements.';
      case 'familySituation':
        return 'Situation familiale et document associé.';
      case 'contract':
        return 'Contrat de travail et document associé.';
      case 'administrativeData':
        return 'Statut RH, classification et qualification.';
      case 'dependents':
        return 'Personnes à charge déclarées.';
      case 'urgentContacts':
        return 'Contacts à prévenir en cas d’urgence.';
      default:
        return '';
    }
  }

  hasData(section: SectionKey): boolean {
    const data = this.data();
    if (!data) return false;
    switch (section) {
      case 'addresses':
        return (data.addresses?.length ?? 0) > 0;
      case 'bankAccount':
        return !!data.bankAccount;
      case 'familySituation':
        return !!data.familySituation;
      case 'contract':
        return !!data.contract;
      case 'administrativeData':
        return (data.administrativeData?.length ?? 0) > 0;
      case 'dependents':
        return (data.dependents?.length ?? 0) > 0;
      case 'urgentContacts':
        return (data.urgentContacts?.length ?? 0) > 0;
      default:
        return false;
    }
  }

  currentLabel(section: SectionKey): string {
    return this.selectedSection() === section ? 'Ouvert' : 'Voir';
  }

  submitCurrent() {
    const userId = this.targetUserId();
    if (!userId || this.isAdminView()) {
      return;
    }

    this.saving.set(true);
    const section = this.selectedSection();
    const request = this.getCurrentPayload(section);
    if (!request) {
      this.saving.set(false);
      this.showToast('Veuillez compléter les champs obligatoires.', 'error');
      return;
    }

    const save$ = this.getSaveObservable(userId, section, request, this.getCurrentDocumentFile(section));
    save$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.showToast('Données enregistrées avec succès.', 'success');
        this.modalOpen.set(false);
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.showToast('Impossible d’enregistrer les données.', 'error');
      },
    });
  }

  private getCurrentPayload(
    section: SectionKey
  ): AddressData | BankAccountData | FamilySituationData | ContractData | AdministrativeData | PersonChargeData | PersonUrgentData | null {
    switch (section) {
      case 'addresses':
        return this.addressForm();
      case 'bankAccount':
        return this.bankForm();
      case 'familySituation':
        return this.familyForm();
      case 'contract':
        return this.contractForm();
      case 'administrativeData':
        return this.adminForm();
      case 'dependents':
        return this.dependentForm();
      case 'urgentContacts':
        return this.urgentForm();
      default:
        return null;
    }
  }

  private getSaveObservable(userId: number, section: SectionKey, payload: any, documentImage: File | null): Observable<any> {
    switch (section) {
      case 'addresses':
        return this.profileDataService.saveAddress(userId, payload);
      case 'bankAccount':
        return this.profileDataService.saveBankAccount(userId, payload, documentImage);
      case 'familySituation':
        return this.profileDataService.saveFamilySituation(userId, payload, documentImage);
      case 'contract':
        return this.profileDataService.saveContract(userId, payload, documentImage);
      case 'administrativeData':
        return this.profileDataService.saveAdministrativeData(userId, payload, documentImage);
      case 'dependents':
        return this.profileDataService.saveDependent(userId, payload);
      case 'urgentContacts':
        return this.profileDataService.saveUrgentContact(userId, payload);
      default:
        return this.profileDataService.getProfileData(userId);
    }
  }

  async deleteAddress(address: AddressData) {
    const userId = this.targetUserId();
    if (!userId || !address.idAddress) return;
    this.openAlert(
      'Supprimer cette adresse ?',
      'Cette action va supprimer définitivement cette adresse.',
      'danger',
      () => {
        this.profileDataService.deleteAddress(userId, address.idAddress!).subscribe({
          next: () => {
            this.showToast('Adresse supprimée.', 'success');
            this.load();
          },
          error: () => this.showToast('Suppression impossible.', 'error'),
        });
      }
    );
  }

  async deleteBankAccount() {
    const userId = this.targetUserId();
    if (!userId) return;
    this.openAlert('Supprimer le compte bancaire ?', 'Le compte bancaire sera retiré du profil.', 'warning', () => {
      this.profileDataService.deleteBankAccount(userId).subscribe({
        next: () => {
          this.showToast('Compte bancaire supprimé.', 'success');
          this.load();
        },
        error: () => this.showToast('Suppression impossible.', 'error'),
      });
    });
  }

  async deleteFamilySituation() {
    const userId = this.targetUserId();
    if (!userId) return;
    this.openAlert('Supprimer la situation familiale ?', 'Le document sera retiré du profil.', 'warning', () => {
      this.profileDataService.deleteFamilySituation(userId).subscribe({
        next: () => {
          this.showToast('Situation familiale supprimée.', 'success');
          this.load();
        },
        error: () => this.showToast('Suppression impossible.', 'error'),
      });
    });
  }

  async deleteAdministrativeData(item: AdministrativeData) {
    const userId = this.targetUserId();
    if (!userId || !item.idAd) return;
    this.openAlert('Supprimer cette donnée administrative ?', 'Cette action supprimera l’enregistrement sélectionné.', 'danger', () => {
      this.profileDataService.deleteAdministrativeData(userId, item.idAd!).subscribe({
        next: () => {
          this.showToast('Donnée administrative supprimée.', 'success');
          this.load();
        },
        error: () => this.showToast('Suppression impossible.', 'error'),
      });
    });
  }

  async deleteDependent(item: PersonChargeData) {
    const userId = this.targetUserId();
    if (!userId || !item.idPerson) return;
    this.openAlert('Supprimer cette personne à charge ?', 'L’enregistrement sera supprimé.', 'danger', () => {
      this.profileDataService.deleteDependent(userId, item.idPerson!).subscribe({
        next: () => {
          this.showToast('Personne supprimée.', 'success');
          this.load();
        },
        error: () => this.showToast('Suppression impossible.', 'error'),
      });
    });
  }

  async deleteUrgentContact(item: PersonUrgentData) {
    const userId = this.targetUserId();
    if (!userId || !item.idPerson) return;
    this.openAlert('Supprimer ce contact urgent ?', 'L’enregistrement sera supprimé.', 'danger', () => {
      this.profileDataService.deleteUrgentContact(userId, item.idPerson!).subscribe({
        next: () => {
          this.showToast('Contact urgent supprimé.', 'success');
          this.load();
        },
        error: () => this.showToast('Suppression impossible.', 'error'),
      });
    });
  }

  updateAddressField(field: keyof AddressData, value: string) {
    this.addressForm.update((current) => ({ ...current, [field]: value }));
  }

  updateBankField(field: keyof BankAccountData, value: string | number) {
    this.bankForm.update((current) => ({
      ...current,
      [field]: field === 'controlleChiffre' ? (value === '' ? null : Number(value)) : value,
    }));
  }

  updateFamilyField(field: keyof FamilySituationData, value: string) {
    this.familyForm.update((current) => ({ ...current, [field]: value }));
  }

  updateContractField(field: keyof ContractData, value: string | number) {
    this.contractForm.update((current) => ({
      ...current,
      [field]: field === 'taux' ? (value === '' ? null : Number(value)) : value,
    }));
  }

  updateAdministrativeField(field: keyof AdministrativeData, value: string) {
    this.adminForm.update((current) => ({ ...current, [field]: value }));
  }

  updateDependentField(field: keyof PersonChargeData, value: string) {
    this.dependentForm.update((current) => ({ ...current, [field]: value }));
  }

  updateUrgentField(field: keyof PersonUrgentData, value: string) {
    this.urgentForm.update((current) => ({ ...current, [field]: value }));
  }

  onBankDocumentSelected(event: Event) {
    this.bankDocumentFile.set(this.extractFile(event));
  }

  onFamilyDocumentSelected(event: Event) {
    this.familyDocumentFile.set(this.extractFile(event));
  }

  onContractDocumentSelected(event: Event) {
    this.contractDocumentFile.set(this.extractFile(event));
  }

  onAdminDocumentSelected(event: Event) {
    this.adminDocumentFile.set(this.extractFile(event));
  }

  getCurrentDocumentFile(section: SectionKey): File | null {
    switch (section) {
      case 'bankAccount':
        return this.bankDocumentFile();
      case 'familySituation':
        return this.familyDocumentFile();
      case 'contract':
        return this.contractDocumentFile();
      case 'administrativeData':
        return this.adminDocumentFile();
      default:
        return null;
    }
  }

  getDocumentLabel(section: SectionKey): string {
    const file = this.getCurrentDocumentFile(section);
    if (file) {
      return file.name;
    }
    const data = this.data();
    switch (section) {
      case 'bankAccount':
        return data?.bankAccount?.documentLink ? this.formatDocumentPath(data.bankAccount.documentLink) : 'Aucune image choisie';
      case 'familySituation':
        return data?.familySituation?.documentLink ? this.formatDocumentPath(data.familySituation.documentLink) : 'Aucune image choisie';
      case 'contract':
        return data?.contract?.documentLink ? this.formatDocumentPath(data.contract.documentLink) : 'Aucune image choisie';
      case 'administrativeData':
        return data?.administrativeData?.[0]?.documentLink ? this.formatDocumentPath(data.administrativeData[0].documentLink) : 'Aucune image choisie';
      default:
        return 'Aucune image';
    }
  }

  private extractFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    return input.files?.length ? input.files[0] : null;
  }

  formatDocumentPath(pathValue: string): string {
    const normalized = pathValue.replace(/\\/g, '/');
    return normalized.split('/').pop() || pathValue;
  }

  documentName(pathValue?: string | null): string {
    if (!pathValue) {
      return '—';
    }
    return this.formatDocumentPath(pathValue);
  }

  documentPreviewUrl(pathValue?: string | null): string | null {
    if (!pathValue) {
      return null;
    }
    return this.documentPreviewUrls()[this.documentName(pathValue)] ?? null;
  }

  sectionItems(section: SectionKey): Array<AddressData | AdministrativeData | PersonChargeData | PersonUrgentData> {
    const data = this.data();
    if (!data) return [];
    switch (section) {
      case 'addresses':
        return data.addresses ?? [];
      case 'administrativeData':
        return data.administrativeData ?? [];
      case 'dependents':
        return data.dependents ?? [];
      case 'urgentContacts':
        return data.urgentContacts ?? [];
      default:
        return [];
    }
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
  }
}
