import { Component, ElementRef, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService'; 
import { ToastrService } from 'ngx-toastr';

declare var tinymce: any;

@Component({
  selector: 'app-creat-email-template',
  templateUrl: './creat-email-template.component.html',
  styleUrls: ['./creat-email-template.component.scss']
})
export class CreatEmailTemplateComponent implements OnInit, AfterViewInit {
  invitationForm!: FormGroup;
  submitted = false;
  senderName: string = '';
  dropdownOpenCompanies = false;
  dropdownOpenActions = false;

  companies: any[] = [];
  workflowTypes: any[] = [];

  isEditMode = false;
  templateId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef,
    private authService: AuthService,
    private companyService: CompanyService,
    private emailTemplateService: EmailTemplateService,
    private workflowService: WorkflowServiceService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.senderName = localStorage.getItem('userName') || 'Procurement Team';

    this.invitationForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
      companies: [[], Validators.required],
      actions: [[], Validators.required]
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.templateId = +params['id'];
        this.isEditMode = true;
        this.loadTemplate(this.templateId);
      }
    });

    this.loadCompanies();
    this.getWorkflowTypes();
  }

  ngAfterViewInit() {
    tinymce.init({
      selector: '#emailEditor',
      height: 500,
      setup: (editor: any) => {
        const updateForm = () => this.invitationForm.patchValue({ body: editor.getContent() });
        editor.on('change', updateForm);
        editor.on('keyup', updateForm);
        editor.on('paste', updateForm);
        editor.on('undo', updateForm);
        editor.on('redo', updateForm);
      },
      menubar: true,
      plugins: [
        'advlist autolink lists link image charmap preview anchor',
        'searchreplace visualblocks code fullscreen insertdatetime media',
        'table emoticons help wordcount autosave directionality visualchars',
        'codesample pagebreak quickbars nonbreaking template'
      ],
      toolbar: [
        'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify',
        'bullist numlist outdent indent | link image media table emoticons codesample | removeformat',
        'ltr rtl | pagebreak | preview fullscreen | code help'
      ].join(' | '),
      toolbar_mode: 'sliding',
      quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
      contextmenu: 'link image table spellchecker',
      autosave_ask_before_unload: true,
      autosave_interval: '30s',
      image_advtab: true,
      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; padding:10px; }'
    });
  }

  get f() { return this.invitationForm.controls; }

  // Load companies
  loadCompanies() {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.companies = (res?.result || res || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          selected: false
        }));

        // Map selected checkboxes if edit mode
        if (this.isEditMode && this.templateId) {
          this.mapSelectedValues();
        }
      },
      error: err => console.error('Error fetching companies:', err)
    });
  }

  // Load workflow types
  getWorkflowTypes() {
    this.workflowService.getWorkflowTypes().subscribe({
      next: (data: any) => {
        this.workflowTypes = (data ?? []).map((w: any) => ({
          id: w.id,
          name: w.typeName,
          selected: false
        }));

        // Map selected checkboxes if edit mode
        if (this.isEditMode && this.templateId) {
          this.mapSelectedValues();
        }
      },
      error: err => console.error('Error fetching workflow types:', err)
    });
  }

  // Load template for edit
  loadTemplate(id: number) {
    this.emailTemplateService.getEmailTemplateById(id).subscribe({
      next: (res: any) => {
        this.invitationForm.patchValue({
          subject: res.subject,
          body: res.body,
          companies: res.entity?.split(', ') || [],
          actions: res.type?.split(', ') || []
        });

        // Map checkboxes if data already loaded
        if (this.companies.length > 0 && this.workflowTypes.length > 0) {
          this.mapSelectedValues();
        }

        // Set TinyMCE content
        setTimeout(() => tinymce.get('emailEditor')?.setContent(res.body), 100);
      },
      error: err => {
        console.error('Error loading template:', err);
        this.toastr.error('Failed to load template.', 'Error');
      }
    });
  }

  // Map selected checkboxes
  mapSelectedValues() {
    const selectedCompanies = this.invitationForm.value.companies || [];
    const selectedActions = this.invitationForm.value.actions || [];

    this.companies.forEach(c => c.selected = selectedCompanies.includes(c.name));
    this.workflowTypes.forEach(w => w.selected = selectedActions.includes(w.name));
  }

  // Toggle dropdowns
  toggleCompanyDropdown() { this.dropdownOpenCompanies = !this.dropdownOpenCompanies; }
  toggleActionDropdown() { this.dropdownOpenActions = !this.dropdownOpenActions; }

  selectCompany(company: any) {
    company.selected = !company.selected;
    const selectedNames = this.companies.filter(c => c.selected).map(c => c.name);
    this.invitationForm.patchValue({ companies: selectedNames });
  }

  selectAction(type: any) {
    type.selected = !type.selected;
    const selectedNames = this.workflowTypes.filter(t => t.selected).map(t => t.name);
    this.invitationForm.patchValue({ actions: selectedNames });
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.dropdownOpenCompanies && !this.eRef.nativeElement.contains(event.target)) this.dropdownOpenCompanies = false;
    if (this.dropdownOpenActions && !this.eRef.nativeElement.contains(event.target)) this.dropdownOpenActions = false;
  }

  // Navigate back
  homePage() {
    this.router.navigate(['/setup/email-templatelist']);
  }

  // Reset form
  resetForm() {
    this.invitationForm.reset();
    this.companies.forEach(c => c.selected = false);
    this.workflowTypes.forEach(t => t.selected = false);
    this.submitted = false;
    tinymce.get('emailEditor')?.setContent('');
  }

  // Save or Update template
  saveEmailTemplate() {
    this.submitted = true;
    this.invitationForm.patchValue({ body: tinymce.get('emailEditor')?.getContent() || '' });

    if (this.invitationForm.invalid) {
      this.toastr.warning('Please fill all required fields.', 'Warning');
      return;
    }

    const payload: any = {
      subject: this.invitationForm.value.subject,
      body: this.invitationForm.value.body,
      type: this.invitationForm.value.actions.join(', '),
      entity: this.invitationForm.value.companies.join(', ')
    };

    if (this.isEditMode && this.templateId) {
      payload.modifiedBy = this.senderName;
      this.emailTemplateService.updateEmailTemplate(this.templateId, payload).subscribe({
        next: () => {
          this.toastr.success('Template updated successfully!', 'Success');
          this.router.navigate(['/setup/email-templatelist']);
        },
        error: err => {
          console.error('Error updating template:', err);
          this.toastr.error('Failed to update template.', 'Error');
        }
      });
    } else {
      payload.createdBy = this.senderName;
      this.companyService.CreatEmailTemplate(payload).subscribe({
        next: () => {
          this.toastr.success('Email template saved successfully!', 'Success');
          this.resetForm();
          this.router.navigate(['/setup/email-templatelist']);
        },
        error: err => {
          console.error('Error saving email template:', err);
          this.toastr.error('Failed to save email template.', 'Error');
        }
      });
    }
  }
}
