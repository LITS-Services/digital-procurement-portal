import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSetup } from './project-setup';

describe('ProjectSetup', () => {
  let component: ProjectSetup;
  let fixture: ComponentFixture<ProjectSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
