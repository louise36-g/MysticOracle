/**
 * Invoice Service
 * Generates French-compliant invoices for credit purchases
 * Auto-entrepreneur with TVA exemption (art. 293 B du CGI)
 */

import prisma from '../db/prisma.js';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;

  // Seller (La Petite Voie)
  seller: {
    name: string;
    address: string;
    siret: string;
    email: string;
  };

  // Buyer
  buyer: {
    email: string;
    username: string;
  };

  // Transaction details
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  // Totals
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  tvaExempt: boolean;
  tvaExemptText: string;

  // Payment reference
  paymentProvider: string;
  paymentId: string;
  currency: string;
}

class InvoiceService {
  private readonly seller = {
    name: 'La Petite Voie',
    address: '7 rue Beauregard, 77171 Chalautre la Grande, France',
    siret: '92357809000014',
    email: 'contact@celestiarcana.com',
  };

  /**
   * Generate invoice number in format: MO-YYYY-XXXXX
   * where XXXXX is a sequential number for the year
   */
  private async generateInvoiceNumber(transactionId: string, createdAt: Date): Promise<string> {
    const year = createdAt.getFullYear();

    // Count transactions before this one in the same year
    const count = await prisma.transaction.count({
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: createdAt,
        },
      },
    });

    // Sequence starts at 1
    const sequence = (count + 1).toString().padStart(5, '0');
    return `MO-${year}-${sequence}`;
  }

  /**
   * Get invoice data for a transaction
   */
  async getInvoiceData(transactionId: string, userId: string): Promise<InvoiceData | null> {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!transaction || !transaction.paymentAmount) {
      return null;
    }

    const invoiceNumber = await this.generateInvoiceNumber(transactionId, transaction.createdAt);
    const amount = Number(transaction.paymentAmount);
    const credits = transaction.amount;

    // Calculate unit price per credit
    const unitPrice = amount / credits;

    return {
      invoiceNumber,
      invoiceDate: transaction.createdAt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),

      seller: this.seller,

      buyer: {
        email: transaction.user.email,
        username: transaction.user.username,
      },

      items: [
        {
          description: transaction.description,
          quantity: credits,
          unitPrice: Math.round(unitPrice * 100) / 100,
          total: amount,
        },
      ],

      subtotal: amount,
      tvaRate: 0,
      tvaAmount: 0,
      total: amount,
      tvaExempt: true,
      tvaExemptText: 'TVA non applicable, art. 293 B du CGI',

      paymentProvider: transaction.paymentProvider || 'Unknown',
      paymentId: transaction.paymentId || 'N/A',
      currency: transaction.currency || 'EUR',
    };
  }

  /**
   * Generate HTML invoice
   */
  async generateInvoiceHtml(
    transactionId: string,
    userId: string,
    language: 'en' | 'fr' = 'fr'
  ): Promise<string | null> {
    const data = await this.getInvoiceData(transactionId, userId);
    if (!data) return null;

    const labels =
      language === 'fr'
        ? {
            title: 'FACTURE',
            invoiceNumber: 'Facture N°',
            date: 'Date',
            seller: 'Vendeur',
            buyer: 'Client',
            description: 'Description',
            quantity: 'Quantité',
            unitPrice: 'Prix unitaire',
            total: 'Total',
            subtotal: 'Sous-total',
            tva: 'TVA',
            totalDue: 'Total à payer',
            paymentRef: 'Référence de paiement',
            paidVia: 'Payé via',
            siret: 'SIRET',
            credits: 'crédits',
          }
        : {
            title: 'INVOICE',
            invoiceNumber: 'Invoice No.',
            date: 'Date',
            seller: 'Seller',
            buyer: 'Customer',
            description: 'Description',
            quantity: 'Quantity',
            unitPrice: 'Unit Price',
            total: 'Total',
            subtotal: 'Subtotal',
            tva: 'VAT',
            totalDue: 'Total Due',
            paymentRef: 'Payment Reference',
            paidVia: 'Paid via',
            siret: 'SIRET',
            credits: 'credits',
          };

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title} ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 28px;
      color: #6366f1;
      margin-bottom: 5px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .party {
      width: 45%;
    }
    .party h3 {
      color: #6366f1;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .party p {
      margin: 5px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #6366f1;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 14px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .totals {
      width: 300px;
      margin-left: auto;
    }
    .totals table {
      margin-bottom: 0;
    }
    .totals td {
      padding: 8px 12px;
    }
    .totals .total-row {
      font-weight: bold;
      font-size: 16px;
      background: #f3f4f6;
    }
    .tva-notice {
      margin-top: 30px;
      padding: 15px;
      background: #fef3c7;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }
    .payment-info {
      margin-top: 30px;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 13px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔮 CelestiArcana</div>
    <div class="invoice-title">
      <h1>${labels.title}</h1>
      <p class="invoice-number">${labels.invoiceNumber} ${data.invoiceNumber}</p>
      <p class="invoice-number">${labels.date}: ${data.invoiceDate}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>${labels.seller}</h3>
      <p><strong>${data.seller.name}</strong></p>
      <p>${data.seller.address}</p>
      <p>${labels.siret}: ${data.seller.siret}</p>
      <p>${data.seller.email}</p>
    </div>
    <div class="party">
      <h3>${labels.buyer}</h3>
      <p><strong>${data.buyer.username}</strong></p>
      <p>${data.buyer.email}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${labels.description}</th>
        <th style="text-align: center;">${labels.quantity}</th>
        <th style="text-align: right;">${labels.unitPrice}</th>
        <th style="text-align: right;">${labels.total}</th>
      </tr>
    </thead>
    <tbody>
      ${data.items
        .map(
          item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity} ${labels.credits}</td>
          <td style="text-align: right;">${item.unitPrice.toFixed(2)} €</td>
          <td style="text-align: right;">${item.total.toFixed(2)} €</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>${labels.subtotal}</td>
        <td style="text-align: right;">${data.subtotal.toFixed(2)} €</td>
      </tr>
      <tr>
        <td>${labels.tva}</td>
        <td style="text-align: right;">N/A</td>
      </tr>
      <tr class="total-row">
        <td>${labels.totalDue}</td>
        <td style="text-align: right;">${data.total.toFixed(2)} €</td>
      </tr>
    </table>
  </div>

  <div class="tva-notice">
    <strong>${data.tvaExemptText}</strong>
  </div>

  <div class="payment-info">
    <p><strong>${labels.paidVia}:</strong> ${data.paymentProvider}</p>
    <p><strong>${labels.paymentRef}:</strong> ${data.paymentId}</p>
  </div>

  <div class="footer">
    <p>${data.seller.name} - ${data.seller.address}</p>
    <p>${labels.siret}: ${data.seller.siret}</p>
  </div>
</body>
</html>
    `.trim();
  }
}

export const invoiceService = new InvoiceService();
