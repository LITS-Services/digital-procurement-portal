import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurmentCompaniesComponent } from './procurment-companies.component';

describe('ProcurmentCompaniesComponent', () => {
  let component: ProcurmentCompaniesComponent;
  let fixture: ComponentFixture<ProcurmentCompaniesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcurmentCompaniesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcurmentCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
