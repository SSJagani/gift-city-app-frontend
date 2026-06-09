import { Outlet } from "react-router-dom";
import { TrendingUp } from "lucide-react";

export default function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-mark">
          <TrendingUp size={34} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Weekly Trade Planner</p>
          <h1>GIFT CITY</h1>
          <p>
            Secure access for stock selection, Saturday inputs, weekly trade
            sheets, reports, and admin workflows.
          </p>
        </div>
        <div className="brand-preview" aria-hidden="true">
          <div className="preview-row strong" />
          <div className="preview-row" />
          <div className="preview-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
      <section className="auth-card">
        <Outlet />
      </section>
    </main>
  );
}
