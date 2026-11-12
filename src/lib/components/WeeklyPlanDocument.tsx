import { useEffect, useState } from 'react';
import { Edit, Save, X } from 'react-feather';
import { weeklyPlanContent, weeklyPlanSelect, weeklyPlanUpsert } from '@lib/database/WeeklyPlanApi';
import { formatDateTime } from '@lib/utils/DateUtils';
import { MarkdownField } from './MarkdownField';

/**
 * The user's one living weekly plan (big picture, calendar, technical
 * analysis), updated as the week goes on. New trades copy it into their
 * journal, so editing it never changes an existing trade.
 */
export function WeeklyPlanDocument() {
  const [content, setContent] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([weeklyPlanContent(), weeklyPlanSelect()])
      .then(([text, plan]) => {
        if (!isMounted) return;
        setContent(text);
        setUpdated(plan?.updated ?? null);
      })
      .catch((err) => console.error('Failed to fetch weekly plan:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEdit = () => {
    setDraft(content ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await weeklyPlanUpsert(draft);
      setContent(saved.content);
      setUpdated(saved.updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save weekly plan:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="document relative" style={{ minHeight: 0 }}>
      <h2 style={{ marginTop: 0 }}>Weekly plan</h2>
      <p className="text-muted" style={{ marginTop: 0 }}>
        {updated ? `Last updated ${formatDateTime(updated)}` : 'Not saved yet'} · copied into
        every new trade
      </p>
      {editing ? (
        <MarkdownField value={draft} editing onChange={setDraft} />
      ) : (
        <MarkdownField value={content} />
      )}
      <div className="flex gap-1" style={{ position: 'absolute', top: 8, right: 8 }}>
        {editing ? (
          <>
            <button aria-label="Save" title="Save weekly plan" onClick={handleSave} disabled={saving}>
              <Save />
            </button>
            <button aria-label="Cancel" title="Cancel" onClick={() => setEditing(false)}>
              <X />
            </button>
          </>
        ) : (
          <button
            aria-label="Edit weekly plan"
            title="Edit weekly plan"
            onClick={handleEdit}
            disabled={content === null}
          >
            <Edit />
          </button>
        )}
      </div>
    </div>
  );
}
