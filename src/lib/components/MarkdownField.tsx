import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getImageSrcFromTradingViewUrl } from '@lib/utils/TradeUtils';

const markdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>['components'] = {
  h1: 'h2',
  h2: 'h3',
  h3: 'h4',
  h4: 'h5',
  input: ({ type, checked }) => {
    if (type !== 'checkbox') return null;
    return (
      <input
        type="checkbox"
        checked={checked}
        readOnly
      />
    );
  },
  a: ({ href, children }) => {
    const imgSrc = href ? getImageSrcFromTradingViewUrl(href) : '';
    return (
      <span className="flex flex-col gap-1">
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
        {imgSrc && (
          <img
            src={imgSrc}
            alt="TradingView chart"
            style={{
              display: 'block',
              maxHeight: 300,
              objectFit: 'contain',
              alignSelf: 'flex-start',
            }}
          />
        )}
      </span>
    );
  },
};

type Placeholder = { start: number; end: number };

// `[...]` placeholders in the text, e.g. `[up / down]` or `[price]`. Links
// (`[text](url)`) and task checkboxes (`- [ ]`) are not placeholders.
function findPlaceholders(text: string): Placeholder[] {
  const found: Placeholder[] = [];
  for (const match of text.matchAll(/\[[^[\]\n]*\]/g)) {
    const start = match.index;
    const end = start + match[0].length;
    if (text[end] === '(') continue;
    const lineStart = text.lastIndexOf('\n', start) + 1;
    const isTaskBox =
      /^\s*([-*+]|\d+[.)])\s+$/.test(text.slice(lineStart, start)) &&
      /^\[[ xX]\]$/.test(match[0]);
    if (isTaskBox) continue;
    found.push({ start, end });
  }
  return found;
}

// The placeholder currently being filled with the arrow keys.
type ActiveChoice = {
  start: number;
  end: number;
  original: string;
  options: string[];
  index: number; // options.length means the original placeholder
};

function toActiveChoice(text: string, { start, end }: Placeholder): ActiveChoice {
  const original = text.slice(start, end);
  const inner = original.slice(1, -1);
  const options = inner.includes('/')
    ? inner.split('/').map((option) => option.trim())
    : [];
  return { start, end, original, options, index: options.length };
}

type MarkdownFieldProps = {
  value?: string | null;
  onChange?: (value: string) => void;
  editing?: boolean;
  placeholder?: string;
};

export function MarkdownField({
  value,
  onChange,
  editing,
  placeholder,
}: MarkdownFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<Placeholder | null>(null);
  const activeChoiceRef = useRef<ActiveChoice | null>(null);
  const historyRef = useRef<{ value: string; cursor: number }[]>([
    { value: value || '', cursor: 0 },
  ]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const scrollY = window.scrollY;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    window.scrollTo(0, scrollY);
    if (pendingSelectionRef.current !== null) {
      const { start, end } = pendingSelectionRef.current;
      pendingSelectionRef.current = null;
      el.setSelectionRange(start, end);
    }
  }, [value, editing]);

  const pushHistory = (val: string, cursor: number) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push({ value: val, cursor });
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  };

  const selectPlaceholder = (el: HTMLTextAreaElement, placeholder: Placeholder) => {
    activeChoiceRef.current = toActiveChoice(el.value, placeholder);
    el.setSelectionRange(placeholder.start, placeholder.end);
  };

  // Up/Down cycles the selected placeholder through its options and back.
  const cycleChoice = (el: HTMLTextAreaElement, step: number) => {
    const choice = activeChoiceRef.current;
    if (
      !choice ||
      choice.options.length === 0 ||
      el.selectionStart !== choice.start ||
      el.selectionEnd !== choice.end
    ) {
      return false;
    }
    const count = choice.options.length + 1;
    const index = (choice.index + step + count) % count;
    const replacement =
      index === choice.options.length ? choice.original : choice.options[index];
    const current = el.value;
    const next =
      current.slice(0, choice.start) + replacement + current.slice(choice.end);
    const end = choice.start + replacement.length;
    activeChoiceRef.current = { ...choice, index, end };
    pushHistory(next, end);
    pendingSelectionRef.current = { start: choice.start, end };
    onChange?.(next);
    return true;
  };

  // Tab / Shift+Tab jumps to the next / previous placeholder, wrapping around.
  const jumpToPlaceholder = (el: HTMLTextAreaElement, backwards: boolean) => {
    const placeholders = findPlaceholders(el.value);
    if (placeholders.length === 0) return false;
    const target = backwards
      ? (placeholders.filter((p) => p.end <= el.selectionStart).pop() ??
        placeholders[placeholders.length - 1])
      : (placeholders.find((p) => p.start >= el.selectionEnd) ??
        placeholders[0]);
    selectPlaceholder(el, target);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    activeChoiceRef.current = null;
    pushHistory(e.target.value, e.target.selectionStart);
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const el = e.currentTarget;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (cycleChoice(el, e.key === 'ArrowDown' ? 1 : -1)) e.preventDefault();
    } else if (e.key === 'Tab' && !ctrl && !e.altKey) {
      if (jumpToPlaceholder(el, e.shiftKey)) e.preventDefault();
    } else if (ctrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const { value: prev, cursor } = historyRef.current[historyIndexRef.current];
        pendingSelectionRef.current = { start: cursor, end: cursor };
        onChange?.(prev);
      }
    } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        const { value: next, cursor } = historyRef.current[historyIndexRef.current];
        pendingSelectionRef.current = { start: cursor, end: cursor };
        onChange?.(next);
      }
    }
  };

  // Clicking inside a `[...]` placeholder selects it, brackets included, so
  // typing replaces it and Up/Down cycles its options.
  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    activeChoiceRef.current = null;
    if (e.detail !== 1 || el.selectionStart !== el.selectionEnd) return;
    const pos = el.selectionStart;
    const placeholder = findPlaceholders(el.value).find(
      (p) => p.start < pos && pos < p.end,
    );
    if (placeholder) selectPlaceholder(el, placeholder);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!/^https?:\/\/\S+$/.test(pasted.trim())) return;

    e.preventDefault();
    const url = pasted.trim();
    const current = value || '';
    const chartCount = (current.match(/\[Chart \d+\]/g) || []).length;
    const label = `[Chart ${chartCount + 1}](${url})`;

    const el = textareaRef.current!;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = current.slice(0, start) + label + current.slice(end);
    const cursor = start + label.length;
    pushHistory(next, cursor);
    pendingSelectionRef.current = { start: cursor, end: cursor };
    onChange?.(next);
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value || ''}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={handleClick}
        style={{
          width: '100%',
          fontFamily: 'inherit',
          padding: 4,
          resize: 'none',
          lineHeight: 1.6,
          overflow: 'hidden',
        }}
      />
    );
  }

  if (!value) return null;

  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {value}
    </ReactMarkdown>
  );
}
