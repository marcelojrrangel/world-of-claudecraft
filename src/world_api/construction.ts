// IWorldConstruction facet: read-surface for the Construction secondary
// profession. Phase 1 exposes only skill and maxSkill; plot/house/blueprints
// land in later phases.
export interface ConstructionView {
  skill: number;
  maxSkill: number;
}

export interface IWorldConstruction {
  readonly constructionSkill: ConstructionView;
}
