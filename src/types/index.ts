export interface BaseDTOResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface SelectOptions {
  value: string;
  label: string;
}
