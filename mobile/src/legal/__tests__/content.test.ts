import { LEGAL_DOCS, SUPPORT_EMAIL } from '../content';

describe('legal content', () => {
  it.each(['privacy', 'terms'] as const)('%s has a title, intro and non-empty sections', (key) => {
    const doc = LEGAL_DOCS[key];
    expect(doc.title).toBeTruthy();
    expect(doc.intro.length).toBeGreaterThan(40);
    expect(doc.sections.length).toBeGreaterThan(4);
    for (const section of doc.sections) {
      expect(section.heading).toBeTruthy();
      expect(section.body.length).toBeGreaterThan(0);
    }
  });

  it('gives users a contact address for data requests', () => {
    expect(JSON.stringify(LEGAL_DOCS.privacy)).toContain(SUPPORT_EMAIL);
  });
});
