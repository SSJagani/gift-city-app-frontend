import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileSpreadsheet,
  Home,
  LogOut,
  RefreshCw,
  Settings,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { stocksApi } from "../api/http.js";
import { useAuth } from "../state/AuthContext.jsx";

const baseStocks = [
  {
    symbol: "AVANTIFEED",
    company: "Avanti Feeds Ltd",
    highAvg: "1,309.91",
    lowAvg: "1,230.24",
    diff: "79.67",
    intradayRange: "197.90",
    avgVolume: "1.9M",
    iciciInvest: "0.5",
    selected: true,
  },
  {
    symbol: "ABC",
    company: "ABC Ltd",
    highAvg: "985.40",
    lowAvg: "912.80",
    diff: "72.60",
    intradayRange: "145.20",
    avgVolume: "1.2M",
    iciciInvest: "0.4",
    selected: true,
  },
  {
    symbol: "XYZ",
    company: "XYZ Ltd",
    highAvg: "924.30",
    lowAvg: "856.10",
    diff: "68.20",
    intradayRange: "133.40",
    avgVolume: "2.0M",
    iciciInvest: "0.6",
    selected: true,
  },
  {
    symbol: "PQR",
    company: "PQR Ltd",
    highAvg: "742.90",
    lowAvg: "691.25",
    diff: "51.65",
    intradayRange: "121.80",
    avgVolume: "950K",
    iciciInvest: "0.3",
    selected: false,
  },
  {
    symbol: "LMN",
    company: "LMN Ltd",
    highAvg: "612.75",
    lowAvg: "566.30",
    diff: "46.45",
    intradayRange: "118.60",
    avgVolume: "870K",
    iciciInvest: "0.2",
    selected: false,
  },
];

const stocks = Array.from({ length: 100 }, (_, index) => {
  const stock = baseStocks[index % baseStocks.length];
  const suffix = index < baseStocks.length ? "" : index + 1;
  return {
    ...stock,
    symbol: `${stock.symbol}${suffix}`,
    selected: stock.selected && index < 3,
  };
});

const rangeTypeOptions = [
  { label: "Days", value: "days", max: 30 },
  { label: "Week", value: "week", max: 54 },
  { label: "Month", value: "month", max: 24 },
];

const navItems = [
  [Home, "Dashboard", true],
  // [FileSpreadsheet, "Stock Selection"],
  // [CalendarDays, "Weekly Sheets"],
  // [BarChart3, "Reports"],
  // [Bell, "Alerts"],
  [Settings, "Settings"],
];

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRangeLabel(rangeType, rangeCount) {
  const endDate = new Date();
  const startDate = new Date();

  if (rangeType === "days") {
    startDate.setDate(endDate.getDate() - rangeCount + 1);
  } else if (rangeType === "week") {
    startDate.setDate(endDate.getDate() - rangeCount * 7 + 1);
  } else {
    startDate.setMonth(endDate.getMonth() - rangeCount + 1);
    startDate.setDate(1);
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [rangeType, setRangeType] = useState("days");
  const [rangeCount, setRangeCount] = useState("7");
  const [stockCount, setStockCount] = useState("5");
  const [stockRows, setStockRows] = useState(stocks);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [stockError, setStockError] = useState("");

  const selectedRange = rangeTypeOptions.find((option) => option.value === rangeType) || rangeTypeOptions[0];
  const parsedRangeCount = Number(rangeCount);
  const periodError =
    !Number.isInteger(parsedRangeCount) || parsedRangeCount < 1 || parsedRangeCount > selectedRange.max
      ? `Enter ${selectedRange.label.toLowerCase()} range 1 to ${selectedRange.max}.`
      : "";
  const parsedStockCount = Number(stockCount);
  const stockCountError =
    !Number.isInteger(parsedStockCount) || parsedStockCount < 1 || parsedStockCount > 100
      ? "Enter a stock count between 1 and 100."
      : "";
  const toolbarError = periodError || stockCountError;
  const visibleStocks = useMemo(
    () => stockRows.slice(0, toolbarError ? 0 : parsedStockCount),
    [parsedStockCount, stockRows, toolbarError],
  );
  const rangeLabel = periodError
    ? "Select a valid range"
    : getRangeLabel(rangeType, parsedRangeCount);

  function handleRangeTypeChange(event) {
    const nextType = event.target.value;
    const nextRange = rangeTypeOptions.find((option) => option.value === nextType) || rangeTypeOptions[0];
    setRangeType(nextType);
    setRangeCount((current) => {
      const currentValue = Number(current);
      if (!Number.isInteger(currentValue) || currentValue < 1) {
        return "1";
      }
      return String(Math.min(currentValue, nextRange.max));
    });
  }

  async function handleRefresh() {
    if (toolbarError) {
      return;
    }
    setLoadingStocks(true);
    setStockError("");

    try {
      const response = await stocksApi.topStocks({
        rangeType,
        rangeCount: parsedRangeCount,
        stockCount: parsedStockCount,
      });
      setStockRows(
        response.data.map((stock) => ({
          symbol: stock.symbol,
          company: stock.company_name,
          highAvg: stock.high_avg_last_7_days ?? "-",
          lowAvg: stock.low_avg_last_7_days ?? "-",
          diff: stock.diff_high_low ?? "-",
          intradayRange: stock.intraday_range ?? "-",
          avgVolume: stock.avg_volume_last_7_days ?? "-",
          iciciInvest: stock.icici_invest ?? "-",
          selected: false,
        })),
      );
      setLastRefreshed(new Date());
    } catch (error) {
      setStockError(error.message || "Unable to refresh Zerodha data.");
    } finally {
      setLoadingStocks(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <TrendingUp size={28} aria-hidden="true" />
          <strong>GIFT CITY</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(([Icon, label, active]) => (
            <button className={active ? "active" : ""} type="button" key={label}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="logout-button" type="button" onClick={logout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
          </div>
          <div className="user-chip">
            <UserRound size={18} aria-hidden="true" />
            <span>{user?.full_name || user?.email}</span>
            <small>{user?.role}</small>
          </div>
        </header>

        <section className="dashboard-grid">
          <div className="panel stock-panel">
            <div className="panel-header">
              <div>
                <h2>Top Stocks by Friday Intraday Range</h2>
                <p>Choose a date range and stock count, then refresh data.</p>
              </div>
              <div className="week-pill">
                <CalendarDays size={16} aria-hidden="true" />
                <span>{rangeLabel}</span>
              </div>
            </div>
            <div className="stock-toolbar">
              <label>
                <span>Range Type</span>
                <select value={rangeType} onChange={handleRangeTypeChange}>
                  {rangeTypeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{selectedRange.label} Count</span>
                <input
                  type="number"
                  min="1"
                  max={selectedRange.max}
                  step="1"
                  value={rangeCount}
                  onChange={(event) => setRangeCount(event.target.value)}
                />
              </label>
              <label>
                <span>No. of Stocks</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={stockCount}
                  onChange={(event) => setStockCount(event.target.value)}
                />
              </label>
              <button
                className="refresh-button"
                type="button"
                onClick={handleRefresh}
                disabled={Boolean(toolbarError) || loadingStocks}
              >
                <RefreshCw size={17} aria-hidden="true" />
                <span>{loadingStocks ? "Refreshing..." : "Refresh Data"}</span>
              </button>
              <div className="toolbar-status" aria-live="polite">
                {toolbarError ||
                  stockError ||
                  (lastRefreshed ? `Refreshed ${lastRefreshed.toLocaleTimeString()}` : "Ready")}
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company Name</th>
                    <th>Hi-avg last 7 days</th>
                    <th>Lo-avg last 7 days</th>
                    <th>Diff. High-Low</th>
                    <th>Intraday Range</th>
                    <th>Avg Volume last 7 days</th>
                    <th>ICICI INVEST</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStocks.map((stock) => (
                    <tr key={stock.symbol}>
                      <td>{stock.symbol}</td>
                      <td>{stock.company}</td>
                      <td>{stock.highAvg}</td>
                      <td>{stock.lowAvg}</td>
                      <td>{stock.diff}</td>
                      <td>{stock.intradayRange}</td>
                      <td>{stock.avgVolume}</td>
                      <td>{stock.iciciInvest}</td>
                      <td>
                        <input type="checkbox" checked={stock.selected} readOnly />
                      </td>
                    </tr>
                  ))}
                  {visibleStocks.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-cell">
                        Enter a valid stock count to show data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="metric-card">
            <span>Total Stocks</span>
            <strong>{visibleStocks.length}</strong>
          </div>
          <div className="metric-card">
            <span>Reached Buy Price</span>
            <strong>2</strong>
          </div>
          <div className="metric-card">
            <span>Avg Profit %</span>
            <strong className="success-text">1.35%</strong>
          </div>
          <div className="metric-card">
            <span>Best Profit %</span>
            <strong className="success-text">2.40%</strong>
          </div>
        </section>
      </section>
    </main>
  );
}
