
export interface Record {
  id: number;
  registrationNumber: string;
  expert: string;
  status: 'Виконано' | 'Не виконано';
  startDate: string;
  endDate:string;
  companyName: string;
  comment: string | null;
  units: number;
  models?: number;
  positions: number;
  codes?: number;
  complexity?: boolean;
  urgency: boolean;
  discount?: string;
  certificateForm?: string;
  pages?: number;
  additionalPages?: number;
  productionType?: 'fully_produced' | 'sufficient_processing';
  certificateServiceType?: 'standard' | 'replacement' | 'reissuance' | 'duplicate';
  actNumber?: string;
  conclusionType?: 'standard' | 'contractual';
}

export interface CostModelRow {
  id: number;
  models: number;
  upTo10: string;
  upTo20: string;
  upTo50: string;
  plus51: string;
}

export interface Firm {
  id: number;
  name: string;
  address: string;
  directorName: string;
  edrpou: string;
  taxNumber: string;
  productName: string;
}

export interface ExpertPlan {
  id: number;
  name: string;
  planAmount: string;
}

export interface GeneralSettings {
  urgency: number;
  
  // For conclusions
  codeCost?: number;
  discount?: number;
  complexity?: number;
  contractualPageCost?: number;

  // For certificates
  additionalPageCost?: number;
  replacementCost?: number;
  reissuanceCost?: number;
  duplicateCost?: number;
  fullyProduced_upTo20PagesCost?: number;
  fullyProduced_from21To200PagesCost?: number;
  fullyProduced_plus201PagesCost?: number;
  fullyProduced_additionalPositionCost?: number;
  sufficientProcessing_upTo20PagesCost?: number;
  sufficientProcessing_from21To200PagesCost?: number;
  sufficientProcessing_plus201PagesCost?: number;
  sufficientProcessing_additionalPositionCost?: number;
}

export interface MonthlyPlan {
  totalPlan: number;
  expertPlans: ExpertPlan[];
}

export type Theme = 'light' | 'dark';

export interface User {
  id: number;
  login: string;
  fullName: string;
  password?: string; // Password is plain text as requested
  role: 'admin' | 'user';
  email?: string;
}

export interface CurrentUser {
  login: string;
  fullName: string;
  role: 'admin' | 'user';
}