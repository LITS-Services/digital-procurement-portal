import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyListingComponent } from './company-listing.component';

describe('CompanyListingComponent', () => {
  let component: CompanyListingComponent;
  let fixture: ComponentFixture<CompanyListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyListingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
