import { useState } from 'react';
import { Edit, Save } from 'react-feather';
import type { TradesRow } from '@lib/database/TradesApi';
import { MarkdownField } from './MarkdownField';

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
  const [draft, setDraft] = useState(() => trade.journal ?? '');

  const isStateInside = typeof onSave === 'function';
  const value = isStateInside ? draft : (trade.journal ?? '');
  const editing = isStateInside ? editingInside : editingOutside;

  const handleEdit = () => {
    setDraft(trade.journal ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    await onSave?.(draft);
    setEditing(false);
  };

  return (
    <div className="document relative">
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
          {editing ? <Save /> : <Edit />}
        </button>
      )}
    </div>
  );
}
