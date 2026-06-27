import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Home,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { stocksApi } from "../api/http.js";
import { useAuth } from "../state/AuthContext.jsx";
import { PERMISSIONS, getRoleMeta, usePermissions, PermissionGate } from "../permissions/index.js";
import StockSelectionPage from "./StockSelection.jsx";
import WeeklySheetsPage from "./WeeklySheets.jsx";
import ReportsPage from "./Reports.jsx";
import UserManagementPage from "./UserManagement.jsx";
import RouteGuard from "../permissions/RouteGuard.jsx";
import SettingsPage from "./settings.jsx";

const baseStocks = [
  { symbol: "AVANTIFEED", company: "Avanti Feeds Ltd",   highAvg: "1,309.91", lowAvg: "1,230.24", diff: "79.67",  intradayRange: "197.90", avgVolume: "1.9M", iciciInvest: "0.5", selected: true  },
  { symbol: "ABC",         company: "ABC Ltd",            highAvg: "985.40",   lowAvg: "912.80",   diff: "72.60",  intradayRange: "145.20", avgVolume: "1.2M", iciciInvest: "0.4", selected: true  },
  { symbol: "XYZ",         company: "XYZ Ltd",            highAvg: "924.30",   lowAvg: "856.10",   diff: "68.20",  intradayRange: "133.40", avgVolume: "2.0M", iciciInvest: "0.6", selected: true  },
  { symbol: "PQR",         company: "PQR Ltd",            highAvg: "742.90",   lowAvg: "691.25",   diff: "51.65",  intradayRange: "121.80", avgVolume: "950K", iciciInvest: "0.3", selected: false },
  { symbol: "LMN",         company: "LMN Ltd",            highAvg: "612.75",   lowAvg: "566.30",   diff: "46.45",  intradayRange: "118.60", avgVolume: "870K", iciciInvest: "0.2", selected: false },
];

const stocks = Array.from({ length: 100 }, (_, index) => {
  const stock = baseStocks[index % baseStocks.length];
  const suffix = index < baseStocks.length ? "" : index + 1;
  return { ...stock, symbol: `${stock.symbol}${suffix}`, selected: stock.selected && index < 3 };
});

const marketTypes = [
  { label: "India", value: "india" },
  { label: "US", value: "us" },
];

const formulaTypes = [
  { label: "Same Close ATR Buffer",  value: "sc"},
  { label: "Previous Close ATR Buffer",  value: "pc"},
];

const rangeTypeOptions = [
  { label: "Days",  value: "days",  max: 30 },
  { label: "Week",  value: "week",  max: 54 },
  { label: "Month", value: "month", max: 24 },
];

// ── Nav items: [icon, label, pageKey, requiredPermission] ────────────────────
const NAV_ITEMS = [
  [Home,          "Dashboard",       "dashboard",        PERMISSIONS.VIEW_DASHBOARD],
  [FileSpreadsheet,"Stock Selection","stock_selection",  PERMISSIONS.VIEW_STOCK_SELECTION],
  [CalendarDays,  "Weekly Sheets",   "weekly_sheets",    PERMISSIONS.VIEW_WEEKLY_SHEETS],
  [BarChart3,     "Reports",         "reports",          PERMISSIONS.VIEW_REPORTS],
  [Bell,          "Alerts",          "alerts",           PERMISSIONS.VIEW_ALERTS],
  [Users,         "User Management", "user_management",  PERMISSIONS.VIEW_USER_MANAGEMENT],
  [Settings,      "Settings",        "settings",         PERMISSIONS.VIEW_SETTINGS],
];

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getRangeLabel(rangeType, rangeCount) {
  const endDate = new Date();
  const startDate = new Date();
  if (rangeType === "days")       startDate.setDate(endDate.getDate() - rangeCount + 1);
  else if (rangeType === "week")  startDate.setDate(endDate.getDate() - rangeCount * 7 + 1);
  else { startDate.setMonth(endDate.getMonth() - rangeCount + 1); startDate.setDate(1); }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function exportToCsv(rows) {
  const header = ["Symbol","Company","Hi-avg","Lo-avg","Diff","Intraday Range","Avg Volume","ICICI INVEST"];
  const lines = rows.map((s) => [s.symbol,s.company,s.highAvg,s.lowAvg,s.diff,s.intradayRange,s.avgVolume,s.iciciInvest].join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "gift_city_stocks.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Page router ───────────────────────────────────────────────────────────────
function PageContent({ pageKey }) {
  switch (pageKey) {
    case "stock_selection":
      return (
        <RouteGuard permission={PERMISSIONS.VIEW_STOCK_SELECTION}>
          <StockSelectionPage />
        </RouteGuard>
      );
    case "weekly_sheets":
      return (
        <RouteGuard permission={PERMISSIONS.VIEW_WEEKLY_SHEETS}>
          <WeeklySheetsPage />
        </RouteGuard>
      );
    case "reports":
      return (
        <RouteGuard permission={PERMISSIONS.VIEW_REPORTS}>
          <ReportsPage />
        </RouteGuard>
      );
    case "user_management":
      return (
        <RouteGuard permission={PERMISSIONS.VIEW_USER_MANAGEMENT}>
          <UserManagementPage />
        </RouteGuard>
      );
    case "settings":
      return (
        <RouteGuard permission={PERMISSIONS.VIEW_SETTINGS}>
          <SettingsPage />
        </RouteGuard>
      );
    default:
      return null; // dashboard handled inline
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { can, role } = usePermissions();
  const roleMeta = getRoleMeta(role);

  const [activePage, setActivePage] = useState("dashboard");
  const [marketType, setMarketType] = useState("india");
  const [formulaType, setFormulaType] = useState("sc");
  const [rangeType, setRangeType] = useState("days");
  const [rangeCount, setRangeCount] = useState("7");
  const [stockCount, setStockCount] = useState("5");
  const [stockRows, setStockRows] = useState(stocks);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [stockError, setStockError] = useState("");

  const selectedRange = rangeTypeOptions.find((o) => o.value === rangeType) || rangeTypeOptions[0];
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
  const rangeLabel = periodError ? "Select a valid range" : getRangeLabel(rangeType, parsedRangeCount);

  function handleRangeTypeChange(event) {
    const nextType = event.target.value;
    const nextRange = rangeTypeOptions.find((o) => o.value === nextType) || rangeTypeOptions[0];
    setRangeType(nextType);
    setRangeCount((current) => {
      const v = Number(current);
      if (!Number.isInteger(v) || v < 1) return "1";
      return String(Math.min(v, nextRange.max));
    });
  }

  async function handleRefresh() {
    if (toolbarError || !can(PERMISSIONS.REFRESH_STOCKS)) return;
    setLoadingStocks(true);
    setStockError("");
    try {
      const response = await stocksApi.topStocks({ rangeType, rangeCount: parsedRangeCount, stockCount: parsedStockCount });
      setStockRows(
        response.data.map((s) => ({
          symbol: s.symbol, company: s.company_name,
          highAvg: s.high_avg_last_7_days ?? "-", lowAvg: s.low_avg_last_7_days ?? "-",
          diff: s.diff_high_low ?? "-", intradayRange: s.intraday_range ?? "-",
          avgVolume: s.avg_volume_last_7_days ?? "-", iciciInvest: s.icici_invest ?? "-",
          selected: false,
        })),
      );
      setLastRefreshed(new Date());
    } catch (error) {
      setStockError(error.message || "Unable to refresh data.");
    } finally {
      setLoadingStocks(false);
    }
  }

  // Visible nav items filtered by role permissions
  const visibleNavItems = NAV_ITEMS.filter(([, , , permission]) => can(permission));

  return (
    <main className="dashboard-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <TrendingUp size={28} aria-hidden="true" />
          <strong>GIFT CITY</strong>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {visibleNavItems.map(([Icon, label, pageKey]) => (
            <button
              key={pageKey}
              className={activePage === pageKey ? "active" : ""}
              type="button"
              onClick={() => setActivePage(pageKey)}
            >
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

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <section className="dashboard-main">
        {/* Top bar */}
        <header className="topbar">
          <div>
            <h1>
              {visibleNavItems.find(([, , key]) => key === activePage)?.[1] ?? "Dashboard"}
            </h1>
          </div>
          <div className="user-chip">
            <UserRound size={18} aria-hidden="true" />
            <span>{user?.full_name || user?.email}</span>
            <span
              className="role-pill"
              style={{ "--role-color": roleMeta.color }}
              title={`Your role: ${roleMeta.label}`}
            >
              <ShieldCheck size={12} aria-hidden="true" />
              {roleMeta.label}
            </span>
          </div>
        </header>

        {/* ── Page: Dashboard ──────────────────────────────────────────── */}
        {activePage === "dashboard" && (
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

              {/* Toolbar — filters gated by EDIT_STOCK_FILTERS */}
              <div className="stock-toolbar">
                <PermissionGate
                  permission={PERMISSIONS.EDIT_STOCK_FILTERS}
                  fallback={
                    <div className="toolbar-readonly">
                      <span>Showing top {parsedStockCount || 5} stocks — filters locked for your role.</span>
                    </div>
                  }
                >
                  <label>
                    <span>Market</span>
                    <select id="" name="" value={marketType} onChange={(e) => setMarketType(e.target.value)}>
                      {marketTypes.map((o) => (
                        <option value={o.value} key={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Formula</span>
                    <select id="" name="" value={formulaType} onChange={(e) => setFormulaType(e.target.value)}>
                      {formulaTypes.map((o) => (
                        <option value={o.value} key={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Range Type</span>
                    <select value={rangeType} onChange={handleRangeTypeChange}>
                      {rangeTypeOptions.map((o) => (
                        <option value={o.value} key={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{selectedRange.label} Count</span>
                    <input type="number" min="1" max={selectedRange.max} step="1"
                      value={rangeCount} onChange={(e) => setRangeCount(e.target.value)} />
                  </label>
                  <label>
                    <span>No. of Stocks</span>
                    <input type="number" min="1" max="100" step="1"
                      value={stockCount} onChange={(e) => setStockCount(e.target.value)} />
                  </label>
                </PermissionGate>

                {/* Refresh — gated by REFRESH_STOCKS */}
                <PermissionGate permission={PERMISSIONS.REFRESH_STOCKS}>
                  <button
                    className="refresh-button"
                    type="button"
                    onClick={handleRefresh}
                    disabled={Boolean(toolbarError) || loadingStocks}
                  >
                    <RefreshCw size={17} aria-hidden="true" />
                    <span>{loadingStocks ? "Refreshing..." : "Refresh Data"}</span>
                  </button>
                </PermissionGate>

                {/* Export — gated by EXPORT_STOCKS */}
                {/* <PermissionGate permission={PERMISSIONS.EXPORT_STOCKS}>
                  <button
                    className="export-button"
                    type="button"
                    onClick={() => exportToCsv(visibleStocks)}
                    disabled={visibleStocks.length === 0}
                  >
                    <Download size={16} aria-hidden="true" />
                    <span>Export CSV</span>
                  </button>
                </PermissionGate> */}

                <div className="toolbar-status" aria-live="polite">
                  {toolbarError || stockError ||
                    (lastRefreshed ? `Refreshed ${lastRefreshed.toLocaleTimeString()}` : "Ready")}
                </div>
              </div>

              {/* Table */}
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
                      {/* Select column — gated by SELECT_STOCKS */}
                      <PermissionGate permission={PERMISSIONS.SELECT_STOCKS}>
                        <th>Select</th>
                      </PermissionGate>
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
                        <PermissionGate permission={PERMISSIONS.SELECT_STOCKS}>
                          <td>
                            <input type="checkbox" checked={stock.selected} readOnly />
                          </td>
                        </PermissionGate>
                      </tr>
                    ))}
                    {visibleStocks.length === 0 && (
                      <tr>
                        <td colSpan="9" className="empty-cell">
                          Enter a valid stock count to show data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metric cards */}
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
        )}

        {/* ── Other pages (permission-guarded) ─────────────────────────── */}
        {activePage !== "dashboard" && <PageContent pageKey={activePage} />}
      </section>
    </main>
  );
}
