export function round(value: number, fractionDigits?: number) {
  return parseFloat(value.toFixed(fractionDigits));
}

export function toUSD(value: number | null | undefined) {
  return value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
