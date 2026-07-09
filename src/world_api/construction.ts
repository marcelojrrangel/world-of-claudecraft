// IWorldConstruction facet: read-surface for the Construction secondary
// profession. Phase 1 exposes skill and maxSkill; Phase 3 adds plot/house;
// Phase 4 adds blueprints; Phase 5 adds furniture; Phase 6 adds benefits.
import type { HousePermission, PlacedFurniture, PlotDef, StoredChestItem } from '../sim/types';

export interface ConstructionView {
  skill: number;
  maxSkill: number;
}

export interface HouseView {
  plotId: string | null;
  houseTier: number;
}

export interface StationView {
  itemId: string;
  x: number;
  z: number;
  stationKind: string;
}

export interface IWorldConstruction {
  readonly constructionSkill: ConstructionView;
  readonly myPlot: PlotDef | null;
  readonly houseState: HouseView;
  readonly knownBlueprints: string[];
  readonly currentHouseProgress: {
    blueprintId: string;
    currentPhase: number;
    totalPhases: number;
  } | null;
  readonly placedFurniture: PlacedFurniture[];
  /** Phase 6: rested XP bonus multiplier (0 = no house, 1.0-2.5 = tier 1-6). */
  readonly houseRestedBonus: number;
  /** Phase 6: crafting stations placed in the player's house. */
  readonly houseStations: StationView[];
  buyPlot(plotId: string): void;
  enterHouse(): void;
  leaveHouse(): void;
  buildBlueprint(blueprintId: string): void;
  learnBlueprint(itemId: string): void;
  placeFurniture(itemId: string, x: number, z: number, rotY: number): void;
  moveFurniture(placedId: string, x: number, z: number, rotY: number): void;
  removeFurniture(placedId: string): void;
  /** Phase 6: chest contents for a placed chest (empty array if not a chest). */
  chestContents(placedId: string): StoredChestItem[];
  /** Phase 6: store items into a chest. Returns true if successful. */
  storeInChest(placedId: string, itemId: string, count: number): boolean;
  /** Phase 6: retrieve items from a chest. Returns true if successful. */
  retrieveFromChest(placedId: string, itemId: string, count: number): boolean;
  /** Phase 6: use a crafting station furniture item. Returns true if successful. */
  useStation(placedId: string): boolean;
  /** Phase 6: visit another player's house interior. */
  visitHouse(targetPid: number): void;
  /** Phase 6: set the house permission level. */
  setHousePermission(permission: HousePermission): void;
  /** Whether an item id is placeable furniture. */
  isPlaceableFurniture(itemId: string): boolean;
}
