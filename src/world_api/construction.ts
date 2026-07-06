// IWorldConstruction facet: read-surface for the Construction secondary
// profession. Phase 1 exposes skill and maxSkill; Phase 3 adds plot/house.
import type { PlotDef } from '../sim/types';

export interface ConstructionView {
  skill: number;
  maxSkill: number;
}

export interface HouseView {
  plotId: string | null;
  houseTier: number;
}

export interface IWorldConstruction {
  readonly constructionSkill: ConstructionView;
  readonly myPlot: PlotDef | null;
  readonly houseState: HouseView;
  buyPlot(plotId: string): void;
  enterHouse(): void;
  leaveHouse(): void;
}
