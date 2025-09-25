import { Component, OnInit, HostListener } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
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
  employees: any[] = [];
  selectedEmployee: any = null;
  dropdownOpen = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    // ADMIN CHECK
    if (!this.authService.hasRole('Admin')) {
      this.toastr.warning('Access denied. Only Admins can access this page.');
      this.router.navigate(['/dashboard/dashboard1']);
      return;
    }

    this.registerForm = this.formBuilder.group({
      Username: ['', Validators.required],
      Fullname: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordComplexityValidator]],
      confirmPassword: ['', Validators.required],
      role: ['User', Validators.required],
      companyGUIDs: this.formBuilder.array([], Validators.required),
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });

    this.loadProcurmentCompanies();
    this.loadEmployees();
  }

  // Password complexity validator
  passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>-]/.test(value);
    const minLength = value.length >= 6;

    if (hasUpperCase && hasSpecialChar && minLength) {
      return null;
    }
    return { passwordComplexity: { hasUpperCase, hasSpecialChar, minLength } };
  }

  get rf() { return this.registerForm.controls; }
  get companyFormArray(): FormArray { return this.registerForm.get('companyGUIDs') as FormArray; }

  get selectedCompaniesLabel(): string {
    return this.selectedCompanies.length > 0
      ? this.selectedCompanies.map(c => c.name).join(', ')
      : 'Select Companies';
  }

  loadProcurmentCompanies() {
    this.spinner.show();
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.procurmentCompanies = res?.$values || [];
      },
      error: () => {
        this.spinner.hide();
        this.toastr.error('Error fetching procurement companies ❌');
      }
    });
  }

  loadEmployees() {
    this.spinner.show();
    this.companyService.getAllEmployees().subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.employees = res?.$values || [];
      },
      error: () => {
        this.spinner.hide();
        this.toastr.error('Error fetching employees ❌');
      }
    });
  }

  onEmployeeSelected(empId: number) {
    const emp = this.employees.find(e => e.id == empId);
    if (emp) {
      this.selectedEmployee = emp;
      this.registerForm.patchValue({
        Username: emp.fullName,
        Fullname: emp.fullName,
        email: emp.email
      });
    }
  }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    const target = event.target;
    if (!target.closest('.dropdown')) {
      this.dropdownOpen = false;
    }
  }

  isCompanySelected(companyGUID: string): boolean {
    return this.selectedCompanies.some(c => c.companyGUID === companyGUID);
  }

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

  onSubmit() {
    this.registerFormSubmitted = true;
    if (this.registerForm.invalid) return;

    const registerData = {
      Username: this.registerForm.value.Username,
      Fullname: this.registerForm.value.Fullname,
      Email: this.registerForm.value.email,
      Password: this.registerForm.value.password,
      Role: this.registerForm.value.role,
      CompanyGUIDs: this.companyFormArray.value
    };

    this.spinner.show();
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
