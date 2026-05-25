export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(13,148,136,0.35); }
    70%  { box-shadow: 0 0 0 10px rgba(13,148,136,0); }
    100% { box-shadow: 0 0 0 0 rgba(13,148,136,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .anim-fade-up  { animation: fadeUp  0.4s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-in  { animation: fadeIn  0.35s ease both; }
  .anim-slide-r  { animation: slideRight 0.35s cubic-bezier(.22,1,.36,1) both; }

  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.10s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.20s; }
  .stagger-5 { animation-delay: 0.25s; }

  .card-hover {
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(13,148,136,0.15) !important;
  }

  .btn-primary {
    background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(8,145,178,0.35);
    outline: none;
  }
  .btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(8,145,178,0.45); }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent;
    color: #0d9488;
    border: 1.5px solid rgba(13,148,136,0.35);
    border-radius: 10px;
    padding: 8px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    outline: none;
  }
  .btn-ghost:hover { background: rgba(13,148,136,0.07); border-color: #0d9488; }

  .btn-danger {
    background: transparent;
    color: #dc2626;
    border: 1.5px solid rgba(220,38,38,0.3);
    border-radius: 10px;
    padding: 8px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    outline: none;
  }
  .btn-danger:hover { background: #fef2f2; border-color: #dc2626; }

  .btn-success {
    background: transparent;
    color: #059669;
    border: 1.5px solid rgba(5,150,105,0.3);
    border-radius: 10px;
    padding: 8px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    outline: none;
  }
  .btn-success:hover { background: #f0fdf4; border-color: #059669; }

  .field {
    width: 100%;
    padding: 11px 15px;
    border: 1.5px solid rgba(13,148,136,0.2);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    color: #134e4a;
    background: #f8fefd;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13,148,136,0.12);
  }
  .field::placeholder { color: #94a3b8; }

  select.field { appearance: none; cursor: pointer; }

  .glass-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.7);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }

  .page-bg {
    min-height: 100vh;
    background: linear-gradient(160deg, #f0faf7 0%, #e8f4f8 50%, #f5f0ff 100%);
    font-family: 'DM Sans', sans-serif;
  }

  .page-header {
    background: linear-gradient(135deg, #0d9488 0%, #0891b2 60%, #6366f1 100%);
    padding: 20px 28px;
    color: white;
    box-shadow: 0 4px 20px rgba(13,148,136,0.3);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .status-Confirmed  { background: #dcfce7; color: #166534; }
  .status-Pending    { background: #fef9c3; color: #713f12; }
  .status-Completed  { background: #dbeafe; color: #1e40af; }
  .status-Cancelled  { background: #fee2e2; color: #991b1b; }
  .status-Rejected   { background: #fee2e2; color: #991b1b; }
  .status-Updated    { background: #f3e8ff; color: #6b21a8; }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: linear-gradient(90deg, #f0fdf9, #e0f2fe); }
  thead th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid rgba(13,148,136,0.15);
  }
  tbody tr {
    border-bottom: 1px solid rgba(13,148,136,0.08);
    transition: background 0.15s;
  }
  tbody tr:hover { background: rgba(13,148,136,0.03); }
  tbody td {
    padding: 13px 16px;
    font-size: 14px;
    color: #1e293b;
    vertical-align: middle;
  }
  tbody tr:last-child { border-bottom: none; }
`;

export const colors = {
  teal: '#0d9488',
  cyan: '#0891b2',
  indigo: '#6366f1',
  dark: '#134e4a',
  muted: '#64748b',
};