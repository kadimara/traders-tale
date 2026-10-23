import type { ReactNode } from 'react';

// Inline markdown: `code`, **bold**, *italic*, [links](url) and `[...]` placeholders.
const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s][^*\n]*\*)|(\[[^[\]\n]*\]\([^)\n]*\))|(\[[^[\]\n]*\])/g;

const mark = (text: string) => <span className="md-mark">{text}</span>;

function highlightInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [all, code, bold, italic, link] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = match.index;
    if (code) {
      nodes.push(<span key={key} className="md-code">{all}</span>);
    } else if (bold) {
      nodes.push(
        <span key={key} className="md-bold">
          {mark('**')}
          {all.slice(2, -2)}
          {mark('**')}
        </span>,
      );
    } else if (italic) {
      nodes.push(
        <span key={key} className="md-italic">
          {mark('*')}
          {all.slice(1, -1)}
          {mark('*')}
        </span>,
      );
    } else if (link) {
      nodes.push(<span key={key} className="md-link">{all}</span>);
    } else {
      nodes.push(<span key={key} className="md-placeholder">{all}</span>);
    }
    last = match.index + all.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function highlightLine(line: string): ReactNode {
  const heading = /^(#{1,6}\s+)(.*)$/.exec(line);
  if (heading) {
    return (
      <span className="md-heading">
        {mark(heading[1])}
        {highlightInline(heading[2])}
      </span>
    );
  }
  const quote = /^(\s*>\s?)(.*)$/.exec(line);
  if (quote) {
    return (
      <>
        {mark(quote[1])}
        <span className="md-quote">{highlightInline(quote[2])}</span>
      </>
    );
  }
  // List items, with an optional task box: `- [ ] text`
  const item = /^(\s*(?:[-*+]|\d+[.)])\s+)(\[[ xX]\](?=\s|$))?(.*)$/.exec(line);
  if (item) {
    return (
      <>
        {mark(item[1])}
        {item[2] && mark(item[2])}
        {highlightInline(item[3])}
      </>
    );
  }
  return highlightInline(line);
}

/**
 * Markdown source with its syntax highlighted, for the layer behind the
 * editor's textarea. Only colors change, never the font, so every character
 * stays where the textarea draws it.
 */
export function MarkdownHighlight({ text }: { text: string }) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && '\n'}
      {highlightLine(line)}
    </span>
  ));
}
