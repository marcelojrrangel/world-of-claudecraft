import { esc } from '../../ui/esc';
import { t } from '../../ui/i18n';
import { tEntity } from '../../ui/entity_i18n';
import {
  GUIDE_BLUEPRINTS,
  GUIDE_FURNITURE_SETS,
  GUIDE_CRAFT_STATIONS,
  GUIDE_CHESTS,
} from '../content.generated';
import { hrefFor } from '../routes';
import type { GuidePage } from './types';
import { lead, p, related, section } from './ui';

const BP_KEY: Record<string, string> = {
  blueprint_tent: 'guide.constructionPage.bpTent',
  blueprint_wooden_shack: 'guide.constructionPage.bpShack',
  blueprint_timber_cottage: 'guide.constructionPage.bpCottage',
  blueprint_stone_house: 'guide.constructionPage.bpStone',
  blueprint_manor: 'guide.constructionPage.bpManor',
  blueprint_grand_estate: 'guide.constructionPage.bpEstate',
};

const QUALITY_KEY: Record<string, string> = {
  poor: 'guide.constructionPage.qualityPoor',
  common: 'guide.constructionPage.qualityCommon',
  uncommon: 'guide.constructionPage.qualityUncommon',
  rare: 'guide.constructionPage.qualityRare',
  epic: 'guide.constructionPage.qualityEpic',
  legendary: 'guide.constructionPage.qualityLegendary',
};

const STATION_KEY: Record<string, string> = {
  station_workbench: 'guide.constructionPage.stationWorkbench',
  station_anvil: 'guide.constructionPage.stationAnvil',
  station_alchemy: 'guide.constructionPage.stationAlchemy',
  station_cooking_fire: 'guide.constructionPage.stationCooking',
  station_loom: 'guide.constructionPage.stationLoom',
};

const CHEST_KEY: Record<string, string> = {
  chest_small: 'guide.constructionPage.chestSmall',
  chest_medium: 'guide.constructionPage.chestMedium',
  chest_large: 'guide.constructionPage.chestLarge',
};

export const construction: GuidePage = {
  titleKey: 'guide.nav.construction',
  render() {
    const bpHtml = GUIDE_BLUEPRINTS.map(
      (bp) => {
        const nameKey = BP_KEY[bp.id];
        const nameHtml = nameKey ? esc(t(nameKey as any)) : esc(bp.name);
        return `<div class="guide-beat">
          <h3 class="guide-beat-h">${nameHtml}</h3>
          <p>Tier ${bp.tier} &mdash; ${esc(t('guide.constructionPage.requiresSkill', { skill: String(bp.requiredSkill) }))}</p>
          <p>${esc(t('guide.constructionPage.phasesCount', { count: String(bp.phases.length) }))}</p>
        </div>`;
      },
    ).join('');

    const furnHtml = GUIDE_FURNITURE_SETS.map(
      (fs) => {
        const qualityKey = QUALITY_KEY[fs.quality];
        const qualityHtml = qualityKey ? esc(t(qualityKey as any)) : esc(fs.quality);
        const itemsHtml = fs.items.map((i) => esc(tEntity({ kind: 'item', id: i.id, field: 'name' }))).join(', ');
        return `<div class="guide-beat">
          <h3 class="guide-beat-h">${esc(fs.label)}</h3>
          <p>${qualityHtml} &mdash; ${esc(t('guide.constructionPage.minTierLabel', { tier: String(fs.minTier) }))}</p>
          <p>${itemsHtml}</p>
        </div>`;
      },
    ).join('');

    const stationHtml = GUIDE_CRAFT_STATIONS.map(
      (s) => {
        const key = STATION_KEY[s.id];
        return `<li>${key ? esc(t(key as any)) : esc(s.name)}</li>`;
      },
    ).join('');

    const chestHtml = GUIDE_CHESTS.map(
      (c) => {
        const key = CHEST_KEY[c.id];
        const qualityKey = QUALITY_KEY[c.quality];
        const qualityHtml = qualityKey ? esc(t(qualityKey as any)) : esc(c.quality);
        return `<li>${key ? esc(t(key as any)) : esc(c.id)} (${qualityHtml})</li>`;
      },
    ).join('');

    return `
      <article class="guide-article">
        <h1>${esc(t('guide.constructionPage.heading'))}</h1>
        ${lead('guide.constructionPage.intro')}

        ${section('guide.constructionPage.plotsTitle', p('guide.constructionPage.plotsBody'))}

        ${section('guide.constructionPage.skillTitle', p('guide.constructionPage.skillBody'))}

        <section class="guide-block">
          <h2>${esc(t('guide.constructionPage.blueprintsTitle'))}</h2>
          <p>${esc(t('guide.constructionPage.blueprintsBody'))}</p>
          <div class="guide-beat-grid">${bpHtml}</div>
        </section>

        <section class="guide-block">
          <h2>${esc(t('guide.constructionPage.furnitureTitle'))}</h2>
          <p>${esc(t('guide.constructionPage.furnitureBody'))}</p>
          <div class="guide-beat-grid">${furnHtml}</div>
        </section>

        <section class="guide-block">
          <h2>${esc(t('guide.constructionPage.stationsTitle'))}</h2>
          <p>${esc(t('guide.constructionPage.stationsBody'))}</p>
          <ul>${stationHtml}</ul>
        </section>

        <section class="guide-block">
          <h2>${esc(t('guide.constructionPage.chestsTitle'))}</h2>
          <p>${esc(t('guide.constructionPage.chestsBody'))}</p>
          <ul>${chestHtml}</ul>
        </section>

        <section class="guide-block">
          <h2>${esc(t('guide.constructionPage.materialsTitle'))}</h2>
          <p>${esc(t('guide.constructionPage.materialsBody'))}</p>
        </section>

        ${related([
          { href: hrefFor('economy'), key: 'guide.nav.economy' },
          { href: hrefFor('quests'), key: 'guide.nav.quests' },
          { href: hrefFor('how-to-play'), key: 'guide.nav.howToPlay' },
        ])}
      </article>`;
  },
};
