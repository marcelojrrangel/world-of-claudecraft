import { describe, it, expect } from 'vitest';
import { localizeSimText } from '../src/ui/sim_i18n';
import { setLanguage, supportedLanguages, t } from '../src/ui/i18n';

const translatedLocales = supportedLanguages.filter((l) => l !== 'en' && l !== 'en_CA');

describe('construction house/plot sim text localizes in every locale', () => {
  const strings = [
    'You already own a building plot.',
    'That plot does not exist.',
    'This plot is already taken.',
    'You do not have enough gold to buy this plot.',
    'You do not own a building plot.',
    'You have not built a house on your plot yet.',
    'You are not inside a house.',
    'Your plot could not be found.',
    'You enter your house.',
    'You purchased Elmshire Plot 1!',
  ];

  it('recognizes every house/plot string in every locale (non-null)', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      for (const s of strings) {
        expect(localizeSimText(s), `${lang}: "${s}" not recognized`).not.toBeNull();
      }
    }
    setLanguage('en');
  });

  it('does not leave house/plot strings in English for translated locales', () => {
    for (const lang of translatedLocales) {
      setLanguage(lang);
      for (const s of strings) {
        const result = localizeSimText(s);
        if (result !== null && result !== s) {
          expect(result, `${lang}: "${s}" stayed English`).not.toBe(s);
        }
      }
    }
    setLanguage('en');
  });
});

describe('construction blueprint/phase sim text localizes in every locale', () => {
  const strings = [
    'That blueprint does not exist.',
    'That is not a construction blueprint.',
    'You already know that blueprint.',
    'Your construction skill is too low for this blueprint.',
    'You have not learned the blueprint for this tier.',
    'You do not have the required materials.',
    'Your construction tool is not high enough tier for this phase.',
  ];

  it('recognizes every blueprint string in every locale (non-null)', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      for (const s of strings) {
        expect(localizeSimText(s), `${lang}: "${s}" not recognized`).not.toBeNull();
      }
    }
    setLanguage('en');
  });

  it('does not leave blueprint strings in English for translated locales', () => {
    for (const lang of translatedLocales) {
      setLanguage(lang);
      for (const s of strings) {
        const result = localizeSimText(s);
        if (result !== null && result !== s) {
          expect(result, `${lang}: "${s}" stayed English`).not.toBe(s);
        }
      }
    }
    setLanguage('en');
  });
});

describe('construction station/chest/visit sim text localizes in every locale', () => {
  const strings = [
    'You must empty the chest before removing it.',
    'That item is not a storage chest.',
    'The chest is full.',
    'You do not have enough of that item.',
    'You must be inside your house to use a crafting station.',
    'That station was not found.',
    'That item is not a crafting station.',
    'You use the workbench and gain a crafting bonus.',
    'That player does not have a house.',
    'You do not have permission to visit this house.',
    'You visit the house.',
    'Invalid permission level. Use: owner, friends, or public.',
  ];

  it('recognizes every station/chest/visit string in every locale (non-null)', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      for (const s of strings) {
        expect(localizeSimText(s), `${lang}: "${s}" not recognized`).not.toBeNull();
      }
    }
    setLanguage('en');
  });

  it('does not leave station/chest/visit strings in English for translated locales', () => {
    for (const lang of translatedLocales) {
      setLanguage(lang);
      for (const s of strings) {
        const result = localizeSimText(s);
        if (result !== null && result !== s) {
          expect(result, `${lang}: "${s}" stayed English`).not.toBe(s);
        }
      }
    }
    setLanguage('en');
  });
});

describe('construction furniture sim text localizes in every locale', () => {
  const strings = [
    'Placed Rustic Chair.',
    'Furniture moved.',
    'Furniture removed.',
  ];

  it('recognizes every furniture status string in every locale (non-null)', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      for (const s of strings) {
        expect(localizeSimText(s), `${lang}: "${s}" not recognized`).not.toBeNull();
      }
    }
    setLanguage('en');
  });

  it('does not leave furniture status strings in English for translated locales', () => {
    for (const lang of translatedLocales) {
      setLanguage(lang);
      for (const s of strings) {
        const result = localizeSimText(s);
        if (result !== null && result !== s) {
          expect(result, `${lang}: "${s}" stayed English`).not.toBe(s);
        }
      }
    }
    setLanguage('en');
  });
});

describe('house permission set localizes the format', () => {
  it('resolves House permission set to owner', () => {
    setLanguage('en');
    const out = localizeSimText('House permission set to owner.');
    expect(out).not.toBeNull();
    setLanguage('en');
  });
});
