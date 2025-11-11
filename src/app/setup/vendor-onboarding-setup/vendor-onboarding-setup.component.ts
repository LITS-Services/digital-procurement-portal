import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-vendor-onboarding-setup',
  templateUrl: './vendor-onboarding-setup.component.html',
  styleUrls: ['./vendor-onboarding-setup.component.scss']
})
export class VendorOnboardingSetupComponent implements OnInit {
  vendorOnboardingForm: FormGroup;
  vendorOnboardingList: any[] = [];
  vendorOnboardingData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  constructor(
    private fb: FormBuilder,
    private router: Router,

  ) {

    this.vendorOnboardingForm = this.fb.group({
      SetupName: ['', Validators.required],
      Entities: ['', Validators.required],
      Roles: ['', Validators.required],
      Initiatiors: ['', Validators.required],
      Description: ['', Validators.required],
      status: [false],
    });

  }

  ngOnInit(): void {
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  NewVendorOnboarding() {
    this.router.navigate(['/setup/create-vendor-onboarding']);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
  }

  onSort(event) {
    setTimeout(() => {
      const sort = event.sorts[0];
      this.vendorOnboardingData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
    }, 200);
  }

  onUpdate() {
    const onboardingId = this.chkBoxSelected[0].onboardingId;
    this.router.navigate(['/setup/create-vendor-onboarding'], {
      queryParams: { id: onboardingId, mode: 'Edit' }, skipLocationChange: true
    });
  }

}
