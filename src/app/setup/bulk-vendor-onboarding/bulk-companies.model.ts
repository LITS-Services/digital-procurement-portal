export interface RequestStatus {
  status: string;
  id: number;
[key: string]: any; 
}

export interface BankDetail {
  vendorCompanyId?: number;        // not used yet (no API)
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string;
  swifT_BIC_Code: string;
  branchName: string;
  branchAddress: string;
  country: string;
  currency: string;
  id?: number;
  createdDate?: string;
  createdBy?: string;
  isDeleted?: boolean;
}

export interface AddressDetail {
  id?: number;
  street: string;
  isPrimary: string;
  city: string;
  state?: string;
  country: string;
  zip?: string;
}

export interface ContactDetail {
  id?: number;
  description: string;
  type?: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
}

export interface DemographicDetail {
  vendorType: string;
  primaryCurrency: string;
  lineOfBusiness: string;
  employeeResponsible: string;
  note:string;
}

export interface AttachmentDetail {
  id: number;
  fileName: string;
  fileType: string;
  sizeInKb: number;
  // keep reference to File for later API upload
  file?: File;
}

export interface Company {
  companyGUID: string; // you can treat this as CompanyKey or generate GUID later
  name: string;
  logo: string;
  remarks: string;
  requestStatusId?: number;
  requestStatus?: RequestStatus;
  bankDetails: BankDetail[];
  addresses: AddressDetail[];
  contacts: ContactDetail[];
  demographics: DemographicDetail | null;
  attachments: AttachmentDetail[];
}

/** Excel row interfaces **/
export type CompaniesRow = {
  CompanyKey?: string;
  Name?: string;
  Remarks?: string;
};

export type AddressRow = {
  CompanyKey?: string;
  Street?: string;
  IsPrimary?: string;
  City?: string;
  State?: string;
  Country?: string;
  Zip?: string;
};

export type ContactRow = {
  CompanyKey?: string;
  Description?: string;
  Type?: string;
  Email?: string;
  Phone?: string;
  IsPrimary?: string;
};

export type BankRow = {
  CompanyKey?: string;
  BankName?: string;
  AccountHolderName?: string;
  AccountNumber?: string;
  IBAN?: string;
  SwiftCode?: string;
  BranchName?: string;
  BranchAddress?: string;
  Country?: string;
  Currency?: string;
};

export type DemographicsRow = {
  VendorType: string;
  PrimaryCurrency: string;
  LineOfBusiness: string;
  EmployeeResponsible: string;
  Note:string;
}