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
  const pendingCursorRef = useRef<number | null>(null);
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
    if (pendingCursorRef.current !== null) {
      const pos = pendingCursorRef.current;
      pendingCursorRef.current = null;
      el.selectionStart = pos;
      el.selectionEnd = pos;
    }
  }, [value, editing]);

  const pushHistory = (val: string, cursor: number) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push({ value: val, cursor });
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    pushHistory(e.target.value, e.target.selectionStart);
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const { value: prev, cursor } = historyRef.current[historyIndexRef.current];
        pendingCursorRef.current = cursor;
        onChange?.(prev);
      }
    } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        const { value: next, cursor } = historyRef.current[historyIndexRef.current];
        pendingCursorRef.current = cursor;
        onChange?.(next);
      }
    }
  };

  // Clicking inside a `[...]` placeholder selects it, brackets included, so
  // typing replaces it. Skips links (`[text](url)`) and task checkboxes.
  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.detail !== 1 || el.selectionStart !== el.selectionEnd) return;
    const text = el.value;
    const pos = el.selectionStart;

    let start = pos - 1;
    while (start >= 0 && !'[]\n'.includes(text[start])) start--;
    if (text[start] !== '[') return;
    let end = pos;
    while (end < text.length && !'[]\n'.includes(text[end])) end++;
    if (text[end] !== ']') return;

    if (text[end + 1] === '(') return;
    const lineStart = text.lastIndexOf('\n', start) + 1;
    const beforeBracket = text.slice(lineStart, start);
    const isTaskBox =
      /^\s*([-*+]|\d+[.)])\s+$/.test(beforeBracket) &&
      /^[ xX]$/.test(text.slice(start + 1, end));
    if (isTaskBox) return;

    el.setSelectionRange(start, end + 1);
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
    pendingCursorRef.current = cursor;
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
