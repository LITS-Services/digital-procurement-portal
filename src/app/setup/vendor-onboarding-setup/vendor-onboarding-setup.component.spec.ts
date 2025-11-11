import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorOnboardingSetupComponent } from './vendor-onboarding-setup.component';

describe('VendorOnboardingSetupComponent', () => {
  let component: VendorOnboardingSetupComponent;
  let fixture: ComponentFixture<VendorOnboardingSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorOnboardingSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorOnboardingSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
