import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqQuotationboxComponent } from './rfq-quotationbox.component';

describe('RfqQuotationboxComponent', () => {
  let component: RfqQuotationboxComponent;
  let fixture: ComponentFixture<RfqQuotationboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqQuotationboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqQuotationboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
