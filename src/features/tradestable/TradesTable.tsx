import { useState, type CSSProperties, type ReactNode } from 'react';
import { useTradesContext } from '../../context/TradesContext';
import {
  setLocalStorageItem,
  useLocalStorage,
} from '../../hooks/useLocalStorage';
import type { TradesRow, TradesUpdate } from '../../lib/database/api';
import { InputNumber } from '../../components/InputNumber';
import { Edit, Info, Plus, Save, Trash, X } from 'react-feather';
import { getTradePnl, getTradeRisk } from '../../lib/TradeUtils';
import { Input } from '../../components/Input';
import { toUSD } from '../../lib/MathUtils';

export function TradesTable() {
  const { trades, insertTrade } = useTradesContext();

  const handleAddTrade = async () => {
    const trade = await insertTrade({
      account: 0,
      amount: 0,
      entry: 0,
      long_short: 'long',
      stop: 0,
      symbol: 'BTCUSD',
      target: 0,
      time_frame: '1h',
    });
    setLocalStorageItem(`trade${trade.id}`, {});
  };

  return (
    <>
      <table>
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.style} />
          ))}
          <col style={{ width: 64 }} />
        </colgroup>
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
  const { deleteTrade, updateTrade } = useTradesContext();
  const [showDetails, setShowDetails] = useState(false);

  const [tradeLocal, setTradeLocal] =
    useLocalStorage<Partial<TradesRow> | null>(`trade${trade.id}`, null);
  const editable = tradeLocal !== null;

  const tradeCombined = { ...trade, ...tradeLocal };

  const handleEdit = () => {
    setTradeLocal({});
  };
  const handleDelete = () => {
    const result = confirm('Are you sure you want to delete this trade?');
    if (result) deleteTrade(trade.id);
  };
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
  const toggleDetails = () => setShowDetails((v) => !v);

  const handleChange = (key: keyof TradesRow, value: unknown) => {
    console.log(key, value);
    setTradeLocal((prev) => ({
      ...prev,
      risk: getTradeRisk(tradeCombined),
      pnl: getTradePnl(tradeCombined),
      [key]: value,
    }));
  };

  return (
    <>
      <tr>
        {columns.map((col) => {
          const render = col.render ?? ((row: TradesRow) => row[col.key]);
          return (
            <th key={col.key}>
              {render(tradeCombined, editable, (value) =>
                handleChange(col.key, value)
              )}
            </th>
          );
        })}
        <th>
          {editable ? (
            <>
              <button aria-label="Save" title="Save" onClick={handleSave}>
                <Save />
              </button>
              <button aria-label="Cancel" title="Cancel" onClick={handleCancel}>
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
                <Info />
              </button>
              {/* <button aria-label="Delete" title="Delete" onClick={handleDelete}>
              <Trash />
            </button> */}
            </>
          )}
        </th>
      </tr>
      {(showDetails || editable) && (
        <RowDetails
          trade={tradeCombined}
          editable={editable}
          onChange={handleChange}
        />
      )}
    </>
  );
}

function RowDetails({
  trade,
  editable,
  onChange,
}: {
  trade: TradesRow;
  editable: boolean;
  onChange: (key: keyof TradesRow, value: unknown) => void;
}) {
  return (
    <tr>
      <td colSpan={columns.length + 1}>
        <div className="flex flex-col gap-1" style={{ padding: '0 8px' }}>
          {editable ? (
            <>
              <Input
                placeholder="plan"
                value={trade.plan}
                onChange={(v) => onChange('plan', v)}
              />
              <Input
                placeholder="review"
                value={trade.review}
                onChange={(v) => onChange('review', v)}
              />
              <Input
                placeholder="https://www.tradingview.com/x/y4rc4UTW/"
                value={trade.url1}
                onChange={(v) => onChange('url1', v)}
              />
              <Input
                placeholder="https://www.tradingview.com/x/y4rc4UTW/"
                value={trade.url2}
                onChange={(v) => onChange('url2', v)}
              />
            </>
          ) : (
            <>
              <span>{trade.plan}</span>
              <span>{trade.review}</span>
              <span>{trade.url1}</span>
              <span>{trade.url2}</span>
            </>
          )}
        </div>
      </td>
    </tr>
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
          placeholder={row.time_frame}
          list="data-list-time_frames"
          onChange={onChange}
        />
      ) : (
        row.time_frame
      );
    },
  },
  { label: 'L / S', key: 'long_short', style: { width: 64 } },
  {
    label: 'ACCOUNT',
    key: 'account',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.account} onChange={onChange} />
      ) : (
        toUSD(row.account)
      );
    },
  },
  {
    label: 'AMOUNT',
    key: 'amount',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.amount} onChange={onChange} />
      ) : (
        toUSD(row.amount)
      );
    },
  },
  {
    label: 'SL',
    key: 'stop',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.stop} onChange={onChange} />
      ) : (
        row.stop
      );
    },
  },
  {
    label: 'ENTRY',
    key: 'entry',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.entry} onChange={onChange} />
      ) : (
        row.entry
      );
    },
  },
  {
    label: 'TARGET',
    key: 'target',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.target} onChange={onChange} />
      ) : (
        row.target
      );
    },
  },
  {
    label: 'EXIT',
    key: 'exit',
    style: { minWidth: 100 },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber value={row.exit} onChange={onChange} />
      ) : (
        row.exit
      );
    },
  },
  {
    label: 'FEES',
    key: 'fees',
    style: { width: 64 },
    render: (row) => toUSD(row.fees),
  },
  {
    label: 'RISK',
    key: 'risk',
    style: { width: 64 },
    render: (row) => (row.risk ? (row.risk * 100).toFixed(2) + '%' : ''),
  },
  {
    label: 'PNL',
    key: 'pnl',
    style: { width: 64 },
    render: (row) => toUSD(row.pnl),
  },
];
