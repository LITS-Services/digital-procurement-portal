import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  printFormattedDocument(title: string, contentHtml: string): void {
    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (!printWindow) {
      alert('Please allow popups for downloading/printing PDF documents.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 24px;
              font-size: 12px;
              line-height: 1.45;
              background: #ffffff;
            }
            @media screen {
              body {
                background: #f1f5f9;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 24px 12px;
              }
              .document-wrapper {
                background: #ffffff;
                width: 210mm;
                min-height: 297mm;
                padding: 18mm 20mm;
                border-radius: 8px;
                box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
              }
            }
            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }
              .document-wrapper {
                width: 100%;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
              }
              .print-btn-bar {
                display: none !important;
              }
              tr {
                page-break-inside: avoid;
              }
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }
            .header-bar h1, .header-bar h2 {
              margin: 0 0 4px 0;
              font-size: 22px;
              color: #1e3a8a;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.6px;
            }
            .header-bar .subtitle, .header-bar p {
              margin: 0;
              font-size: 13px;
              color: #475569;
              font-weight: 600;
            }
            .header-bar .meta-box, .header-bar .meta-info {
              text-align: right;
            }
            .header-bar .doc-number {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.3px;
            }
            .header-bar .doc-date {
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
              margin-top: 2px;
            }
            .status-badge {
              display: inline-block;
              padding: 3px 12px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .status-paid, .status-approved, .status-completed {
              background: #dcfce7;
              color: #15803d;
              border: 1px solid #86efac;
            }
            .status-pending, .status-inprogress, .status-submitted {
              background: #fef3c7;
              color: #b45309;
              border: 1px solid #fde68a;
            }
            .status-rejected, .status-cancelled {
              background: #fee2e2;
              color: #b91c1c;
              border: 1px solid #fecaca;
            }
            .status-draft, .status-open {
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #cbd5e1;
            }
            .purpose-banner {
              background: #f8fafc;
              border-left: 3.5px solid #2563eb;
              padding: 8px 12px;
              margin-bottom: 16px;
              border-radius: 0 6px 6px 0;
              font-size: 11.5px;
              display: flex;
              align-items: baseline;
              gap: 8px;
            }
            .purpose-banner .purpose-label {
              font-weight: 700;
              color: #1e3a8a;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.4px;
              flex-shrink: 0;
            }
            .purpose-banner .purpose-text {
              color: #334155;
              font-weight: 500;
            }
            /* Modern Card Deck (3 Columns or 2 Columns) */
            .info-cards {
              display: grid;
              gap: 14px;
              margin-bottom: 20px;
            }
            .info-cards-3 {
              grid-template-columns: repeat(3, 1fr);
            }
            .info-cards-2 {
              grid-template-columns: repeat(2, 1fr);
            }
            .info-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            .info-card-header {
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
              padding: 6px 10px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #1e3a8a;
            }
            .info-card-body {
              padding: 8px 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 4px 0;
              border-bottom: 1px solid #f1f5f9;
              font-size: 11px;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-row .info-label {
              font-size: 9.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-right: 6px;
              flex-shrink: 0;
            }
            .info-row .info-value {
              font-size: 11px;
              font-weight: 600;
              color: #0f172a;
              text-align: right;
              word-break: break-word;
            }
            /* Legacy Grid Fallback */
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px 14px;
              margin-bottom: 18px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #f8fafc;
              font-size: 11.5px;
            }
            .info-label {
              font-size: 10px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .info-value {
              font-size: 11.5px;
              font-weight: 600;
              color: #0f172a;
              text-align: right;
            }
            /* Data Table */
            table.data-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 12px;
              margin-bottom: 18px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            table.data-table thead th {
              background: #1e293b;
              color: #ffffff;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 8px 10px;
              border: none;
              text-align: left;
            }
            table.data-table tbody td {
              padding: 7px 10px;
              border-top: 1px solid #f1f5f9;
              font-size: 11.5px;
              color: #334155;
              vertical-align: middle;
            }
            table.data-table tbody tr:nth-child(even) td {
              background: #f8fafc;
            }
            .text-end { text-align: right !important; }
            .text-center { text-align: center !important; }
            /* Totals Section */
            .totals-box, .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
              margin-bottom: 22px;
            }
            .totals-card, table.totals-table {
              width: 290px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
            }
            .totals-row, table.totals-table tr {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 11.5px;
              color: #64748b;
            }
            .totals-row.grand-total, table.totals-table tr.grand-total {
              border-top: 1.5px solid #cbd5e1;
              margin-top: 6px;
              padding-top: 8px;
              font-weight: 700;
              font-size: 13px;
              color: #0f172a;
            }
            .totals-row.grand-total span:last-child, table.totals-table tr.grand-total td:last-child {
              color: #1e40af;
              font-size: 14px;
              font-weight: 800;
            }
            /* Signatures */
            .footer-section {
              margin-top: 30px;
              padding-top: 18px;
              border-top: 1px solid #e2e8f0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
              gap: 18px;
            }
            .signature-block {
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              border-radius: 6px;
              padding: 10px 12px;
              text-align: center;
            }
            .signature-block .signature-title {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              color: #475569;
            }
            .signature-line {
              border-bottom: 1.5px solid #94a3b8;
              margin: 28px auto 6px auto;
              width: 85%;
            }
            .signature-block .signature-name {
              font-size: 11px;
              font-weight: 600;
              color: #0f172a;
            }
            .signature-block .signature-role {
              font-size: 9.5px;
              color: #64748b;
            }
            .print-btn-bar {
              margin-bottom: 16px;
              padding: 10px 16px;
              background: #0f172a;
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
              width: 100%;
              max-width: 210mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .print-btn-title {
              color: #94a3b8;
              font-size: 12px;
              font-weight: 600;
            }
            .print-btn {
              background: #2563eb;
              color: #ffffff;
              border: none;
              padding: 7px 18px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 5px;
              cursor: pointer;
              transition: background 0.15s;
            }
            .print-btn:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <span class="print-btn-title">Procurement Portal &bull; Document Preview</span>
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="document-wrapper">
            ${contentHtml}
          </div>
          <script>
            setTimeout(() => { window.print(); }, 400);
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
