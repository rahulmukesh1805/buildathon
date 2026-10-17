/**
 * CivicFix AI — Data Export & Municipal Briefing Utilities
 */

/**
 * Exports current incident list to downloadable CSV
 */
export function exportIncidentsToCSV(incidents, filename = `civicfix_incidents_${new Date().toISOString().slice(0, 10)}.csv`) {
  if (!incidents || incidents.length === 0) {
    alert('No incident records to export.');
    return;
  }

  const headers = [
    'Tracking Token',
    'Title',
    'Category',
    'Severity',
    'Status',
    'Address',
    'Landmark',
    'Latitude',
    'Longitude',
    'Assigned Crew',
    'Reporter Name',
    'Reporter Contact',
    'AI Priority Assessment',
    'Created At',
    'Resolved At',
    'Resolution Notes'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = incidents.map(inc => [
    escapeCSV(inc.tracking_token),
    escapeCSV(inc.title),
    escapeCSV(inc.category),
    escapeCSV(inc.severity),
    escapeCSV(inc.status),
    escapeCSV(inc.address),
    escapeCSV(inc.landmark || 'N/A'),
    escapeCSV(inc.latitude || ''),
    escapeCSV(inc.longitude || ''),
    escapeCSV(inc.assigned_crew_name || 'Unassigned'),
    escapeCSV(inc.reporter_name || 'Anonymous'),
    escapeCSV(inc.reporter_contact || 'Confidential'),
    escapeCSV(inc.ai_priority_suggestion || 'Standard'),
    escapeCSV(new Date(inc.created_at).toLocaleString()),
    escapeCSV(inc.resolved_at ? new Date(inc.resolved_at).toLocaleString() : 'Pending'),
    escapeCSV(inc.resolution_notes || 'None')
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a dedicated printable municipal summary document
 */
export function printMunicipalBriefing(incidents) {
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    window.print();
    return;
  }

  const criticals = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved');
  const inProgress = incidents.filter(i => i.status === 'in_progress');
  const resolved = incidents.filter(i => i.status === 'resolved');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CivicFix AI — Municipal Infrastructure Operations Briefing</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 32px; line-height: 1.4; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: 800; color: #0b132b; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .critical { background: #fee2e2; color: #991b1b; }
          .medium { background: #fef3c7; color: #92400e; }
          .resolved { background: #d1fae5; color: #065f46; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .kpi-num { font-size: 22px; font-weight: 800; color: #0b132b; margin-top: 4px; }
          .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .token { font-weight: 700; color: #0d9488; font-variant-numeric: tabular-nums; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; } /* taste-skill-ignore: print document rule */
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">CivicFix AI — Municipal Hazard Operations Briefing</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleString()} | Official Municipal Operational Audit</div>
          </div>
          <button onclick="window.print()" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Print / Save PDF
          </button>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Logged Incidents</div>
            <div class="kpi-num">${incidents.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Critical Active Risks</div>
            <div class="kpi-num" style="color: #dc2626;">${criticals.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Field Crews Active</div>
            <div class="kpi-num" style="color: #d97706;">${inProgress.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Resolved Hazards</div>
            <div class="kpi-num" style="color: #059669;">${resolved.length}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; color: #0b132b;">Active Hazard Log</h3>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Hazard & Location</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned Crew</th>
            </tr>
          </thead>
          <tbody>
            ${incidents.map(inc => `
              <tr>
                <td class="token">#${inc.tracking_token}</td>
                <td>
                  <strong>${inc.title}</strong><br/>
                  <span style="color: #64748b;">${inc.address}${inc.landmark ? ` (${inc.landmark})` : ''}</span>
                </td>
                <td>${inc.category.replace('_', ' ')}</td>
                <td><span class="badge ${inc.severity}">${inc.severity}</span></td>
                <td>${inc.status.replace('_', ' ')}</td>
                <td>${inc.assigned_crew_name || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Municipal Infrastructure Operations & Dispatch Protocol • CivicFix AI</div>
          <div>Confidential — For Authorized Municipal Dispatch Personnel</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
