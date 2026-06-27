/**
 * GIFT CITY — Role-Based Access Control (RBAC)
 *
 * Architecture:
 *   1. PERMISSIONS  – atomic capability strings (what can be done)
 *   2. ROLE_PERMISSIONS – which permissions each role has
 *   3. Helper functions – consumed by hooks, guards, and UI components
 *
 * Roles (from API user.role):
 *   super_admin | admin | analysis | client
 */

// ─── Atomic Permission Keys ───────────────────────────────────────────────────
export const PERMISSIONS = {
  // ── Navigation / Pages ──────────────────────────────────────────────────────
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_STOCK_SELECTION: "view:stock_selection",
  VIEW_WEEKLY_SHEETS: "view:weekly_sheets",
  VIEW_REPORTS: "view:reports",
  VIEW_ALERTS: "view:alerts",
  VIEW_SETTINGS: "view:settings",
  VIEW_USER_MANAGEMENT: "view:user_management",
  VIEW_AUDIT_LOG: "view:audit_log",

  // ── Stock Table Actions ──────────────────────────────────────────────────────
  REFRESH_STOCKS: "action:refresh_stocks",
  SELECT_STOCKS: "action:select_stocks",
  EXPORT_STOCKS: "action:export_stocks",
  EDIT_STOCK_FILTERS: "action:edit_stock_filters",

  // ── Admin Actions ────────────────────────────────────────────────────────────
  MANAGE_USERS: "action:manage_users",
  MANAGE_ROLES: "action:manage_roles",
  VIEW_ALL_CLIENTS: "action:view_all_clients",
};

// ─── Role → Permissions Map ───────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  super_admin: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STOCK_SELECTION,
    PERMISSIONS.VIEW_WEEKLY_SHEETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_USER_MANAGEMENT,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.REFRESH_STOCKS,
    PERMISSIONS.SELECT_STOCKS,
    PERMISSIONS.EXPORT_STOCKS,
    PERMISSIONS.EDIT_STOCK_FILTERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ALL_CLIENTS,
  ],

  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STOCK_SELECTION,
    PERMISSIONS.VIEW_WEEKLY_SHEETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_USER_MANAGEMENT,
    PERMISSIONS.REFRESH_STOCKS,
    PERMISSIONS.SELECT_STOCKS,
    PERMISSIONS.EXPORT_STOCKS,
    PERMISSIONS.EDIT_STOCK_FILTERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
  ],

  analysis: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STOCK_SELECTION,
    PERMISSIONS.VIEW_WEEKLY_SHEETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.REFRESH_STOCKS,
    PERMISSIONS.EXPORT_STOCKS,
    PERMISSIONS.EDIT_STOCK_FILTERS,
  ],

  client: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ALERTS,
  ],
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns the Set of permissions for a given role.
 * Falls back to empty set for unknown roles.
 */
export function getPermissionsForRole(role) {
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}

/**
 * Check if a role has a single permission.
 */
export function roleHasPermission(role, permission) {
  return getPermissionsForRole(role).has(permission);
}

/**
 * Check if a role has ALL of the listed permissions.
 */
export function roleHasAllPermissions(role, permissions) {
  const set = getPermissionsForRole(role);
  return permissions.every((p) => set.has(p));
}

/**
 * Check if a role has ANY of the listed permissions.
 */
export function roleHasAnyPermission(role, permissions) {
  const set = getPermissionsForRole(role);
  return permissions.some((p) => set.has(p));
}

// ─── Role Metadata (for UI badges, labels) ────────────────────────────────────
export const ROLE_META = {
  super_admin: { label: "Super Admin", color: "#7c3aed" },
  admin:       { label: "Admin",       color: "#175bcc" },
  analysis:    { label: "Analysis",    color: "#0e7a60" },
  client:      { label: "Client",      color: "#92400e" },
};

export function getRoleMeta(role) {
  return ROLE_META[role] ?? { label: role ?? "Unknown", color: "#6b7280" };
}
