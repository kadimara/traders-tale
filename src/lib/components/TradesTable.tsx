import { type CSSProperties, type ReactNode } from 'react';
import { Download, DownloadCloud, Edit, ExternalLink, Plus, Save, Send, X, XOctagon } from 'react-feather';
import { Link } from '@tanstack/react-router';
import { useTradesContext } from '../context/TradesContext';
import { useMonthContext } from '../context/MonthContext';
import { useNewTrade } from '../hooks/useNewTrade';
import { useOkxSync } from '../hooks/useOkxSync';
import { useOkxOrder } from '../hooks/useOkxOrder';
import { useTradeEdit } from '../hooks/useTradeEdit';
import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradesRow,
} from '@lib/database/TradesApi';
import { formatDateTime, toDateTimeLocalInput } from '@lib/utils/DateUtils';
import { toUSD } from '@lib/utils/MathUtils';
import {
  contractsToUsd,
  exportTradesToCsv,
  formatTradeSize,
  getContractSize,
  usdToContracts,
} from '@lib/utils/TradeUtils';
import { Input } from './Input';
import { InputNumber } from './InputNumber';

export function TradesTable() {
  const { trades } = useTradesContext();
  const { monthKey } = useMonthContext();
  const { sync, syncing } = useOkxSync();
  const handleAddTrade = useNewTrade();

  return (
    <>
      <table>
        <thead>
          <tr style={{ position: 'sticky', top: 10 }}>
            <TradeColumnHeaders />
            <th>
              <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                <button aria-label="Export CSV" title="Export CSV" onClick={() => exportTradesToCsv(trades, monthKey)}>
                  <Download />
                </button>
                <button
                  aria-label="Sync OKX"
                  title="Sync closed OKX positions into trades"
                  onClick={sync}
                  disabled={syncing}
                >
                  <DownloadCloud />
                </button>
                <button aria-label="Add" title="Add" onClick={handleAddTrade}>
                  <Plus />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {trades?.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
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

// `hide` leaves out columns, e.g. the ones the trade page shows in its title.
export function TradeColumnHeaders({ hide = [] }: { hide?: (keyof TradesRow)[] }) {
  return tradeColumns
    .filter((col) => !hide.includes(col.key))
    .map((col) => <th key={col.key}>{col.label}</th>);
}

function TradeRow({ trade }: { trade: TradesRow }) {
  const { send, cancel: cancelOrder, sending } = useOkxOrder();
  const { draft, editing, edit, save, cancel, change } = useTradeEdit(trade);

  // const handleDelete = () => {
  //   const result = confirm('Are you sure you want to delete this trade?');
  //   if (result) deleteTrade(trade.id);
  // };

  return (
    <tr
      style={{
        background: editing ? 'var(--color-bg-highlight)' : undefined,
        color: trade.status === 'canceled' && !editing ? 'gray' : undefined,
        boxShadow:
          trade.status === 'planned' || trade.status === 'live' ? 'inset 3px 0 0 var(--color-main)' : undefined,
      }}
    >
      <TradeCells trade={draft} editing={editing} onChange={change} />
      <th style={{ justifyItems: 'center', width: 130 }}>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button aria-label="Save" title="Save" onClick={save}>
                <Save />
              </button>
              <button
                aria-label="Cancel"
                title="Cancel"
                onClick={cancel}
              >
                <X />
              </button>
            </>
          ) : (
            <>
              <button aria-label="Edit" title="Edit" onClick={edit}>
                <Edit />
              </button>
              {trade.status === 'planned' && (
                <button
                  aria-label="Send to OKX"
                  title="Send to OKX as a limit order with stop-loss"
                  onClick={() => send(trade.id)}
                  disabled={sending}
                >
                  <Send />
                </button>
              )}
              {trade.status === 'live' && trade.okx_order && (
                <button
                  aria-label="Cancel OKX order"
                  title={`Cancel the OKX order (${trade.okx_order})`}
                  onClick={() => cancelOrder(trade.id)}
                  disabled={sending}
                >
                  <XOctagon />
                </button>
              )}
              <Link
                role="button"
                to="/trade/$id"
                params={{ id: trade.id }}
                aria-label="Open trade"
                title="Open trade"
              >
                <ExternalLink />
              </Link>
              {/* <button aria-label="Delete" title="Delete" onClick={handleDelete}>
            <Trash />
            </button> */}
            </>
          )}
        </div>
      </th>
    </tr>
  );
}

type TradeCellsProps = {
  trade: TradesRow;
  editing: boolean;
  onChange: (key: keyof TradesRow, value: unknown) => void;
  hide?: (keyof TradesRow)[];
  // Center every cell instead of right-aligning the numbers.
  center?: boolean;
};

// The column cells of one trade row, also used on the trade page.
export function TradeCells({ trade, editing, onChange, hide = [], center = false }: TradeCellsProps) {
  return tradeColumns.filter((col) => !hide.includes(col.key)).map((col) => {
    const render = col.render ?? ((row: TradesRow) => row[col.key]);
    return (
      <th key={col.key} style={center ? { ...col.style, textAlign: 'center' } : col.style}>
        {render(trade, editing, (value) => onChange(col.key, value))}
      </th>
    );
  });
}

const tradeColumns: {
  label: string;
  key: keyof TradesRow;
  style?: CSSProperties;
  render?: (
    row: TradesRow,
    editable: boolean,
    onChange: (value: unknown) => void,
  ) => ReactNode;
}[] = [
  {
    label: 'STATUS',
    key: 'status',
    style: { width: 100, textAlign: 'center' },
    render: (row, editable, onChange) =>
      editable ? (
        <select
          name="status"
          style={{ textAlign: 'center' }}
          value={row.status}
          onChange={(e) => onChange(e.target.value as TradeStatus)}
        >
          {TRADE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ) : (
        row.status
      ),
  },
  {
    label: 'DATE',
    key: 'created_at',
    style: { width: 200 },
    render: ({ created_at }, editable, onChange) => {
      if (editable) {
        const localValue = toDateTimeLocalInput(created_at);
        return (
          <input
            type="datetime-local"
            defaultValue={localValue}
            onChange={(e) => onChange(new Date(e.target.value).toISOString())}
            style={{ width: 180 }}
          />
        );
      }
      return formatDateTime(created_at);
    },
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
        toUSD(Math.round(row.account))
      );
    },
  },
  {
    label: 'SIZE',
    key: 'amount',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      const contractSize = getContractSize(row.symbol);
      if (!editable) return formatTradeSize(row);
      if (!contractSize) {
        return (
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
            <span>$</span>
            <InputNumber
              name="amount"
              placeholder="dollars"
              value={row.amount || null}
              onChange={onChange}
            />
          </div>
        );
      }
      return (
        <InputNumber
          name="contracts"
          title={`Contracts (1 = ${contractSize} ${row.symbol.toUpperCase()})`}
          placeholder="contracts"
          disabled={!row.entry}
          min="0"
          step="1"
          value={
            row.entry && row.amount ? usdToContracts(row.amount, contractSize, row.entry) : null
          }
          onChange={(contracts) => onChange(contractsToUsd(contracts, contractSize, row.entry))}
        />
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
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      return editable ? (
        <InputNumber
          name="fees"
          min="0"
          value={row.fees ?? 0}
          onChange={onChange}
        />
      ) : (
        toUSD(row.fees ? -row.fees : row.fees)
      );
    },
  },
  {
    label: 'RISK',
    key: 'risk',
    style: { width: 64, textAlign: 'right' },
    render: (row) => (row.risk ? (row.risk * 100).toFixed(2) + '%' : ''),
  },
  {
    label: 'PNL',
    key: 'pnl',
    style: { width: 64, textAlign: 'right' },
    render: (row) => (
      // -1 = red, 0 = currentColor, 1 = green
      <span className={row.status === 'closed' ? 'number' + Math.sign(row.pnl || 0) : ''}>
        {toUSD(row.pnl)}
      </span>
    ),
  },
];
