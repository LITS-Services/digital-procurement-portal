import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqAttachmentComponent } from './rfq-attachment.component';

describe('RfqAttachmentComponent', () => {
  let component: RfqAttachmentComponent;
  let fixture: ComponentFixture<RfqAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RfqAttachmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfqAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
