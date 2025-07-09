import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorRegistrationFormComponent } from './vendor-registration-form.component';

describe('VendorRegistrationFormComponent', () => {
  let component: VendorRegistrationFormComponent;
  let fixture: ComponentFixture<VendorRegistrationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorRegistrationFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorRegistrationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
