import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

interface CompanyConfig {
  nombre: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  primaryColor: string;
}

const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  fenix: {
    nombre: 'Fénix Traveler',
    rfc: 'XAXX010101000',
    direccion: 'Morelia, Michoacán, México',
    telefono: '+52 443 123 4567',
    email: 'contacto@fenixtraveler.com',
    sitioWeb: 'www.fenixtraveler.com',
    primaryColor: '#3B82F6'
  },
  chroma: {
    nombre: 'Chroma Travel',
    rfc: 'XAXX010101000',
    direccion: 'Guadalajara, Jalisco, México',
    telefono: '+52 443 404 4104',
    email: 'contacto@chromatravel.online',
    sitioWeb: 'www.chromatravel.online',
    primaryColor: '#8C50DC'
  }
};

const OUTPUT_DIR = './documents';

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export interface ReceiptData {
  id: string;
  fechaPago: string;
  referencia: string;
  reservaId: string;
  metodoPago: string;
  monto: number;
  moneda: string;
}

export interface ClientData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export async function generateReceipt(
  datosPago: ReceiptData,
  cliente: ClientData,
  brandCode: string = 'chroma'
): Promise<string> {
  ensureOutputDir();
  
  const config = COMPANY_CONFIGS[brandCode] || COMPANY_CONFIGS.chroma;
  const filename = `recibo_${datosPago.id}_${Date.now()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    
    doc.pipe(stream);
    
    doc.fontSize(24).fillColor(config.primaryColor).text('RECIBO DE PAGO', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#333');
    doc.text(config.nombre, { align: 'center' });
    doc.text(`RFC: ${config.rfc}`, { align: 'center' });
    doc.text(config.direccion, { align: 'center' });
    doc.text(`Tel: ${config.telefono}`, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(10);
    doc.text(`Recibo No.: ${datosPago.id}`);
    doc.text(`Fecha: ${new Date(datosPago.fechaPago).toLocaleDateString('es-MX')}`);
    doc.text(`Referencia: ${datosPago.referencia}`);
    doc.moveDown();
    
    doc.fontSize(14).fillColor(config.primaryColor).text('DATOS DEL CLIENTE');
    doc.fontSize(10).fillColor('#333');
    doc.text(`Nombre: ${cliente.nombre} ${cliente.apellidos}`);
    doc.text(`Email: ${cliente.email}`);
    doc.text(`Teléfono: ${cliente.telefono}`);
    doc.moveDown();
    
    doc.fontSize(14).fillColor(config.primaryColor).text('DETALLE DEL PAGO');
    doc.fontSize(10).fillColor('#333');
    doc.text(`Reserva: ${datosPago.reservaId}`);
    doc.text(`Método de pago: ${datosPago.metodoPago}`);
    doc.moveDown();
    
    doc.fontSize(18).fillColor(config.primaryColor);
    doc.text(`TOTAL: $${datosPago.monto.toLocaleString()} ${datosPago.moneda}`, { align: 'right' });
    
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#666');
    doc.text('Este documento es un comprobante de pago. Para factura fiscal, solicítela dentro de los 30 días posteriores al pago.', { align: 'center' });
    
    doc.end();
    
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateProforma(
  reserva: any,
  cliente: ClientData,
  brandCode: string = 'chroma'
): Promise<string> {
  ensureOutputDir();
  
  const config = COMPANY_CONFIGS[brandCode] || COMPANY_CONFIGS.chroma;
  const filename = `proforma_${reserva.confirmationCode}_${Date.now()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    
    doc.pipe(stream);
    
    doc.fontSize(24).fillColor(config.primaryColor).text('COTIZACIÓN / PROFORMA', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#333');
    doc.text(config.nombre, { align: 'center' });
    doc.text(config.direccion, { align: 'center' });
    doc.text(`${config.email} | ${config.telefono}`, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(10);
    doc.text(`Folio: ${reserva.confirmationCode}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`);
    doc.text(`Válido hasta: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}`);
    doc.moveDown();
    
    doc.fontSize(14).fillColor(config.primaryColor).text('CLIENTE');
    doc.fontSize(10).fillColor('#333');
    doc.text(`${cliente.nombre} ${cliente.apellidos}`);
    doc.text(cliente.email);
    doc.text(cliente.telefono);
    doc.moveDown();
    
    doc.fontSize(14).fillColor(config.primaryColor).text('DETALLES DE LA RESERVACIÓN');
    doc.fontSize(10).fillColor('#333');
    doc.text(`Check-in: ${reserva.checkIn}`);
    doc.text(`Check-out: ${reserva.checkOut}`);
    doc.text(`Huéspedes: ${reserva.guests}`);
    doc.text(`Habitaciones: ${reserva.rooms || 1}`);
    doc.moveDown();
    
    doc.rect(50, doc.y, 500, 60).fill('#f5f5f5');
    doc.fillColor('#333').fontSize(12);
    doc.text('TOTAL:', 60, doc.y + 15);
    doc.fontSize(24).fillColor(config.primaryColor);
    doc.text(`$${Number(reserva.totalPrice).toLocaleString()} ${reserva.currency}`, 200, doc.y - 20);
    
    doc.moveDown(4);
    doc.fontSize(8).fillColor('#666');
    doc.text('Esta cotización es informativa. Los precios están sujetos a disponibilidad y pueden variar.', { align: 'center' });
    doc.text(`${config.sitioWeb}`, { align: 'center' });
    
    doc.end();
    
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateQRCode(data: string): Promise<string> {
  ensureOutputDir();
  const filename = `qr_${Date.now()}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  await QRCode.toFile(filepath, data, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
  
  return filepath;
}
