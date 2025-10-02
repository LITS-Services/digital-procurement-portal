import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqApprovalHistoryComponent } from './rfq-approval-history.component';

describe('RfqApprovalHistoryComponent', () => {
  let component: RfqApprovalHistoryComponent;
  let fixture: ComponentFixture<RfqApprovalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqApprovalHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqApprovalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
