import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGlobalConfigurationComponent } from './new-global-configuration.component';

describe('NewGlobalConfigurationComponent', () => {
  let component: NewGlobalConfigurationComponent;
  let fixture: ComponentFixture<NewGlobalConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewGlobalConfigurationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGlobalConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
