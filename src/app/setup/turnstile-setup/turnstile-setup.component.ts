import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-turnstile-setup',
  templateUrl: './turnstile-setup.component.html',
  styleUrls: ['./turnstile-setup.component.scss'],
  standalone: false
})
export class TurnstileSetupComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  procurementEnabled = false;
  vendorEnabled = false;
  loading = false;
  saving = false;
  private baseUrl = `${environment.apiUrl}/System`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  homePage(): void {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  load(): void {
    this.loading = true;
    this.spinner.show();
    this.http.get<{
      enabled?: boolean;
      Enabled?: boolean;
      procurementEnabled?: boolean;
      ProcurementEnabled?: boolean;
      vendorEnabled?: boolean;
      VendorEnabled?: boolean;
    }>(`${this.baseUrl}/turnstile-settings`)
      .subscribe({
        next: (res) => {
          this.procurementEnabled = !!(res?.procurementEnabled ?? res?.ProcurementEnabled ?? res?.enabled ?? res?.Enabled);
          this.vendorEnabled = !!(res?.vendorEnabled ?? res?.VendorEnabled);
          this.loading = false;
          this.spinner.hide();
        },
        error: () => {
          this.loading = false;
          this.spinner.hide();
          this.toastr.error('Failed to load Turnstile settings.');
        }
      });
  }

  onToggleProcurement(checked: boolean): void {
    this.save(checked, this.vendorEnabled, 'Procurement');
  }

  onToggleVendor(checked: boolean): void {
    this.save(this.procurementEnabled, checked, 'Vendor');
  }

  private save(procurementEnabled: boolean, vendorEnabled: boolean, portalLabel: string): void {
    this.saving = true;
    this.http.put<{ procurementEnabled?: boolean; vendorEnabled?: boolean }>(
      `${this.baseUrl}/turnstile-settings`,
      { procurementEnabled, vendorEnabled }
    ).subscribe({
      next: (res) => {
        this.procurementEnabled = !!(res?.procurementEnabled ?? procurementEnabled);
        this.vendorEnabled = !!(res?.vendorEnabled ?? vendorEnabled);
        this.saving = false;
        const on = portalLabel === 'Vendor' ? this.vendorEnabled : this.procurementEnabled;
        this.toastr.success(
          on
            ? `${portalLabel} login captcha enabled.`
            : `${portalLabel} login captcha disabled.`
        );
      },
      error: () => {
        this.load();
        this.saving = false;
        this.toastr.error('Failed to save Turnstile settings.');
      }
    });
  }
}
