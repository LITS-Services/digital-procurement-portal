import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTenderingRequestComponent } from './new-tendering-request.component';

describe('NewTenderingRequestComponent', () => {
  let component: NewTenderingRequestComponent;
  let fixture: ComponentFixture<NewTenderingRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewTenderingRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewTenderingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
