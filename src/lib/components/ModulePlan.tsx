import { useState } from 'react';
import { Module, type ModuleProps } from './Module';
import { Edit, Save } from 'react-feather';
import { MarkdownField } from './MarkdownField';

type ModulePlanProps = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (content: string) => void;
} & Omit<ModuleProps, 'onChange'>;

export function ModulePlan({
  value,
  disabled,
  placeholder,
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

  return (
    <Module
      className="flex-col gap-1"
      style={{ position: 'relative', justifyContent: 'flex-start', ...style }}
      {...props}
    >
      <MarkdownField
        value={isEditing ? editText : value}
        editing={isEditing}
        placeholder={placeholder}
        onChange={setEditText}
      />
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
