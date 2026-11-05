export interface RequestStatus {
  status: string;
  id: number;
  [key: string]: any; 
}

export interface BankDetail {
  vendorCompanyId?: number;
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

export interface UsersDetail {
  userName: string;
  userEmail: string;
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
  extension?: string;
  isPrimary?: boolean;
}

export interface DemographicDetail {
  vendorType: string;
  primaryCurrency: string;
  lineOfBusiness: string;
  employeeResponsible: string;
  note: string;
  segment?: string;
  speciality?: string;
  chain?: string;
  birthCountry?: string;
}

export interface AttachmentDetail {
  id: number;
  fileName: string;
  fileType: string;
  sizeInKb: number;
  file?: File;
}

export interface Company {
  companyGUID: string;
  name: string;
  logo: string;
  remarks: string;
  trn?: string;
  websiteUrl?: string;
  paymentTerm?: string;
  paymentMethod?: string;
  vendorPostingGroup?: string;
  generalBusinessPostingGroup?: string;
  vatBusinessPostingGroup?: string;
  requestStatusId?: number;
  requestStatus?: RequestStatus;
  bankDetails: BankDetail[];
  addresses: AddressDetail[];
  contacts: ContactDetail[];
  users: UsersDetail[];
  demographics: DemographicDetail | null;
  attachments: AttachmentDetail[];
}

/** Excel row interfaces **/
export type CompaniesRow = {
  CompanyKey?: string;
  Name?: string;
  Remarks?: string;
  TRN?: string | number;
  WebsiteUrl?: string;
  PaymentTerm?: string;
  PaymentMethod?: string;
  VendorPostingGroup?: string;
  GeneralBusinessPostingGroup?: string;
  VATBusinessPostingGroup?: string;
};

export type UserRow = {
  UserName?: string;
  UserEmail?: string;
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
  ContactNumber?: string;
  Extension?: string | number;
  IsPrimary?: string;
};

export type BankRow = {
  CompanyKey?: string;
  BankName?: string;
  AccountHolderName?: string;
  AccountNumber?: string | number;
  IBAN?: string;
  SwiftCode?: string;
  SWIFT_BIC_Code?: string;
  BranchName?: string;
  BranchAddress?: string;
  Country?: string;
  Currency?: string;
};

export type DemographicsRow = {
  VendorType?: string;
  PrimaryCurrency?: string;
  LineOfBusiness?: string;
  EmployeeResponsible?: string;
  Note?: string;
  Segment?: string;
  Speciality?: string;
  Chain?: string;
  BirthCountry?: string;
};
