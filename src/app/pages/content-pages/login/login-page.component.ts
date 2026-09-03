import { Component, ChangeDetectorRef, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from 'app/shared/auth/auth.service';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from 'ngx-toastr';
import { environment } from 'environments/environment';
import { LoginTurnstileProtectionService } from 'app/shared/auth/login-turnstile-protection.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: false
})
export class LoginPageComponent implements OnInit, OnDestroy, AfterViewChecked {

  loginFormSubmitted = false;
  isLoginFailed = false;
  isSSOLoading = false;
  errorMessage = '';
  hidePassword: boolean = true;
  captchaRequired = false;
  isLocked = false;
  lockoutRemainingText = '';
  turnstileToken: string | null = null;
  turnstileVisible = false;
  turnstileLoadError = '';
  private pendingTurnstileRender = false;
  private tokenSub?: Subscription;
  private loadErrSub?: Subscription;
  private lockoutTickSub?: Subscription;
  private blockedUntilMs = 0;

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required]),
    rememberMe: new UntypedFormControl(true),
    // recaptchaReactive: new UntypedFormControl('', [Validators.required])

  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    public toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private perms: PermissionService,
    private turnstileProtection: LoginTurnstileProtectionService
  ) { }

  ngOnInit() {
    this.tokenSub = this.turnstileProtection.captchaTokenChanged$.subscribe(token => {
      this.turnstileToken = token;
    });
    this.loadErrSub = this.turnstileProtection.turnstileLoadError$.subscribe(err => {
      this.turnstileLoadError = err ?? '';
    });

    this.authService.getCaptchaConfig().subscribe(cfg => {
      const siteKey = (cfg.siteKey || environment.resolvedTurnstileSiteKey || '').trim();
      if (siteKey) {
        window.config = { ...window.config, turnstileSiteKey: siteKey };
      }
      if (cfg.enabled && siteKey) {
        this.showTurnstile();
      }
    });

    const msg = sessionStorage.getItem('authFlash');
    if (msg) {
      sessionStorage.removeItem('authFlash');
      const title = msg.toLowerCase().includes('inactivity') ? 'Signed out' : 'Session expired';
      this.toastr.warning(msg, title, { timeOut: 10000 });
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
      this.spinner.show();
      console.log("✅ Token found from Azure redirect:", token);

      const ssoData = {
        token: token,
        refreshToken: refreshToken,
        email: email,
        id: userId,
        userName: username,
      };

      this.authService.setSSOSession(ssoData);
      localStorage.setItem('isAuthenticated', 'true');

      // ✅ load permissions immediately (same thing that happens on page refresh)
      this.perms.refreshForCurrentUser$().subscribe({
        next: () => {
          this.spinner.hide();
          this.goToLanding(true);
          this.cdr.detectChanges();
        },
        error: () => {
          this.spinner.hide();
          this.goToLanding(true);
          this.cdr.detectChanges();
        }
      });
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

  ngAfterViewChecked(): void {
    if (this.pendingTurnstileRender && this.turnstileVisible && !this.turnstileLoadError) {
      this.pendingTurnstileRender = false;
      void this.turnstileProtection.renderTurnstile('#turnstile-container');
    }
  }

  ngOnDestroy(): void {
    this.tokenSub?.unsubscribe();
    this.loadErrSub?.unsubscribe();
    this.clearLockoutCountdown();
    this.turnstileProtection.teardownOnNoCaptchaNeeded();
  }

  get lf() {
    return this.loginForm.controls;
  }

  private showTurnstile(): void {
    if (this.turnstileVisible) return;
    this.turnstileVisible = true;
    this.pendingTurnstileRender = true;
    this.cdr.detectChanges();
  }

  retryCaptcha(): void {
    this.turnstileLoadError = '';
    this.pendingTurnstileRender = true;
    this.turnstileProtection.resetTurnstile('#turnstile-container');
    this.cdr.detectChanges();
  }

  private startLockoutCountdown(remainingSeconds: number): void {
    const seconds = remainingSeconds > 0 ? remainingSeconds : 10 * 60;
    this.blockedUntilMs = Date.now() + seconds * 1000;
    this.lockoutTickSub?.unsubscribe();
    this.updateLockoutRemainingText();
    this.lockoutTickSub = interval(1000).subscribe(() => {
      this.updateLockoutRemainingText();
      if (Date.now() >= this.blockedUntilMs) {
        this.clearLockoutCountdown();
        this.isLocked = false;
        this.errorMessage = 'You can try logging in again.';
        this.cdr.detectChanges();
      }
    });
  }

  private clearLockoutCountdown(): void {
    this.lockoutTickSub?.unsubscribe();
    this.lockoutTickSub = undefined;
    this.blockedUntilMs = 0;
    this.lockoutRemainingText = '';
  }

  private updateLockoutRemainingText(): void {
    const totalSec = Math.max(0, Math.ceil((this.blockedUntilMs - Date.now()) / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    this.lockoutRemainingText = `${m}:${s.toString().padStart(2, '0')}`;
    this.cdr.detectChanges();
  }

  // 🔹 Normal login
  onSubmit() {
    this.loginFormSubmitted = true;
    // captcha
    // if (this.loginForm.controls['recaptchaReactive'].invalid) {
    //   this.toastr.warning('Please verify the CAPTCHA to proceed.');
    //   return;
    // }

    if (this.loginForm.invalid) return;
    if (this.isLocked) return;
    if (this.turnstileVisible && !this.turnstileLoadError && environment.resolvedTurnstileSiteKey && !this.turnstileToken) {
      this.toastr.warning('Please complete the captcha to continue.');
      return;
    }

    this.spinner.show();

    this.authService.signinUser(
      this.loginForm.value.username,
      this.loginForm.value.password,
      this.turnstileToken
    ).subscribe(
      (res: any) => {
        this.spinner.hide();
        this.turnstileProtection.recordLoginSuccess();
        if (!this.authService.isAuthenticated()) {
          this.isLoginFailed = true;
          this.errorMessage = 'Login succeeded but the session was not stored. Please try again.';
          this.cdr.detectChanges();
          return;
        }
        this.goToLanding();
        this.cdr.detectChanges();
      },
      (err: any) => {
        this.isLoginFailed = true;
        this.spinner.hide();
        const body = err?.error;
        this.captchaRequired = !!body?.captchaRequired;
        this.isLocked = !!body?.isBlocked || err?.status === 429;
        const fromErrors = Array.isArray(body?.errors) ? body.errors[0] : null;
        const raw = typeof body === 'string' ? body : (body?.message || fromErrors);
        if (this.isLocked) {
          this.startLockoutCountdown(Number(body?.remainingSeconds ?? 0));
          this.errorMessage = raw || 'This account is temporarily locked. Please try again later.';
        } else {
          this.clearLockoutCountdown();
          this.errorMessage = raw || 'Invalid username or password';
        }
        if (this.captchaRequired || this.turnstileVisible) {
          this.showTurnstile();
          this.turnstileProtection.resetTurnstile('#turnstile-container');
        }
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

  rememberMe() { }

  forgotpassword() {
    this.router.navigate(['forgotpassword'], { relativeTo: this.route.parent });
  }

  private goToLanding(replaceUrl = false): void {
    this.router.navigate([this.perms.getDefaultLandingPath()], { replaceUrl });
  }
}
