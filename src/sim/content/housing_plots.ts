import type { PlotDef } from '../types';

// Builder's Row — 8 plots just north-east of Eastbrook (zone1).
// Prices increase with tier cap and location desirability.
export const PLOTS: PlotDef[] = [
  { id: 'plot_eastbrook_01', zoneId: 'zone1', x: 190, z: -320, price: 50000, maxTier: 2 },
  { id: 'plot_eastbrook_02', zoneId: 'zone1', x: 210, z: -320, price: 100000, maxTier: 3 },
  { id: 'plot_eastbrook_03', zoneId: 'zone1', x: 230, z: -320, price: 150000, maxTier: 3 },
  { id: 'plot_eastbrook_04', zoneId: 'zone1', x: 190, z: -345, price: 300000, maxTier: 4 },
  { id: 'plot_eastbrook_05', zoneId: 'zone1', x: 210, z: -345, price: 500000, maxTier: 5 },
  { id: 'plot_eastbrook_06', zoneId: 'zone1', x: 230, z: -345, price: 800000, maxTier: 5 },
  { id: 'plot_eastbrook_07', zoneId: 'zone1', x: 200, z: -370, price: 1500000, maxTier: 6 },
  { id: 'plot_eastbrook_08', zoneId: 'zone1', x: 220, z: -370, price: 2500000, maxTier: 6 },
];
