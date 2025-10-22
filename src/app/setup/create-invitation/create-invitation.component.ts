import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service'; // import AuthService
// import { CompanyService } from 'app/shared/services/Company.services'; // ❌ Commented

@Component({
  selector: 'app-create-invitation',
  templateUrl: './create-invitation.component.html',
  styleUrls: ['./create-invitation.component.scss']
})
export class CreateInvitationComponent implements OnInit {
  invitationForm!: FormGroup;
  submitted = false;
  dropdownOpen = false;
  senderName: string = '';
  // companies: any[] = [];  // ❌ Commented: No longer needed

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private eRef: ElementRef,
    private authService: AuthService, // ✅ Kept
    // private companyService: CompanyService // ❌ Commented
  ) {}

  ngOnInit(): void {
    const storedUserName = localStorage.getItem('userName');
    this.senderName = storedUserName ? storedUserName : 'Procurement Team';

    this.invitationForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      body: [this.getDefaultBody(), Validators.required],
      // companies: [[], Validators.required] // ❌ Commented
    });

    // this.loadCompanies(); // ❌ Commented
  }

  get f() {
    return this.invitationForm.controls;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // selectCompany(company: any) {
  //   company.selected = !company.selected;
  //   const selectedCompanies = this.companies
  //     .filter((c) => c.selected)
  //     .map((c) => c.name);
  //   this.invitationForm.patchValue({ companies: selectedCompanies });
  // }

  homePage() {
    this.router.navigate(['/setup/email-setup']);
  }

  resetForm() {
    this.invitationForm.reset();
    // this.companies.forEach((c) => (c.selected = false)); // ❌ Commented
    this.submitted = false;
    this.invitationForm.patchValue({
      body: this.getDefaultBody()
    });
  }

 saveInvitation() {
  this.submitted = true;
  if (this.invitationForm.invalid) return;

  // Prepare form data to send to API
  const userData = {
    submitterEmail: this.senderName + '@example.com', // or get actual submitter email
    receiverEmail: this.invitationForm.value.receiverEmail,
    subject: this.invitationForm.value.subject,
    body: this.invitationForm.value.body
  };

  // Call AuthService API
  this.authService.createEmailInvitation(userData).subscribe({
    next: (res) => {
      console.log('Invitation sent:', res);
      alert('Invitation sent successfully!');
      this.resetForm();
      this.router.navigate(['/setup/email-setup']); // ✅ Redirect added here
    },
    error: (err) => {
      console.error('Error sending invitation:', err);
      alert('Failed to send invitation.');
    }
  });
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

  // loadCompanies() {
  //   this.companyService.getProCompanies().subscribe({
  //     next: (res: any) => {
  //       this.companies = (res?.result || res || []).map((c: any) => ({
  //         id: c.id,
  //         name: c.name,
  //         selected: false
  //       }));
  //     },
  //     error: (err) => {
  //       console.error('Error fetching companies:', err);
  //     }
  //   });
  // }
}
