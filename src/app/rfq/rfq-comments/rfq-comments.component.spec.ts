import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqCommentsComponent } from './rfq-comments.component';

describe('RfqCommentsComponent', () => {
  let component: RfqCommentsComponent;
  let fixture: ComponentFixture<RfqCommentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqCommentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
