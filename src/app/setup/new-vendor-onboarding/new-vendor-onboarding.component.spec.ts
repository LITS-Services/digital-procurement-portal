import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewVendorOnboardingComponent } from './new-vendor-onboarding.component';

describe('NewVendorOnboardingComponent', () => {
  let component: NewVendorOnboardingComponent;
  let fixture: ComponentFixture<NewVendorOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewVendorOnboardingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewVendorOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
