import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowApproverSetupComponent } from './workflow-approver-setup.component';

describe('WorkflowApproverSetupComponent', () => {
  let component: WorkflowApproverSetupComponent;
  let fixture: ComponentFixture<WorkflowApproverSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowApproverSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowApproverSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
