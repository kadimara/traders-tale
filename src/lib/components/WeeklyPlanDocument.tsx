import { useEffect, useState } from 'react';
import { Edit, Save, X } from 'react-feather';
import { weeklyPlanSelectByWeek, weeklyPlanUpsert } from '@lib/database/WeeklyPlanApi';
import { addDays } from '@lib/utils/DateUtils';
// Starting point for a week without a plan. Edit the .md file to change it.
import weeklyPlanTemplate from '@lib/templates/WeeklyPlan.md?raw';
import { MarkdownField } from './MarkdownField';

/**
 * The plan of one week (big picture, calendar, technical analysis), shared by
 * every trade in that week: editing it here changes it for all of them.
 * Remount it with `key={weekStart}` when the week changes.
 */
export function WeeklyPlanDocument({ weekStart }: { weekStart: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    weeklyPlanSelectByWeek(weekStart)
      .then((plan) => isMounted && setContent(plan?.content ?? null))
      .catch((err) => console.error('Failed to fetch weekly plan:', err))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [weekStart]);

  const handleEdit = () => {
    setDraft(content || weeklyPlanTemplate);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await weeklyPlanUpsert(weekStart, draft);
      setContent(saved.content);
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
        Week {weekStart} – {addDays(weekStart, 6)} (UTC) · shared by every trade this week
      </p>
      {editing ? (
        <MarkdownField value={draft} editing onChange={setDraft} />
      ) : content ? (
        <MarkdownField value={content} />
      ) : (
        !loading && (
          <p className="text-muted">
            No plan for this week yet. Click edit to fill in the big picture, calendar and
            technical analysis.
          </p>
        )
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
            disabled={loading}
          >
            <Edit />
          </button>
        )}
      </div>
    </div>
  );
}
