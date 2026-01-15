import { useMemo } from 'react';
import type { TradesRow } from '@lib/database/TradesApi';
import { getImageSrcFromTradingViewUrl } from '@lib/utils/TradeUtils';
import { Input } from './Input';

export function TradeDetails({
  trade,
  disabled,
  onChange,
}: {
  trade: TradesRow;
  disabled?: boolean;
  onChange?: (key: keyof TradesRow, value: unknown) => void;
}) {
  const src1 = useMemo(
    () => getImageSrcFromTradingViewUrl(trade.url1 || ''),
    [trade.url1]
  );
  const src2 = useMemo(
    () => getImageSrcFromTradingViewUrl(trade.url2 || ''),
    [trade.url2]
  );

  return (
    <div className="flex flex-col gap-1">
      {disabled ? (
        <>
          <span>{trade.plan}</span>
          <span>{trade.review}</span>
          <div className="flex gap-1">
            <div className="flex flex-col flex-1 align-items-center">
              <a href={trade.url1 ?? undefined} target="_blank">
                {trade.url1}
              </a>
              <img
                src={src1}
                alt="Tradingview chart image"
                style={{ maxHeight: 400, objectFit: 'contain' }}
              />
            </div>
            <div className="flex  flex-col flex-1 align-items-center">
              <a href={trade.url2 ?? undefined} target="_blank">
                {trade.url2}
              </a>
              <img
                src={src2}
                alt="Tradingview chart image"
                style={{ maxHeight: 400, objectFit: 'contain' }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <Input
            name="plan"
            placeholder="plan"
            value={trade.plan}
            onChange={(v) => onChange?.('plan', v)}
          />
          <Input
            name="review"
            placeholder="review"
            value={trade.review}
            onChange={(v) => onChange?.('review', v)}
          />
          <Input
            name="url1"
            placeholder="https://www.tradingview.com/x/y4rc4UTW/"
            value={trade.url1}
            onChange={(v) => onChange?.('url1', v)}
          />
          <Input
            name="url2"
            placeholder="https://www.tradingview.com/x/y4rc4UTW/"
            value={trade.url2}
            onChange={(v) => onChange?.('url2', v)}
          />
        </>
      )}
    </div>
  );
}
