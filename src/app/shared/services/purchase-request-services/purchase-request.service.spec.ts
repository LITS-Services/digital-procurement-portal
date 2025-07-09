import { TestBed } from '@angular/core/testing';

import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchaseRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
