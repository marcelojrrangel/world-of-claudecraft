// Construction secondary profession: data shapes and helpers.
import type { ConstructionSystem } from '../../types';

export function emptyConstructionSystem(): ConstructionSystem {
  return {
    skill: 0,
    plotId: null,
    houseTier: 0,
    knownBlueprints: [],
    phasesBuilt: {},
    furniture: [],
    chests: {},
    permission: 'owner',
  };
}

// Normalizes a possibly-absent, possibly-partial saved ConstructionSystem
// (old character saves predate this field entirely, or a partially-migrated
// save from a future phase) into a full, zero-defaulted record. Never throws
// on an absent or malformed field.
export function normalizeConstructionSystem(
  saved: Partial<ConstructionSystem> | undefined | null,
): ConstructionSystem {
  if (!saved) return emptyConstructionSystem();
  return {
    skill:
      typeof saved.skill === 'number' && Number.isFinite(saved.skill)
        ? Math.max(0, Math.min(300, saved.skill))
        : 0,
    plotId: typeof saved.plotId === 'string' ? saved.plotId : null,
    houseTier:
      typeof saved.houseTier === 'number' && Number.isFinite(saved.houseTier)
        ? Math.max(0, Math.min(6, Math.floor(saved.houseTier)))
        : 0,
    knownBlueprints: Array.isArray(saved.knownBlueprints)
      ? saved.knownBlueprints.filter((b) => typeof b === 'string')
      : [],
    phasesBuilt:
      saved.phasesBuilt &&
      typeof saved.phasesBuilt === 'object' &&
      !Array.isArray(saved.phasesBuilt)
        ? Object.fromEntries(
            Object.entries(saved.phasesBuilt).filter(
              ([, v]) => typeof v === 'number' && Number.isFinite(v),
            ),
          )
        : {},
    furniture: Array.isArray(saved.furniture)
      ? saved.furniture.filter(
          (f) =>
            f &&
            typeof f.id === 'string' &&
            typeof f.itemId === 'string' &&
            typeof f.x === 'number' &&
            typeof f.z === 'number' &&
            typeof f.rotY === 'number',
        )
      : [],
    chests:
      saved.chests && typeof saved.chests === 'object' && !Array.isArray(saved.chests)
        ? Object.fromEntries(
            Object.entries(saved.chests).filter(
              ([, items]) =>
                Array.isArray(items) &&
                items.every(
                  (ci) =>
                    ci &&
                    typeof ci.itemId === 'string' &&
                    typeof ci.count === 'number' &&
                    Number.isFinite(ci.count) &&
                    ci.count > 0,
                ),
            ),
          )
        : {},
    permission: saved.permission === 'friends' || saved.permission === 'public' ? saved.permission : 'owner',
  };
}

export {
  blueprintTierById,
  buildPhase,
  canBuildBlueprint,
  constructionSkillFor,
  currentHouseProgressFor,
  drainConstructionGrants,
  knownBlueprintsFor,
  learnBlueprint,
  nextBlueprintForTier,
  queueConstructionGrant,
} from './blueprints';
export {
  buyPlot,
  enterHouse,
  houseOrigin,
  houseSlotAt,
  isHousePos,
  leaveHouse,
  setHousePermission,
  updateHouseInstances,
  visitHouse,
} from './housing';
export {
  chestSlotCount,
  isChestItem,
  isPlaceableFurniture,
  furnitureSize,
  placeFurniture,
  moveFurniture,
  removeFurniture,
  placedFurnitureFor,
  stationKindFor,
} from './furniture';
export {
  useStation,
} from './stations';
