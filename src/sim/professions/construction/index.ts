// Construction secondary profession: data shapes and helpers.
// Phase 1 only: skill tracking and normalize. Gameplay building mechanics
// land in later phases.
import type { ConstructionSystem } from '../../types';

export function emptyConstructionSystem(): ConstructionSystem {
  return {
    skill: 0,
    plotId: null,
    houseTier: 0,
    knownBlueprints: [],
    phasesBuilt: {},
    furniture: [],
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
  };
}
