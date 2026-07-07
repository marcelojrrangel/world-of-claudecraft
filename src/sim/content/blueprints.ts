import type { BlueprintDef } from '../types';

export const BLUEPRINTS: BlueprintDef[] = [
  {
    id: 'blueprint_tent',
    name: "Builder's Tent",
    tier: 1,
    itemId: 'blueprint_tent',
    requiredSkill: 0,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'rough_stone', count: 5 }, { itemId: 'raw_lumber', count: 2 }], toolTier: 1, skillGain: 2, trivialAt: 25 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'raw_lumber', count: 3 }, { itemId: 'sawed_plank', count: 2 }], toolTier: 1, skillGain: 2, trivialAt: 25 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'canvas_scrap', count: 4 }, { itemId: 'raw_lumber', count: 3 }], toolTier: 1, skillGain: 2, trivialAt: 25 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'canvas_scrap', count: 3 }, { itemId: 'rough_stone', count: 2 }], toolTier: 1, skillGain: 2, trivialAt: 25 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'bedroll', count: 1 }, { itemId: 'candle', count: 1 }], toolTier: 1, skillGain: 2, trivialAt: 30 },
    ],
  },
  {
    id: 'blueprint_wooden_shack',
    name: 'Wooden Shack',
    tier: 2,
    itemId: 'blueprint_wooden_shack',
    requiredSkill: 25,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'rough_stone', count: 10 }, { itemId: 'clay_lump', count: 5 }], toolTier: 1, skillGain: 3, trivialAt: 50 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'raw_lumber', count: 8 }, { itemId: 'sawed_plank', count: 10 }, { itemId: 'iron_nail', count: 10 }], toolTier: 1, skillGain: 3, trivialAt: 50 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'sawed_plank', count: 12 }, { itemId: 'iron_nail', count: 10 }], toolTier: 1, skillGain: 3, trivialAt: 50 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'clay_tile', count: 10 }, { itemId: 'sawed_plank', count: 6 }], toolTier: 1, skillGain: 3, trivialAt: 55 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'door_wooden', count: 1 }, { itemId: 'window_shutter', count: 1 }], toolTier: 1, skillGain: 3, trivialAt: 55 },
    ],
  },
  {
    id: 'blueprint_timber_cottage',
    name: 'Timber Cottage',
    tier: 3,
    itemId: 'blueprint_timber_cottage',
    requiredSkill: 75,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'cut_stone', count: 15 }, { itemId: 'limestone_mortar', count: 8 }], toolTier: 2, skillGain: 4, trivialAt: 100 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'sawed_plank', count: 12 }, { itemId: 'iron_nail', count: 15 }, { itemId: 'iron_hinge', count: 4 }], toolTier: 2, skillGain: 4, trivialAt: 100 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'sawed_plank', count: 20 }, { itemId: 'limestone_mortar', count: 5 }], toolTier: 2, skillGain: 4, trivialAt: 100 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'clay_tile', count: 15 }, { itemId: 'sawed_plank', count: 8 }], toolTier: 2, skillGain: 4, trivialAt: 105 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'door_sturdy', count: 1 }, { itemId: 'glass_pane', count: 2 }], toolTier: 2, skillGain: 4, trivialAt: 105 },
    ],
  },
  {
    id: 'blueprint_stone_house',
    name: 'Stone House',
    tier: 4,
    itemId: 'blueprint_stone_house',
    requiredSkill: 150,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'granite_block', count: 25 }, { itemId: 'limestone_mortar', count: 15 }], toolTier: 3, skillGain: 5, trivialAt: 180 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'reinforced_beam', count: 20 }, { itemId: 'iron_nail', count: 20 }, { itemId: 'iron_hinge', count: 8 }], toolTier: 3, skillGain: 5, trivialAt: 180 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'granite_block', count: 30 }, { itemId: 'limestone_mortar', count: 20 }], toolTier: 3, skillGain: 5, trivialAt: 180 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'fired_brick', count: 20 }, { itemId: 'clay_tile', count: 10 }], toolTier: 3, skillGain: 5, trivialAt: 185 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'door_ironbound', count: 1 }, { itemId: 'glass_pane', count: 4 }, { itemId: 'iron_grille', count: 2 }], toolTier: 3, skillGain: 5, trivialAt: 185 },
    ],
  },
  {
    id: 'blueprint_manor',
    name: 'Country Manor',
    tier: 5,
    itemId: 'blueprint_manor',
    requiredSkill: 200,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'marble_block', count: 40 }, { itemId: 'limestone_mortar', count: 25 }], toolTier: 4, skillGain: 6, trivialAt: 230 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'reinforced_beam', count: 30 }, { itemId: 'iron_nail', count: 30 }, { itemId: 'iron_hinge', count: 12 }], toolTier: 4, skillGain: 6, trivialAt: 230 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'marble_block', count: 50 }, { itemId: 'limestone_mortar', count: 30 }], toolTier: 4, skillGain: 6, trivialAt: 230 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'fired_brick', count: 30 }, { itemId: 'clay_tile', count: 20 }, { itemId: 'glass_pane', count: 5 }], toolTier: 4, skillGain: 6, trivialAt: 235 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'door_ironbound', count: 2 }, { itemId: 'crystal_pane', count: 6 }, { itemId: 'iron_grille', count: 3 }], toolTier: 4, skillGain: 6, trivialAt: 235 },
    ],
  },
  {
    id: 'blueprint_grand_estate',
    name: 'Grand Estate',
    tier: 6,
    itemId: 'blueprint_grand_estate',
    requiredSkill: 250,
    phases: [
      { index: 0, nameId: 'foundation', materials: [{ itemId: 'rune_carved_stone', count: 60 }, { itemId: 'enchanted_lumber', count: 40 }], toolTier: 5, skillGain: 8, trivialAt: 300 },
      { index: 1, nameId: 'frame', materials: [{ itemId: 'enchanted_lumber', count: 50 }, { itemId: 'iron_nail', count: 40 }, { itemId: 'iron_hinge', count: 20 }], toolTier: 5, skillGain: 8, trivialAt: 300 },
      { index: 2, nameId: 'walls', materials: [{ itemId: 'rune_carved_stone', count: 60 }, { itemId: 'enchanted_lumber', count: 40 }], toolTier: 5, skillGain: 8, trivialAt: 300 },
      { index: 3, nameId: 'roof', materials: [{ itemId: 'fired_brick', count: 40 }, { itemId: 'clay_tile', count: 30 }, { itemId: 'crystal_pane', count: 10 }], toolTier: 5, skillGain: 8, trivialAt: 300 },
      { index: 4, nameId: 'details', materials: [{ itemId: 'door_runic', count: 2 }, { itemId: 'crystal_pane', count: 10 }, { itemId: 'rune_carved_stone', count: 5 }], toolTier: 5, skillGain: 8, trivialAt: 300 },
    ],
  },
];

export const BLUEPRINTS_BY_ID: Record<string, BlueprintDef> = Object.fromEntries(
  BLUEPRINTS.map((b) => [b.id, b]),
);

export function blueprintByItemId(itemId: string): BlueprintDef | undefined {
  return BLUEPRINTS.find((b) => b.itemId === itemId);
}
