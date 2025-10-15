import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSetupComponent } from './email-setup.component';

describe('EmailSetupComponent', () => {
  let component: EmailSetupComponent;
  let fixture: ComponentFixture<EmailSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmailSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
