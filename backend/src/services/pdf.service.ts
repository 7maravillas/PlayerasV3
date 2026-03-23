// backend/src/services/pdf.service.ts
import PDFDocument from 'pdfkit';

interface OrderItem {
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  isPersonalized?: boolean;
  customName?: string | null;
  customNumber?: string | null;
}

interface OrderData {
  orderNumber: string;
  createdAt: Date | string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  reference?: string | null;
  shippingMethod: string;
  shippingCents: number;
  subtotalCents: number;
  totalCents: number;
  trackingNumber?: string | null;
  items: OrderItem[];
}

// ─── helpers ───────────────────────────────────────────────────────────────────
const GOLD   = '#C9993A';
const BLACK  = '#111111';
const GRAY   = '#6B7280';
const LIGHT  = '#F5F5F5';
const BORDER = '#E5E7EB';
const WHITE  = '#FFFFFF';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID:            'Pagado',
  PROCESSING:      'En proceso',
  SHIPPED:         'Enviado',
  DELIVERED:       'Entregado',
  CANCELLED:       'Cancelado',
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Envuelve la generación en una Promise para esperar correctamente a doc.end() */
function buildPDF(draw: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    doc.end();
  });
}

// ─── PDF de una sola orden ─────────────────────────────────────────────────────
export function generateOrderPDF(order: OrderData): Promise<Buffer> {
  return buildPDF((doc) => {
    const W = doc.page.width;

    // Barra dorada superior
    doc.rect(0, 0, W, 6).fill(GOLD);

    // ── Header ──
    doc.font('Helvetica-Bold').fontSize(22).fillColor(BLACK).text('PLayera', 50, 22);
    doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('Jerseys Oficiales de Fútbol', 50, 47);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(GOLD)
      .text(order.orderNumber, 0, 22, { align: 'right', width: W - 50 });
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(`Fecha: ${fmtDate(order.createdAt)}`, 0, 42, { align: 'right', width: W - 50 })
      .text(`Estado: ${STATUS_LABEL[order.status] ?? order.status}`, 0, 54, { align: 'right', width: W - 50 });

    doc.moveTo(50, 75).lineTo(W - 50, 75).strokeColor(BORDER).lineWidth(1).stroke();

    // ── Datos del cliente / dirección ──
    const infoY = 88;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY).text('CLIENTE', 50, infoY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
      .text(`${order.firstName} ${order.lastName}`, 50, infoY + 13);
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(order.email, 50, infoY + 26)
      .text(order.phone, 50, infoY + 38);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY).text('ENVIAR A', 310, infoY);
    doc.font('Helvetica').fontSize(9).fillColor(BLACK)
      .text(order.address, 310, infoY + 13)
      .text(`${order.city}, ${order.state} ${order.zipCode}`, 310, infoY + 25)
      .text(order.country, 310, infoY + 37);
    if (order.reference) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(`Ref: ${order.reference}`, 310, infoY + 49);
    }

    const shipLabel = order.shippingMethod === 'EXPRESS'
      ? 'Express DHL (1-3 días)' : 'Estándar (3-7 días)';
    const shipInfoY = infoY + (order.reference ? 62 : 55);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY).text('ENVÍO', 310, shipInfoY);
    doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(shipLabel, 310, shipInfoY + 12);
    if (order.trackingNumber) {
      doc.font('Helvetica').fontSize(9).fillColor(GOLD)
        .text(`Tracking: ${order.trackingNumber}`, 310, shipInfoY + 24);
    }

    // ── Tabla de productos ──
    const tableTop = infoY + 100;
    const cols = { name: 50, size: 300, color: 355, qty: 415, unit: 445, total: 505 };

    // Cabecera
    doc.rect(50, tableTop, W - 100, 20).fill(BLACK);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE);
    doc.text('PRODUCTO',    cols.name  + 4, tableTop + 6);
    doc.text('TALLA',       cols.size  + 4, tableTop + 6);
    doc.text('COLOR',       cols.color + 4, tableTop + 6);
    doc.text('QTY',         cols.qty,       tableTop + 6, { width: 25, align: 'right' });
    doc.text('PRECIO U.',   cols.unit,      tableTop + 6, { width: 55, align: 'right' });
    doc.text('TOTAL',       cols.total,     tableTop + 6, { width: 45, align: 'right' });

    let rowY = tableTop + 20;
    order.items.forEach((item, idx) => {
      const hasCustom = item.isPersonalized && item.customName;
      const rowH = hasCustom ? 28 : 20;
      if (idx % 2 === 0) doc.rect(50, rowY, W - 100, rowH).fill(LIGHT);

      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
        .text(item.productName, cols.name + 4, rowY + 6, { width: 245, ellipsis: true });
      if (hasCustom) {
        doc.font('Helvetica').fontSize(7).fillColor(GOLD)
          .text(`✦ ${item.customName} #${item.customNumber ?? ''}`, cols.name + 4, rowY + 17, { width: 245 });
      }
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(item.variantSize ?? '—',  cols.size  + 4, rowY + 6)
        .text(item.variantColor ?? '—', cols.color + 4, rowY + 6);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
        .text(String(item.quantity), cols.qty, rowY + 6, { width: 25, align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(fmt(item.unitPriceCents), cols.unit, rowY + 6, { width: 55, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
        .text(fmt(item.totalCents), cols.total, rowY + 6, { width: 45, align: 'right' });
      rowY += rowH;
    });

    doc.moveTo(50, rowY).lineTo(W - 50, rowY).strokeColor(BORDER).lineWidth(0.5).stroke();

    // ── Totales ──
    const tX = W - 200;
    rowY += 10;
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text('Subtotal:', tX, rowY)
      .text(fmt(order.subtotalCents), tX + 80, rowY, { width: 70, align: 'right' });
    rowY += 15;
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text('Envío:', tX, rowY)
      .text(order.shippingCents === 0 ? 'Gratis' : fmt(order.shippingCents), tX + 80, rowY, { width: 70, align: 'right' });
    rowY += 12;
    doc.moveTo(tX, rowY).lineTo(W - 50, rowY).strokeColor(BORDER).lineWidth(0.5).stroke();
    rowY += 8;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK)
      .text('TOTAL:', tX, rowY)
      .text(fmt(order.totalCents), tX + 80, rowY, { width: 70, align: 'right' });

    // ── Footer ──
    const fY = doc.page.height - 55;
    doc.rect(0, fY, W, 1).fill(BORDER);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
      .text('Gracias por tu compra • PLayera — Jerseys Oficiales de Fútbol', 50, fY + 10, { align: 'center', width: W - 100 })
      .text('Soporte: hola@playera.mx', 50, fY + 22, { align: 'center', width: W - 100 });
  });
}

// ─── PDF de reporte (múltiples órdenes en un período) ─────────────────────────
export interface ReportOrder {
  orderNumber: string;
  createdAt:   Date | string;
  status:      string;
  firstName:   string;
  lastName:    string;
  email:       string;
  totalCents:  number;
  shippingCents: number;
  subtotalCents: number;
  items:       { productName: string; quantity: number; totalCents: number }[];
}

export function generateReportPDF(
  orders: ReportOrder[],
  from: string,
  to: string,
): Promise<Buffer> {
  return buildPDF((doc) => {
    const W = doc.page.width;

    const totalRevenue  = orders.reduce((s, o) => s + o.totalCents, 0);
    const totalShipping = orders.reduce((s, o) => s + o.shippingCents, 0);
    const totalOrders   = orders.length;

    // ── Portada / Header ──
    doc.rect(0, 0, W, 6).fill(GOLD);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(BLACK).text('PLayera', 50, 22);
    doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('Reporte de ventas', 50, 47);

    const period = `${new Date(from).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })} — ${new Date(to).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })}`;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD)
      .text(period, 0, 30, { align: 'right', width: W - 50 });
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(`Generado: ${fmtDate(new Date())}`, 0, 47, { align: 'right', width: W - 50 });

    doc.moveTo(50, 68).lineTo(W - 50, 68).strokeColor(BORDER).lineWidth(1).stroke();

    // ── Resumen ──
    const summaryY = 80;
    const cards = [
      { label: 'Órdenes',   value: String(totalOrders) },
      { label: 'Ingresos',  value: fmt(totalRevenue) },
      { label: 'Envíos',    value: fmt(totalShipping) },
      { label: 'Promedio',  value: totalOrders ? fmt(Math.round(totalRevenue / totalOrders)) : '$0' },
    ];
    const cardW = (W - 100) / 4 - 6;
    cards.forEach((card, i) => {
      const cx = 50 + i * (cardW + 8);
      doc.rect(cx, summaryY, cardW, 48).fill(LIGHT);
      doc.font('Helvetica-Bold').fontSize(7).fillColor(GRAY)
        .text(card.label.toUpperCase(), cx + 8, summaryY + 8, { width: cardW - 16 });
      doc.font('Helvetica-Bold').fontSize(13).fillColor(BLACK)
        .text(card.value, cx + 8, summaryY + 20, { width: cardW - 16 });
    });

    // ── Tabla de órdenes ──
    const tableTop = summaryY + 65;
    const cols = { num: 50, date: 140, client: 220, items: 340, status: 390, total: 470 };

    // Cabecera
    doc.rect(50, tableTop, W - 100, 20).fill(BLACK);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE);
    doc.text('# ORDEN',  cols.num  + 4, tableTop + 6);
    doc.text('FECHA',    cols.date + 4, tableTop + 6);
    doc.text('CLIENTE',  cols.client + 4, tableTop + 6);
    doc.text('ITEMS',    cols.items + 4, tableTop + 6, { width: 45, align: 'right' });
    doc.text('ESTADO',   cols.status + 4, tableTop + 6);
    doc.text('TOTAL',    cols.total + 4, tableTop + 6, { width: W - 50 - cols.total - 4, align: 'right' });

    let rowY = tableTop + 20;
    const ROW_H = 18;

    orders.forEach((order, idx) => {
      // Nueva página si no hay espacio
      if (rowY + ROW_H > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
        // Re-dibujar cabecera en nueva página
        doc.rect(50, rowY, W - 100, 20).fill(BLACK);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE);
        doc.text('# ORDEN',  cols.num  + 4, rowY + 6);
        doc.text('FECHA',    cols.date + 4, rowY + 6);
        doc.text('CLIENTE',  cols.client + 4, rowY + 6);
        doc.text('ITEMS',    cols.items + 4, rowY + 6, { width: 45, align: 'right' });
        doc.text('ESTADO',   cols.status + 4, rowY + 6);
        doc.text('TOTAL',    cols.total + 4, rowY + 6, { width: W - 50 - cols.total - 4, align: 'right' });
        rowY += 20;
      }

      if (idx % 2 === 0) doc.rect(50, rowY, W - 100, ROW_H).fill(LIGHT);

      const totalItems = order.items.reduce((s, it) => s + it.quantity, 0);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD)
        .text(order.orderNumber, cols.num + 4, rowY + 5, { width: 88 });
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(new Date(order.createdAt).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit' }), cols.date + 4, rowY + 5);
      doc.font('Helvetica').fontSize(8).fillColor(BLACK)
        .text(`${order.firstName} ${order.lastName}`, cols.client + 4, rowY + 5, { width: 115, ellipsis: true });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
        .text(String(totalItems), cols.items + 4, rowY + 5, { width: 45, align: 'right' });
      doc.font('Helvetica').fontSize(7.5).fillColor(GRAY)
        .text(STATUS_LABEL[order.status] ?? order.status, cols.status + 4, rowY + 5, { width: 78 });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
        .text(fmt(order.totalCents), cols.total + 4, rowY + 5, { width: W - 50 - cols.total - 4, align: 'right' });

      rowY += ROW_H;
    });

    doc.moveTo(50, rowY).lineTo(W - 50, rowY).strokeColor(BORDER).lineWidth(0.5).stroke();

    // Total final
    rowY += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK)
      .text(`TOTAL DEL PERÍODO:`, cols.num + 4, rowY)
      .text(fmt(totalRevenue), cols.total + 4, rowY, { width: W - 50 - cols.total - 4, align: 'right' });

    // ── Footer ──
    const fY = doc.page.height - 50;
    doc.rect(0, fY, W, 1).fill(BORDER);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
      .text('PLayera — Reporte generado automáticamente', 50, fY + 10, { align: 'center', width: W - 100 });
  });
}
