import { FileSpreadsheet } from "lucide-react";

export default function StockSelectionPage() {
  return (
    <div className="page-content">
      <div className="page-hero">
        <FileSpreadsheet size={36} className="page-hero-icon" aria-hidden="true" />
        <div>
          <h2>Stock Selection</h2>
          <p>Review and finalise stocks for this week's trade sheet.</p>
        </div>
      </div>
      <div className="panel placeholder-panel">
        <p>Stock selection workflow will appear here.</p>
      </div>
    </div>
  );
}
