import { VehicleProfile, VehicleModel } from '../models/vehicleProfile';
import { TireStockItem } from '../models/tireStockItem';
import { Lock } from '../models/lock';

export const DEFAULT_VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    tires: 2,
    cpuRange: [2, 4],
    ioRange: [1, 2],
    defaultPriority: 3,
    iconKey: 'motorcycle',
    description: 'Quick 2-wheel change; swift fitting and balancing.',
  },
  {
    id: 'sedan',
    name: 'Sedan',
    tires: 4,
    cpuRange: [6, 10],
    ioRange: [2, 4],
    defaultPriority: 4,
    iconKey: 'sedan',
    description: 'Standard passenger car; 4 wheels with alignment check.',
  },
  {
    id: 'suv',
    name: 'SUV / Pickup',
    tires: 4,
    cpuRange: [10, 14],
    ioRange: [3, 5],
    defaultPriority: 5,
    iconKey: 'suv',
    description: 'Heavy 4x4 passenger vehicle requiring high-torque fastening.',
  },
  {
    id: 'jeepney',
    name: 'Jeepney / Van',
    tires: 6,
    cpuRange: [12, 16],
    ioRange: [4, 8],
    defaultPriority: 8, 
    iconKey: 'jeepney',
    description: 'Public utility route vehicle; long parts I/O, urgent priority.',
  },
  {
    id: 'truck',
    name: 'Truck / Bus',
    tires: 8,
    cpuRange: [18, 28],
    ioRange: [5, 10],
    defaultPriority: 7,
    iconKey: 'truck',
    description: 'Commercial hauler; dual rear axles, multi-stage pneumatic mount.',
  },
];

export const DEFAULT_VEHICLE_MODELS: VehicleModel[] = [
  { id: 'honda_click', name: 'Honda Click 125', vehicleTypeId: 'motorcycle', tireSpec: '80/90 R14', tireCount: 2 },
  { id: 'yamaha_nmax', name: 'Yamaha NMAX 155', vehicleTypeId: 'motorcycle', tireSpec: '140/70 R13', tireCount: 2 },
  { id: 'toyota_vios', name: 'Toyota Vios 1.5G', vehicleTypeId: 'sedan', tireSpec: '185/60 R15', tireCount: 4 },
  { id: 'honda_civic', name: 'Honda Civic RS', vehicleTypeId: 'sedan', tireSpec: '215/50 R17', tireCount: 4 },
  { id: 'ford_ranger', name: 'Ford Ranger Raptor', vehicleTypeId: 'suv', tireSpec: '265/65 R17', tireCount: 4 },
  { id: 'toyota_hilux', name: 'Toyota Hilux Conquest', vehicleTypeId: 'suv', tireSpec: '265/65 R17', tireCount: 4 },
  { id: 'sarao_jeepney', name: 'Sarao Commuter Jeepney', vehicleTypeId: 'jeepney', tireSpec: '7.00 R15', tireCount: 6 },
  { id: 'toyota_hiace', name: 'Toyota Hiace Commuter', vehicleTypeId: 'jeepney', tireSpec: '195/80 R15', tireCount: 4 },
  { id: 'isuzu_forward', name: 'Isuzu Forward Cargo', vehicleTypeId: 'truck', tireSpec: '11R 22.5', tireCount: 6 },
  { id: 'hino_grand_bus', name: 'Hino Grand Coach Bus', vehicleTypeId: 'truck', tireSpec: '295/80 R22.5', tireCount: 8 },
];

export const DEFAULT_TIRE_CATALOG: TireStockItem[] = [
  { id: 'tire_80_90_r14', brand: 'Pirelli', model: 'City Demon', size: '80/90 R14', price: 1850, stock: 12, reserved: 0 },
  { id: 'tire_140_70_r13', brand: 'Dunlop', model: 'ScootSmart', size: '140/70 R13', price: 2400, stock: 10, reserved: 0 },
  { id: 'tire_185_60_r15', brand: 'Michelin', model: 'Primacy 4', size: '185/60 R15', price: 4200, stock: 16, reserved: 0 },
  { id: 'tire_215_50_r17', brand: 'Bridgestone', model: 'Turanza ER300', size: '215/50 R17', price: 5800, stock: 12, reserved: 0 },
  { id: 'tire_265_65_r17', brand: 'BFGoodrich', model: 'All-Terrain KO2', size: '265/65 R17', price: 8900, stock: 12, reserved: 0 },
  { id: 'tire_700_r15', brand: 'Deestone', model: 'Extra Traction Lug', size: '7.00 R15', price: 4500, stock: 18, reserved: 0 },
  { id: 'tire_195_80_r15', brand: 'Goodyear', model: 'Cargo Pro', size: '195/80 R15', price: 3900, stock: 14, reserved: 0 },
  { id: 'tire_11r_225', brand: 'Bridgestone', model: 'R150 Commercial', size: '11R 22.5', price: 14500, stock: 12, reserved: 0 },
  { id: 'tire_295_80_r225', brand: 'Michelin', model: 'X Coach Energy', size: '295/80 R22.5', price: 16800, stock: 8, reserved: 0 },
];

export const DEFAULT_LOCKS: Record<string, Lock> = {
  lock_tire_changer: {
    id: 'lock_tire_changer',
    osName: 'Mutex 0x01 (Tire Mount Driver)',
    shopName: 'Pneumatic Tire Changer',
    heldByPid: null,
    waitingPids: [],
  },
  lock_wheel_balancer: {
    id: 'lock_wheel_balancer',
    osName: 'Mutex 0x02 (Harmonic Balancer)',
    shopName: 'Digital Dynamic Wheel Balancer',
    heldByPid: null,
    waitingPids: [],
  },
  lock_cash_register: {
    id: 'lock_cash_register',
    osName: 'Mutex 0x03 (POS Billing Controller)',
    shopName: 'Main Cash Register / POS',
    heldByPid: null,
    waitingPids: [],
  },
};

export const COLOR_PALETTE = [
  '#CC5500',
  '#0284C7', 
  '#059669', 
  '#7C3AED', 
  '#D97706', 
  '#DB2777', 
  '#475569', 
  '#0D9488', 
  '#B45309', 
  '#4338CA', 
];
