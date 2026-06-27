import { CalendarDays } from "lucide-react";

export default function WeeklySheetsPage() {
  return (
    <div className="page-content">
      <div className="page-hero">
        <CalendarDays size={36} className="page-hero-icon" aria-hidden="true" />
        <div>
          <h2>Weekly Sheets</h2>
          <p>Manage and review weekly trade input sheets.</p>
        </div>
      </div>
      <div className="panel placeholder-panel">
        <p>Weekly sheet data will appear here.</p>
      </div>
    </div>
  );
}
