import { decodeHtmlEntities, ensurePlainJobDescription, stripHtml } from './strip-html.util';

describe('decodeHtmlEntities', () => {
  it('decodes double-encoded markup', () => {
    expect(decodeHtmlEntities('&amp;lt;p&amp;gt;Hi&amp;lt;/p&amp;gt;')).toBe(
      '<p>Hi</p>',
    );
  });
});

describe('stripHtml', () => {
  it('turns entity-encoded ATS HTML into readable structured text', () => {
    const raw =
      '&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;&lt;a href=&quot;https://fin.ai/&quot;&gt;Fin&lt;/a&gt; is the AI Customer Agent company.&lt;/p&gt;&lt;/div&gt;&lt;h2&gt;&lt;strong&gt;What Will I Be Doing?&lt;/strong&gt;&lt;/h2&gt;&lt;ul&gt;&lt;li&gt;Lead technical discovery&lt;/li&gt;&lt;li&gt;Design POCs&lt;/li&gt;&lt;/ul&gt;&lt;p&gt;Pension scheme &amp;amp; match up to 4%&lt;/p&gt;';

    const text = stripHtml(raw);

    expect(text).not.toMatch(/&lt;|&gt;|&amp;|class=/);
    expect(text).toContain('Fin is the AI Customer Agent company.');
    expect(text).toContain('What Will I Be Doing?');
    expect(text).toContain('• Lead technical discovery');
    expect(text).toContain('• Design POCs');
    expect(text).toContain('Pension scheme & match up to 4%');
    expect(text).toMatch(/\n/);
  });

  it('preserves paragraphs from normal HTML (Adzuna-style)', () => {
    const html =
      '<p>We need a developer.</p><ul><li>TypeScript</li><li>NestJS</li></ul>';
    const text = stripHtml(html);
    expect(text).toContain('We need a developer.');
    expect(text).toContain('• TypeScript');
    expect(text).toContain('• NestJS');
  });

  it('returns empty for blank input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml('   ')).toBe('');
  });

  it('ensurePlainJobDescription re-strips escaped cached text', () => {
    const escaped = '&lt;p&gt;Hello&lt;/p&gt;&lt;ul&gt;&lt;li&gt;One&lt;/li&gt;&lt;/ul&gt;';
    const plain = ensurePlainJobDescription(escaped);
    expect(plain).toContain('Hello');
    expect(plain).toContain('• One');
    expect(ensurePlainJobDescription('Already plain text')).toBe(
      'Already plain text',
    );
  });
});
