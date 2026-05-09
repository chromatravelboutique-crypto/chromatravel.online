import twilio from 'twilio';

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

const getWhatsAppConfig = (brandCode: string): WhatsAppConfig => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  
  if (brandCode === 'fenix') {
    return {
      accountSid,
      authToken,
      fromNumber: process.env.TWILIO_FENIX_WHATSAPP || 'whatsapp:+14155238886'
    };
  }
  return {
    accountSid,
    authToken,
    fromNumber: process.env.TWILIO_CHROMA_WHATSAPP || 'whatsapp:+14155238886'
  };
};

export async function sendWhatsAppMessage(
  to: string, 
  message: string, 
  brandCode: string = 'chroma'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWhatsAppConfig(brandCode);
  
  if (!config.accountSid || !config.authToken) {
    console.log('Twilio not configured - WhatsApp message not sent');
    return { success: false, error: 'Twilio not configured' };
  }
  
  try {
    const client = twilio(config.accountSid, config.authToken);
    
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: config.fromNumber,
      to: formattedTo
    });
    
    console.log(`WhatsApp message sent to ${to}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

export function generateBookingWhatsAppMessage(booking: any, brandCode: string): string {
  const brandName = brandCode === 'fenix' ? 'Fenix Traveler' : 'Chroma Travel';
  
  return `Hola ${booking.guestFirstName}!

Tu reservacion con ${brandName} ha sido confirmada.

Codigo: ${booking.confirmationCode}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Total: $${booking.totalPrice} ${booking.currency}

Gracias por tu confianza. Cualquier duda, estamos para servirte.`;
}

export function generatePromoWhatsAppMessage(nombre: string, promocion: { titulo: string; descuento: string; destino: string }): string {
  return `Hola ${nombre}!

Tenemos una oferta especial para ti:

${promocion.titulo}
${promocion.descuento} de descuento en ${promocion.destino}

Responde a este mensaje para mas informacion.`;
}

export function generateBirthdayWhatsAppMessage(nombre: string, codigoDescuento: string): string {
  return `Feliz cumpleanos ${nombre}!

Te enviamos un regalo especial: 15% de descuento en tu proxima reservacion.

Usa el codigo: ${codigoDescuento}

Que tengas un dia increible!`;
}
