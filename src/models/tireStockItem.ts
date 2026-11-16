/**
 * @file tireStockItem.ts
 * @description Tire stock inventory item representing shared physical resources.
 */

export interface TireStockItem {
  id: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  stock: number;
  reserved: number;
}
