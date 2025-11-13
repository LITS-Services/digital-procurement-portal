import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AclSetupComponent } from './acl-setup.component';

describe('AclSetupComponent', () => {
  let component: AclSetupComponent;
  let fixture: ComponentFixture<AclSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AclSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AclSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
