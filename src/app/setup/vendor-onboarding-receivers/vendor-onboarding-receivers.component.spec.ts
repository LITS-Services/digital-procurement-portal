import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorOnboardingReceiversComponent } from './vendor-onboarding-receivers.component';

describe('VendorOnboardingReceiversComponent', () => {
  let component: VendorOnboardingReceiversComponent;
  let fixture: ComponentFixture<VendorOnboardingReceiversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorOnboardingReceiversComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorOnboardingReceiversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
