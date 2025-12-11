import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';

@Component({
  selector: 'app-create-invitation',
  templateUrl: './create-invitation.component.html',
  styleUrls: ['./create-invitation.component.scss'],
  standalone: false
})
export class CreateInvitationComponent implements OnInit {
  invitationForm!: FormGroup;
  submitted = false;
  dropdownOpen = false;
  senderName: string = '';
  isResendMode = false;   // ✅ Check if resend mode
  emailId: number | null = null; // ✅ Store ID from query param

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private eRef: ElementRef,
    private EmailTemplateService: EmailTemplateService,
    private route: ActivatedRoute,
    private toastr: ToastrService // ✅ Added Toastr
  ) {}

  ngOnInit(): void {
    const storedUserName = localStorage.getItem('userName');
    this.senderName = storedUserName ? storedUserName : 'Procurement Team';

    this.invitationForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      body: [this.getDefaultBody(), Validators.required],
    });

    // ✅ Check for ID in query param (Resend case)
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.emailId = +params['id'];
        this.isResendMode = true;
        this.loadEmailDetails(this.emailId);
      }
    });
  }

  get f() {
    return this.invitationForm.controls;
  }

  // ✅ Load Email Details by ID
  loadEmailDetails(id: number) {
    this.EmailTemplateService.getEmailInvitationById(id).subscribe({
      next: (res: any) => {
        if (res) {
          this.invitationForm.patchValue({
            receiverEmail: res.receiverEmail || '',
            subject: res.subject || '',
            body: res.body || this.getDefaultBody(),
          });
        }
      },
      error: (err) => {
        console.error('Error loading email details:', err);
        this.toastr.error('Failed to load invitation details.', 'Error');
      }
    });
  }

  homePage() {
    this.router.navigate(['/setup/email-setup']);
  }

  resetForm() {
    this.invitationForm.reset();
    this.submitted = false;
    this.invitationForm.patchValue({
      body: this.getDefaultBody()
    });
  }

  // ✅ Save or Resend Invitation
  saveInvitation() {
    this.submitted = true;
    if (this.invitationForm.invalid) return;

    const userData = {
      submitterEmail: this.senderName + '@example.com',
      receiverEmail: this.invitationForm.value.receiverEmail,
      subject: this.invitationForm.value.subject,
      body: this.invitationForm.value.body
    };

    if (this.isResendMode && this.emailId) {
      // ✅ RESEND MODE → Call update API
      this.EmailTemplateService.updateEmailInvitation(this.emailId, userData).subscribe({
        next: (res) => {
          console.log('Invitation resent:', res);
          this.toastr.success('Invitation resent successfully!', 'Success');
          this.router.navigate(['/setup/email-setup']);
        },
        error: (err) => {
          console.error('Error resending invitation:', err);
          this.toastr.error('Failed to resend invitation.', 'Error');
        }
      });
    } else {
      // ✅ NORMAL CREATE MODE
      this.EmailTemplateService.createEmailInvitation(userData).subscribe({
        next: (res) => {
          console.log('Invitation sent:', res);
          this.toastr.success('Invitation sent successfully!', 'Success');
          this.resetForm();
          this.router.navigate(['/setup/email-setup']);
        },
        error: (err) => {
          console.error('Error sending invitation:', err);
          this.toastr.error('Failed to send invitation.', 'Error');
        }
      });
    }
  }

  getDefaultBody(): string {
    return (
      `Dear Vendor,\n\n` +
      `We are pleased to invite you to register on our Procurement Portal.\n` +
      `Please click the link below to complete your registration process.\n` +
      `http://localhost:4200/pages/registeration\n\n` +
      `Best Regards,\n` +
      `${this.senderName}`
    );
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.dropdownOpen && this.eRef.nativeElement.contains(event.target) || !this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }
}
