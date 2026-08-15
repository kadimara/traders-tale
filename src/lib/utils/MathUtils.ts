export function round(value: number, fractionDigits?: number) {
  return parseFloat(value.toFixed(fractionDigits));
}

export function toUSD(value: number | null | undefined) {
  return (
    value?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 8,
      minimumFractionDigits: 0,
    }) || ''
  );
}

export function toEUR(value: number | null | undefined) {
  return (
    value?.toLocaleString('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 8,
      minimumFractionDigits: 0,
    }) || ''
  );
}
