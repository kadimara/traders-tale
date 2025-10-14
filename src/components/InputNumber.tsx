import type { InputHTMLAttributes } from 'react';

export function InputNumber({
  value,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value?: number | null | undefined;
  onChange?: (value: number) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = value === '' ? 0 : Number(value);
    onChange?.(numberValue);
  };
  return (
    <input
      onFocus={(e) => e.target.select()}
      {...props}
      type="number"
      value={typeof value == 'number' ? value : ''}
      style={{ textAlign: 'end' }}
      onChange={handleChange}
    />
  );
}
