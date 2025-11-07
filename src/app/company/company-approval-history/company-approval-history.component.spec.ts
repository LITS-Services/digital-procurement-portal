import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyApprovalHistoryComponent } from './company-approval-history.component';

describe('CompanyApprovalHistoryComponent', () => {
  let component: CompanyApprovalHistoryComponent;
  let fixture: ComponentFixture<CompanyApprovalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyApprovalHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyApprovalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
