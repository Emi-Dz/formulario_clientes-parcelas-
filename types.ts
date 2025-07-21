export enum PaymentSystem {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
  QUINCENAL = 'QUINCENAL',
  MENSAL = 'MENSAL',
}

export type Language = 'es' | 'pt' | '';

export type ClientType = 'logista' | 'funcionario' | '';

export type UserRole = 'admin' | 'vendedor';

export type ClientStatus = 'apto' | 'no_apto';

export interface AuthUser {
    id: string;
    username: string;
    role: UserRole;
}

export interface UserWithPassword extends AuthUser {
    password?: string;
}

export interface SaleData {
    id: string; 
    timestamp: string;
    clientFullName: string;
    clientCpf: string;
    purchaseDate: string;
    phone: string;
    product: string;
    
    // User inputs these:
    totalProductPrice: number;
    downPayment: number;
    installments: number;
    
    // This is calculated:
    installmentPrice: number;

    reference1Name: string;
    reference1Relationship: string;
    reference2Name: string;
    reference2Relationship: string;
    
    language: Language;
    storeName: string;
    
    workLocation: string;
    workAddress: string;
    homeLocation: string;
    homeAddress: string;
    
    photoStoreFileName: string;
    photoContractFrontFileName: string;
    photoContractBackFileName: string;
    photoIdFrontFileName: string;
    photoIdBackFileName: string;
    photoCpfFileName: string;
    photoHomeFileName: string;
    photoPhoneCodeFileName: string;
    photoFaceFileName: string;
    
    clientType: ClientType;
    paymentSystem: PaymentSystem;
    paymentStartDate: string;
    
    vendedor: string;
    guarantor: string;
    photoInstagramFileName: string;
    notes: string;

    // New field for client eligibility status
    clientStatus: ClientStatus;
}
