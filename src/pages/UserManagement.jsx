import { Users, ShieldCheck, UserRound } from "lucide-react";
import { ROLE_META } from "../permissions/index.js";

const DEMO_USERS = [
  { id: 1, name: "Arjun Shah",    email: "arjun@giftcity.in",  role: "super_admin" },
  { id: 2, name: "Priya Mehta",   email: "priya@giftcity.in",  role: "admin"       },
  { id: 3, name: "Rohan Desai",   email: "rohan@giftcity.in",  role: "analysis"    },
  { id: 4, name: "Sneha Patel",   email: "sneha@giftcity.in",  role: "client"      },
  { id: 5, name: "Vikram Nair",   email: "vikram@giftcity.in", role: "client"      },
];

export default function UserManagementPage() {
  return (
    <div className="page-content">
      <div className="page-hero">
        <Users size={36} className="page-hero-icon" aria-hidden="true" />
        <div>
          <h2>User Management</h2>
          <p>Manage team members, their roles, and access levels.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Team Members</h3>
            <p>{DEMO_USERS.length} users registered</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_USERS.map((u) => {
                const meta = ROLE_META[u.role] ?? { label: u.role, color: "#6b7280" };
                return (
                  <tr key={u.id}>
                    <td>
                      <span className="user-cell">
                        <UserRound size={16} aria-hidden="true" />
                        {u.name}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className="role-badge"
                        style={{ "--badge-color": meta.color }}
                      >
                        <ShieldCheck size={12} aria-hidden="true" />
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <span className="status-active">Active</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
