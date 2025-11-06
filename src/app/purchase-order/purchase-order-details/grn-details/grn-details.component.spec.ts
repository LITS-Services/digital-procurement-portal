import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnDetailsComponent } from './grn-details.component';

describe('GrnDetailsComponent', () => {
  let component: GrnDetailsComponent;
  let fixture: ComponentFixture<GrnDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrnDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
