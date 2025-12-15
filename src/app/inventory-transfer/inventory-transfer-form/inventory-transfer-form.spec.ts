import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryTransferForm } from './inventory-transfer-form';

describe('InventoryTransferForm', () => {
  let component: InventoryTransferForm;
  let fixture: ComponentFixture<InventoryTransferForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryTransferForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryTransferForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
