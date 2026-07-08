import { esc } from './esc';
import { t } from './i18n';
import type { IWorld } from '../world_api';

export interface BuildModeWindowDeps {
  sim: IWorld;
  hideTooltip(): void;
  onClose(): void;
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
  const stationCount = sim.houseStations.length;
  const furnitureCount = sim.placedFurniture.length;

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
            ${blueprints.map((bp) => `<li><button type="button" class="build-mode-bp-item" data-bp="${esc(bp)}">${esc(bp)}</button></li>`).join('')}
          </ul>`}
      </div>
      ${progress
        ? `<div class="build-mode-section">
          <h3>${esc(t('hudChrome.construction.buildMode.materials'))}</h3>
          <p>${esc(t('hudChrome.construction.buildMode.phase', { current: progress.currentPhase, total: progress.totalPhases }))}</p>
        </div>`
        : ''}
    </div>`;

  // Wire close button
  const closeBtn = el.querySelector('[data-close]');
  if (closeBtn) closeBtn.addEventListener('click', () => deps.onClose());
}
