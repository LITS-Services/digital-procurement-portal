import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
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
export class LoginPageComponent implements OnInit {

  loginFormSubmitted = false;
  isLoginFailed = false;
  isSSOLoading = false;
  errorMessage = '';
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
    public toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const msg = sessionStorage.getItem('authFlash');
    if (msg) {
      sessionStorage.removeItem('authFlash');
      this.toastr.warning(msg, 'Session expired', { timeOut: 10000 });
    }

    // 🔹 Handle SSO callback redirect (token from Azure)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    let refreshToken = params.get('refreshToken') ?? undefined;
    if (refreshToken) refreshToken = refreshToken.replace(/ /g, "+");

    const email = params.get('email');
    const userId = params.get('id');
    const username = params.get('username');
    const error = params.get('error');

    if (token) {
      console.log("✅ Token found from Azure redirect:", token);
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (email) localStorage.setItem('userEmail', email);
      if (userId) localStorage.setItem('userId', userId);
      if (username) localStorage.setItem('username', username);

      this.router.navigate(['/dashboard/dashboard1'], { replaceUrl: true });
      return;
    }

    if (error) {
      this.isLoginFailed = true;
      this.errorMessage = error;
      console.error('❌ Azure SSO error:', error);
      this.cdr.detectChanges();
      return;
    }
  }

  get lf() {
    return this.loginForm.controls;
  }

  // 🔹 Normal login
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

        // Save token and user info
        localStorage.setItem('token', res.token);
        localStorage.setItem('id', res.id || '');
        localStorage.setItem('userId', res.userId || '');
        localStorage.setItem('userName', res.userName || '');

        // Save roles
        const roles = res?.roles || [];
        const role = roles.length > 0 ? roles[0] : '';
        localStorage.setItem('role', role);

        // Save companyIds
        const companyIds = res?.companyIds?.$values || [];
        console.log('Extracted companyIds:', companyIds);
        localStorage.setItem('companyIds', JSON.stringify(companyIds));

        this.router.navigate(['/dashboard/dashboard1']);
        this.cdr.detectChanges();
      },
      (err: any) => {
        this.isLoginFailed = true;
        this.spinner.hide();
        console.error('❌ Login error:', err);
        this.errorMessage = err?.error?.message || 'Invalid username or password';
        this.cdr.detectChanges();
      }
    );
  }

  // 🔹 Microsoft SSO Login
  loginWithSSO() {
    this.isSSOLoading = true;

    this.authService.initiateSSOLogin('').subscribe({
      next: (response: any) => {
        this.isSSOLoading = false;
        if (response.loginUrl) {
          console.log("🔗 Redirecting to Microsoft SSO:", response.loginUrl);
          window.location.href = response.loginUrl;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSSOLoading = false;
        this.errorMessage = 'Failed to connect to Microsoft SSO service.';
        this.isLoginFailed = true;
        console.error('❌ SSO connection failed');
        this.cdr.detectChanges();
      }
    });
  }

  SSO(event: Event) {
    event.preventDefault();
    this.loginWithSSO();
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  rememberMe() {}

  forgotpassword() {
    this.router.navigate(['forgotpassword'], { relativeTo: this.route.parent });
  }
}
