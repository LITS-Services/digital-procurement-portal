import { Component, ElementRef, HostListener, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';
import { ToastrService } from 'ngx-toastr';
import { LookupService } from 'app/shared/services/lookup.service';

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
  dropdownOpenStatus = false;

  companies: any[] = [];
  workflowTypes: any[] = [];

  // ✅ Status dropdown options (will be sent as "Action" in payload)
  statusOptions = [
    { name: 'Submit', selected: false },
    { name: 'Approve', selected: false },
    { name: 'Onhold', selected: false },
    { name: 'Recall', selected: false }
  ];

  isEditMode = false;
  templateId: number | null = null;

  placeholders: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef,
    private authService: AuthService,
    private companyService: CompanyService,
    private emailTemplateService: EmailTemplateService,
    private workflowService: WorkflowServiceService,
    private toastr: ToastrService,
    private lookupService: LookupService,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.senderName = localStorage.getItem('userName') || 'Procurement Team';

    // ✅ Form with status field (will be sent as "Action" in payload)
    this.invitationForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
      companies: [[], Validators.required],
      actions: [[], Validators.required],
      status: [[], Validators.required]
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
    

    // ✅ Wait for Angular change detection
    setTimeout(() => {
      tinymce.init({
        selector: '#emailEditor',
        height: 500,
        menubar: true,
        branding: false,
        
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
          'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media',
          'table', 'emoticons', 'help', 'wordcount', 'autosave', 'directionality', 'visualchars',
          'codesample', 'pagebreak', 'quickbars', 'nonbreaking', 'template'
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
        content_style: `
          body {
            font-family:Helvetica,Arial,sans-serif;
            font-size:14px;
            padding:10px;
          }
        `,
        // ✅ Add change event to update form
        setup: (editor) => {
          editor.on('change', () => {
            const content = editor.getContent();
            this.invitationForm.patchValue({ body: content });
            this.invitationForm.get('body')?.markAsTouched();
          });
        }
      });
    }, 100);
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

        if (this.isEditMode && this.templateId) {
          this.mapSelectedValues();
        }
      },
      error: err => console.error('Error fetching workflow types:', err)
    });
  }

  get selectedWorkflowTypesCount(): number {
    return this.workflowTypes.filter(t => t.selected).length;
  }

  // Load template for edit
  loadTemplate(id: number) {
    this.emailTemplateService.getEmailTemplateById(id).subscribe({
      next: (res: any) => {
        this.invitationForm.patchValue({
          subject: res.subject,
          body: res.body,
          companies: res.entity?.split(', ') || [],
          actions: res.type?.split(', ') || [],
          status: res.action?.split(', ') || [] // ✅ Changed from res.status to res.action
        });

        if (this.companies.length > 0 && this.workflowTypes.length > 0) {
          this.mapSelectedValues();
        }

        if (this.statusOptions.length > 0) {
          this.mapSelectedValues();
        }

        setTimeout(() => tinymce.get('emailEditor')?.setContent(res.body), 100);
      },
      error: err => {
        console.error('Error loading template:', err);
        this.toastr.error('Failed to load template.', 'Error');
      }
    });
  }

  loadPlaceholders(workflowTypeId: number) {
    this.lookupService.getAllPlaceHoldersByWorkflowType(workflowTypeId).subscribe({
      next: (res: any[]) => {
        const mapped = res.map(p => ({
          id: p.id,
          workflowTypeId: workflowTypeId, 
          description: p.description || p.placeHolder
        }));
        this.placeholders = [...this.placeholders, ...mapped]; 
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load placeholders', err)
    });
  }

  insertPlaceholder(placeholder: string) {
    const editor = tinymce.get('emailEditor');
    if (editor) {
      editor.execCommand('mceInsertContent', false, placeholder);
    }
  }

  // Map selected checkboxes
  mapSelectedValues() {
    const selectedCompanies = this.invitationForm.value.companies || [];
    const selectedActions = this.invitationForm.value.actions || [];
    const selectedStatus = this.invitationForm.value.status || [];

    this.companies.forEach(c => c.selected = selectedCompanies.includes(c.name));
    this.workflowTypes.forEach(w => w.selected = selectedActions.includes(w.name));
    this.statusOptions.forEach(s => s.selected = selectedStatus.includes(s.name));
  }

  // Toggle dropdowns
  toggleCompanyDropdown() { this.dropdownOpenCompanies = !this.dropdownOpenCompanies; }
  toggleActionDropdown() { this.dropdownOpenActions = !this.dropdownOpenActions; }
  toggleStatusDropdown() { this.dropdownOpenStatus = !this.dropdownOpenStatus; }

  selectCompany(company: any) {
    company.selected = !company.selected;
    const selectedNames = this.companies.filter(c => c.selected).map(c => c.name);
    this.invitationForm.patchValue({ companies: selectedNames });
    this.invitationForm.get('companies')?.markAsTouched(); // ✅ Mark as touched
  }

  selectAction(type: any) {
    type.selected = !type.selected;
    const selectedNames = this.workflowTypes.filter(t => t.selected).map(t => t.name);
    this.invitationForm.patchValue({ actions: selectedNames });
    this.invitationForm.get('actions')?.markAsTouched(); // ✅ Mark as touched
    // Load placeholders when selecting a workflow type
    if (type.selected) {
      this.loadPlaceholders(type.id);
    } else {
      // Remove placeholders of unselected type
      this.placeholders = this.placeholders.filter(p => p.workflowTypeId !== type.id);
    }
  }
selectStatus(s: any) {
    s.selected = !s.selected;
    const selectedNames = this.statusOptions.filter(opt => opt.selected).map(opt => opt.name);
    this.invitationForm.patchValue({ status: selectedNames });
    this.invitationForm.get('status')?.markAsTouched(); // ✅ Mark as touched
  }
  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.dropdownOpenCompanies && !this.eRef.nativeElement.contains(event.target)) this.dropdownOpenCompanies = false;
    if (this.dropdownOpenActions && !this.eRef.nativeElement.contains(event.target)) this.dropdownOpenActions = false;
    if (this.dropdownOpenStatus && !this.eRef.nativeElement.contains(event.target)) this.dropdownOpenStatus = false;
  }

  homePage() {
    this.router.navigate(['/setup/email-templatelist']);
  }

  resetForm() {
    this.invitationForm.reset();
    this.companies.forEach(c => c.selected = false);
    this.workflowTypes.forEach(t => t.selected = false);
    this.statusOptions.forEach(s => s.selected = false);
    this.submitted = false;
    tinymce.get('emailEditor')?.setContent('');
  }

  // ✅ Add Helper Method to Mark All Fields as Touched
  markFormGroupTouched() {
    Object.keys(this.invitationForm.controls).forEach(key => {
      const control = this.invitationForm.get(key);
      control?.markAsTouched();
    });
  }

  // ✅ Add Form Status Check Method for Debugging
  checkFormStatus() {
    console.log('=== FORM STATUS ===');
    console.log('Valid:', this.invitationForm.valid);
    console.log('Invalid:', this.invitationForm.invalid);
    console.log('Values:', this.invitationForm.value);
    
    Object.keys(this.invitationForm.controls).forEach(key => {
      const control = this.invitationForm.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched
      });
    });
  }

  // Save or Update template
  saveEmailTemplate() {
    this.submitted = true;
    
    // ✅ Get TinyMCE content FIRST
    const tinyMceContent = tinymce.get('emailEditor')?.getContent() || '';
    this.invitationForm.patchValue({ body: tinyMceContent });
    
    // ✅ Debug: Check form values and validity
    console.log('Form Values:', this.invitationForm.value);
    console.log('Form Valid:', this.invitationForm.valid);
    console.log('Form Errors:', this.invitationForm.errors);
    console.log('Control Errors:', {
      subject: this.f['subject'].errors,
      body: this.f['body'].errors,
      companies: this.f['companies'].errors,
      actions: this.f['actions'].errors,
      status: this.f['status'].errors
    });

    if (this.invitationForm.invalid) {
      this.toastr.warning('Please fill all required fields.', 'Warning');
      
      // ✅ Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
      return;
    }

    const payload: any = {
      subject: this.invitationForm.value.subject,
      body: this.invitationForm.value.body,
      type: this.invitationForm.value.actions.join(', '),
      entity: this.invitationForm.value.companies.join(', '),
      action: this.invitationForm.value.status.join(', ') // ✅ Changed from 'status' to 'action'
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