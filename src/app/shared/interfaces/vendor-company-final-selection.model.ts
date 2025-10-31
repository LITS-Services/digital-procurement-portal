export interface CompanyVM {
  companyId: string | null;
  companyName: string | null;
}

export interface VendorAndCompanyForFinalSelectionVM {
  vendorId: string | null;
  vendorName: string | null;
  companies: CompanyVM[];
}
