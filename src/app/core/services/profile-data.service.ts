import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  AddressData,
  ContractData,
  AdministrativeData,
  BankAccountData,
  FamilySituationData,
  PersonChargeData,
  PersonUrgentData,
  UserProfileData,
} from '../models/profile-data';

@Injectable({ providedIn: 'root' })
export class ProfileDataService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/users`;

  getProfileData(userId: number): Observable<UserProfileData> {
    return this.http.get<UserProfileData>(`${this.baseUrl}/${userId}/profile-data`);
  }

  getDocumentBlob(fileName: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/documents/${encodeURIComponent(fileName)}`, { responseType: 'blob' });
  }

  saveAddress(userId: number, data: AddressData): Observable<AddressData> {
    if (data.idAddress) {
      return this.http.put<AddressData>(`${this.baseUrl}/${userId}/profile-data/addresses/${data.idAddress}`, data);
    }
    return this.http.post<AddressData>(`${this.baseUrl}/${userId}/profile-data/addresses`, data);
  }

  deleteAddress(userId: number, addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/addresses/${addressId}`);
  }

  saveBankAccount(userId: number, data: BankAccountData, documentImage?: File | null): Observable<BankAccountData> {
    const formData = new FormData();
    this.appendField(formData, 'nameBenifice', data.nameBenifice);
    this.appendField(formData, 'bankTitle', data.bankTitle);
    this.appendField(formData, 'ville', data.ville);
    this.appendField(formData, 'compte', data.compte);
    this.appendField(formData, 'controlleChiffre', data.controlleChiffre);
    this.appendField(formData, 'contry', data.contry);
    this.appendField(formData, 'documentLink', data.documentLink);
    if (documentImage) {
      formData.append('documentImage', documentImage);
    }
    return this.http.post<BankAccountData>(`${this.baseUrl}/${userId}/profile-data/bank-account/upload`, formData, {
      headers: this.authHeaders(),
    });
  }

  deleteBankAccount(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/bank-account`, {
      headers: this.authHeaders(),
    });
  }

  saveFamilySituation(userId: number, data: FamilySituationData, documentImage?: File | null): Observable<FamilySituationData> {
    const formData = new FormData();
    this.appendField(formData, 'situation', data.situation);
    this.appendField(formData, 'documentUpload', data.documentUpload);
    this.appendField(formData, 'documentLink', data.documentLink);
    if (documentImage) {
      formData.append('documentImage', documentImage);
    }
    return this.http.post<FamilySituationData>(`${this.baseUrl}/${userId}/profile-data/family-situation/upload`, formData, {
      headers: this.authHeaders(),
    });
  }

  deleteFamilySituation(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/family-situation`, {
      headers: this.authHeaders(),
    });
  }

  saveContract(userId: number, data: ContractData, documentImage?: File | null): Observable<ContractData> {
    const formData = new FormData();
    this.appendField(formData, 'nature', data.nature);
    this.appendField(formData, 'typeContra', data.typeContra);
    this.appendField(formData, 'dateStart', data.dateStart);
    this.appendField(formData, 'dateEnd', data.dateEnd);
    this.appendField(formData, 'typeTemp', data.typeTemp);
    this.appendField(formData, 'dateAffectation', data.dateAffectation);
    this.appendField(formData, 'post', data.post);
    this.appendField(formData, 'emploi', data.emploi);
    this.appendField(formData, 'taux', data.taux);
    this.appendField(formData, 'lieu', data.lieu);
    this.appendField(formData, 'documentLink', data.documentLink);
    if (documentImage) {
      formData.append('documentImage', documentImage);
    }
    return this.http.post<ContractData>(`${this.baseUrl}/${userId}/profile-data/contract/upload`, formData, {
      headers: this.authHeaders(),
    });
  }

  deleteContract(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/contract`, {
      headers: this.authHeaders(),
    });
  }

  saveAdministrativeData(userId: number, data: AdministrativeData, documentImage?: File | null): Observable<AdministrativeData> {
    const formData = new FormData();
    this.appendField(formData, 'situationEmploye', data.situationEmploye);
    this.appendField(formData, 'cathegorieSituation', data.cathegorieSituation);
    this.appendField(formData, 'classification', data.classification);
    this.appendField(formData, 'qualification', data.qualification);
    this.appendField(formData, 'dateInscrit', data.dateInscrit);
    this.appendField(formData, 'documentLink', data.documentLink);
    if (documentImage) {
      formData.append('documentImage', documentImage);
    }
    return this.http.post<AdministrativeData>(`${this.baseUrl}/${userId}/profile-data/administrative-data/upload`, formData, {
      headers: this.authHeaders(),
    });
  }

  deleteAdministrativeData(userId: number, idAd: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/administrative-data/${idAd}`, {
      headers: this.authHeaders(),
    });
  }

  saveDependent(userId: number, data: PersonChargeData): Observable<PersonChargeData> {
    if (data.idPerson) {
      return this.http.put<PersonChargeData>(`${this.baseUrl}/${userId}/profile-data/dependents/${data.idPerson}`, data, {
        headers: this.authHeaders(),
      });
    }
    return this.http.post<PersonChargeData>(`${this.baseUrl}/${userId}/profile-data/dependents`, data, {
      headers: this.authHeaders(),
    });
  }

  deleteDependent(userId: number, idPerson: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/dependents/${idPerson}`, {
      headers: this.authHeaders(),
    });
  }

  saveUrgentContact(userId: number, data: PersonUrgentData): Observable<PersonUrgentData> {
    if (data.idPerson) {
      return this.http.put<PersonUrgentData>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts/${data.idPerson}`, data, {
        headers: this.authHeaders(),
      });
    }
    return this.http.post<PersonUrgentData>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts`, data, {
      headers: this.authHeaders(),
    });
  }

  deleteUrgentContact(userId: number, idPerson: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts/${idPerson}`, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private appendField(formData: FormData, key: string, value: unknown) {
    if (value === null || value === undefined || value === '') {
      return;
    }
    formData.append(key, String(value));
  }
}
