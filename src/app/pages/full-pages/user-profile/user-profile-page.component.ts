import {
  Component,
  ViewChild,
  OnInit,
  OnDestroy,
  Inject,
  Renderer2,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ConfigService } from 'app/shared/services/config.service';
import { LayoutService } from 'app/shared/services/layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';
import { ToastrService } from 'ngx-toastr';
import { SwiperDirective, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { UserServiceService } from 'app/shared/services/user-service.service';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
  styleUrls: ['./user-profile-page.component.scss']
})
export class UserProfilePageComponent implements OnInit, AfterViewInit, OnDestroy {
  public config: any = {};
  layoutSub: Subscription;

  public swipeConfig: SwiperConfigInterface = {
    slidesPerView: 'auto',
    centeredSlides: false,
    spaceBetween: 15
  };

  @ViewChild(SwiperDirective, { static: false }) directiveRef?: SwiperDirective;

  public userForm: FormGroup;
  public resetPasswordForm: FormGroup;
  // public profileImage: string | ArrayBuffer | null = 'assets/img/profile/user.png';
  public profileImage: string = 'assets/img/profile/user.png';
  activeTab: 'details' | 'password' = 'password'; // default active tab


  public userId: string = '';

  public roles: any[] = [];
  public companies: any[] = [];

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  hidePassword: boolean = true;
  hideOldPassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private configService: ConfigService,
    private layoutService: LayoutService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private userService: UserServiceService,
    private router: Router,
    private spinner: NgxSpinnerService

  ) {
    this.config = this.configService.templateConf;

    // Initialize User Profile Form
    this.userForm = this.fb.group({
      userName: [{ value: '', disabled: true }],
      fullName: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phoneNumber: [''],
      roles: [[]],
      companies: [[]]
    });

    // Initialize Reset Password Form
    this.resetPasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Password Validators (unchanged)
  passwordMatchValidator(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { passwordMismatch: true };
  }

  newNotEqualOldValidator(group: FormGroup) {
    const oldPass = group.get('oldPassword')?.value;
    const newPass = group.get('newPassword')?.value;
    return oldPass && newPass && oldPass === newPass ? { sameAsOld: true } : null;
  }

  ngOnInit() {
    this.activeTab = 'details';
    this.layoutSub = this.configService.templateConf$.subscribe(conf => {
      if (conf) {
        this.config = conf;
        this.cdr.detectChanges();
      }
    });

    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserData(this.userId);
    }

    this.loadRoles();
    this.loadCompanies();

    // Apply validator with both conditions
    this.resetPasswordForm.setValidators([this.passwordMatchValidator, this.newNotEqualOldValidator]);
  }

  ngAfterViewInit() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = true;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = false;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
    if (this.layoutSub) this.layoutSub.unsubscribe();
    this.cdr.detectChanges();
  }

  // Load roles for dropdown
  loadRoles() {
    this.companyService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = res?.$values || res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  // Load companies for dropdown
  loadCompanies() {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.companies = res?.result || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading companies:', err)
    });
  }

  // Load User Data
  loadUserData(id: string) {
    this.companyService.getprocurementusersbyid(id).subscribe({
      next: (res: any) => {
        // Patch data into form
        this.userForm.patchValue({
          userName: res.userName,
          fullName: res.fullName,
          email: res.email,
          phoneNumber: res.phoneNumber || '',
          roles: res.roles || [],
          companies: res.companies || []
        });

        if (res.profilePicture) {
          this.profileImage = res.profilePicture;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user data', err);
        this.toastr.error('Failed to load user data');
        this.cdr.detectChanges();
      }
    });
  }

  // Open Reset Password Modal (same logic)
  openResetPassword(content: any) {
    this.resetPasswordForm.reset();
    this.modalService.open(content, { centered: true, backdrop: 'static' });
    this.cdr.detectChanges();
  }

  // KEEP SAME RESET PASSWORD LOGIC
  onResetPassword() {
    if (this.resetPasswordForm.invalid || !this.userId) {
      this.toastr.error("Please fill all fields correctly");
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      userid: this.userId,
      oldPassword: this.resetPasswordForm.get('oldPassword')?.value,
      newPassword: this.resetPasswordForm.get('newPassword')?.value
    };

    this.companyService.resetPassword(payload).subscribe({
      next: () => {
        this.toastr.success('Password updated successfully');
        this.resetPasswordForm.reset();
        // modal.close();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error resetting password', err);
        this.toastr.error('Failed to reset password');
        this.cdr.detectChanges();
      }
    });
  }

  // Profile image upload preview
  // onProfileImageChange(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       this.profileImage = e.target?.result as string;
  //       // this.userService.updateProfilePicture(this.profileImage); // updates shared state
  //       this.cdr.detectChanges();
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }

  onProfileImageChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.profileImage = e.target?.result as string;
      this.cdr.detectChanges();

      if (!this.userId) {
        this.toastr.warning('User ID not found.');
        return;
      }

      const companies = this.userForm.get('companies')?.value || [];
      const selectedCompanyIds: number[] = companies.map((c: any) => Number(c.id));

      const roles = this.userForm.get('roles')?.value || [];
      const selectedRoleIds: string[] = roles.map((r: any) => r.id);

      const payload = {
        id: this.userId,
        fullName: this.userForm.get('fullName')?.value,
        userName: this.userForm.get('userName')?.value,
        email: this.userForm.get('email')?.value,
        phoneNumber: this.userForm.get('phoneNumber')?.value || '',
        isDeleted: false,
        profilePicture: this.profileImage,
        selectedCompanyIds,
        selectedRoleIds
      };

      // 🔹 Show spinner before API call
      this.spinner.show();

      this.companyService.ProcurmentuserUpdate(this.userId, payload)
        .pipe(finalize(() => {
          this.spinner.hide(); // 🔹 Always hide spinner
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: () => {
            this.toastr.success('Profile picture updated successfully');
            this.userService.updateProfilePicture(this.profileImage);
          },
          error: (err) => {
            console.error('Error updating profile picture:', err);
            this.toastr.error('Failed to update profile picture');
          }
        });
    };

    reader.readAsDataURL(file);
  }

  // Save user changes
  saveChanges() {
    if (!this.userId) {
      this.toastr.warning('User ID not found.');
      return;
    }

    const companies = this.userForm.get('companies')?.value || [];
    const selectedCompanyIds: number[] = companies.map((c: any) => Number(c.id));

    const roles = this.userForm.get('roles')?.value || [];
    const selectedRoleIds: string[] = roles.map((r: any) => r.id);

    const payload = {
      id: this.userId,
      fullName: this.userForm.get('fullName')?.value,
      userName: this.userForm.get('userName')?.value,
      email: this.userForm.get('email')?.value,
      phoneNumber: this.userForm.get('phoneNumber')?.value || '',
      isDeleted: false,
      profilePicture: this.profileImage || '',
      selectedCompanyIds: selectedCompanyIds,
      selectedRoleIds: selectedRoleIds
    };

    this.companyService.ProcurmentuserUpdate(this.userId, payload).subscribe({
      next: (response) => {
        this.toastr.success('User updated successfully');
        this.userService.updateProfilePicture(this.profileImage); // update after saving too
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.toastr.error('Failed to update user');
        this.cdr.detectChanges();
      }
    });
  }

  // Navigate back to dashboard
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }


  // Password Visibility

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'password':
        this.hidePassword = !this.hidePassword;
        break;
      case 'oldPassword':
        this.hideOldPassword = !this.hideOldPassword;
        break;
      case 'confirmPassword':
        this.hideConfirmPassword = !this.hideConfirmPassword;
        break;
    }
  }
}
