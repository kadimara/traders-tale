import type { InputHTMLAttributes } from 'react';

export function Input({
  value,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value?: string | null | undefined;
  onChange?: (value: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };
  return <input {...props} value={value || ''} onChange={handleChange} />;
}
