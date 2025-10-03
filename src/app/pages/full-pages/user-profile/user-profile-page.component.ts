import { Component, ViewChild, OnInit, OnDestroy, Inject, Renderer2, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ConfigService } from 'app/shared/services/config.service';
import { LayoutService } from 'app/shared/services/layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';
import { ToastrService } from 'ngx-toastr';

import { SwiperDirective, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  public profileImage: string | ArrayBuffer | null = 'assets/img/profile/user.png';
  public userId: string;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private configService: ConfigService,
    private layoutService: LayoutService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    this.config = this.configService.templateConf;

    // User Profile Form
    this.userForm = this.fb.group({
      userName: [{ value: '', disabled: true }],
      fullName: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phoneNumber: [''],
      officeLocation: [''],
      mailingAddress: [''],
      roles: [[]],
      companies: [[]]
    });

    // Reset Password Form
    this.resetPasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.layoutSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) {
        this.config = templateConf;
        this.cdr.detectChanges(); // ✅ detectChanges added
      }
    });

    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserData(this.userId);
    }

    this.resetPasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{6,}$/) // at least 1 uppercase & 1 number
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: [this.passwordMatchValidator, this.newNotEqualOldValidator] });
  }

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

  ngAfterViewInit() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = true;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
    this.cdr.detectChanges(); // ✅ detectChanges added
  }

  ngOnDestroy() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = false;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
    this.cdr.detectChanges(); // ✅ detectChanges added
  }

  openResetPassword(content: any) {
    this.resetPasswordForm.reset();
    this.modalService.open(content, { centered: true, backdrop: 'static' });
    this.cdr.detectChanges(); // ✅ detectChanges added
  }

  onResetPassword(modal: any) {
    if (this.resetPasswordForm.invalid || !this.userId) {
      this.toastr.error("Please fill all fields correctly");
      this.cdr.detectChanges(); // ✅ detectChanges added
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
        modal.close();
        this.cdr.detectChanges(); // ✅ detectChanges added
      },
      error: (err) => {
        console.error('Error resetting password', err);
        this.toastr.error('Failed to reset password');
        this.cdr.detectChanges(); // ✅ detectChanges added
      }
    });
  }

  loadUserData(id: string) {
    this.companyService.getprocurementusersbyid(id).subscribe({
      next: (res) => {
        this.userForm.patchValue({
          userName: res.userName,
          fullName: res.fullName,
          email: res.email,
          phoneNumber: res.phoneNumber || '',
          officeLocation: '',
          mailingAddress: '',
          roles: res.roles?.$values || [],
          companies: res.companies?.$values || []
        });

        if (res.profilePicture) {
          this.profileImage = res.profilePicture;
        }
        this.cdr.detectChanges(); // ✅ detectChanges added
      },
      error: (err) => {
        console.error('Error loading user data', err);
        this.toastr.error('Failed to load user data');
        this.cdr.detectChanges(); // ✅ detectChanges added
      }
    });
  }

  onProfileImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImage = e.target?.result as string;
        this.cdr.detectChanges(); // ✅ detectChanges added
      };
      reader.readAsDataURL(file);
    }
  }

  saveChanges() {
    if (!this.userId) return;

    const companies = this.userForm.get('companies')?.value || [];
    const selectedCompanyIds: number[] = companies.map((c: any) => Number(c.id));

    const roles = this.userForm.get('roles')?.value || [];
    const selectedRoleIds: string[] = roles.map((r: any) => r.id);

    const updateData = {
      id: this.userId,
      fullName: this.userForm.get('fullName')?.value,
      userName: this.userForm.get('userName')?.value,
      email: this.userForm.get('email')?.value,
      phoneNumber: this.userForm.get('phoneNumber')?.value,
      isDeleted: false,
      profilePicture: this.profileImage,
      selectedCompanyIds: selectedCompanyIds,
      selectedRoleIds: selectedRoleIds
    };

    this.companyService.ProcurmentuserUpdate(this.userId, updateData).subscribe({
      next: () => {
        this.toastr.success('User updated successfully');
        this.cdr.detectChanges(); // ✅ detectChanges added
      },
      error: (err) => {
        console.error('Error updating user', err);
        this.toastr.error('Failed to update user');
        this.cdr.detectChanges(); // ✅ detectChanges added
      }
    });
  }
}
