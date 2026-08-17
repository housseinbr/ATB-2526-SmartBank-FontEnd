import { UserResponse } from './user-response';

export interface AddressData {
  idAddress?: number | null;
  country?: string | null;
  ville?: string | null;
  government?: string | null;
  documentLink?: string | null;
}

export interface BankAccountData {
  idAccount?: number | null;
  nameBenifice?: string | null;
  bankTitle?: string | null;
  ville?: string | null;
  compte?: string | null;
  controlleChiffre?: number | null;
  contry?: string | null;
  documentLink?: string | null;
}

export interface AdministrativeData {
  idAd?: number | null;
  situationEmploye?: string | null;
  cathegorieSituation?: string | null;
  classification?: string | null;
  qualification?: string | null;
  dateInscrit?: string | null;
  documentLink?: string | null;
}

export interface FamilySituationData {
  idUser?: number | null;
  situation?: string | null;
  documentUpload?: string | null;
  documentLink?: string | null;
}

export interface ContractData {
  idC?: number | null;
  nature?: string | null;
  typeContra?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  typeTemp?: string | null;
  dateAffectation?: string | null;
  post?: string | null;
  emploi?: string | null;
  taux?: number | null;
  lieu?: string | null;
  documentLink?: string | null;
}

export interface PersonChargeData {
  idPerson?: number | null;
  name?: string | null;
  lastName?: string | null;
  relation?: string | null;
  numTel?: string | null;
}

export interface PersonUrgentData {
  idPerson?: number | null;
  name?: string | null;
  lastName?: string | null;
  relation?: string | null;
  numTel?: string | null;
}

export interface UserProfileData {
  user: UserResponse;
  addresses: AddressData[];
  bankAccount: BankAccountData | null;
  administrativeData: AdministrativeData[];
  familySituation: FamilySituationData | null;
  contract: ContractData | null;
  dependents: PersonChargeData[];
  urgentContacts: PersonUrgentData[];
}
