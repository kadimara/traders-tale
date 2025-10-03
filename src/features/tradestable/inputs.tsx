export function InputSymbol({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        value={value}
        list="symbols"
        id="ice-cream-choice"
        name="ice-cream-choice"
      />
    </>
  );
}
