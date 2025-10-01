import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqRemarksComponent } from './rfq-remarks.component';

describe('RfqRemarksComponent', () => {
  let component: RfqRemarksComponent;
  let fixture: ComponentFixture<RfqRemarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqRemarksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqRemarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
