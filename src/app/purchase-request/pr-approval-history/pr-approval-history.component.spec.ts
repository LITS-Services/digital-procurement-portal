import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrApprovalHistoryComponent } from './pr-approval-history.component';

describe('PrApprovalHistoryComponent', () => {
  let component: PrApprovalHistoryComponent;
  let fixture: ComponentFixture<PrApprovalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrApprovalHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrApprovalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
