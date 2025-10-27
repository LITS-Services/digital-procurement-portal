import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatEmailTemplateComponent } from './creat-email-template.component';

describe('CreatEmailTemplateComponent', () => {
  let component: CreatEmailTemplateComponent;
  let fixture: ComponentFixture<CreatEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatEmailTemplateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
