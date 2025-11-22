import type { TradesSpotRow } from '@lib/database/SpotApi';
import { getImageSrcFromTradingViewUrl } from '@lib/utils/TradeUtils';
import { useMemo } from 'react';
import { Input } from './Input';

export function SpotDetails({
  trade,
  disabled,
  onChange,
}: {
  trade: TradesSpotRow;
  disabled?: boolean;
  onChange?: (key: keyof TradesSpotRow, value: unknown) => void;
}) {
  const src = useMemo(
    () => getImageSrcFromTradingViewUrl(trade.url || ''),
    [trade.url]
  );

  return (
    <div className="flex flex-col gap-1">
      {disabled ? (
        <>
          <span>{trade.description}</span>
          <div className="flex gap-1">
            <div className="flex flex-col flex-1 align-items-center">
              <span>{trade.url}</span>
              <img
                src={src}
                alt="Tradingview chart image"
                style={{ maxHeight: 400, objectFit: 'contain' }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <Input
            name="description"
            placeholder="description"
            value={trade.description}
            onChange={(v) => onChange?.('description', v)}
          />
          <Input
            name="url"
            placeholder="https://www.tradingview.com/x/y4rc4UTW/"
            value={trade.url}
            onChange={(v) => onChange?.('url', v)}
          />
        </>
      )}
    </div>
  );
}
