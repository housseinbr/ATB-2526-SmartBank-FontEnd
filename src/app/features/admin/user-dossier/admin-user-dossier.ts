import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserResponse } from '../../../core/models/user-response';
import { UserService } from '../../../core/services/user.service';
import { Competance, } from '../../../core/models/competance';
import { CompetanceService } from '../../../core/services/competance.service';
import { EvaluationItem, EvaluationService } from '../../../core/services/evaluation.service';
import { MobiliteRequest } from '../../../core/models/rh-requests';
import { MobiliteService } from '../../../core/services/mobilite.service';
import { AiConversation, AiService } from '../../../core/services/ai.service';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { HistorySold } from '../../../core/models/absence';
import { ProfileDataService } from '../../../core/services/profile-data.service';
import { UserProfileData } from '../../../core/models/profile-data';

@Component({
  selector: 'app-admin-user-dossier', standalone: true, imports: [CommonModule, RouterLink],
  templateUrl: './admin-user-dossier.html', styleUrl: './admin-user-dossier.css',
})
export class AdminUserDossier implements OnInit {
  private route = inject(ActivatedRoute); private users = inject(UserService); private competancesApi = inject(CompetanceService);
  private evaluationsApi = inject(EvaluationService); private mobilitesApi = inject(MobiliteService); private ai = inject(AiService);
  private absences = inject(AbsenceApiService); private profile = inject(ProfileDataService);
  readonly user = signal<UserResponse | null>(null); readonly competances = signal<Competance[]>([]); readonly evaluations = signal<EvaluationItem[]>([]);
  readonly mobilities = signal<MobiliteRequest[]>([]); readonly conversations = signal<AiConversation[]>([]); readonly history = signal<HistorySold[]>([]);
  readonly profileData = signal<UserProfileData | null>(null); readonly tab = signal<'overview'|'competences'|'evaluations'|'mobilite'|'ai'|'data'>('overview'); readonly loading = signal(true);
  readonly initials = () => { const value = this.user(); return `${value?.firstName?.[0] ?? ''}${value?.lastName?.[0] ?? ''}`; };
  readonly fullName = () => { const value = this.user(); return `${value?.firstName ?? ''} ${value?.lastName ?? ''}`.trim(); };
  readonly userMeta = () => { const value = this.user(); return `${value?.email ?? ''} · ${value?.role ?? ''} · ${value?.actif ?? ''}`; };
  maskDocument(value?: string | null): string { return value ? 'Document disponible' : 'Aucun document'; }
  valueOrDash(value?: string | number | null): string { return value === null || value === undefined || value === '' ? '—' : String(value); }
  ngOnInit(): void { const id = Number(this.route.snapshot.paramMap.get('id')); if (!id) return; this.users.getUserById(id).subscribe({next: u => this.user.set(u)}); this.competancesApi.getForUser(id).subscribe({next: x => this.competances.set(x)}); this.evaluationsApi.managed().subscribe({next: x => this.evaluations.set(x.filter(item => item.user?.id === id))}); this.mobilitesApi.getManaged().subscribe({next: x => this.mobilities.set(x.filter(item => item.user?.id === id))}); this.ai.adminConversations(id).subscribe({next: x => this.conversations.set(x)}); this.absences.getHistoryForUser(id).subscribe({next: x => this.history.set(x)}); this.profile.getProfileData(id).subscribe({next: x => this.profileData.set(x), complete: () => this.loading.set(false), error: () => this.loading.set(false)}); }
  select(tab: 'overview'|'competences'|'evaluations'|'mobilite'|'ai'|'data'): void { this.tab.set(tab); }
}