import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqVendorModalComponent } from './rfq-vendor-modal.component';

describe('RfqVendorModalComponent', () => {
  let component: RfqVendorModalComponent;
  let fixture: ComponentFixture<RfqVendorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqVendorModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqVendorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
