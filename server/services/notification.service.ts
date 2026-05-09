/**
 * NOTIFICATION SERVICE
 * Centraliza email + WhatsApp post-reserva/lead
 */
import { sendEmail } from '../email-service';

const WA_ADMIN = process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE || '';
const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY || '';

async function sendCallmebot(phone: string, message: string): Promise<boolean> {
  if (!CALLMEBOT_KEY) {
    console.log('[whatsapp] CALLMEBOT_API_KEY not set, skipping WA notification');
    return false;
  }
  try {
    const clean = phone.replace(/\D/g, '');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_KEY}`;
    const res = await fetch(url);
    return res.ok;
  } catch (err) {
    console.error('[callmebot] error:', err);
    return false;
  }
}

export interface ReservaNotifParams {
  nombre: string;
  email: string;
  telefono?: string | null;
  hotel: string;
  checkIn: string;
  checkOut: string;
  noches: number;
  adultos: number;
  menores: number;
  juniors: number;
  infantes: number;
  distribucion: string;
  totalEfectivo: string;
  totalTarjeta: string;
  anticipo: string;
  kuaniGenerados: number;
  leadId: number;
  diasAlCheckIn: number;
}

export async function notificarReserva(params: ReservaNotifParams): Promise<void> {
  const msg = `
🆕 NUEVA SOLICITUD DE RESERVA #${params.leadId}
━━━━━━━━━━━━━━━━━━━━━
👤 ${params.nombre} | 📧 ${params.email}${params.telefono ? ` | 📱 ${params.telefono}` : ''}

🏨 ${params.hotel}
📅 ${params.checkIn} → ${params.checkOut} (${params.noches}N)
👥 ${params.adultos} adultos${params.menores > 0 ? `, ${params.menores} menores` : ''}${params.juniors > 0 ? `, ${params.juniors} juniors` : ''}${params.infantes > 0 ? `, ${params.infantes} infantes` : ''}
🏠 ${params.distribucion}

💵 Efectivo: ${params.totalEfectivo}
💳 Tarjeta: ${params.totalTarjeta}
💳 Anticipo: ${params.anticipo}
⭐ Kuani generados: ${params.kuaniGenerados} pts
📆 Días al check-in: ${params.diasAlCheckIn}
`.trim();

  // 1. WhatsApp al admin
  await sendCallmebot(WA_ADMIN, msg);

  // 2. WhatsApp al cliente si tiene teléfono
  if (params.telefono) {
    const clienteMsg = `
✈️ Hola ${params.nombre}! Recibimos tu solicitud de reserva en Fénix Traveler.

🏨 ${params.hotel}
📅 ${params.checkIn} → ${params.checkOut}
💰 Total: ${params.totalEfectivo} (efectivo/SPEI)

Un asesor te contactará en breve para confirmar disponibilidad y datos de pago.

¿Tienes dudas? Escríbenos a este mismo número 😊
`.trim();
    await sendCallmebot(params.telefono, clienteMsg);
  }

  // 3. Email al cliente
  try {
    await sendEmail({
      to: params.email,
      subject: `✈️ Solicitud recibida — ${params.hotel}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#f97316">Fénix Traveler</h2>
          <p>Hola <strong>${params.nombre}</strong>,</p>
          <p>Recibimos tu solicitud de reserva. Un asesor te contactará en las próximas horas.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Hotel</strong></td><td style="padding:8px">${params.hotel}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Check-in</strong></td><td style="padding:8px">${params.checkIn}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Check-out</strong></td><td style="padding:8px">${params.checkOut}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Total efectivo</strong></td><td style="padding:8px;color:#16a34a"><strong>${params.totalEfectivo}</strong></td></tr>
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Total tarjeta</strong></td><td style="padding:8px;color:#2563eb"><strong>${params.totalTarjeta}</strong></td></tr>
            <tr><td style="padding:8px;background:#f5f5f5"><strong>Anticipo requerido</strong></td><td style="padding:8px"><strong>${params.anticipo}</strong></td></tr>
            <tr><td style="padding:8px;background:#fff7ed"><strong>⭐ Kuani generados</strong></td><td style="padding:8px"><strong>${params.kuaniGenerados} puntos</strong></td></tr>
          </table>
          <p style="color:#6b7280;font-size:14px">Precios en MXN, impuestos incluidos. Sujeto a disponibilidad.</p>
          <p>— Equipo Fénix Traveler</p>
        </div>
      `
    });
  } catch (err) {
    console.error('[notificarReserva] email error:', err);
  }
}

export async function notificarLead(params: {
  nombre: string; email: string; telefono?: string; mensaje: string; fuente: string;
}): Promise<void> {
  const msg = `🔔 NUEVO LEAD (${params.fuente})
👤 ${params.nombre}
📧 ${params.email}${params.telefono ? `\n📱 ${params.telefono}` : ''}
💬 ${params.mensaje.slice(0, 200)}`;
  await sendCallmebot(WA_ADMIN, msg);
}
