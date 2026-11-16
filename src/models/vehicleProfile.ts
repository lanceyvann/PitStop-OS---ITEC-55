/**
 * @file vehicleProfile.ts
 * @description Vehicle profiles, types, and model specifications.
 * Defines tire count, CPU/I-O scaling factors, and default priorities.
 */

export interface VehicleProfile {
  id: string;
  name: string;
  tires: number;
  cpuRange: [number, number];
  ioRange: [number, number];
  defaultPriority: number; // 1 (lowest) to 10 (highest/fleet)
  iconKey: 'motorcycle' | 'sedan' | 'suv' | 'jeepney' | 'truck';
  description: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  vehicleTypeId: string;
  tireSpec: string; // e.g., "140/70 R17", "195/65 R15"
  tireCount: number;
}
