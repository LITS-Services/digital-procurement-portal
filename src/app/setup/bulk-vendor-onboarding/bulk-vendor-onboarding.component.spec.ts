import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkVendorOnboardingComponent } from './bulk-vendor-onboarding.component';

describe('BulkVendorOnboardingComponent', () => {
  let component: BulkVendorOnboardingComponent;
  let fixture: ComponentFixture<BulkVendorOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BulkVendorOnboardingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkVendorOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
