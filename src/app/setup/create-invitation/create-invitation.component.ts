import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-invitation',
  templateUrl: './create-invitation.component.html',
  styleUrls: ['./create-invitation.component.scss']
})
export class CreateInvitationComponent implements OnInit {
  invitationForm!: FormGroup;
  submitted = false;
  dropdownOpen = false;

  companies = [
    { id: 1, name: 'Tech Innovators Pvt Ltd', selected: false },
    { id: 2, name: 'BlueOcean Solutions', selected: false },
    { id: 3, name: 'GreenField Industries', selected: false },
    { id: 4, name: 'NextGen Systems', selected: false },
    { id: 5, name: 'Prime Vendors Co.', selected: false }
  ];

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.invitationForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      body: ['', Validators.required],
      regards: ['', Validators.required],
      companies: [[], Validators.required]
    });
  }

  get f() {
    return this.invitationForm.controls;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectCompany(company: any) {
    company.selected = !company.selected;
    const selectedCompanies = this.companies
      .filter((c) => c.selected)
      .map((c) => c.name);
    this.invitationForm.patchValue({ companies: selectedCompanies });
  }

  homePage() {
    this.router.navigate(['/setup/email-setup']);
  }

  saveInvitation() {
    this.submitted = true;
    if (this.invitationForm.invalid) return;

    console.log('Invitation:', this.invitationForm.value);
    alert('Invitation saved successfully!');
  }

  resetForm() {
    this.invitationForm.reset();
    this.companies.forEach((c) => (c.selected = false));
    this.submitted = false;
  }
}
