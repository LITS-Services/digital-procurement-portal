import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestApprovalComponent } from './purchase-request-approval.component';

describe('PurchaseRequestApprovalComponent', () => {
  let component: PurchaseRequestApprovalComponent;
  let fixture: ComponentFixture<PurchaseRequestApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseRequestApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
