import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPurchaseRequestComponent } from './new-purchase-request.component';

describe('NewPurchaseRequestComponent', () => {
  let component: NewPurchaseRequestComponent;
  let fixture: ComponentFixture<NewPurchaseRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewPurchaseRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPurchaseRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
