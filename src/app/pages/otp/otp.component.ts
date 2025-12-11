import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
  standalone: false
})
export class OtpComponent implements OnInit {
  otpForm!: FormGroup;
  otpFormSubmitted = false;
  isOtpFailed = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });
  }

  get of() {
    return this.otpForm.controls;
  }

  // verifyOtp() {
  //   this.otpFormSubmitted = true;
  //   if (this.otpForm.invalid) return;

  //   this.spinner.show(); // show spinner

  //   this.authService.verifyOtp(this.otpForm.value.otp).subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();
  //       this.toastr.success('OTP Verified Successfully ✅');
  //       this.router.navigate(['/dashboard/dashboard1']);
  //     },
  //     error: (err: any) => {
  //       this.spinner.hide();
  //       this.isOtpFailed = true;
  //       this.toastr.error('Invalid or Expired OTP ❌');
  //       console.error('OTP verification failed:', err);
  //     }
  //   });
  // }


  verifyOtp() {
  this.otpFormSubmitted = true;
  if (this.otpForm.invalid) return;

  this.spinner.show();

  // this.authService.verifyOtp(this.otpForm.value.otp).subscribe({
  //   next: (res: string) => {
  //     this.spinner.hide();

  //     if (res.toLowerCase().includes('verified') || res.toLowerCase().includes('completed')) {
  //       this.toastr.success(res);
  //       this.router.navigate(['/dashboard/dashboard1']);
  //     } else {
  //       this.isOtpFailed = true;
  //       this.toastr.error(res || 'Invalid or Expired OTP ❌');
  //     }
  //   },
  //   error: (err: any) => {
  //     this.spinner.hide();
  //     this.isOtpFailed = true;
  //     this.toastr.error('Invalid or Expired OTP ❌');
  //     console.error('OTP verification failed:', err);
  //   }
  // });
}


  resendOtp() {
    const portalType = 'Procurement';
    const username = localStorage.getItem('pendingUsername');
    if (!username) return;

    this.spinner.show();

    this.authService.resendOtp(username, portalType).subscribe({
      next: (res) => {
        this.spinner.hide();
        this.toastr.info('OTP Resent Successfully 🔄');
        console.log('OTP resent', res);
      },
      error: (err) => {
        this.spinner.hide();
        this.toastr.error('Failed to resend OTP ❌');
        console.error('Failed to resend OTP', err);
      }
    });
  }
}
