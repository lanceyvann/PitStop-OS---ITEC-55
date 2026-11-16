/**
 * @file settingsStorage.ts
 * @description LocalStorage persistence and validation for user settings, vehicle profiles,
 * tire catalog, and saved customer order presets. Includes 'Reset to Defaults' option.
 */

import { VehicleProfile, VehicleModel } from '../models/vehicleProfile';
import { TireStockItem } from '../models/tireStockItem';
import { DEFAULT_VEHICLE_PROFILES, DEFAULT_VEHICLE_MODELS, DEFAULT_TIRE_CATALOG } from './defaults';

export interface SavedOrderPreset {
  id: string;
  name: string;
  vehicleTypeId: string;
  modelId: string;
  tireSpec: string;
  tireCount: number;
  priority: number;
}

export interface UserShopSettings {
  vehicleProfiles: VehicleProfile[];
  vehicleModels: VehicleModel[];
  tireCatalog: TireStockItem[];
  orderPresets: SavedOrderPreset[];
  quantum: number;
  agingEnabled: boolean;
  viewMode: 'OS' | 'STORY';
  speedMs: number;
}

const STORAGE_KEY = 'tire_shop_kernel_user_settings_v1';

export const DEFAULT_USER_SETTINGS: UserShopSettings = {
  vehicleProfiles: DEFAULT_VEHICLE_PROFILES,
  vehicleModels: DEFAULT_VEHICLE_MODELS,
  tireCatalog: DEFAULT_TIRE_CATALOG,
  orderPresets: [
    {
      id: 'preset_standard_sedan',
      name: 'Standard Sedan Service',
      vehicleTypeId: 'sedan',
      modelId: 'Toyota Vios 1.5G',
      tireSpec: '185/60 R15',
      tireCount: 4,
      priority: 4,
    },
    {
      id: 'preset_fleet_jeepney',
      name: 'Commuter Fleet Jeepney Rush',
      vehicleTypeId: 'jeepney',
      modelId: 'Sarao Commuter Jeepney',
      tireSpec: '7.00 R15',
      tireCount: 6,
      priority: 8,
    },
    {
      id: 'preset_truck_haul',
      name: 'Heavy Hauler Full Axle Replacement',
      vehicleTypeId: 'truck',
      modelId: 'Isuzu Forward Cargo',
      tireSpec: '11R 22.5',
      tireCount: 6,
      priority: 7,
    },
  ],
  quantum: 3,
  agingEnabled: true,
  viewMode: 'OS',
  speedMs: 250,
};

const memoryStore: Record<string, string> = {};

function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
    clear: () => {
      Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    },
  };
}

export class SettingsStorage {
  /**
   * Loads saved settings from localStorage, falling back to defaults.
   */
  public static load(): UserShopSettings {
    try {
      const storage = getStorage();
      const serialized = storage.getItem(STORAGE_KEY);
      if (!serialized) {
        return JSON.parse(JSON.stringify(DEFAULT_USER_SETTINGS));
      }
      const parsed = JSON.parse(serialized);
      return {
        vehicleProfiles: parsed.vehicleProfiles || DEFAULT_VEHICLE_PROFILES,
        vehicleModels: parsed.vehicleModels || DEFAULT_VEHICLE_MODELS,
        tireCatalog: parsed.tireCatalog || DEFAULT_TIRE_CATALOG,
        orderPresets: parsed.orderPresets || DEFAULT_USER_SETTINGS.orderPresets,
        quantum: parsed.quantum || 3,
        agingEnabled: parsed.agingEnabled !== undefined ? parsed.agingEnabled : true,
        viewMode: parsed.viewMode || 'OS',
        speedMs: parsed.speedMs || 250,
      };
    } catch (e) {
      console.warn('Failed to parse localStorage settings, using defaults', e);
      return JSON.parse(JSON.stringify(DEFAULT_USER_SETTINGS));
    }
  }

  /**
   * Saves settings to localStorage.
   */
  public static save(settings: UserShopSettings): boolean {
    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
      return false;
    }
  }

  /**
   * Resets all user settings back to initial factory defaults.
   */
  public static resetToDefaults(): UserShopSettings {
    getStorage().removeItem(STORAGE_KEY);
    const defaults = JSON.parse(JSON.stringify(DEFAULT_USER_SETTINGS));
    this.save(defaults);
    return defaults;
  }

  public static clear(): void {
    getStorage().clear();
  }

  /**
   * Validates vehicle profile inputs.
   */
  public static validateVehicleProfile(profile: Partial<VehicleProfile>): { valid: boolean; error?: string } {
    if (!profile.name || profile.name.trim().length === 0) {
      return { valid: false, error: 'Profile name is required.' };
    }
    if (!profile.tires || profile.tires <= 0) {
      return { valid: false, error: 'Tires count must be greater than 0.' };
    }
    if (!profile.cpuRange || profile.cpuRange[0] <= 0 || profile.cpuRange[1] < profile.cpuRange[0]) {
      return { valid: false, error: 'CPU range min must be > 0 and max >= min.' };
    }
    if (!profile.ioRange || profile.ioRange[0] < 0 || profile.ioRange[1] < profile.ioRange[0]) {
      return { valid: false, error: 'I/O range min must be >= 0 and max >= min.' };
    }
    if (profile.defaultPriority === undefined || profile.defaultPriority < 1 || profile.defaultPriority > 10) {
      return { valid: false, error: 'Priority must be between 1 and 10.' };
    }
    return { valid: true };
  }

  /**
   * Validates tire catalog item inputs.
   */
  public static validateTireItem(item: Partial<TireStockItem>): { valid: boolean; error?: string } {
    if (!item.brand || item.brand.trim().length === 0) {
      return { valid: false, error: 'Brand is required.' };
    }
    if (!item.model || item.model.trim().length === 0) {
      return { valid: false, error: 'Model name is required.' };
    }
    if (!item.size || item.size.trim().length === 0) {
      return { valid: false, error: 'Tire size is required.' };
    }
    if (item.price === undefined || item.price < 0) {
      return { valid: false, error: 'Price must be non-negative.' };
    }
    if (item.stock === undefined || item.stock < 0) {
      return { valid: false, error: 'Stock quantity must be non-negative.' };
    }
    return { valid: true };
  }
}
