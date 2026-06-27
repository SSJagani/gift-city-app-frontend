import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { brokerSettingsApi } from "../api/http.js";

const STOCK_TYPES = [
  { label: "Indian Stocks", value: "indian" },
  { label: "US Stocks", value: "us" },
];

const BROKERS_BY_STOCK_TYPE = {
  indian: [
    { label: "Zerodha", value: "zerodha" },
    { label: "ICICI Direct", value: "icici_direct" },
    // { label: "Angel One", value: "angel_one" },
    // { label: "Upstox", value: "upstox" },
  ],
  us: [
    { label: "Interactive Brokers", value: "interactive_brokers" },
    // { label: "Alpaca", value: "alpaca" },
    // { label: "TD Ameritrade", value: "td_ameritrade" },
    { label: "Charles Schwab", value: "charles_schwab" },
  ],
};

const SETTINGS_TABS = [
  { label: "API Configuration", value: "api_configuration" },
  // { label: "General Settings", value: "general_settings" },
  // { label: "Notifications", value: "notifications" },
  // { label: "Security", value: "security" },
  // { label: "Audit Logs", value: "audit_logs" },
];

const emptyForm = {
  stockType: "indian",
  brokerName: "zerodha",
  apiKey: "",
  accessKey: "",
};

function unwrapPayload(response) {
  return response?.data ?? response;
}

function normalizeBroker(raw) {
  if (!raw) return null;
  const stockType = raw.stock_type || raw.stockType || "indian";
  const brokerName = raw.broker_name || raw.brokerName || "";

  return {
    id: raw.id || raw.uuid || raw._id || brokerName,
    stockType,
    brokerName,
    apiKey: raw.api_key || raw.apiKey || "",
    accessKey: raw.access_key || raw.accessKey || "",
    connected: Boolean(raw.connected ?? raw.is_connected ?? raw.success),
    message: raw.message || "",
    createdAt: raw.created_at || raw.createdAt || "",
  };
}

function normalizeBrokerList(response) {
  const payload = unwrapPayload(response);
  const rows = Array.isArray(payload)
    ? payload
    : payload?.brokers || payload?.results || payload?.records || [];
  return rows.map(normalizeBroker).filter(Boolean);
}

function normalizeBrokerDetail(response) {
  const payload = unwrapPayload(response);
  return normalizeBroker(payload?.broker || payload?.record || payload);
}

function getBrokerLabel(stockType, brokerName) {
  return (
    BROKERS_BY_STOCK_TYPE[stockType]?.find((broker) => broker.value === brokerName)?.label ||
    brokerName ||
    "-"
  );
}

function getStockTypeLabel(stockType) {
  return STOCK_TYPES.find((type) => type.value === stockType)?.label || stockType || "-";
}

function getMessage(response, fallback) {
  const payload = unwrapPayload(response);
  return payload?.message || response?.message || fallback;
}

function toPayload(form) {
  return {
    stock_type: form.stockType,
    broker_name: form.brokerName,
    api_key: form.apiKey.trim(),
    access_key: form.accessKey.trim(),
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("api_configuration");
  const [brokers, setBrokers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState(null);

  const isModalOpen = Boolean(modalMode);
  const isEditing = modalMode === "edit";
  const brokerOptions = BROKERS_BY_STOCK_TYPE[form.stockType] || [];
  const alertTitle = alert?.type === "success" ? "Success" : "Error";

  const filteredBrokers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return brokers;

    return brokers.filter((broker) => {
      const searchable = [
        getStockTypeLabel(broker.stockType),
        getBrokerLabel(broker.stockType, broker.brokerName),
        broker.brokerName,
        broker.message,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [brokers, searchQuery]);

  useEffect(() => {
    loadBrokers();
  }, []);

  async function loadBrokers() {
    setLoadingList(true);
    try {
      const response = await brokerSettingsApi.list();
      setBrokers(normalizeBrokerList(response));
    } catch (error) {
      setAlert({ type: "error", message: error.message || "Unable to load broker settings." });
    } finally {
      setLoadingList(false);
    }
  }

  function updateForm(field, value) {
    setForm((current) => {
      if (field === "stockType") {
        const nextBroker = BROKERS_BY_STOCK_TYPE[value]?.[0]?.value || "";
        return { ...current, stockType: value, brokerName: nextBroker };
      }
      return { ...current, [field]: value };
    });
  }

  function validateForm() {
    if (!form.stockType || !form.brokerName) {
      setAlert({ type: "error", message: "Select stock type and broker name." });
      return false;
    }

    if (!form.apiKey.trim() || !form.accessKey.trim()) {
      setAlert({ type: "error", message: "Enter API key and access key." });
      return false;
    }

    const duplicate = brokers.some(
      (broker) => broker.brokerName === form.brokerName && broker.id !== editingId,
    );
    if (duplicate) {
      setAlert({
        type: "error",
        message: `${getBrokerLabel(form.stockType, form.brokerName)} is already integrated.`,
      });
      return false;
    }

    return true;
  }

  function openAddModal() {
    setAlert(null);
    setEditingId(null);
    setForm(emptyForm);
    setModalMode("add");
  }

  async function openEditModal(brokerId) {
    setAlert(null);
    setLoadingDetail(true);
    setModalMode("edit");
    setEditingId(brokerId);

    try {
      const response = await brokerSettingsApi.detail(brokerId);
      const broker = normalizeBrokerDetail(response);
      setForm({
        stockType: broker?.stockType || "indian",
        brokerName: broker?.brokerName || "zerodha",
        apiKey: broker?.apiKey || "",
        accessKey: broker?.accessKey || "",
      });
    } catch (error) {
      setModalMode(null);
      setEditingId(null);
      setAlert({ type: "error", message: error.message || "Unable to load broker details." });
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!validateForm()) return;

    setSaving(true);
    setAlert(null);

    try {
      const payload = toPayload(form);
      const response = isEditing
        ? await brokerSettingsApi.update(editingId, payload)
        : await brokerSettingsApi.create(payload);

      setAlert({
        type: "success",
        message: getMessage(response, isEditing ? "Broker updated successfully." : "Broker connected successfully."),
      });
      closeModal();
      await loadBrokers();
    } catch (error) {
      setAlert({ type: "error", message: error.message || "Unable to save broker settings." });
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteCurrent() {
    const target =
      brokers.find((broker) => broker.id === editingId) || {
        id: editingId,
        stockType: form.stockType,
        brokerName: form.brokerName,
      };
    setDeleteTarget(target);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;

    setDeleting(true);
    setAlert(null);

    try {
      const response = await brokerSettingsApi.remove(deleteTarget.id);
      setAlert({ type: "success", message: getMessage(response, "Broker deleted successfully.") });
      setDeleteTarget(null);
      closeModal();
      await loadBrokers();
    } catch (error) {
      setAlert({ type: "error", message: error.message || "Unable to delete broker." });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-content settings-page">
      <div className="page-hero">
        <Settings size={36} className="page-hero-icon" aria-hidden="true" />
        <div>
          <h2>Settings / API Configuration</h2>
          <p>Manage broker API connections for Indian and US markets.</p>
        </div>
      </div>

      <section className="settings-shell">
        <aside className="settings-tabs" aria-label="Settings sections">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={activeTab === tab.value ? "active" : ""}
              type="button"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <div className="panel settings-panel">
          {activeTab === "api_configuration" ? (
            <>
              <div className="settings-table-toolbar">
                <div>
                  <h3>Broker API Records</h3>
                  <p>Click any row to edit, update, or delete the broker connection.</p>
                </div>

                <div className="settings-table-actions">
                  <label className="search-field">
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search brokers"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </label>
                  <button className="primary-action" type="button" onClick={openAddModal}>
                    <Plus size={17} aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="table-wrap broker-table-wrap">
                <table className="broker-table">
                  <thead>
                    <tr>
                      <th>Market Type</th>
                      <th>Broker Name</th>
                      <th>API Key</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrokers.map((broker) => (
                      <tr
                        key={broker.id}
                        className="clickable-row"
                        onClick={() => openEditModal(broker.id)}
                        tabIndex="0"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") openEditModal(broker.id);
                        }}
                      >
                        <td>{getStockTypeLabel(broker.stockType)}</td>
                        <td>{getBrokerLabel(broker.stockType, broker.brokerName)}</td>
                        <td>********</td>
                        <td>
                          <span className={broker.connected ? "status-active" : "status-muted"}>
                            {broker.connected ? "Connected" : "Not connected"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loadingList && filteredBrokers.length === 0 && (
                      <tr>
                        <td className="empty-cell" colSpan="4">
                          No broker records found.
                        </td>
                      </tr>
                    )}
                    {loadingList && (
                      <tr>
                        <td className="empty-cell" colSpan="4">
                          Loading broker records...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="future-settings-panel">
              <h3>{SETTINGS_TABS.find((tab) => tab.value === activeTab)?.label}</h3>
              <p>This settings area is ready for future configuration.</p>
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="broker-modal-title">
            <header className="modal-header">
              <div>
                <h3 id="broker-modal-title">{isEditing ? "Edit Broker API" : "Add Broker API"}</h3>
                <p>{isEditing ? "Update or remove this broker connection." : "Add a new broker connection."}</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close modal" onClick={closeModal}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {loadingDetail ? (
              <div className="modal-loading">
                <Loader2 size={22} aria-hidden="true" />
                <span>Loading broker details...</span>
              </div>
            ) : (
              <div className="modal-form-grid">
                <label className="field">
                  <span>Stock Type</span>
                  <select value={form.stockType} onChange={(event) => updateForm("stockType", event.target.value)}>
                    {STOCK_TYPES.map((stockType) => (
                      <option key={stockType.value} value={stockType.value}>
                        {stockType.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Broker Name</span>
                  <select value={form.brokerName} onChange={(event) => updateForm("brokerName", event.target.value)}>
                    {brokerOptions.map((broker) => (
                      <option key={broker.value} value={broker.value}>
                        {broker.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>API Key</span>
                  <div className="input-with-icon">
                    <KeyRound size={16} aria-hidden="true" />
                    <input
                      type="password"
                      value={form.apiKey}
                      placeholder="Enter API key"
                      onChange={(event) => updateForm("apiKey", event.target.value)}
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Access Key</span>
                  <div className="input-with-icon">
                    <KeyRound size={16} aria-hidden="true" />
                    <input
                      type="password"
                      value={form.accessKey}
                      placeholder="Enter access key"
                      onChange={(event) => updateForm("accessKey", event.target.value)}
                    />
                  </div>
                </label>
              </div>
            )}

            <footer className="modal-actions">
              {isEditing && (
                <button className="danger-button" type="button" onClick={requestDeleteCurrent} disabled={saving || deleting}>
                  <Trash2 size={17} aria-hidden="true" />
                  <span>Delete</span>
                </button>
              )}
              <button className="secondary-button" type="button" onClick={closeModal} disabled={saving || deleting}>
                Cancel
              </button>
              <button className="primary-action" type="button" onClick={handleSave} disabled={saving || loadingDetail}>
                <Save size={17} aria-hidden="true" />
                <span>{saving ? "Saving..." : isEditing ? "Update" : "Save"}</span>
              </button>
            </footer>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop confirm-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h3 id="delete-confirm-title">Delete Broker?</h3>
            <p>
              Delete {getBrokerLabel(deleteTarget.stockType, deleteTarget.brokerName)} from broker API settings?
            </p>
            <div className="confirm-actions">
              <button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={confirmDelete} disabled={deleting}>
                <Trash2 size={17} aria-hidden="true" />
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {alert && (
        <section
          className={`sweet-alert-toast ${alert.type}`}
          role="alert"
          aria-live="polite"
          aria-labelledby="sweet-alert-title"
          aria-describedby="sweet-alert-message"
        >
          <div className="sweet-alert-toast-icon">
            {alert.type === "success" ? (
              <CheckCircle2 size={24} aria-hidden="true" />
            ) : (
              <AlertCircle size={24} aria-hidden="true" />
            )}
          </div>
          <div>
            <h3 id="sweet-alert-title">{alertTitle}</h3>
            <p id="sweet-alert-message">{alert.message}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Close alert" onClick={() => setAlert(null)}>
            <X size={16} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}
