import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsStorage, DEFAULT_USER_SETTINGS } from '../config/settingsStorage';

describe('User Profile and Settings Management', () => {
  beforeEach(() => {
    SettingsStorage.clear();
  });

  it('validates vehicle profile inputs and rejects negative or inverted ranges', () => {
    const invalidRange = SettingsStorage.validateVehicleProfile({
      name: 'Bad Range',
      tires: 4,
      cpuRange: [10, 5],
      ioRange: [1, 2],
      defaultPriority: 5,
    });
    expect(invalidRange.valid).toBe(false);
    expect(invalidRange.error).toContain('CPU range min must be > 0 and max >= min');

    const negativeTires = SettingsStorage.validateVehicleProfile({
      name: 'Zero Tires',
      tires: 0,
      cpuRange: [2, 4],
      ioRange: [1, 2],
      defaultPriority: 5,
    });
    expect(negativeTires.valid).toBe(false);

    const valid = SettingsStorage.validateVehicleProfile({
      name: 'Custom Offroad',
      tires: 4,
      cpuRange: [6, 12],
      ioRange: [2, 5],
      defaultPriority: 7,
    });
    expect(valid.valid).toBe(true);
  });

  it('validates tire catalog inputs and rejects negative prices or stock', () => {
    const invalidPrice = SettingsStorage.validateTireItem({
      brand: 'Michelin',
      model: 'Primacy',
      size: '195/65 R15',
      price: -100,
      stock: 5,
    });
    expect(invalidPrice.valid).toBe(false);

    const validTire = SettingsStorage.validateTireItem({
      brand: 'Michelin',
      model: 'Primacy',
      size: '195/65 R15',
      price: 4500,
      stock: 10,
    });
    expect(validTire.valid).toBe(true);
  });

  it('resets user settings to factory defaults', () => {
    const custom = {
      ...DEFAULT_USER_SETTINGS,
      quantum: 9,
      vehicleProfiles: [],
    };
    SettingsStorage.save(custom);

    const loadedCustom = SettingsStorage.load();
    expect(loadedCustom.quantum).toBe(9);

    const defaults = SettingsStorage.resetToDefaults();
    expect(defaults.quantum).toBe(3);
    expect(defaults.vehicleProfiles.length).toBeGreaterThan(0);
  });
});
