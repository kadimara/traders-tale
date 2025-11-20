import { useState, type CSSProperties, type ReactNode } from 'react';
import { Circle, Edit, Info, Plus, Save, X } from 'react-feather';
import { useTradesContext } from '../context/TradesContext';
import { setLocalStorageItem, useLocalStorage } from '../hooks/useLocalStorage';
import type { TradesRow, TradesUpdate } from '@lib/database/api';
import { toUSD } from '@lib/utils/MathUtils';
import {
  getTradeLongShort,
  getTradePnl,
  getTradeRisk,
} from '@lib/utils/TradeUtils';
import { Input } from './Input';
import { InputNumber } from './InputNumber';
import { TradeDetails } from './TradeDetails';

export function TradesTable() {
  const { trades, insertTrade } = useTradesContext();

  // group trades by month (YYYY-MM)
  const tradesByMonth = trades?.reduce((acc, trade) => {
    const d = new Date(trade.created_at);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    const label = d.toLocaleString(undefined, { year: 'numeric', month: 'long' }); // e.g. "November 2025"
    if (!acc[key]) acc[key] = { label, trades: [] as TradesRow[] };
    acc[key].trades.push(trade);
    return acc;
  }, {} as Record<string, { label: string; trades: TradesRow[] }>);

  // sort months descending (newest first)
  const monthKeys = tradesByMonth ? Object.keys(tradesByMonth).sort((a, b) => b.localeCompare(a)) : [];

  const handleAddTrade = async () => {
    const trade = await insertTrade({
      account: 0,
      amount: 0,
      entry: 0,
      long_short: 'long',
      stop: 0,
      symbol: 'BTC',
      target: 0,
      time_frame: '15m',
    });
    setLocalStorageItem(`trade${trade.id}`, {});
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>
              <button aria-label="Add" title="Add" onClick={handleAddTrade}>
                <Plus />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {monthKeys.length > 0 ? (
            monthKeys.map((monthKey) => (
              <tr key={`month-${monthKey}`}>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    textAlign: 'left',
                    padding: '8px',
                    fontWeight: 700,
                    background: 'var(--color-bg-highlight)',
                  }}
                >
                  {tradesByMonth![monthKey].label}
                </td>
              </tr>
            )).flatMap((monthRow, idx) => {
              const key = monthKeys[idx];
              // render the month header + its trades
              return [
                monthRow,
                ...tradesByMonth![key].trades.map((trade) => (
                  <Row key={trade.id} trade={trade} />
                )),
              ];
            })
          ) : (
            // fallback: no trades
            trades?.map((trade) => <Row key={trade.id} trade={trade} />)
          )}
        </tbody>
      </table>
      <datalist id="data-list-symbols">
        <option value="BTC"></option>
        <option value="ETH"></option>
        <option value="SOL"></option>
        <option value="ADA"></option>
        <option value="BNB"></option>
      </datalist>
      <datalist id="data-list-time_frames">
        <option value="1m"></option>
        <option value="3m"></option>
        <option value="5m"></option>
        <option value="15m"></option>
        <option value="1h"></option>
        <option value="4h"></option>
        <option value="D"></option>
        <option value="W"></option>
      </datalist>
    </>
  );
}

function Row({ trade }: { trade: TradesRow }) {
  const { updateTrade } = useTradesContext();
  const [tradeLocal, setTradeLocal] =
    useLocalStorage<Partial<TradesRow> | null>(`trade${trade.id}`, null);
  const tradeCombined = { ...trade, ...tradeLocal };

  const [d, setShowDetails] = useState(false);
  const toggleDetails = () => setShowDetails((v) => !v);
  const editable = tradeLocal !== null;
  const showDetails = d || editable;

  const handleEdit = () => {
    setTradeLocal({});
  };
  // const handleDelete = () => {
  //   const result = confirm('Are you sure you want to delete this trade?');
  //   if (result) deleteTrade(trade.id);
  // };
  const handleSave = async () => {
    if (tradeLocal && Object.keys(tradeLocal).length > 0) {
      await updateTrade(trade.id, {
        ...tradeLocal,
      } as TradesUpdate);
    }
    setTradeLocal(null);
  };
  const handleCancel = () => {
    setTradeLocal(null);
  };

  const handleChange = (key: keyof TradesRow, value: unknown) => {
    setTradeLocal((prev) => {
      const local = { ...prev, [key]: value };
      const combined = { ...trade, ...local };
      const long_short = getTradeLongShort({ ...combined });
      const risk = getTradeRisk({ ...combined, long_short });
      const pnl = getTradePnl({ ...combined, risk, long_short });
      return {
        ...local,
        long_short,
        risk,
        pnl,
      };
    });
  };

  return (
    <>
      <tr
        style={{
          background: showDetails ? 'var(--color-bg-highlight)' : undefined,
          borderBottomColor: showDetails ? 'transparent' : undefined,
          color: !trade.executed && !editable ? 'gray' : undefined,
        }}
      >
        {columns.map((col) => {
          const render = col.render ?? ((row: TradesRow) => row[col.key]);
          return (
            <th key={col.key} style={col.style}>
              {render(tradeCombined, editable, (value) =>
                handleChange(col.key, value)
              )}
            </th>
          );
        })}
        <th style={{ justifyItems: 'center', width: 100 }}>
          <div className="flex gap-1">
            {editable ? (
              <>
                <button aria-label="Save" title="Save" onClick={handleSave}>
                  <Save />
                </button>
                <button
                  aria-label="Cancel"
                  title="Cancel"
                  onClick={handleCancel}
                >
                  <X />
                </button>
              </>
            ) : (
              <>
                <button aria-label="Edit" title="Edit" onClick={handleEdit}>
                  <Edit />
                </button>
                <button
                  aria-label="Details"
                  title="Details"
                  onClick={toggleDetails}
                >
                  {showDetails ? <Circle /> : <Info />}
                </button>
                {/* <button aria-label="Delete" title="Delete" onClick={handleDelete}>
              <Trash />
              </button> */}
              </>
            )}
          </div>
        </th>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={columns.length + 1}
            style={{
              textAlign: 'left',
              padding: '8px',
              background: 'var(--color-bg-highlight)',
            }}
          >
            <TradeDetails
              trade={tradeCombined}
              disabled={!editable}
              onChange={handleChange}
            />
          </td>
        </tr>
      )}
    </>
  );
}

const columns: {
  label: string;
  key: keyof TradesRow;
  style?: CSSProperties;
  render?: (
    row: TradesRow,
    editable: boolean,
    onChange: (value: unknown) => void
  ) => ReactNode;
}[] = [
  {
    label: 'DATE',
    key: 'created_at',
    style: { width: 200 },
    render: ({ created_at }) => new Date(created_at).toLocaleString(),
  },
  {
    label: 'SYMBOL',
    key: 'symbol',
    style: { width: 64 },
    render: (row, editable, onChange) =>
      editable ? (
        <Input
          name="symbol"
          placeholder={row.symbol}
          list="data-list-symbols"
          onChange={onChange}
        />
      ) : (
        row.symbol
      ),
  },
  {
    label: 'TF',
    key: 'time_frame',
    style: { width: 64 },
    render: (row, editable, onChange) => {
      return editable ? (
        <Input
          name="time_frame"
          placeholder={row.time_frame}
          list="data-list-time_frames"
          onChange={onChange}
        />
      ) : (
        row.time_frame
      );
    },
  },
  {
    label: 'L / S',
    key: 'long_short',
    style: { width: 64 },
    render: (row) => (
      // long = green, short = red
      <span className={row.long_short}>{row.long_short}</span>
    ),
  },
  {
    label: 'ACCOUNT',
    key: 'account',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="account" value={row.account} onChange={onChange} />
      ) : (
        toUSD(row.account)
      );
    },
  },
  {
    label: 'AMOUNT',
    key: 'amount',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="amount" value={row.amount} onChange={onChange} />
      ) : (
        toUSD(row.amount)
      );
    },
  },
  {
    label: 'SL',
    key: 'stop',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="stop" value={row.stop} onChange={onChange} />
      ) : (
        toUSD(row.stop)
      );
    },
  },
  {
    label: 'ENTRY',
    key: 'entry',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="entry" value={row.entry} onChange={onChange} />
      ) : (
        toUSD(row.entry)
      );
    },
  },
  {
    label: 'TARGET',
    key: 'target',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="target" value={row.target} onChange={onChange} />
      ) : (
        toUSD(row.target)
      );
    },
  },
  {
    label: 'EXIT',
    key: 'exit',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="exit" value={row.exit} onChange={onChange} />
      ) : (
        toUSD(row.exit)
      );
    },
  },
  {
    label: 'FEES',
    key: 'fees',
    style: { width: 100, textAlign: 'right' },
    render: (row, editable, onChange) => {
      const percentage = row.fees ? (row.fees * 100).toFixed(02) + '%' : '';
      return editable ? (
        <InputNumber
          name="fees"
          min="0"
          max="0.1"
          step="0.01"
          value={(row.fees || 0) * 100}
          onChange={(value) => onChange(value / 100)}
        />
      ) : (
        percentage
      );
    },
  },
  {
    label: 'RISK',
    key: 'risk',
    style: { width: 64, textAlign: 'right' },
    render: (row) => (row.risk ? (row.risk * 100).toFixed(02) + '%' : ''),
  },
  {
    label: 'PNL',
    key: 'pnl',
    style: { width: 64, textAlign: 'right' },
    render: (row) => (
      // -1 = red, 0 = currentColor, 1 = green
      <span className={row.executed ? 'number' + Math.sign(row.pnl || 0) : ''}>
        {toUSD(row.pnl)}
      </span>
    ),
  },
  {
    label: 'EXEC',
    key: 'executed',
    style: { width: 64, textAlign: 'right' },
    render: (row, editable, onChange) => {
      return (
        <input
          type="checkbox"
          name="executed"
          checked={row.executed}
          disabled={!editable}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    },
  },
];
