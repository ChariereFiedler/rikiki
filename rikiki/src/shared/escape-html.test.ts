import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape-html.js';

describe('escapeHtml', () => {
  it('neutralises the five HTML-significant characters', () => {
    expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  it('closes the deck-mermaid error sink · a script payload stays inert text', () => {
    // Mermaid folds the offending source into UnknownDiagramError's message, so
    // the message is attacker-reachable from deck content.
    const message = 'No diagram type detected for text: <img src=x onerror=alert(1)>';
    const escaped = escapeHtml(message);
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes the ampersand first so an entity is not double-decoded', () => {
    expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
  });

  it('leaves text with no significant character untouched', () => {
    expect(escapeHtml('graph LR a --> b')).toBe('graph LR a --&gt; b');
  });

  it('coerces a non-string input rather than throwing', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });

  it('is safe for an attribute value · quotes cannot break out', () => {
    const href = '" onload="alert(1)';
    expect(escapeHtml(href)).toBe('&quot; onload=&quot;alert(1)');
  });
});
