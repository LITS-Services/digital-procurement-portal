import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRfqComponent } from './new-rfq.component';

describe('NewRfqComponent', () => {
  let component: NewRfqComponent;
  let fixture: ComponentFixture<NewRfqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewRfqComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRfqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
