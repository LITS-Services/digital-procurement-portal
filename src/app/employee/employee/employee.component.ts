import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent implements OnInit {

  companyForm: UntypedFormGroup;
  companyId: number | null = null;
  isEditMode: boolean = false;

  employees: any[] = [];
  companies: any[] = [];
  selectedCompanyGUIDs: string[] = [];
  companyFormSubmitted: boolean = false;

  roles: any[] = [
    { id: 1, name: 'User' },
    { id: 2, name: 'Admin' }
  ];

  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService, 
    private toastr: ToastrService 
  ) {}

  ngOnInit(): void {

    // ✅ Restrict access to Admin only
    if (!this.authService.hasRole('Admin')) {
      this.toastr.warning('Access denied. Only Admins can access this page.');
      this.router.navigate(['/dashboard/dashboard1']);
      return;
    }

    const idParam = this.route.snapshot.queryParamMap.get('id');
    this.companyId = idParam ? +idParam : null;
    this.isEditMode = !!this.companyId;

    // Build form
    this.companyForm = this.fb.group({
      employeeId: [null, Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      roleId: [null, Validators.required]
    }, { validators: this.passwordMatchValidator });

    if (this.isEditMode) this.loadCompany();

    this.loadEmployees();
    this.loadCompanies();
  }

  // ✅ Custom validator
  passwordMatchValidator(form: UntypedFormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  // ✅ Load company for edit
  loadCompany() {
    this.companyService.getproByid(this.companyId).subscribe({
      next: (company: any) => {
        this.companyForm.patchValue({
          employeeId: company.employeeId,
          name: company.name,
          email: company.email,
          roleId: company.roleId
        });
        this.selectedCompanyGUIDs = company.companyGUIDs || [];
      }
    });
  }

  // ✅ Load employees
  loadEmployees() {
    this.companyService.getAllEmployees().subscribe({
      next: (res: any) => {
        this.employees = res?.$values || [];
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  // ✅ Load companies
  loadCompanies() {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.companies = res?.$values || res;
      },
      error: (err) => console.error('Error loading companies:', err)
    });
  }

  // ✅ Toggle company checkbox
  onCompanyToggle(event: Event, guid: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedCompanyGUIDs.includes(guid)) {
        this.selectedCompanyGUIDs.push(guid);
      }
    } else {
      this.selectedCompanyGUIDs = this.selectedCompanyGUIDs.filter(c => c !== guid);
    }
  }

  // ✅ Select employee auto-fill
  onEmployeeSelect(event: Event) {
    const selectedId = (event.target as HTMLSelectElement).value;
    const selectedEmp = this.employees.find(e => e.id == selectedId);
    if (selectedEmp) {
      this.companyForm.patchValue({ 
        name: selectedEmp.fullName, 
        email: selectedEmp.email 
      });
    }
  }

  // ✅ Toggle password visibility
  togglePassword(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }

  // ✅ Submit employee form
  onSubmit() {
    this.companyFormSubmitted = true;
    if (this.companyForm.invalid || this.selectedCompanyGUIDs.length === 0) return;

    const formValues = this.companyForm.getRawValue();
    const payload = {
      id: formValues.employeeId,
      username: formValues.name,       
      email: formValues.email,
      fullName: formValues.name,       
      password: formValues.password,
      role: this.roles.find(r => r.id == formValues.roleId)?.name,
      companyGUIDs: this.selectedCompanyGUIDs
    };

    this.companyService.registerEmployee(payload).subscribe({
      next: () => this.router.navigate(['/procurment-companies']),
      error: (err) => console.error('Error saving employee:', err)
    });
  }

  // ✅ Reset form
  onReset() {
    this.companyForm.reset(); 
    this.selectedCompanyGUIDs = [];
    this.companyFormSubmitted = false;
    if (this.isEditMode) this.loadCompany();
  }

  // ✅ Go back
  goBack() {
    this.router.navigate(['/procurment-companies']);
  }
}
