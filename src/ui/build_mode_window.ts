import { esc } from './esc';
import { t } from './i18n';
import { tEntity } from './entity_i18n';
import type { IWorld } from '../world_api';

export interface BuildModeWindowDeps {
  sim: IWorld;
  hideTooltip(): void;
  onClose(): void;
  onPlaceFurniture(itemId: string): void;
  onMoveFurniture(placedId: string): void;
  onRemoveFurniture(placedId: string): void;
  /** Current placement rotation in radians (increments of PI/4). */
  placementRotation: number;
  onRotationChange(rot: number): void;
}

/** Furniture items the player can place (filtered from inventory). */
function placeableInventoryItems(sim: IWorld): { itemId: string; count: number }[] {
  const inv = sim.inventory;
  const seen = new Map<string, number>();
  for (const slot of inv) {
    if (slot.count > 0 && sim.isPlaceableFurniture(slot.itemId)) {
      seen.set(slot.itemId, (seen.get(slot.itemId) ?? 0) + slot.count);
    }
  }
  return [...seen.entries()].map(([itemId, count]) => ({ itemId, count }));
}

export function renderBuildModeWindow(
  el: HTMLElement,
  deps: BuildModeWindowDeps,
): void {
  const sim = deps.sim;
  const blueprints = sim.knownBlueprints;
  const progress = sim.currentHouseProgress;
  const houseState = sim.houseState;
  const tier = houseState.houseTier;
  const furnitureCount = sim.placedFurniture.length;
  const placed = sim.placedFurniture;
  const inventoryItems = placeableInventoryItems(sim);

  el.innerHTML = `
    <div class="panel-title">
      <span>${esc(t('hudChrome.construction.buildMode.title'))}</span>
      <button type="button" class="x-btn" data-close aria-label="${esc(t('hudChrome.construction.furniture.cancel'))}">X</button>
    </div>
    <div class="build-mode-body">
      <div class="build-mode-section">
        <h3>${esc(t('hudChrome.construction.house.title'))}</h3>
        <p>${esc(t('hudChrome.construction.house.tier', { tier }))}</p>
        <p>${esc(t('hudChrome.construction.house.furniture', { count: furnitureCount }))}</p>
        <p>${esc(t('hudChrome.construction.house.restedBonus', { bonus: sim.houseRestedBonus }))}</p>
      </div>
      <div class="build-mode-section">
        <h3>${esc(t('hudChrome.construction.buildMode.blueprints'))}</h3>
        ${blueprints.length === 0
          ? `<p class="build-mode-empty">${esc(t('hudChrome.construction.buildMode.noSelection'))}</p>`
          : `<ul class="build-mode-bp-list">
            ${blueprints.map((bp) => `<li><button type="button" class="build-mode-bp-item" data-bp="${esc(bp)}">${esc(tEntity({ kind: 'item', id: bp, field: 'name' }))}</button></li>`).join('')}
          </ul>`}
      </div>
      ${progress
        ? `<div class="build-mode-section">
          <h3>${esc(t('hudChrome.construction.buildMode.materials'))}</h3>
          <p>${esc(t('hudChrome.construction.buildMode.phase', { current: progress.currentPhase, total: progress.totalPhases }))}</p>
        </div>`
        : ''}
      <div class="build-mode-section">
        <h3>${esc(t('hudChrome.construction.furniture.place'))}</h3>
        <div class="build-mode-rotation">
          <label>Rotation:</label>
          <button type="button" class="build-mode-rot-btn" data-rot="0">0</button>
          <button type="button" class="build-mode-rot-btn" data-rot="1">45</button>
          <button type="button" class="build-mode-rot-btn" data-rot="2">90</button>
          <button type="button" class="build-mode-rot-btn" data-rot="3">135</button>
          <button type="button" class="build-mode-rot-btn" data-rot="4">180</button>
          <button type="button" class="build-mode-rot-btn" data-rot="5">225</button>
          <button type="button" class="build-mode-rot-btn" data-rot="6">270</button>
          <button type="button" class="build-mode-rot-btn" data-rot="7">315</button>
        </div>
        ${inventoryItems.length === 0
          ? `<p class="build-mode-empty">${esc(t('hudChrome.construction.buildMode.noSelection'))}</p>`
          : `<ul class="build-mode-furn-list">
            ${inventoryItems.map((fi) => `<li><button type="button" class="build-mode-place-btn" data-item="${esc(fi.itemId)}">${esc(tEntity({ kind: 'item', id: fi.itemId, field: 'name' }))} (${fi.count})</button></li>`).join('')}
          </ul>`}
      </div>
      ${placed.length > 0
        ? `<div class="build-mode-section">
          <h3>${esc(t('hudChrome.construction.furniture.remove'))}</h3>
          <ul class="build-mode-placed-list">
            ${placed.map((pf) => `<li>
              <span>${esc(tEntity({ kind: 'item', id: pf.itemId, field: 'name' }))}</span>
              <button type="button" class="build-mode-move-btn" data-placed="${esc(pf.id)}">${esc(t('hudChrome.construction.furniture.move'))}</button>
              <button type="button" class="build-mode-remove-btn" data-placed="${esc(pf.id)}">${esc(t('hudChrome.construction.furniture.remove'))}</button>
            </li>`).join('')}
          </ul>
        </div>`
        : ''}
    </div>`;

  const closeBtn = el.querySelector('[data-close]');
  if (closeBtn) closeBtn.addEventListener('click', () => deps.onClose());

  // Rotation buttons
  for (const btn of el.querySelectorAll('.build-mode-rot-btn')) {
    btn.addEventListener('click', () => {
      const rot = Number((btn as HTMLElement).dataset.rot) * (Math.PI / 4);
      deps.onRotationChange(rot);
    });
  }

  for (const btn of el.querySelectorAll('.build-mode-place-btn')) {
    btn.addEventListener('click', () => deps.onPlaceFurniture((btn as HTMLElement).dataset.item!));
  }
  for (const btn of el.querySelectorAll('.build-mode-move-btn')) {
    btn.addEventListener('click', () => deps.onMoveFurniture((btn as HTMLElement).dataset.placed!));
  }
  for (const btn of el.querySelectorAll('.build-mode-remove-btn')) {
    btn.addEventListener('click', () => deps.onRemoveFurniture((btn as HTMLElement).dataset.placed!));
  }
}
