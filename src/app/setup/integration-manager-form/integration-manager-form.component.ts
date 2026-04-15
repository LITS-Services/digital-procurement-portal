import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-integration-manager-form',
  templateUrl: './integration-manager-form.component.html',
  styleUrls: ['./integration-manager-form.component.scss'],
  standalone: false
})
export class IntegrationManagerFormComponent implements OnInit {
  integrationForm!: FormGroup;
  isEditMode = false;
  loading = false;
  currentId: number | null = null;

  intervalTypeOptions = [
    { value: 1, label: 'Minute' },
    { value: 2, label: 'Hour' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private systemService: SystemService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.integrationForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      url: ['', Validators.required],
      intervalType: [null, Validators.required],
      interval: [null, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });

    this.route.queryParams.subscribe(params => {
      const id = Number(params?.id);
      if (id) {
        this.currentId = id;
        this.isEditMode = true;
        this.loadById(id);
      }
    });
  }

  loadById(id: number): void {
    this.loading = true;
    this.systemService.getIntegrationManagerById(id).subscribe({
      next: (res) => {
        this.integrationForm.patchValue({
          name: res?.name ?? '',
          code: res?.code ?? '',
          url: res?.url ?? '',
          intervalType: this.normalizeIntervalType(res?.intervalType),
          interval: res?.interval ?? null,
          isActive: !!res?.isActive
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load integration.');
      }
    });
  }

  private normalizeIntervalType(value: string | number | null | undefined): number | null {
    if (typeof value === 'number') {
      return value;
    }
    if (!value) {
      return null;
    }

    const normalized = value.toString().toLowerCase();
    if (normalized === 'minute') {
      return 1;
    }
    if (normalized === 'hour') {
      return 2;
    }
    return null;
  }

  onSave(): void {
    if (this.integrationForm.invalid) {
      this.integrationForm.markAllAsTouched();
      this.toastr.warning('Please complete required fields.');
      return;
    }

    const value = this.integrationForm.value;
    const payload = {
      name: value.name,
      code: value.code || null,
      url: value.url,
      intervalType: Number(value.intervalType),
      interval: Number(value.interval),
      isActive: !!value.isActive
    };

    this.loading = true;

    if (this.isEditMode && this.currentId) {
      this.systemService.updateIntegrationManager({ id: this.currentId, ...payload }).subscribe({
        next: () => {
          this.loading = false;
          this.toastr.success('Integration updated successfully.');
          this.router.navigate(['/setup/integration-manager']);
        },
        error: () => {
          this.loading = false;
          this.toastr.error('Failed to update integration.');
        }
      });
      return;
    }

    this.systemService.createIntegrationManager(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Integration created successfully.');
        this.router.navigate(['/setup/integration-manager']);
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to create integration.');
      }
    });
  }

  homePage(): void {
    this.router.navigate(['/setup/integration-manager']);
  }
}
