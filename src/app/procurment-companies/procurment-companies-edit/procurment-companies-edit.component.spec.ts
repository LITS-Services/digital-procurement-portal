import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurmentCompaniesEditComponent } from './procurment-companies-edit.component';

describe('ProcurmentCompaniesEditComponent', () => {
  let component: ProcurmentCompaniesEditComponent;
  let fixture: ComponentFixture<ProcurmentCompaniesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcurmentCompaniesEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcurmentCompaniesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
