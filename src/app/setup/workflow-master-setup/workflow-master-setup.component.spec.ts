import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowMasterSetupComponent } from './workflow-master-setup.component';

describe('WorkflowMasterSetupComponent', () => {
  let component: WorkflowMasterSetupComponent;
  let fixture: ComponentFixture<WorkflowMasterSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowMasterSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowMasterSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
