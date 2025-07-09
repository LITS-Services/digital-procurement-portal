import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenderingComponent } from './tendering.component';

describe('TenderingComponent', () => {
  let component: TenderingComponent;
  let fixture: ComponentFixture<TenderingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TenderingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenderingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
