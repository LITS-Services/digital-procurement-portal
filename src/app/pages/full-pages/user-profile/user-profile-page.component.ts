import { Component, ViewChild, OnInit, OnDestroy, Inject, Renderer2, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ConfigService } from 'app/shared/services/config.service';
import { LayoutService } from 'app/shared/services/layout.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';
import { ToastrService } from 'ngx-toastr';

import { SwiperDirective, SwiperConfigInterface } from 'ngx-swiper-wrapper';

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
  public profileImage: string | ArrayBuffer | null = 'assets/img/profile/user.png';
  public userId: string;

  constructor(
    private configService: ConfigService,
    private layoutService: LayoutService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private toastr: ToastrService
  ) {
    this.config = this.configService.templateConf;

    // Initialize form
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
  }

  ngOnInit() {
    this.layoutSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) {
        this.config = templateConf;
      }
      this.cdr.markForCheck();
    });

    // Get userId from localStorage
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadUserData(this.userId);
    }
  }

  ngAfterViewInit() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = true;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
  }

  ngOnDestroy() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = false;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  // Load user data from API
  loadUserData(id: string) {
    this.companyService.getprocurementusersbyid(id).subscribe({
      next: (res) => {
        this.userForm.patchValue({
          userName: res.userName,
          fullName: res.fullName,
          email: res.email,
          phoneNumber: res.phoneNumber || '',
          officeLocation: '', // Map if API provides
          mailingAddress: '', // Map if API provides
          roles: res.roles?.$values || [],
          companies: res.companies?.$values || []
        });

        // Set profile image Base64 if exists
        if (res.profilePicture) {
          this.profileImage = res.profilePicture;
        }
      },
      error: (err) => {
        console.error('Error loading user data', err);
        this.toastr.error('Failed to load user data');
      }
    });
  }

  // Handle profile image change and convert to Base64
  onProfileImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Save the image as Base64 string
        this.profileImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Save form changes
  saveChanges() {
    if (!this.userId) return;

    // Map company IDs as numbers
    const companies = this.userForm.get('companies')?.value || [];
    const selectedCompanyIds: number[] = companies.map((c: any) => Number(c.id));

    // Map role IDs as strings
    const roles = this.userForm.get('roles')?.value || [];
    const selectedRoleIds: string[] = roles.map((r: any) => r.id);

    const updateData = {
      id: this.userId,
      fullName: this.userForm.get('fullName')?.value,
      userName: this.userForm.get('userName')?.value,
      email: this.userForm.get('email')?.value,
      phoneNumber: this.userForm.get('phoneNumber')?.value,
      isDeleted: false,
      profilePicture: this.profileImage, // Base64 string
      selectedCompanyIds: selectedCompanyIds,
      selectedRoleIds: selectedRoleIds
    };

    // Call API
    this.companyService.ProcurmentuserUpdate(this.userId, updateData).subscribe({
      next: () => {
        this.toastr.success('User updated successfully');
      },
      error: (err) => {
        console.error('Error updating user', err);
        this.toastr.error('Failed to update user');
      }
    });
  }
}
