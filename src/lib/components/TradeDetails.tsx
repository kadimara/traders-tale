import type { TradesRow } from '@lib/database/TradesApi';
import { MarkdownField } from './MarkdownField';

function composePlan(trade: TradesRow): string {
  const parts: string[] = [];
  if (trade.plan) parts.push(trade.plan);
  if (trade.review && !trade.plan?.includes(trade.review))
    parts.push(trade.review);
  if (trade.url1 && !trade.plan?.includes(trade.url1))
    parts.push(`[Chart 1](${trade.url1})`);
  if (trade.url2 && !trade.plan?.includes(trade.url2))
    parts.push(`[Chart 2](${trade.url2})`);
  return parts.join('\n\n');
}

export function TradeDetails({
  trade,
  disabled,
  onChange,
}: {
  trade: TradesRow;
  disabled?: boolean;
  onChange?: (key: keyof TradesRow, value: unknown) => void;
}) {
  return (
    <MarkdownField
      value={composePlan(trade)}
      editing={!disabled}
      placeholder={
        'Describe your plan and review. Paste TradingView links to preview charts.\n\n[Chart](https://www.tradingview.com/x/example/)'
      }
      onChange={(v) => {
        onChange?.('plan', v);
        // TODO merge database columns plan + review + url1 + url2 into plan and rename plan to review or journal
        onChange?.('review', null);
        onChange?.('url1', null);
        onChange?.('url2', null);
      }}
    />
  );
}
