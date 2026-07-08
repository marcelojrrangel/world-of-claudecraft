import { esc } from '../../ui/esc';
import { t } from '../../ui/i18n';
import {
  GUIDE_BLUEPRINTS,
  GUIDE_FURNITURE_SETS,
  GUIDE_CRAFT_STATIONS,
  GUIDE_CHESTS,
} from '../content.generated';
import { hrefFor } from '../routes';
import type { GuidePage } from './types';
import { lead, p, related, section } from './ui';

const QUALITY_LABEL: Record<string, string> = {
  poor: 'Poor',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const construction: GuidePage = {
  titleKey: 'guide.nav.construction',
  render() {
    const bpHtml = GUIDE_BLUEPRINTS.map(
      (bp) => `<div class="guide-beat">
        <h3 class="guide-beat-h">${esc(bp.name)}</h3>
        <p>Tier ${bp.tier} &mdash; requires ${bp.requiredSkill} skill</p>
        <p>${bp.phases.length} construction phases</p>
      </div>`,
    ).join('');

    const furnHtml = GUIDE_FURNITURE_SETS.map(
      (fs) => `<div class="guide-beat">
        <h3 class="guide-beat-h">${esc(fs.label)}</h3>
        <p>${esc(QUALITY_LABEL[fs.quality] ?? fs.quality)} &mdash; minimum tier ${fs.minTier}</p>
        <p>${fs.items.map((i) => esc(i.name)).join(', ')}</p>
      </div>`,
    ).join('');

    const stationHtml = GUIDE_CRAFT_STATIONS.map(
      (s) => `<li>${esc(s.name)}</li>`,
    ).join('');

    const chestHtml = GUIDE_CHESTS.map(
      (c) => `<li>${esc(c.name)} (${esc(QUALITY_LABEL[c.quality] ?? c.quality)})</li>`,
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
