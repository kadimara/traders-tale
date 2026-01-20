import { useState, type CSSProperties } from 'react';
import { Module, type ModuleProps } from './Module';
import { Edit, Save } from 'react-feather';
import ReactMarkdown from 'react-markdown';

type ModulePlanProps = {
  value: string;
  disabled?: boolean;
  onChange: (content: string) => void;
} & Omit<ModuleProps, 'onChange'>;

export function ModulePlan({
  value,
  disabled,
  style,
  onChange,
  ...props
}: ModulePlanProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(value);

  // Handle toggle between edit and preview
  const handleToggleEdit = () => {
    if (isEditing) {
      // Save the plan when exiting edit mode
      onChange(editText);
    } else {
      // When entering edit mode, sync the current value
      setEditText(value);
    }
    setIsEditing(!isEditing);
  };

  const textStyle: CSSProperties = {
    flex: 1,
    width: '100%',
    minHeight: '300px',
    fontFamily: 'inherit',
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
      style={{ position: 'relative', justifyContent: 'flex-start', ...style }}
      {...props}
    >
      {isEditing ? (
        <textarea
          disabled={disabled}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          style={textStyle}
        />
      ) : (
        <ReactMarkdown
          components={{
            h1: 'h2',
            h2: 'h3',
            h3: 'h4',
            h4: 'h5',
          }}
        >
          {value}
        </ReactMarkdown>
      )}
      <button
        disabled={disabled}
        style={{ position: 'absolute', top: 8, right: 8 }}
        onClick={handleToggleEdit}
      >
        {isEditing ? <Save /> : <Edit />}
      </button>
    </Module>
  );
}
