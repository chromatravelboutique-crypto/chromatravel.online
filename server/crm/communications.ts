import nodemailer from 'nodemailer';

interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  emailUser: string;
  emailPassword: string;
  fromName: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const getEmailConfig = (brandCode: string): EmailConfig => {
  if (brandCode === 'fenix') {
    return {
      smtpServer: process.env.SMTP_SERVER || 'smtp.hostinger.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '465'),
      emailUser: process.env.FENIX_EMAIL || 'contacto@fenixtraveler.com',
      emailPassword: process.env.FENIX_EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
      fromName: 'Fénix Traveler'
    };
  }
  return {
    smtpServer: process.env.SMTP_SERVER || 'smtp.hostinger.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '465'),
    emailUser: process.env.CHROMA_EMAIL || 'contacto@chromatravel.online',
    emailPassword: process.env.CHROMA_EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
    fromName: 'Chroma Travel'
  };
};

export async function sendEmail(data: EmailData, brandCode: string = 'chroma'): Promise<boolean> {
  const config = getEmailConfig(brandCode);
  
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpServer,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword
      }
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.emailUser}>`,
      to: data.to,
      subject: data.subject,
      text: data.text || '',
      html: data.html
    });

    console.log(`✓ Email enviado a ${data.to}: ${data.subject}`);
    return true;
  } catch (error) {
    console.error(`✗ Error enviando email a ${data.to}:`, error);
    return false;
  }
}

export function generateBirthdayEmail(nombre: string, puntosRegalo: number, codigoDescuento: string, brandCode: string): string {
  const brandName = brandCode === 'fenix' ? 'Fénix Traveler' : 'Chroma Travel';
  const primaryColor = brandCode === 'fenix' ? '#3B82F6' : '#8C50DC';
  const sitio = brandCode === 'fenix' ? 'fenixtraveler.com' : 'chromatravel.online';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${primaryColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; }
            .gift-box { background: white; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { background: ${primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Feliz Cumpleaños ${nombre}!</h1>
            </div>
            <div class="content">
                <p>Querido ${nombre},</p>
                <p>En <strong>${brandName}</strong> queremos celebrar contigo este día tan especial.</p>
                
                <div class="gift-box">
                    <h2>Tus Regalos de Cumpleaños:</h2>
                    <ul>
                        <li><strong>${puntosRegalo} Puntos</strong> agregados a tu cuenta</li>
                        <li><strong>15% de descuento</strong> en cualquier reserva este mes</li>
                        <li>Código: <strong>${codigoDescuento}</strong></li>
                    </ul>
                </div>
                
                <p>Es el momento perfecto para planear tu próxima aventura.</p>
                
                <a href="https://${sitio}/destinos?promo=${codigoDescuento}" class="button">
                    Ver Destinos Especiales
                </a>
                
                <p style="margin-top: 30px;">¡Que tengas un día increíble!</p>
                <p>Con cariño,<br><strong>El equipo de ${brandName}</strong></p>
            </div>
            <div class="footer">
                <p>${brandName} | Tu agencia de viajes</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generatePromoEmail(nombre: string, tier: string, promocion: { titulo: string; descuento: string; destino: string }, brandCode: string): string {
  const brandName = brandCode === 'fenix' ? 'Fénix Traveler' : 'Chroma Travel';
  const primaryColor = brandCode === 'fenix' ? '#3B82F6' : '#8C50DC';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${primaryColor}, #D4914C); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; }
            .promo-box { background: white; border: 2px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
            .discount { font-size: 48px; font-weight: bold; color: ${primaryColor}; }
            .button { background: ${primaryColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${promocion.titulo}</h1>
                <p>Oferta exclusiva para clientes ${tier}</p>
            </div>
            <div class="content">
                <p>Hola ${nombre},</p>
                <p>Tenemos una promoción especial pensada para ti:</p>
                
                <div class="promo-box">
                    <div class="discount">${promocion.descuento}</div>
                    <h3>${promocion.destino}</h3>
                </div>
                
                <a href="#" class="button">Reservar Ahora</a>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Esta oferta es exclusiva para miembros ${tier} de ${brandName}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generateBookingConfirmationEmail(booking: any, brandCode: string): string {
  const brandName = brandCode === 'fenix' ? 'Fénix Traveler' : 'Chroma Travel';
  const primaryColor = brandCode === 'fenix' ? '#3B82F6' : '#8C50DC';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${primaryColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; }
            .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
            .total { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Reservación Confirmada!</h1>
                <p>Código: ${booking.confirmationCode}</p>
            </div>
            <div class="content">
                <p>Hola ${booking.guestFirstName},</p>
                <p>Tu reservación ha sido confirmada exitosamente.</p>
                
                <div class="booking-details">
                    <h3>Detalles de tu reservación:</h3>
                    <p><strong>Check-in:</strong> ${booking.checkIn}</p>
                    <p><strong>Check-out:</strong> ${booking.checkOut}</p>
                    <p><strong>Huéspedes:</strong> ${booking.guests}</p>
                    <p class="total">Total: $${booking.totalPrice} ${booking.currency}</p>
                </div>
                
                <p>Gracias por confiar en ${brandName}.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
