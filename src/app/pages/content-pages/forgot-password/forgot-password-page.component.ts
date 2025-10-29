import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-forgot-password-page',
    templateUrl: './forgot-password-page.component.html',
    styleUrls: ['./forgot-password-page.component.scss']
})

export class ForgotPasswordPageComponent {
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


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        public toastr: ToastrService
    ) {

        // Forgot Form
        this.forgetPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        // OTP form
        this.otpForm = this.fb.group({
            otp: ['', [ Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/) ]]
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


    passwordMatchValidator(group: AbstractControl) {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }

    // On login link click
    goBackToLogin(): void {
        this.router.navigateByUrl("/pages/login");
    }


    // On registration link click
    onRegister() {
        this.router.navigate(['register'], { relativeTo: this.route.parent });
    }

    //  Send email
    onSubmit(): void {
        this.formSubmitted = true;
        if (this.forgetPasswordForm.invalid) return;

        console.log('Email sent to:', this.forgetPasswordForm.value.email);
        // Simulate email sent and move to OTP step
        this.currentStep = 'otp';
    }

    // Verify OTP
    onConfirmOtp(): void {
        this.otpFormSubmitted = true;
        if (this.otpForm.invalid) return;

        console.log('OTP entered:', this.otpForm.value.otp);
        // Simulate OTP verification success
        this.currentStep = 'newpassword';
    }

    // Reset password
    onResetPassword(): void {
        this.passwordFormSubmitted = true;
        if (this.newPasswordForm.invalid) {
            this.toastr.error('Invalid Form');
            return;
        }

        console.log('Password reset to:', this.newPasswordForm.value.password);
        this.toastr.success('Password reset successfully!');
        this.router.navigate(['/pages/login']);
    }

    // Password Visibility
    togglePasswordVisibility(field: string) {
        if (field === 'password') {
            this.hidePassword = !this.hidePassword;
        } else if (field === 'confirmPassword') {
            this.hideConfirmPassword = !this.hideConfirmPassword;
        }
    }
}
