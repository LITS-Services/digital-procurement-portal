import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyActionsComponent } from './company-actions.component';

describe('CompanyActionsComponent', () => {
  let component: CompanyActionsComponent;
  let fixture: ComponentFixture<CompanyActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyActionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
