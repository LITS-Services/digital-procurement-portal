import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrInventoryManagementComponent } from './pr-inventory-management.component';

describe('PrInventoryManagementComponent', () => {
  let component: PrInventoryManagementComponent;
  let fixture: ComponentFixture<PrInventoryManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrInventoryManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrInventoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
