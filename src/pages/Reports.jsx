import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="page-content">
      <div className="page-hero">
        <BarChart3 size={36} className="page-hero-icon" aria-hidden="true" />
        <div>
          <h2>Reports</h2>
          <p>View weekly performance and trade summary reports.</p>
        </div>
      </div>
      <div className="panel placeholder-panel">
        <p>Reports and analytics will appear here.</p>
      </div>
    </div>
  );
}
