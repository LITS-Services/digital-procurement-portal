import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestRemarksComponent } from './purchase-request-remarks.component';

describe('PurchaseRequestRemarksComponent', () => {
  let component: PurchaseRequestRemarksComponent;
  let fixture: ComponentFixture<PurchaseRequestRemarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseRequestRemarksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestRemarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
