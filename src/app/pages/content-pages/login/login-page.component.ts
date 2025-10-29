import { Component, ViewChild } from '@angular/core';
import { NgForm, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from 'app/shared/auth/auth.service';
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  loginFormSubmitted = false;
  isLoginFailed = false;

  hidePassword: boolean = true;

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required]),
    rememberMe: new UntypedFormControl(true)
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    public toastr: ToastrService
  ) { }

  ngOnInit() {
    const msg = sessionStorage.getItem('authFlash');
    if (msg) {
      sessionStorage.removeItem('authFlash');
      this.toastr.warning(msg, 'Session expired', { timeOut: 10000 });
    }

  }

  get lf() {
    return this.loginForm.controls;
  }

  // On submit button click
  onSubmit() {
    this.loginFormSubmitted = true;
    if (this.loginForm.invalid) return;

    this.spinner.show(undefined, {
      type: 'ball-triangle-path',
      size: 'medium',
      bdColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fullScreen: true
    });

    this.authService.signinUser(
      this.loginForm.value.username,
      this.loginForm.value.password
    ).subscribe(
      (res: any) => {
        this.spinner.hide();

        // Save token
        localStorage.setItem('token', res.token);

        // Save user info
        localStorage.setItem('id', res.id || '');
        localStorage.setItem('userId', res.userId || '');
        localStorage.setItem('userName', res.userName || '');

        // Save roles
        const roles = res?.roles || [];
        const role = roles.length > 0 ? roles[0] : '';
        localStorage.setItem('role', role);



        // Save roles $id
        const rolesId = res?.roles?.$id || '';
        console.log('Roles $id:', rolesId);
        localStorage.setItem('rolesId', rolesId);

        // Save companyIds
        const companyIds = res?.companyIds?.$values || [];
        console.log('Extracted companyIds:', companyIds);
        localStorage.setItem('companyIds', JSON.stringify(companyIds));

        // Save companyIds $id
        const companyIdsId = res?.companyIds?.$id || '';
        console.log('CompanyIds $id:', companyIdsId);
        localStorage.setItem('companyIdsId', companyIdsId);

        // Navigate to dashboard
        this.router.navigate(['/dashboard/dashboard1']);
      },
      (err: any) => {
        this.isLoginFailed = true;
        this.spinner.hide();
        console.error('Login error:', err);
      }
    );
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
  rememberMe() {
    // implement if needed
  }

  forgotpassword() {
    this.router.navigate(['forgotpassword'], { relativeTo: this.route.parent });
  }

  SSO(event: Event) {
    // implement if needed
  }
}
