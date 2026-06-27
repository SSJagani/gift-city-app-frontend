import { usePermissions } from "./usePermissions.js";

/**
 * <PermissionGate>
 *
 * Declaratively show/hide UI based on the current user's permissions.
 *
 * Props:
 *   permission   {string}   – single permission key (uses can())
 *   permissions  {string[]} – array; combined with `require`
 *   require      {"all"|"any"} – default "all"
 *   fallback     {ReactNode}  – what to render when access is denied (default: null)
 *   children     {ReactNode}
 *
 * Examples:
 *   <PermissionGate permission={PERMISSIONS.REFRESH_STOCKS}>
 *     <RefreshButton />
 *   </PermissionGate>
 *
 *   <PermissionGate permissions={[PERMISSIONS.MANAGE_USERS]} fallback={<Forbidden />}>
 *     <UserManagementPage />
 *   </PermissionGate>
 */
export default function PermissionGate({
  permission,
  permissions,
  require = "all",
  fallback = null,
  children,
}) {
  const { can, canAll, canAny } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = require === "any" ? canAny(permissions) : canAll(permissions);
  } else {
    // No permission specified — render children by default
    allowed = true;
  }

  return allowed ? children : fallback;
}
