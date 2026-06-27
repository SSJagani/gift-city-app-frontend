import { ShieldOff } from "lucide-react";
import { usePermissions } from "./usePermissions.js";

/**
 * <RouteGuard permission={...}>
 *
 * Wraps a page/route and renders a Forbidden screen if the user
 * lacks the required permission. Must be used inside <AuthProvider>.
 *
 * Usage (in App.jsx):
 *   <Route
 *     path="/user-management"
 *     element={
 *       <ProtectedRoute>
 *         <RouteGuard permission={PERMISSIONS.VIEW_USER_MANAGEMENT}>
 *           <UserManagementPage />
 *         </RouteGuard>
 *       </ProtectedRoute>
 *     }
 *   />
 */
export default function RouteGuard({ permission, permissions, require = "all", children }) {
  const { can, canAll, canAny, role } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = require === "any" ? canAny(permissions) : canAll(permissions);
  } else {
    allowed = true;
  }

  if (!allowed) {
    return <ForbiddenPage role={role} />;
  }

  return children;
}

function ForbiddenPage({ role }) {
  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <ShieldOff size={48} className="forbidden-icon" aria-hidden="true" />
        <h2>Access Denied</h2>
        <p>
          Your role (<strong>{role ?? "unknown"}</strong>) does not have
          permission to view this page.
        </p>
        <p className="forbidden-hint">
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}
