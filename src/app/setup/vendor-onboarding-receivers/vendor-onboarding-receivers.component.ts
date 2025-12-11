import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-vendor-onboarding-receivers',
  templateUrl: './vendor-onboarding-receivers.component.html',
  styleUrls: ['./vendor-onboarding-receivers.component.scss'],
  standalone: false
})
export class VendorOnboardingReceiversComponent implements OnInit {

  @Input() onboardingId!: number;
  @Input() onboardingRoleId!: string;
  @Input() onboardingentityId!: number;
  @Input() data: any;

  roles: any[] = [];
  entitiesList: any[] = [];
  receiversList: any;
  public chkBoxSelected = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadRoles(() => {
      this.loadEntities();
      // this.loadFilteredReceivers(this.onboardingentityId, this.onboardingRoleId);
      this.loadReceiversList();
    });
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  loadFilteredReceivers(entityId: number, roleId: string): void {
    console.log('%c[loadFilteredReceivers Triggered]', 'color: #1976d2; font-weight: bold;');
    console.log('➡️ Entity ID:', entityId);
    console.log('➡️ Role ID:', roleId);

    if (!entityId || !roleId) {
      console.warn('Missing entityId or roleId. Skipping API call.');
      return;
    }

    this.spinner.show();
    console.log('Loading receivers for Entity:', entityId, 'and Role:', roleId);

    this.companyService.getFilteredReceivers(entityId, roleId)
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          // Normalize API response structure
          this.receiversList = res?.$values || res || [];
          console.log('Receivers loaded successfully:', this.receiversList);
        },
        error: (err) => {
          console.error('Error loading filtered receivers:', err);
          this.toastr.error('Failed to load receivers. Please try again.');
          this.receiversList = [];
        }
      });
  }

  loadRoles(callback?: () => void) {
    this.spinner.show();
    this.companyService.getRoles()
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
          // Execute callback if provided (after roles are loaded)
          if (callback) {
            console.log('Roles loaded, executing callback');
            callback();
          }
        })
      )
      .subscribe({
        next: (res: any) => {
          this.roles = res?.$values || res || [];
          console.log('Roles loaded successfully:', this.roles);
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.toastr.error('Failed to load roles. Please try again.');
          // Still execute callback even if error
          if (callback) {
            callback();
          }
        }
      });
  }

  loadEntities() {
    this.spinner.show();
    this.companyService
      .getProCompanies()
      .pipe(finalize(() => { this.spinner.hide(); this.cdr.detectChanges(); }))
      .subscribe({
        next: (res: any) => {
          const companies = res?.result || [];
          this.entitiesList = companies.map((c: any) => ({
            ...c,
            status: c.isDeleted ? 'Inactive' : 'Active',
            logo: c.logo || ''
          }));
          console.log('Entities loaded:', this.entitiesList);
        },
        error: (err) => {
          console.error('Error fetching companies:', err);
          this.toastr.error('Failed to load companies. Please try again.');
        }
      });
  }


  loadReceiversList(): void {
    if (!this.onboardingId) {
      console.warn('onboardingId is missing. Skipping loadReceiversList.');
      this.receiversList = [];
      return;
    }

    console.log('%c[loadReceiversList] Triggered for onboardingId:', 'color: #1976d2; font-weight: bold;', this.onboardingId);
    this.spinner.show();

    this.companyService
      .getReceiversSetupid(this.onboardingId)
      .pipe(finalize(() => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          // Defensive check in case API wraps data
          this.receiversList = Array.isArray(res) ? res : res?.$values || res?.data || [];
          console.log('%c✅ Receivers loaded:', 'color: green; font-weight: bold;', this.receiversList);

          if (this.receiversList.length === 0) {
            this.toastr.info('No receivers found for this setup.');
          }
        },
        error: (err) => {
          console.error('%c❌ Error fetching receivers:', 'color: red; font-weight: bold;', err);
          this.toastr.error('Failed to load receivers. Please try again.');
          this.receiversList = [];
        }
      });
  }

  getRoleName(roleId: string): string {
    if (!roleId || !this.roles?.length) return '—';
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : '—';
  }

  getEntityName(entityId: number): string {
    if (!entityId || !this.entitiesList?.length) return '—';
    const entity = this.entitiesList.find(e => e.id === entityId);
    return entity ? entity.name : '—';
  }

}
