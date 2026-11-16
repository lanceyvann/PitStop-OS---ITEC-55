export interface VehicleProfile {
  id: string;
  name: string;
  tires: number;
  cpuRange: [number, number];
  ioRange: [number, number];
  defaultPriority: number; 
  iconKey: 'motorcycle' | 'sedan' | 'suv' | 'jeepney' | 'truck';
  description: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  vehicleTypeId: string;
  tireSpec: string; 
  tireCount: number;
}
