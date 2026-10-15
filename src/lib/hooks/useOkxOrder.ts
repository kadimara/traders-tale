import { useState } from 'react';
import { okxCancel, okxOrder, type OkxOrderResult } from '@lib/database/OkxApi';
import { useTradesContext } from '@lib/context/TradesContext';

// Sends a planned trade to OKX as a limit order with its stop-loss (preview,
// confirm, place, reload; the trade becomes live), or cancels a live trade's
// order. Used by the trades table rows.
export function useOkxOrder() {
  const { reloadTrades } = useTradesContext();
  const [sending, setSending] = useState(false);

  const send = async (tradeId: string) => {
    setSending(true);
    try {
      const preview = await okxOrder(tradeId);
      if (confirm(orderSummary(preview))) {
        const result = await okxOrder(tradeId, preview.order);
        await reloadTrades();
        alert(`Order placed on OKX (${result.ordId}).`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
    setSending(false);
  };

  const cancel = async (tradeId: string) => {
    if (!confirm('Cancel this order on OKX? Its stop-loss is cancelled with it.')) return;
    setSending(true);
    try {
      const { status } = await okxCancel(tradeId);
      await reloadTrades();
      if (status === 'filled') alert('The order already filled, so the position is open. The trade is now filled.');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
    setSending(false);
  };

  return { send, cancel, sending };
}

function orderSummary({ order, long_short, contracts, sizeUsd, riskUsd, lastPx, previousOrderState }: OkxOrderResult) {
  const lines = [
    `Place this order on OKX?`,
    '',
    `${long_short.toUpperCase()} ${order.instId}`,
    `Limit ${order.side} ${contracts} contract(s) @ ${order.px} (≈ $${sizeUsd})`,
    `Stop-loss @ ${order.attachAlgoOrds[0].slTriggerPx} (market), risk ≈ $${riskUsd}`,
    `Margin: ${order.tdMode}. Last price: ${lastPx}`,
  ];
  // A limit above (long) or below (short) the market fills straight away.
  const fillsNow = order.side === 'buy' ? Number(order.px) >= lastPx : Number(order.px) <= lastPx;
  if (fillsNow) lines.push('', '⚠ The entry is past the last price, so this fills immediately.');
  if (previousOrderState) lines.push('', `The previous order for this trade was ${previousOrderState}.`);
  return lines.join('\n');
}
