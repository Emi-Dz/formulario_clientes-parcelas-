export enum PaymentSystem {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
}

export type Language = 'es' | 'pt' | '';

export type ClientType = 'logista' | 'funcionario' | '';

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
    
    photoStoreFileName: string | File;
    photoContractFrontFileName: string | File;
    photoContractBackFileName: string | File;
    photoIdFrontFileName: string | File;
    photoIdBackFileName: string | File;
    photoCpfFileName: string | File;
    photoHomeFileName: string | File;
    photoPhoneCodeFileName: string | File;
    
    clientType: ClientType;
    paymentSystem: PaymentSystem;
    paymentStartDate: string;
    
    vendedor: string;
    guarantor: string;
    photoInstagramFileName: string | File;
    notes: string;
}
