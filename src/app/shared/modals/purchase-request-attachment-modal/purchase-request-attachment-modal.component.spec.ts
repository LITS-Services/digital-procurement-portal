import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestAttachmentModalComponent } from './purchase-request-attachment-modal.component';

describe('PurchaseRequestAttachmentModalComponent', () => {
  let component: PurchaseRequestAttachmentModalComponent;
  let fixture: ComponentFixture<PurchaseRequestAttachmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseRequestAttachmentModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestAttachmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
