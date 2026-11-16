/**
 * @file inventoryManager.ts
 * @description Shared Tire Stock Room Inventory Manager (OS Shared Memory/Resource Pool).
 * Handles stock verification, reservation, deduction, and supplier delivery wake-ups.
 */

import { TireStockItem } from '../models/tireStockItem';
import { DEFAULT_TIRE_CATALOG } from '../config/defaults';

export class InventoryManager {
  private items: Map<string, TireStockItem>;

  constructor(initialItems: TireStockItem[] = DEFAULT_TIRE_CATALOG) {
    this.items = new Map();
    initialItems.forEach((item) => {
      this.items.set(item.id, { ...item });
    });
  }

  public getItems(): TireStockItem[] {
    return Array.from(this.items.values()).map((item) => ({ ...item }));
  }

  public getItem(id: string): TireStockItem | undefined {
    const item = this.items.get(id);
    return item ? { ...item } : undefined;
  }

  public setStock(id: string, count: number): void {
    const item = this.items.get(id);
    if (item) {
      item.stock = count;
    }
  }

  public findBySize(size: string): TireStockItem | undefined {
    for (const item of this.items.values()) {
      if (item.size === size) return { ...item };
    }
    return undefined;
  }

  /**
   * Checks if required quantity is available (unreserved).
   */
  public hasAvailableStock(id: string, count: number): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    return item.stock - item.reserved >= count;
  }

  /**
   * Reserves tires for an active order.
   * Returns true on success, false if out of stock.
   */
  public reserveStock(id: string, count: number): boolean {
    const item = this.items.get(id);
    if (!item || item.stock - item.reserved < count) {
      return false;
    }
    item.reserved += count;
    return true;
  }

  /**
   * Releases previously reserved tires without deducting inventory (e.g. on order abortion).
   */
  public releaseReservation(id: string, count: number): void {
    const item = this.items.get(id);
    if (item) {
      item.reserved = Math.max(0, item.reserved - count);
    }
  }

  /**
   * Commits and deducts stock when work finishes.
   */
  public commitStock(id: string, count: number): void {
    const item = this.items.get(id);
    if (item) {
      item.stock = Math.max(0, item.stock - count);
      item.reserved = Math.max(0, item.reserved - count);
    }
  }

  /**
   * Restocks an item (e.g. supplier restock delivery event).
   * Returns total available stock after restock.
   */
  public restock(id: string, count: number): number {
    const item = this.items.get(id);
    if (item) {
      item.stock += count;
      return item.stock;
    }
    return 0;
  }

  /**
   * Restores inventory state (used during Time Machine rewind).
   */
  public restoreState(items: TireStockItem[]): void {
    this.items.clear();
    items.forEach((item) => {
      this.items.set(item.id, { ...item });
    });
  }
}
