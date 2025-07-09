import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestAccountBudgetLookupModalComponent } from './purchase-request-account-budget-lookup-modal.component';

describe('PurchaseRequestAccountBudgetLookupModalComponent', () => {
  let component: PurchaseRequestAccountBudgetLookupModalComponent;
  let fixture: ComponentFixture<PurchaseRequestAccountBudgetLookupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseRequestAccountBudgetLookupModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestAccountBudgetLookupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
