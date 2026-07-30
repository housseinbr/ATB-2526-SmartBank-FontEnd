import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddressData,
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
  private baseUrl = `${environment.apiUrl}/users`;

  getProfileData(userId: number): Observable<UserProfileData> {
    return this.http.get<UserProfileData>(`${this.baseUrl}/${userId}/profile-data`);
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
    return this.http.post<BankAccountData>(`${this.baseUrl}/${userId}/profile-data/bank-account/upload`, formData);
  }

  deleteBankAccount(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/bank-account`);
  }

  saveFamilySituation(userId: number, data: FamilySituationData, documentImage?: File | null): Observable<FamilySituationData> {
    const formData = new FormData();
    this.appendField(formData, 'situation', data.situation);
    this.appendField(formData, 'documentUpload', data.documentUpload);
    this.appendField(formData, 'documentLink', data.documentLink);
    if (documentImage) {
      formData.append('documentImage', documentImage);
    }
    return this.http.post<FamilySituationData>(`${this.baseUrl}/${userId}/profile-data/family-situation/upload`, formData);
  }

  deleteFamilySituation(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/family-situation`);
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
    return this.http.post<AdministrativeData>(`${this.baseUrl}/${userId}/profile-data/administrative-data/upload`, formData);
  }

  deleteAdministrativeData(userId: number, idAd: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/administrative-data/${idAd}`);
  }

  saveDependent(userId: number, data: PersonChargeData): Observable<PersonChargeData> {
    if (data.idPerson) {
      return this.http.put<PersonChargeData>(`${this.baseUrl}/${userId}/profile-data/dependents/${data.idPerson}`, data);
    }
    return this.http.post<PersonChargeData>(`${this.baseUrl}/${userId}/profile-data/dependents`, data);
  }

  deleteDependent(userId: number, idPerson: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/dependents/${idPerson}`);
  }

  saveUrgentContact(userId: number, data: PersonUrgentData): Observable<PersonUrgentData> {
    if (data.idPerson) {
      return this.http.put<PersonUrgentData>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts/${data.idPerson}`, data);
    }
    return this.http.post<PersonUrgentData>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts`, data);
  }

  deleteUrgentContact(userId: number, idPerson: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/profile-data/urgent-contacts/${idPerson}`);
  }

  private appendField(formData: FormData, key: string, value: unknown) {
    if (value === null || value === undefined || value === '') {
      return;
    }
    formData.append(key, String(value));
  }
}
