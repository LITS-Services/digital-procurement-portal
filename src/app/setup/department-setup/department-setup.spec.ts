import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentSetup } from './department-setup';

describe('DepartmentSetup', () => {
  let component: DepartmentSetup;
  let fixture: ComponentFixture<DepartmentSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
