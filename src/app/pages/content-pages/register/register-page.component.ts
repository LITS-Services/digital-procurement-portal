import { Component, OnInit, HostListener } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MustMatch } from '../../../shared/directives/must-match.validator';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit {
  registerFormSubmitted = false;
  registerForm: UntypedFormGroup;
  procurmentCompanies: any[] = [];
  selectedCompanies: any[] = [];
  dropdownOpen = false; // Control dropdown visibility

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      Username: ['', Validators.required],
      Fullname: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['User', Validators.required],
      companyGUIDs: this.formBuilder.array([], Validators.required),
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });

    this.loadProcurmentCompanies();
  }

  get rf() { return this.registerForm.controls; }
  get companyFormArray(): FormArray { return this.registerForm.get('companyGUIDs') as FormArray; }

  // Label for dropdown
  get selectedCompaniesLabel(): string {
    return this.selectedCompanies.length > 0
      ? this.selectedCompanies.map(c => c.name).join(', ')
      : 'Select Companies';
  }

  // Load companies
  loadProcurmentCompanies() {
    this.spinner.show();
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.procurmentCompanies = res?.$values || [];
      },
      error: (err) => {
        this.spinner.hide();
        this.toastr.error('Error fetching procurement companies ❌');
      }
    });
  }

  // Dropdown toggle
  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    const target = event.target;
    if (!target.closest('.dropdown')) {
      this.dropdownOpen = false;
    }
  }

  // Check if selected
  isCompanySelected(companyGUID: string): boolean {
    return this.selectedCompanies.some(c => c.companyGUID === companyGUID);
  }

  // Select/unselect company
  toggleCompanySelection(event: any, company: any) {
    if (event.target.checked) {
      this.selectedCompanies.push(company);
      this.companyFormArray.push(this.formBuilder.control(company.companyGUID));
    } else {
      const index = this.selectedCompanies.findIndex(c => c.companyGUID === company.companyGUID);
      if (index >= 0) this.selectedCompanies.splice(index, 1);

      const formIndex = this.companyFormArray.controls.findIndex(x => x.value === company.companyGUID);
      if (formIndex >= 0) this.companyFormArray.removeAt(formIndex);
    }
  }

  // Form submission
  onSubmit() {
    this.registerFormSubmitted = true;
    if (this.registerForm.invalid) return;

    const registerData = {
      Username: this.registerForm.value.Username,
      Fullname: this.registerForm.value.Username,
      Email: this.registerForm.value.email,
      Password: this.registerForm.value.password,
      Role: this.registerForm.value.role,
      CompanyGUIDs: this.companyFormArray.value
    };

    this.spinner.show();
    // this.authService.register(registerData).subscribe({
    //   // next: (res: any) => {
    //   //   this.spinner.hide();
    //   //   this.toastr.success('OTP sent to your email');
    //   //   localStorage.setItem('pendingUsername', registerData.Username);
    //   //   this.router.navigate(['/otp']);
    //   // },
    //   next: (res: any) => {
    //     this.spinner.hide();

    //     // Since backend returns a string like "OTP sent to email..."
    //     if (typeof res === 'string' && res.includes('OTP sent')) {
    //       this.toastr.success(res);
    //       localStorage.setItem('pendingUsername', registerData.Username);
    //       this.router.navigate(['/otp']);
    //     } else {
    //       this.toastr.error('Unexpected response. Please try again');
    //     }
    //   },
    //   error: (err) => {
    //     this.spinner.hide();
    //     this.toastr.error('Registration failed ❌ Please try again');
    //   }
    // });
    this.authService.register(registerData).subscribe({
      next: (res: string) => {
        this.spinner.hide();
        if (res.includes('OTP sent')) {
          this.toastr.success(res);
          localStorage.setItem('pendingUsername', registerData.Username);
          this.router.navigate(['/otp']);
        } else {
          this.toastr.error('Unexpected response. Please try again');
        }
      },
      error: () => {
        this.spinner.hide();
        this.toastr.error('Registration failed ❌ Please try again');
      }
    });
  }
}
