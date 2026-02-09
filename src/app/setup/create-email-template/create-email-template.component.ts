import { Component, ElementRef, HostListener, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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



@Component({
  selector: 'app-creat-email-template',
  templateUrl: './create-email-template.component.html',
  styleUrls: ['./create-email-template.component.scss'],
  standalone: false
})
export class CreateEmailTemplateComponent implements OnInit, AfterViewInit {
  @ViewChild('editorArea') editorArea!: ElementRef;
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
  lastEditorRange: Range | null = null;

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
      procurementCompanyId: [null],
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
    // Custom editor initialization if needed
  }

  executeCommand(command: string, value: string | null = null) {
    document.execCommand(command, false, value || undefined);
    this.onEditorInput();
    this.cdr.detectChanges(); // Trigger UI update for button states
  }

  isCommandActive(command: string): boolean {
    try {
      if (!this.editorArea) return false;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;

      // Check if selection is within the editor area
      if (!this.editorArea.nativeElement.contains(commonAncestor)) {
        return false;
      }

      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  }

  filteredPlaceholders: any[] = [];

  filterTags(event: any) {
    const query = event.target.value.toLowerCase();
    if (!query) {
      this.filteredPlaceholders = [...this.placeholders];
      return;
    }
    this.filteredPlaceholders = this.placeholders.filter(ph =>
      ph.description.toLowerCase().includes(query)
    );
  }

  onEditorInput() {
    if (this.editorArea) {
      const content = this.editorArea.nativeElement.innerHTML;
      this.invitationForm.patchValue({ body: content });
      this.invitationForm.get('body')?.markAsTouched();
    }
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

        if (this.editorArea) {
          this.editorArea.nativeElement.innerHTML = res.body || '';
        }

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
    if (this.editorArea) {
      const selection = window.getSelection();
      let range: Range | null = null;

      // 1. Determine the correct range to use
      if (this.lastEditorRange && (!selection || selection.rangeCount === 0 || !this.editorArea.nativeElement.contains(selection.anchorNode))) {
        // Use saved range if editor is not focused
        range = this.lastEditorRange;
      } else if (selection && selection.rangeCount > 0) {
        // Use current selection if it's within the editor
        const currentRange = selection.getRangeAt(0);
        if (this.editorArea.nativeElement.contains(currentRange.commonAncestorContainer)) {
          range = currentRange;
        } else {
          range = this.lastEditorRange;
        }
      }

      // 2. Focus the editor cautiously
      this.editorArea.nativeElement.focus();

      // 3. Restore the range if we have one
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        // 4. Perform the insertion
        range.deleteContents();
        const textNode = document.createTextNode(placeholder);
        range.insertNode(textNode);

        // 5. Move cursor after the inserted placeholder
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        // 6. Persist the new range
        this.lastEditorRange = range.cloneRange();
      } else {
        // Fallback: append if no range exists
        this.editorArea.nativeElement.innerHTML += placeholder;
      }
      this.onEditorInput();
      this.cdr.detectChanges();
    }
  }

  saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (this.editorArea.nativeElement.contains(range.commonAncestorContainer)) {
        this.lastEditorRange = range.cloneRange();
      }
    }
    this.cdr.detectChanges();
  }

  // ------------------ Form Submission ------------------
  saveEmailTemplate() {
    this.submitted = true;

    // Get custom editor content
    const content = this.editorArea?.nativeElement.innerHTML || '';
    this.invitationForm.patchValue({ body: content });

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

    // Clear placeholders
    this.placeholders = [];

    this.submitted = false;

    // Clear custom editor content
    if (this.editorArea) {
      this.editorArea.nativeElement.innerHTML = '';
    }
  }

  get f() {
    return this.invitationForm.controls;
  }
}
