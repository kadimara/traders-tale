import { useSpotContext } from '@lib/context/SpotContext';
import type { TradesSpotRow } from '@lib/database/SpotApi';
import type { TradesUpdate } from '@lib/database/TradesApi';
import { toEUR } from '@lib/utils/MathUtils';
import { getSpotPnl } from '@lib/utils/TradeUtils';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Circle, Edit, Info, Plus, Save, X } from 'react-feather';
import { setLocalStorageItem, useLocalStorage } from '../hooks/useLocalStorage';
import { Input } from './Input';
import { InputNumber } from './InputNumber';
import { SpotDetails } from './SpotDetails';

export function SpotTable() {
  const { trades, insertTrade } = useSpotContext();

  const handleAddTrade = async () => {
    const trade = await insertTrade({
      account: 0,
      amount: 0,
      entry: 0,
      symbol: 'BTC',
    });
    setLocalStorageItem(`spot${trade.id}`, {});
  };

  return (
    <>
      <table>
        <thead>
          <tr style={{ position: 'sticky', top: 10 }}>
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
          {trades?.map((trade) => (
            <Row key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>
      <datalist id="data-list-symbols">
        <option value="BTC"></option>
        <option value="ETH"></option>
        <option value="SOL"></option>
        <option value="ADA"></option>
        <option value="BNB"></option>
      </datalist>
    </>
  );
}

function Row({ trade }: { trade: TradesSpotRow }) {
  const { updateTrade } = useSpotContext();
  const [tradeLocal, setTradeLocal] =
    useLocalStorage<Partial<TradesSpotRow> | null>(`spot${trade.id}`, null);
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

  const handleChange = (key: keyof TradesSpotRow, value: unknown) => {
    setTradeLocal((prev) => {
      const local = { ...prev, [key]: value };
      const combined = { ...trade, ...local };
      const pnl = getSpotPnl({ ...combined });
      return {
        ...local,
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
          const render = col.render ?? ((row: TradesSpotRow) => row[col.key]);
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
            <SpotDetails
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
  key: keyof TradesSpotRow;
  style?: CSSProperties;
  render?: (
    row: TradesSpotRow,
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
    label: 'ACCOUNT',
    key: 'account',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber name="account" value={row.account} onChange={onChange} />
      ) : (
        toEUR(row.account)
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
        toEUR(row.amount)
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
        toEUR(row.entry)
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
        toEUR(row.exit)
      );
    },
  },
  {
    label: 'FEES',
    key: 'fees',
    style: { width: 100, textAlign: 'right' },
    render: (row, editable, onChange) => {
      const percentage = row.fees ? (row.fees * 100).toFixed(2) + '%' : '';
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
    label: 'PNL',
    key: 'pnl',
    style: { width: 64, textAlign: 'right' },
    render: (row) => (
      // -1 = red, 0 = currentColor, 1 = green
      <span className={row.executed ? 'number' + Math.sign(row.pnl || 0) : ''}>
        {toEUR(row.pnl)}
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
