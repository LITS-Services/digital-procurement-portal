import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqFinalVendorsComponent } from './rfq-final-vendors.component';

describe('RfqFinalVendorsComponent', () => {
  let component: RfqFinalVendorsComponent;
  let fixture: ComponentFixture<RfqFinalVendorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqFinalVendorsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqFinalVendorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
