import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryTransferListComponent } from './inventory-transfer-list.component';

describe('InventoryTransferListComponent', () => {
  let component: InventoryTransferListComponent;
  let fixture: ComponentFixture<InventoryTransferListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryTransferListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryTransferListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
