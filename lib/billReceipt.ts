import type { CafeProfile, GSTConfig, OrderBill } from '../types/cms';
import { formatInr } from './format';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildBillHtml(bill: OrderBill, cafe: CafeProfile, gst: GSTConfig) {
  const rows = bill.items
    .map((item) => {
      const portion = item.portion === 'HALF' ? 'Half' : 'Full';
      const lineTotal = formatInr(item.unitPrice * item.quantity);
      return `<tr>
        <td>${escapeHtml(item.name)} (${portion})</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatInr(item.unitPrice)}</td>
        <td style="text-align:right">${lineTotal}</td>
      </tr>`;
    })
    .join('');

  const paidAt = new Date(bill.settledAt).toLocaleString('en-IN');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(bill.billNumber)}</title>
    <style>
      body { font-family: -apple-system, Segoe UI, sans-serif; color: #4B3832; padding: 24px; background: #FFFDF7; }
      h1 { margin: 0 0 4px; font-size: 22px; }
      p { margin: 0 0 6px; color: #4B3832; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #F5E6CA; padding: 8px 4px; font-size: 13px; }
      th { text-align: left; color: #4B3832; }
      .totals { margin-top: 16px; width: 100%; }
      .totals td { border: none; padding: 4px 0; }
      .grand { font-weight: 800; font-size: 16px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(cafe.name)}</h1>
    <p>${escapeHtml(cafe.address)}, ${escapeHtml(cafe.city)}</p>
    <p>Phone ${escapeHtml(cafe.phone)} · ${escapeHtml(cafe.email)}</p>
    ${gst.enabled ? `<p>GSTIN ${escapeHtml(gst.gstin)}</p>` : ''}
    <p><strong>${escapeHtml(bill.billNumber)}</strong> · ${escapeHtml(bill.tableName)} · ${paidAt}</p>
    <p>Paid by ${bill.paymentMethod}</p>
    <table>
      <thead>
        <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">${formatInr(bill.subtotal)}</td></tr>
      <tr><td>CGST</td><td style="text-align:right">${formatInr(bill.cgstAmount)}</td></tr>
      <tr><td>SGST</td><td style="text-align:right">${formatInr(bill.sgstAmount)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">${formatInr(bill.total)}</td></tr>
    </table>
    <p style="margin-top:24px">Thank you for visiting ${escapeHtml(cafe.name)}.</p>
  </body>
</html>`;
}
