import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  companyId: string | null = null;
  isEditMode: boolean = false;

  employees: any[] = [];
  companies: any[] = [];
  selectedCompanyGUIDs: string[] = [];
  companyFormSubmitted: boolean = false;

  roles: any[] = [];

  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (!this.authService.hasRole('Admin')) {
      this.toastr.warning('Access denied. Only Admins can access this page.');
      this.router.navigate(['/dashboard/dashboard1']);
      return;
    }

    this.companyId = this.route.snapshot.queryParamMap.get('id');
    this.isEditMode = !!this.companyId;

    // this.companyForm = this.fb.group({
    //   employeeId: [null], // optional for create
    //   name: [{ value: '', disabled: this.isEditMode }, Validators.required],
    //   email: [{ value: '', disabled: this.isEditMode }, [Validators.required, Validators.email]],
    //   password: ['', this.isEditMode ? [] : [
    //     Validators.required,
    //     Validators.minLength(6),
    //     Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/)
    //   ]],
    //   confirmPassword: ['', this.isEditMode ? [] : Validators.required],
    //   roleId: [null, Validators.required],
    //   isDeleted: [false]
    // }, { validators: this.passwordMatchValidator });

    this.companyForm = this.fb.group({
      employeeId: [null],
      name: [{ value: '', disabled: this.isEditMode }, Validators.required],
      email: [{ value: '', disabled: this.isEditMode }, [Validators.required, Validators.email]],
      password: [{ value: '', disabled: this.isEditMode }, this.isEditMode ? [] : [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/)
      ]],
      confirmPassword: [{ value: '', disabled: this.isEditMode }, this.isEditMode ? [] : Validators.required],

      roleId: [null, Validators.required],
      isDeleted: [false]
    }, { validators: this.passwordMatchValidator });


    this.loadRoles();
    this.loadCompanies();

    if (!this.isEditMode) this.loadEmployees();
  }

  passwordMatchValidator(form: UntypedFormGroup) {
    if (form.get('password')?.disabled) return null;
    if (form.get('password')?.value || form.get('confirmPassword')?.value) {
      return form.get('password')?.value === form.get('confirmPassword')?.value
        ? null : { passwordMismatch: true };
    }
    return null;
  }

  loadRoles() {
    this.companyService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = res?.$values || res || [];
        this.cdr.detectChanges();
        if (this.isEditMode && this.companyId) this.loadEmployeeForEdit(this.companyId);
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  loadCompanies() {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.companies = res?.result || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading companies:', err)
    });
  }


  loadEmployees() {
    this.companyService.getAllEmployees().subscribe({
      next: (res: any) => {
        // this.employees = res?.result || []; // ✅ Fixed: use res.result
        this.employees = Array.isArray(res.result) ? res.result : res;
        console.log("employees agaye ", this.employees);
        this.cdr.detectChanges();

      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadEmployeeForEdit(id: string) {
    this.companyForm.patchValue({ isDeleted: false });

    this.companyService.getprocurementusersbyid(id).subscribe({
      next: (emp: any) => {
        this.companyForm.patchValue({
          employeeId: emp.id,
          name: emp.fullName || emp.Username || emp.userName,
          email: emp.email || '',
          isDeleted: emp.isDeleted || false
        });

        this.companyForm.get('name')?.disable();
        this.companyForm.get('email')?.disable();
        this.companyForm.get('password')?.disable();
        this.companyForm.get('confirmPassword')?.disable();

        if (emp.roles && (emp.roles.$values?.length || emp.roles.length)) {
          const roleName = emp.roles.$values ? emp.roles.$values[0].name : emp.roles[0].name;
          const role = this.roles.find(r => r.name === roleName);
          this.companyForm.patchValue({ roleId: role?.id || null });
        }

        if (emp.companies && (emp.companies.$values?.length || emp.companies.length)) {
          this.selectedCompanyGUIDs = emp.companies.$values
            ? emp.companies.$values.map((c: any) => c.companyGUID)
            : emp.companies.map((c: any) => c.companyGUID);
        }

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching employee:', err)
    });
  }

  onActiveChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    // If Active is checked => isDeleted should be false
    this.companyForm.patchValue({ isDeleted: !checked });
  }


  onEmployeeSelect(event: Event) {
    const selectedId = (event.target as HTMLSelectElement).value;
    const selectedEmp = this.employees.find(e => e.id === selectedId);
    if (selectedEmp) {
      this.companyForm.patchValue({
        name: selectedEmp.fullName,
        email: selectedEmp.email
      });
      this.cdr.detectChanges();
    }
  }

  onCompanyToggle(event: Event, guid: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedCompanyGUIDs.includes(guid)) this.selectedCompanyGUIDs.push(guid);
    } else {
      this.selectedCompanyGUIDs = this.selectedCompanyGUIDs.filter(c => c !== guid);
    }
    this.cdr.detectChanges();
  }

  togglePassword(field: 'password' | 'confirmPassword') {
    if (!this.isEditMode) {
      if (field === 'password') {
        this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
      } else {
        this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
      }
      this.cdr.detectChanges();
    }
  }

  // toggleStatus() {
  //   const current = this.companyForm.get('isDeleted')?.value;
  //   this.companyForm.patchValue({ isDeleted: !current });
  //   this.cdr.detectChanges();
  // }

  onSubmit() {
    this.companyFormSubmitted = true;
    console.log(this.companyForm.errors, this.companyForm.status, this.companyForm.value);
    console.log(this.companyForm.getRawValue());
    console.log(this.companyForm);

    if (this.companyForm.invalid) {
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    if (this.selectedCompanyGUIDs.length === 0) {
      this.toastr.warning('Please select at least one company.');
      return;
    }

    const formValues = this.companyForm.getRawValue();
    const selectedRole = this.roles.find(r => r.id == formValues.roleId);

    // EDIT MODE
    if (this.isEditMode) {
      const updatePayload = {
        id: formValues.employeeId,
        fullName: this.companyForm.get('name')?.value,
        userName: this.companyForm.get('name')?.value,
        email: this.companyForm.get('email')?.value,
        phoneNumber: '',
        isDeleted: formValues.isDeleted,
        profilePicture: '',
        selectedCompanyIds: this.companies
          .filter(c => this.selectedCompanyGUIDs.includes(c.companyGUID))
          .map(c => c.id),
        selectedRoleIds: selectedRole ? [selectedRole.id] : []
      };

      this.companyService.ProcurmentuserUpdate(formValues.employeeId, updatePayload).subscribe({
        next: () => {
          this.toastr.success('Employee updated successfully');
          this.router.navigate(['/employee-list']);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastr.error('Failed to update employee');
          console.error('Error updating employee:', err);
        }
      });
      return;
    }

    // CREATE MODE
    const createPayload: any = {
      id: formValues.employeeId,
      fullName: formValues.name,
      userName: formValues.name,
      email: formValues.email,
      phoneNumber: '',
      isDeleted: formValues.isDeleted,
      profilePicture: '',
      selectedCompanyIds: this.companies
        .filter(c => this.selectedCompanyGUIDs.includes(c.companyGUID))
        .map(c => c.id),
      roleNames: selectedRole ? [selectedRole.name] : [],
      password: formValues.password
    };

    console.log("createpayload", createPayload);

    this.companyService.registerEmployee(createPayload).subscribe({
      next: () => {
        this.toastr.success('Employee registered successfully');
        this.router.navigate(['/employee-list']);
        this.loadEmployees();
        this.companyForm.reset();
        this.selectedCompanyGUIDs = [];
        this.companyFormSubmitted = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Failed to register employee');
        console.error('Error saving employee:', err);
      }
    });
  }

  onReset() {
    this.companyForm.reset();
    this.selectedCompanyGUIDs = [];
    this.companyFormSubmitted = false;
    if (this.isEditMode && this.companyId) this.loadEmployeeForEdit(this.companyId);
    this.cdr.detectChanges();
  }

  goBack() {
    this.router.navigate(['/employee-list']);
  }
}
