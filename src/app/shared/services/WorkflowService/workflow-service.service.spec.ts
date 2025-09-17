import { TestBed } from '@angular/core/testing';

import { WorkflowServiceService } from './workflow-service.service';

describe('WorkflowServiceService', () => {
  let service: WorkflowServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
