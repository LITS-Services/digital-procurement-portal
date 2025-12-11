import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/shared/auth/auth.service'; // make sure path is correct
import { NgxSpinnerService } from 'ngx-spinner';
import { NgZone } from '@angular/core'; // Added NgZone for navigation safety
import { NgOtpInputComponent, NgOtpInputConfig } from 'ng-otp-input';

@Component({
    selector: 'app-forgot-password-page',
    templateUrl: './forgot-password-page.component.html',
    styleUrls: ['./forgot-password-page.component.scss'],
    standalone: false
})

export class ForgotPasswordPageComponent {

    @ViewChild(NgOtpInputComponent, { static: false }) ngOtpInput: NgOtpInputComponent;
    forgetPasswordForm!: FormGroup;
    newPasswordForm!: FormGroup;
    otpForm!: FormGroup;

    formSubmitted = false;
    passwordFormSubmitted = false;
    otpFormSubmitted = false;

    hidePassword: boolean = true;
    hideConfirmPassword: boolean = true;
    currentStep: 'email' | 'otp' | 'newpassword' = 'email';
    passwordPattern: RegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[^\s]).{6,}$/;

    // Email stored for current session use (if needed)
    private userEmail: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        public toastr: ToastrService,
        private authService: AuthService,
        private spinner: NgxSpinnerService,
        private cdRef: ChangeDetectorRef,
        private ngZone: NgZone // Injected NgZone
    ) {

        // Forgot Form
        this.forgetPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        // OTP form
        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/)]]
        });

        // New password form
        this.newPasswordForm = this.fb.group(
            {
                password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
                confirmPassword: ['', [Validators.required]]
            },
            { validators: [this.passwordMatchValidator] }
        );
    }

    get f() { return this.forgetPasswordForm.controls; }
    get lf() { return this.otpForm.controls; } // Used 'lf' to match reference component
    get nF() { return this.newPasswordForm.controls; }


    passwordMatchValidator(group: AbstractControl) {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }

    goBackToLogin(): void {
        this.router.navigateByUrl("/pages/login");
    }

    onRegister() {
        this.router.navigate(['register'], { relativeTo: this.route.parent });
    }

    // Send email - Calls forgetPassword API
    onSubmit(): void {
        this.formSubmitted = true;
        if (this.forgetPasswordForm.invalid) return;

        this.spinner.show();
        const email = this.forgetPasswordForm.value.email;
        this.authService.forgetPassword(email).subscribe({
            next: (response) => {
                localStorage.setItem('forgotEmail', email);
                this.userEmail = email;

                this.ngZone.run(() => {
                    this.currentStep = 'otp';
                    this.cdRef.detectChanges();
                });

                console.log('🌀 Spinner hidden');
                this.spinner.hide();
            },
            error: (error) => {
                this.ngZone.run(() => {
                    this.toastr.error('Failed to send OTP. Please check the email.');
                    this.cdRef.detectChanges(); // optional safety
                });
                this.spinner.hide();
            }
        });
    }

    // Verify OTP - Calls verifyOtp API
    onConfirmOtp(): void {
        this.otpFormSubmitted = true;
        if (this.otpForm.invalid) return;

        this.spinner.show();
        const otpValue = this.otpForm.value.otp;

        // Retrieve email from localStorage, matching the reference component's flow
        const email = localStorage.getItem('forgotEmail');

        if (!email) {
            this.spinner.hide();
            this.toastr.error('Email not found. Please restart the process.');
            this.currentStep = 'email'; // Go back to the start
            return;
        }

        const navigateEmail = email;

        // Use 'verifyOtp' method, and pass 'true' for resetOtp query param flow
        this.authService.verifyOtp(email, otpValue, true).subscribe({
            next: (res: any) => {
                this.spinner.hide();

                // Cleanup local storage
                localStorage.removeItem('forgotEmail');

                this.ngZone.run(() => {
                    this.currentStep = 'newpassword';
                    this.toastr.success('OTP verified successfully');
                    this.cdRef.detectChanges();
                });
            },
            error: (err: any) => {
                this.spinner.hide();
                this.toastr.error('Invalid or expired OTP');
                console.error('OTP verification failed:', err);
            }
        });
    }

    // Resend OTP - Calls resendOtp API
    resendOtp(): void {
        const forgotEmail = localStorage.getItem('forgotEmail');

        if (!forgotEmail) {
            this.toastr.warning('No email found to resend OTP');
            this.currentStep = 'email';
            return;
        }

        this.spinner.show();
        // Assuming portalType '1' for Vendor Portal as per reference logic
        const portalType = '2';

        this.authService.resendOtp(forgotEmail, portalType).subscribe({
            next: (res: any) => {
                this.spinner.hide();
                this.toastr.info('OTP resent successfully');
            },
            error: (err) => {
                this.spinner.hide();
                this.toastr.error('Failed to resend OTP');
                console.error('Failed to resend OTP:', err);
            }
        });
    }


    // Reset password - Calls ResetPassword API
    onResetPassword(): void {
        this.passwordFormSubmitted = true;
        if (this.newPasswordForm.invalid) {
            this.toastr.error('Invalid Form');
            return;
        }

        this.spinner.show();

        // The email for the payload is taken from where it was stored during the process
        // Since localStorage was cleared after OTP, we rely on the component's internal state (this.userEmail) 
        // or re-fetch it if a separate NewPassword component was used.
        // For this single-page component, we'll use 'this.userEmail', assuming it holds the value.
        const email = this.forgetPasswordForm.value.email || this.userEmail;

        const payload = {
            email: email, // Email should be available from the component's stored state
            newPassword: this.newPasswordForm.value.password
        };

        this.authService.ProcurementResetPassword(payload).subscribe({
            next: (response) => {
                this.toastr.success('Password reset successfully!');
                this.router.navigate(['/pages/login']);
                this.spinner.hide();
            },
            error: (error) => {
                this.toastr.error('Password reset failed. Please try again.');
                console.error('Reset password error:', error);
                this.spinner.hide();
            }
        });
    }

    // Password Visibility
    togglePasswordVisibility(field: string) {
        if (field === 'password') {
            this.hidePassword = !this.hidePassword;
        } else if (field === 'confirmPassword') {
            this.hideConfirmPassword = !this.hideConfirmPassword;
        }
    }

    onOtpChange(value: string): void {
        this.otpForm.get('otp')?.setValue(value);
        this.otpForm.get('otp')?.updateValueAndValidity();
    }

}