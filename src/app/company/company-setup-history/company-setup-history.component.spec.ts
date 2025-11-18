import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanySetupHistoryComponent } from './company-setup-history.component';

describe('CompanySetupHistoryComponent', () => {
  let component: CompanySetupHistoryComponent;
  let fixture: ComponentFixture<CompanySetupHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanySetupHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanySetupHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
