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

  public hasAvailableStock(id: string, count: number): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    return item.stock - item.reserved >= count;
  }

  public reserveStock(id: string, count: number): boolean {
    const item = this.items.get(id);
    if (!item || item.stock - item.reserved < count) {
      return false;
    }
    item.reserved += count;
    return true;
  }

  public releaseReservation(id: string, count: number): void {
    const item = this.items.get(id);
    if (item) {
      item.reserved = Math.max(0, item.reserved - count);
    }
  }

  public commitStock(id: string, count: number): void {
    const item = this.items.get(id);
    if (item) {
      item.stock = Math.max(0, item.stock - count);
      item.reserved = Math.max(0, item.reserved - count);
    }
  }

  public restock(id: string, count: number): number {
    const item = this.items.get(id);
    if (item) {
      item.stock += count;
      return item.stock;
    }
    return 0;
  }

  public restoreState(items: TireStockItem[]): void {
    this.items.clear();
    items.forEach((item) => {
      this.items.set(item.id, { ...item });
    });
  }
}
