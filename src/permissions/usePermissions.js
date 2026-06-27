import { useMemo } from "react";
import { useAuth } from "../state/AuthContext.jsx";
import {
  getPermissionsForRole,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
} from "./permissions.js";

/**
 * usePermissions()
 *
 * Returns permission-checking utilities derived from the logged-in user's role.
 *
 * Usage:
 *   const { can, canAll, canAny, role, permissions } = usePermissions();
 *   if (can(PERMISSIONS.REFRESH_STOCKS)) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role?.name ?? user?.data?.role?.name ?? null;
  const permissions = useMemo(() => getPermissionsForRole(role), [role]);

  const can = useMemo(
    () => (permission) => permissions.has(permission),
    [permissions],
  );

  const canAll = useMemo(
    () => (permissionList) => permissionList.every((p) => permissions.has(p)),
    [permissions],
  );

  const canAny = useMemo(
    () => (permissionList) => permissionList.some((p) => permissions.has(p)),
    [permissions],
  );

  return {
    role,
    permissions,
    can,
    canAll,
    canAny,
  };
}
