import { describe, it, expect } from 'vitest';
import { parseMarkdown, inline, toPlain, toHtml, titleOf, textOf, wordCount } from './markdown';

describe('Studio Markdown', () => {
  it('reads headings, paragraphs with line breaks, lists and tables', () => {
    const b = parseMarkdown([
      '## Twinkle Song', '', 'Twinkle, twinkle, little star,', 'How I wonder what you are!', '',
      '- **Teacher:** shows the flashcards', '- Pupils: repeat', '  - in pairs', '',
      '1. First', '2. Second', '', '| Word | Meaning |', '|---|---|', '| kitchen | where we cook |', '| garden | plants grow here |'
    ].join('\n'));
    expect(b.map((x) => x.t)).toEqual(['h', 'p', 'ul', 'ol', 'table']);
    expect(textOf((b[1] as unknown as { c: never }).c)).toBe('Twinkle, twinkle, little star,\nHow I wonder what you are!');
    const ul = b[2] as unknown as { items: { c: never; sub?: { items: unknown[] } }[] };
    expect(ul.items).toHaveLength(2);
    expect(ul.items[1].sub?.items).toHaveLength(1);
    expect((ul.items[0].c as { t: string }[])[0].t).toBe('b');
    const t = b[4] as unknown as { head: never[]; rows: never[][] };
    expect(t.head.map(textOf)).toEqual(['Word', 'Meaning']);
    expect(t.rows.map((r) => r.map(textOf))).toEqual([['kitchen', 'where we cook'], ['garden', 'plants grow here']]);
  });
  it('keeps numbering that continues after a gap', () => {
    const b = parseMarkdown('3. Third\n4. Fourth');
    expect(b[0]).toMatchObject({ t: 'ol', start: 3 });
  });
  it('never turns AI text into HTML: tags stay as text, and the clipboard HTML is escaped', () => {
    const b = parseMarkdown('Hello <img src=x onerror=alert(1)> **bold** <script>alert(2)</script>');
    expect(textOf((b[0] as unknown as { c: never }).c)).toContain('<img src=x onerror=alert(1)>');
    const html = toHtml(b);
    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('<strong>bold</strong>');
  });
  it('shows links as text with their address, not as links', () => {
    expect(textOf(inline('See [StoryWeaver](https://storyweaver.org.in) today'))).toBe('See StoryWeaver (https://storyweaver.org.in) today');
  });
  it('handles bold, italics and code, and leaves snake_case and maths alone', () => {
    expect(inline('a **b** *c* `d` e_f 2 * 3').map((x) => x.t)).toEqual(['text', 'b', 'text', 'i', 'text', 'code', 'text']);
    expect(textOf(inline('word_with_underscores'))).toBe('word_with_underscores');
  });
  it('unwraps an answer that came inside a code fence', () => {
    expect(parseMarkdown('```markdown\n## Title\nText\n```').map((x) => x.t)).toEqual(['h', 'p']);
  });
  it('makes plain text for copying, a title and a word count', () => {
    const b = parseMarkdown('## Quiz: Countries\n1. Where is Kenji from?\nAnswer: Japan\n\n- one\n- two');
    expect(titleOf(b)).toBe('Countries');
    expect(titleOf(parseMarkdown('## Lesson overview\nFriends Around the World\nPupils ask and answer.'))).toBe('Friends Around the World');
    expect(titleOf(parseMarkdown('## Word list\n\n| Word |\n|---|\n| a |'))).toBe('');
    expect(toPlain(b)).toContain('• one');
    expect(wordCount('Kenji is from Japan.')).toBe(4);
  });
});
