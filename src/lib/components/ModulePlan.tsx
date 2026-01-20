import { useState, useMemo, type CSSProperties } from 'react';
import { Module, type ModuleProps } from './Module';
import { Edit, Save } from 'react-feather';
import ReactMarkdown from 'react-markdown';

type ModulePlanProps = { monthDate: Date } & ModuleProps;

const PLACEHOLDER_TEMPLATE = `# Trading Plan - {MONTH} {YEAR}

## Daily Goals
- Target trades: 2-3 per day
- Max daily loss: $500
- Win rate target: > 50%

## Focus Areas
- Focus on key support/resistance levels
- Risk reward ratio minimum 1:2
- Trade only high probability setups

## Risk Management
- Max position size: 2% of account
- Stop loss always in place
- No revenge trading

## Strategy Notes
- Primary timeframe: 4H
- Best trading hours: 9AM - 2PM
- Pairs: EUR/USD, GBP/USD
`;

export function ModulePlan({ monthDate, style, ...props }: ModulePlanProps) {
  // Generate month-year key for this month
  const monthKey = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [monthDate]);

  // State for managing plans per month
  const [plans, setPlans] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);

  // Get current plan or placeholder
  const currentPlan =
    plans[monthKey] ||
    PLACEHOLDER_TEMPLATE.replace(
      '{MONTH}',
      monthDate.toLocaleDateString(undefined, { month: 'long' })
    ).replace('{YEAR}', monthDate.getFullYear().toString());

  const [editText, setEditText] = useState(currentPlan);

  // Handle toggle between edit and preview
  const handleToggleEdit = () => {
    if (isEditing) {
      // Save the plan when exiting edit mode
      setPlans((prev) => ({
        ...prev,
        [monthKey]: editText,
      }));
    } else {
      // When entering edit mode, sync the current plan text
      setEditText(currentPlan);
    }
    setIsEditing(!isEditing);
  };

  const textStyle: CSSProperties = {
    flex: 1,
    width: '100%',
    minHeight: '300px',
    fontFamily: 'inherit',
    // border: '1px solid var(--color-border)',
    padding: 4,
    resize: 'none',
    overflow: 'auto',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  };

  return (
    <Module
      className="flex-col gap-1"
      style={{ position: 'relative', ...style }}
      {...props}
    >
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          style={textStyle}
        />
      ) : (
        <div
          style={{
            flex: 1,
            width: '100%',
            minHeight: '300px',
            overflow: 'auto',
            padding: 4,
            lineHeight: 1.6,
          }}
        >
          <ReactMarkdown
            components={{
              h1: 'h2',
              h2: 'h3',
              h3: 'h4',
              h4: 'h5',
            }}
          >
            {currentPlan}
          </ReactMarkdown>
        </div>
      )}
      <button
        style={{ position: 'absolute', top: 8, right: 8 }}
        onClick={handleToggleEdit}
      >
        {isEditing ? <Save /> : <Edit />}
      </button>
    </Module>
  );
}
