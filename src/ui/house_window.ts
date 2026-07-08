import { esc } from './esc';
import { formatNumber, t } from './i18n';
import type { IWorld } from '../world_api';

export interface HouseWindowDeps {
  sim: IWorld;
  onClose(): void;
}

export function renderHouseWindow(
  el: HTMLElement,
  deps: HouseWindowDeps,
): void {
  const sim = deps.sim;
  const house = sim.houseState;
  const bp = sim.knownBlueprints.length;
  const furn = sim.placedFurniture.length;
  const stations = sim.houseStations.length;
  const bonus = sim.houseRestedBonus;
  const permission: string = (sim as any).setHousePermission?.length > 0 ? 'owner' : '';

  el.innerHTML = `
    <div class="panel-title">
      <span>${esc(t('hudChrome.construction.house.title'))}</span>
      <button type="button" class="x-btn" data-close aria-label="${esc(t('hudChrome.construction.furniture.cancel'))}">X</button>
    </div>
    <div class="house-body">
      <p>${esc(t('hudChrome.construction.house.tier', { tier: house.houseTier }))}</p>
      <p>${esc(t('hudChrome.construction.house.furniture', { count: formatNumber(furn, { maximumFractionDigits: 0 }) }))}</p>
      <p>${esc(t('hudChrome.construction.house.restedBonus', { bonus: formatNumber(bonus, { maximumFractionDigits: 1 }) }))}</p>
      <p>${esc(t('hudChrome.construction.buildMode.blueprints'))}: ${esc(formatNumber(bp, { maximumFractionDigits: 0 }))}</p>
      <p>${esc(t('hudChrome.construction.house.title'))} stations: ${esc(formatNumber(stations, { maximumFractionDigits: 0 }))}</p>
    </div>`;

  const closeBtn = el.querySelector('[data-close]');
  if (closeBtn) closeBtn.addEventListener('click', () => deps.onClose());
}
