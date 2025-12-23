import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorRating } from './vendor-rating';

describe('VendorRating', () => {
  let component: VendorRating;
  let fixture: ComponentFixture<VendorRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorRating]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorRating);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
