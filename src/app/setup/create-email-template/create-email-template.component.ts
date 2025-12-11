import { Component, ElementRef, HostListener, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';
import { ToastrService } from 'ngx-toastr';
import { LookupService } from 'app/shared/services/lookup.service';

interface DropdownItem {
  id: number;
  description: string;
}

declare var tinymce: any;

@Component({
  selector: 'app-creat-email-template',
  templateUrl: './create-email-template.component.html',
  styleUrls: ['./create-email-template.component.scss'],
  standalone: false
})
export class CreateEmailTemplateComponent implements OnInit, AfterViewInit {
  invitationForm!: FormGroup;
  submitted = false;
  senderName: string = '';

  dropdownOpenCompanies = false;
  dropdownOpenTypes = false;
  dropdownOpenActions = false;

  companies: DropdownItem[] = [];
  workFlowTypes: DropdownItem[] = [];
  actionOptions: DropdownItem[] = [];

  selectedCompany: DropdownItem | null = null;
  selectedType: DropdownItem | null = null;
  selectedAction: DropdownItem | null = null;

  placeholders: any[] = [];
  isEditMode = false;
  templateId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef,
    private companyService: CompanyService,
    private emailTemplateService: EmailTemplateService,
    private toastr: ToastrService,
    private lookupService: LookupService,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.senderName = localStorage.getItem('userName') || 'Procurement Team';

    this.invitationForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
      procurementCompanyId: [null, Validators.required],
      workFlowTypeId: [null, Validators.required],
      emailActionId: [null, Validators.required]
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.templateId = +params['id'];
        this.isEditMode = true;
        this.loadTemplate(this.templateId);
      }
    });

    this.loadProcurementCompanies();
    this.loadWorkflowTypes();
    this.loadEmailActions();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      tinymce.init({
        selector: '#emailEditor',
        height: 500,
        menubar: true,
        branding: false,
        plugins: [
          'advlist autolink lists link image charmap preview anchor',
          'searchreplace visualblocks code fullscreen insertdatetime media table',
          'emoticons help wordcount autosave directionality visualchars codesample pagebreak quickbars nonbreaking template'
        ],
        toolbar: 'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table emoticons codesample | removeformat | ltr rtl | pagebreak | preview fullscreen | code help',
        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
        contextmenu: 'link image table spellchecker',
        autosave_ask_before_unload: true,
        autosave_interval: '30s',
        image_advtab: true,
        content_style: `body { font-family:Helvetica,Arial,sans-serif; font-size:14px; padding:10px; }`,
        setup: editor => {
          editor.on('change', () => {
            this.invitationForm.patchValue({ body: editor.getContent() });
            this.invitationForm.get('body')?.markAsTouched();
          });
        }
      });
    }, 100);
  }

  loadTemplate(id: number) {
    this.emailTemplateService.getEmailTemplateById(id).subscribe({
      next: (res: any) => {
        this.invitationForm.patchValue({
          subject: res.subject,
          body: res.body,
          procurementCompanyId: res.procurementCompanyId,
          workFlowTypeId: res.workFlowTypeId,
          emailActionId: res.emailActionId
        });


        if (this.companies.length > 0 && this.workFlowTypes.length > 0) {
          this.mapSelectedValues();
          this.cdr.detectChanges();
        }

        if (this.actionOptions.length > 0) {
          this.mapSelectedValues();
          this.cdr.detectChanges();
        }

        if (res.workFlowTypeId) {
          this.loadPlaceholders(res.workFlowTypeId);
        }
        
        setTimeout(() => tinymce.get('emailEditor')?.setContent(res.body), 100);

      },
      error: err => {
        console.error('Error loading template:', err);
        this.toastr.error('Failed to load template.', 'Error');
      }
    });
  }

  loadProcurementCompanies() {
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;

    this.lookupService.getProcCompaniesByProcUserId(userId).subscribe({
      next: (res: any[]) => {
        this.companies = (res || []).map(c => ({
          id: c.id,
          description: c.description
        }));
        if (this.isEditMode) this.mapSelectedValues();
        this.cdr.detectChanges();
      },
      error: err => console.error('Error fetching procurement companies:', err)
    });
  }

  loadWorkflowTypes() {
    this.lookupService.getAllWorkflowTypes().subscribe({
      next: (res: any[]) => {
        this.workFlowTypes = (res || []).map(w => ({
          id: w.id,
          description: w.description
        }));
        if (this.isEditMode) this.mapSelectedValues();
        this.cdr.detectChanges();
      },
      error: err => console.error('Error fetching workflow types:', err)
    });
  }

  loadEmailActions() {
    this.lookupService.getAllEmailActions().subscribe({
      next: (res: any[]) => {
        this.actionOptions = (res || []).map(a => ({
          id: a.id,
          description: a.description
        }));
        if (this.isEditMode) this.mapSelectedValues();
        this.cdr.detectChanges();
      },
      error: err => console.error('Error fetching email actions:', err)
    });
  }

  mapSelectedValues() {
    const form = this.invitationForm.value;

    this.selectedCompany = this.companies.find(c => c.id === form.procurementCompanyId) || null;
    this.selectedType = this.workFlowTypes.find(t => t.id === form.workFlowTypeId) || null;
    this.selectedAction = this.actionOptions.find(a => a.id === form.emailActionId) || null;
  }

  selectCompany(company: DropdownItem) {
    this.selectedCompany = company;
    this.invitationForm.patchValue({ procurementCompanyId: company.id });
    this.dropdownOpenCompanies = false;
  }

  selectType(type: DropdownItem) {
    this.selectedType = type;
    this.invitationForm.patchValue({ workFlowTypeId: type.id });
    this.dropdownOpenTypes = false;

    // Load placeholders
    this.loadPlaceholders(type.id);
  }

  selectAction(action: DropdownItem) {
    this.selectedAction = action;
    this.invitationForm.patchValue({ emailActionId: action.id });
    this.dropdownOpenActions = false;
  }

  // ------------------ Placeholder Management ------------------
  loadPlaceholders(workflowTypeId: number) {
    this.lookupService.getAllPlaceHoldersByWorkflowType(workflowTypeId).subscribe({
      next: (res: any[]) => {
        this.placeholders = res.map(p => ({
          id: p.id,
          workflowTypeId: workflowTypeId,
          description: p.description || p.placeHolder
        }));
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load placeholders', err)
    });
  }

  insertPlaceholder(placeholder: string) {
    const editor = tinymce.get('emailEditor');
    if (editor) editor.execCommand('mceInsertContent', false, placeholder);
  }

  // ------------------ Form Submission ------------------
  saveEmailTemplate() {
    this.submitted = true;

    // Get TinyMCE content
    const tinyMceContent = tinymce.get('emailEditor')?.getContent() || '';
    this.invitationForm.patchValue({ body: tinyMceContent });

    if (this.invitationForm.invalid) {
      this.toastr.warning('Please fill all required fields.', 'Warning');
      return;
    }

    const emailTemplatePayload = {
      subject: this.invitationForm.value.subject,
      body: this.invitationForm.value.body,
      workFlowTypeId: this.invitationForm.value.workFlowTypeId,
      procurementCompanyId: this.invitationForm.value.procurementCompanyId,
      emailActionId: this.invitationForm.value.emailActionId
    };

    if (this.isEditMode && this.templateId) {

      const payload = {
        id: this.templateId,       // Required by backend
        emailTemplate: emailTemplatePayload
      };

      this.emailTemplateService.updateEmailTemplate(payload).subscribe({
        next: () => {
          this.router.navigate(['/setup/email-templatelist']);
        },
        error: err => {
          console.error('Error updating template:', err);
          this.toastr.error('Failed to update template.', 'Error');
        }
      });

      return;
    }

    const createPayload = {
      emailTemplate: emailTemplatePayload
    };

    this.emailTemplateService.creatEmailTemplate(createPayload).subscribe({
      next: () => {
        this.router.navigate(['/setup/email-templatelist']);
      },
      error: err => {
        console.error('Error saving email template:', err);
        this.toastr.error('Failed to save email template.', 'Error');
      }
    });
  }

  // ------------------ Dropdown Toggle ------------------
  toggleDropdown(type: 'company' | 'type' | 'action') {
    if (type === 'company') this.dropdownOpenCompanies = !this.dropdownOpenCompanies;
    if (type === 'type') this.dropdownOpenTypes = !this.dropdownOpenTypes;
    if (type === 'action') this.dropdownOpenActions = !this.dropdownOpenActions;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpenCompanies = false;
      this.dropdownOpenTypes = false;
      this.dropdownOpenActions = false;
    }
  }

  homePage() {
    this.router.navigate(['/setup/email-templatelist']);
  }

  resetForm() {
    this.invitationForm.reset({
      subject: '',
      body: '',
      procurementCompanyId: null,
      workFlowTypeId: null,
      emailActionId: null
    });

    // Reset selected dropdown objects
    this.selectedCompany = null;
    this.selectedType = null;
    this.selectedAction = null;

    this.submitted = false;

    // Clear TinyMCE content
    const editor = tinymce.get('emailEditor');
    if (editor) editor.setContent('');
  }

  get f() {
    return this.invitationForm.controls;
  }
}
