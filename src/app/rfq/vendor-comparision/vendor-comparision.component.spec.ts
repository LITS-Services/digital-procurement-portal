import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorComparisionComponent } from './vendor-comparision.component';

describe('VendorComparisionComponent', () => {
  let component: VendorComparisionComponent;
  let fixture: ComponentFixture<VendorComparisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorComparisionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorComparisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
