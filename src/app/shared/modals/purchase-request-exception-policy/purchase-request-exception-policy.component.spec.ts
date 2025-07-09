import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestExceptionPolicyComponent } from './purchase-request-exception-policy.component';

describe('PurchaseRequestExceptionPolicyComponent', () => {
  let component: PurchaseRequestExceptionPolicyComponent;
  let fixture: ComponentFixture<PurchaseRequestExceptionPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseRequestExceptionPolicyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestExceptionPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
