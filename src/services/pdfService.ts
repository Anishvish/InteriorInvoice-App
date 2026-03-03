// ==========================================
// PDF Service - Invoice PDF Generation
// ==========================================

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { InvoiceWithItems } from '../models/types';
import { Company } from '../models/types';
import { formatCurrency } from '../utils/calculator';

function buildInvoiceHTML(invoice: InvoiceWithItems, company: Company): string {
  const isGST = company.hasGST;
  const title = isGST ? 'TAX INVOICE' : 'INVOICE';

  const itemRows = invoice.items
    .map(
      (item, index) => `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td>${item.description}</td>
        <td style="text-align:center;">${item.calculationMode}</td>
        <td style="text-align:center;">${item.calculationMode === 'AREA'
          ? `${item.lengthFeet}'${item.lengthInches}" × ${item.widthFeet}'${item.widthInches}"`
          : '-'
        }</td>
        <td style="text-align:right;">${item.calculationMode === 'AREA' ? item.area.toFixed(2) : '-'}</td>
        <td style="text-align:right;">${item.quantity}</td>
        <td style="text-align:right;">${formatCurrency(item.rate)}</td>
        <td style="text-align:right;">${formatCurrency(item.lineTotal)}</td>
      </tr>`
    )
    .join('');

  const gstSection = isGST
    ? `
      <tr>
        <td colspan="6"></td>
        <td style="text-align:right; font-weight:500;">GST (${invoice.gstPercent}%)</td>
        <td style="text-align:right;">${formatCurrency(invoice.gstAmount)}</td>
      </tr>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; padding: 30px; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6C63FF; padding-bottom: 20px; margin-bottom: 20px; }
        .company-info h1 { color: #6C63FF; font-size: 24px; margin-bottom: 4px; }
        .company-info p { color: #5C5C7A; font-size: 12px; line-height: 1.6; }
        .invoice-title { text-align: center; font-size: 22px; font-weight: 700; color: #6C63FF; margin: 15px 0; letter-spacing: 2px; }
        .meta-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .meta-box { background: #F8F9FE; padding: 12px 16px; border-radius: 8px; flex: 1; margin: 0 5px; }
        .meta-box h3 { color: #6C63FF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .meta-box p { font-size: 12px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        thead th { background: #6C63FF; color: white; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        tbody td { padding: 10px 8px; border-bottom: 1px solid #E8E8F0; font-size: 12px; }
        tbody tr:nth-child(even) { background: #FAFAFF; }
        .totals-section { margin-top: 10px; display: flex; justify-content: flex-end; }
        .totals-table { width: 320px; }
        .totals-table td { padding: 8px 12px; font-size: 13px; }
        .totals-table .grand-total td { font-size: 16px; font-weight: 700; color: #6C63FF; border-top: 2px solid #6C63FF; border-bottom: 2px solid #6C63FF; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature-box { text-align: center; }
        .signature-line { width: 200px; border-top: 1px solid #1a1a2e; margin-top: 60px; padding-top: 5px; font-size: 11px; color: #5C5C7A; }
        .thank-you { text-align: center; margin-top: 30px; color: #6C63FF; font-size: 14px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${company.companyName}</h1>
          <p>${company.ownerName ? company.ownerName + '<br>' : ''}
          ${company.address ? company.address + '<br>' : ''}
          ${company.phone ? 'Phone: ' + company.phone : ''}
          ${isGST && company.gstNumber ? '<br>GSTIN: ' + company.gstNumber : ''}</p>
        </div>
      </div>

      <div class="invoice-title">${title}</div>

      <div class="meta-section">
        <div class="meta-box">
          <h3>Invoice Details</h3>
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
          <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div class="meta-box">
          <h3>Bill To</h3>
          <p><strong>${invoice.clientName}</strong><br>
          ${invoice.clientAddress ? invoice.clientAddress + '<br>' : ''}
          ${invoice.clientPhone ? 'Phone: ' + invoice.clientPhone : ''}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th style="text-align:left;">Description</th>
            <th style="width:60px;">Mode</th>
            <th style="width:100px;">Size</th>
            <th style="width:70px;">Area</th>
            <th style="width:50px;">Qty</th>
            <th style="width:80px;">Rate</th>
            <th style="width:90px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td style="text-align:right; font-weight:500;">Subtotal</td>
            <td style="text-align:right;">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          ${gstSection}
          <tr class="grand-total">
            <td style="text-align:right;">Grand Total</td>
            <td style="text-align:right;">${formatCurrency(invoice.grandTotal)}</td>
          </tr>
          <tr>
            <td style="text-align:right; font-weight:500;">Advance Paid</td>
            <td style="text-align:right;">${formatCurrency(invoice.advance)}</td>
          </tr>
          <tr>
            <td style="text-align:right; font-weight:600; color: ${invoice.balance > 0 ? '#E53935' : '#4CAF50'};">Balance Due</td>
            <td style="text-align:right; font-weight:600; color: ${invoice.balance > 0 ? '#E53935' : '#4CAF50'};">${formatCurrency(invoice.balance)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <div></div>
        <div class="signature-box">
          <div class="signature-line">Authorized Signature</div>
        </div>
      </div>

      <div class="thank-you">Thank you for your business!</div>
    </body>
    </html>
  `;
}

export async function generatePDF(
  invoice: InvoiceWithItems,
  company: Company
): Promise<string> {
  const html = buildInvoiceHTML(invoice, company);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function sharePDF(
  invoice: InvoiceWithItems,
  company: Company
): Promise<void> {
  const uri = await generatePDF(invoice, company);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice ${invoice.invoiceNumber}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function previewPDF(
  invoice: InvoiceWithItems,
  company: Company
): Promise<void> {
  const html = buildInvoiceHTML(invoice, company);
  await Print.printAsync({ html });
}
