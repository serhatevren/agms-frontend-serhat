export interface StudentUser {
  id: string;
  name: string;
  surname: string;
  email: string;
}

export enum CeremonyStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface Ceremony {
  id: string;
  ceremonyDate: string;
  ceremonyLocation: string;
  ceremonyDescription: string;
  ceremonyStatus: CeremonyStatus;
  academicYear: string;
  studentAffairsId: string;
  studentUsers: StudentUser[];
}

export interface CreateCeremonyRequest {
  ceremonyDate: string;
  ceremonyLocation: string;
  ceremonyDescription: string;
  ceremonyStatus: CeremonyStatus;
  academicYear: string;
  studentAffairsId: string;
}

export interface UpdateCeremonyRequest extends CreateCeremonyRequest {
  id: string;
}

export interface CeremonyListResponse {
  items: Ceremony[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
