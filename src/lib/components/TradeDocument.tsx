import { useState } from 'react';
import { Edit, Save } from 'react-feather';
import type { TradesRow } from '@lib/database/TradesApi';
import { MarkdownField } from './MarkdownField';

export function composePlan(trade: TradesRow): string {
  const parts: string[] = [];
  if (trade.plan) parts.push(trade.plan);
  if (trade.review && !trade.plan?.includes(trade.review))
    parts.push(trade.review);
  if (trade.url1 && !trade.plan?.includes(trade.url1))
    parts.push(`[Chart 1](${trade.url1})`);
  if (trade.url2 && !trade.plan?.includes(trade.url2))
    parts.push(`[Chart 2](${trade.url2})`);
  return parts.join('\n\n');
}

type TradeDocumentProps = {
  trade: TradesRow;
  editing?: boolean;
  onSave?: (plan: string) => void | Promise<void>;
  onChange?: (plan: string) => void | Promise<void>;
};

export function TradeDocument({
  trade,
  editing: editingOutside,
  onSave,
  onChange,
}: TradeDocumentProps) {
  const [editingInside, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => composePlan(trade));

  const isStateInside = typeof onSave === 'function';
  const value = isStateInside ? draft : composePlan(trade);
  const editing = isStateInside ? editingInside : editingOutside;

  const handleEdit = () => {
    setDraft(composePlan(trade));
    setEditing(true);
  };

  const handleSave = async () => {
    await onSave?.(draft);
    setEditing(false);
  };

  return (
    <div
      className={editing ? 'document editing' : 'document'}
      style={{ position: 'relative' }}
    >
      <MarkdownField
        value={value}
        editing={editing}
        placeholder="Describe your plan and review. Paste TradingView links to preview charts."
        onChange={isStateInside ? setDraft : onChange}
      />
      {isStateInside && (
        <button
          aria-label={editing ? 'Save' : 'Edit'}
          title={editing ? 'Save' : 'Edit'}
          style={{ position: 'absolute', top: 8, right: 8 }}
          onClick={editing ? handleSave : handleEdit}
        >
          {editing ? <Save size={16} /> : <Edit size={16} />}
        </button>
      )}
    </div>
  );
}
