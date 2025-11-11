// company.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { LookupService } from 'app/shared/services/lookup.service';

@Injectable({ providedIn: 'root' })
export class DashboardResolver implements Resolve<any> {
  constructor(private lookupService: LookupService) {}

  async resolve(): Promise<any> {
    const userId = localStorage.getItem('userId');
    if (!userId) return [];

    const companies = await this.lookupService
      .getProcCompaniesByProcUserId(userId)
      .toPromise(); 
      
      const raw = localStorage.getItem('selectedCompanyId');
      if (raw === null) {
        localStorage.setItem('selectedCompanyId', 'All'); // default to All
      }

    return companies;
  }
}
