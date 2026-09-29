import { useState, type CSSProperties, type ReactNode } from 'react';
import { Circle, Download, Edit, ExternalLink, Info, Plus, Save, X } from 'react-feather';
import { Link } from '@tanstack/react-router';
import { useTradesContext } from '../context/TradesContext';
import { useMonthContext } from '../context/MonthContext';
import { setLocalStorageItem, useLocalStorage } from '../hooks/useLocalStorage';
import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradesRow,
  type TradesUpdate,
} from '@lib/database/TradesApi';
import { formatDateTime, toDateTimeLocalInput } from '@lib/utils/DateUtils';
import { toUSD } from '@lib/utils/MathUtils';
import {
  contractsToUsd,
  exportTradesToCsv,
  getContractSize,
  getTradeLongShort,
  getTradePnl,
  getTradeRisk,
  usdToContracts,
} from '@lib/utils/TradeUtils';
import { Input } from './Input';
import { InputNumber } from './InputNumber';
import { TradeDocument } from './TradeDocument';

export function TradesTable() {
  const { trades, insertTrade } = useTradesContext();
  const { monthKey } = useMonthContext();

  const handleAddTrade = async () => {
    const trade = await insertTrade({
      account: 0,
      amount: 0,
      entry: 0,
      long_short: 'long',
      stop: 0,
      status: 'planned',
      symbol: 'BTC',
    });
    setLocalStorageItem(`trade${trade.id}`, {});
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
              <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                <button aria-label="Export CSV" title="Export CSV" onClick={() => exportTradesToCsv(trades, monthKey)}>
                  <Download />
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

function Row({ trade }: { trade: TradesRow }) {
  const { updateTrade } = useTradesContext();
  const [tradeLocal, setTradeLocal] =
    useLocalStorage<Partial<TradesRow> | null>(`trade${trade.id}`, null);
  const tradeCombined = { ...trade, ...tradeLocal };

  const [d, setShowDetails] = useState(false);
  const toggleDetails = () => setShowDetails((v) => !v);
  const editing = tradeLocal !== null;
  const showDetails = d || editing;

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
      // Keep the contract count when the entry changes after contracts were entered
      const contractSize = getContractSize(local.symbol ?? trade.symbol);
      const prevEntry = prev?.entry ?? trade.entry;
      if (key === 'entry' && prev?.amount && contractSize && prevEntry) {
        const contracts = usdToContracts(prev.amount, contractSize, prevEntry);
        local.amount = contractsToUsd(contracts, contractSize, value as number);
      }
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
          color: trade.status !== 'taken' && !editing ? 'gray' : undefined,
        }}
      >
        {columns.map((col) => {
          const render = col.render ?? ((row: TradesRow) => row[col.key]);
          return (
            <th key={col.key} style={col.style}>
              {render(
                tradeCombined,
                editing,
                (value) => handleChange(col.key, value),
              )}
            </th>
          );
        })}
        <th style={{ justifyItems: 'center', width: 100 }}>
          <div className="flex gap-1">
            {editing ? (
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
                <Link
                  role="button"
                  to="/trade/$id"
                  params={{ id: String(trade.id) }}
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
      {showDetails && (
        <tr>
          <td
            colSpan={columns.length + 1}
            className="text-left p-2 bg-highlight"
          >
            <TradeDocument
              trade={tradeCombined}
              editing={editing}
              onChange={(journal) => handleChange('journal', journal)}
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
    onChange: (value: unknown) => void,
  ) => ReactNode;
}[] = [
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
        toUSD(row.account)
      );
    },
  },
  {
    label: 'AMOUNT',
    key: 'amount',
    style: { minWidth: 100, textAlign: 'right' },
    render(row, editable, onChange) {
      const contractSize = getContractSize(row.symbol);
      if (!editable || !contractSize) {
        return editable ? (
          <InputNumber name="amount" value={row.amount} onChange={onChange} />
        ) : (
          toUSD(row.amount)
        );
      }
      return (
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <InputNumber
            name="contracts"
            title={`Contracts (1 = ${contractSize} ${row.symbol.toUpperCase()})`}
            placeholder={row.entry ? 'contracts' : 'set entry'}
            disabled={!row.entry}
            min="0"
            step="1"
            value={row.entry ? usdToContracts(row.amount, contractSize, row.entry) : null}
            onChange={(contracts) =>
              onChange(contractsToUsd(contracts, contractSize, row.entry))
            }
          />
          <span style={{ whiteSpace: 'nowrap' }}>ct ≈ {toUSD(row.amount)}</span>
        </div>
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
      <span className={row.status === 'taken' ? 'number' + Math.sign(row.pnl || 0) : ''}>
        {toUSD(row.pnl)}
      </span>
    ),
  },
  {
    label: 'STATUS',
    key: 'status',
    style: { width: 100, textAlign: 'right' },
    render: (row, editable, onChange) =>
      editable ? (
        <select
          name="status"
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
];
