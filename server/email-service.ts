import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });
    
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  destination?: string;
  source?: string;
}): Promise<boolean> {
  const html = `
    <h2>Nuevo Lead Recibido</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Nombre:</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${lead.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${lead.email}">${lead.email}</a></td>
      </tr>
      ${lead.phone ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Teléfono:</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
      </tr>
      ` : ''}
      ${lead.destination ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Destino:</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${lead.destination}</td>
      </tr>
      ` : ''}
      ${lead.source ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Fuente:</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${lead.source}</td>
      </tr>
      ` : ''}
      ${lead.message ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Mensaje:</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${lead.message}</td>
      </tr>
      ` : ''}
    </table>
    <p style="margin-top: 20px; color: #666;">
      Este lead fue capturado automáticamente desde el sitio web.
    </p>
  `;

  return sendEmail({
    to: process.env.SMTP_USER || "contacto@chromatravel.online",
    subject: `Nuevo Lead: ${lead.name} - ${lead.destination || 'Consulta General'}`,
    html,
    replyTo: lead.email,
  });
}

export async function sendBookingConfirmation(booking: {
  customerName: string;
  customerEmail: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
  currency: string;
  confirmationCode: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #ec4899); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">¡Reservación Confirmada!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hola <strong>${booking.customerName}</strong>,</p>
        <p>Tu reservación ha sido confirmada. Aquí están los detalles:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #10b981;">${booking.hotelName}</h3>
          <p><strong>Código de confirmación:</strong> ${booking.confirmationCode}</p>
          <p><strong>Check-in:</strong> ${booking.checkIn}</p>
          <p><strong>Check-out:</strong> ${booking.checkOut}</p>
          <p><strong>Total:</strong> ${booking.currency} ${booking.totalPrice}</p>
        </div>
        
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>¡Que tengas un excelente viaje!</p>
        
        <p style="margin-top: 30px;">
          <strong>Chroma Travel</strong><br>
          <a href="mailto:contacto@chromatravel.online">contacto@chromatravel.online</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: booking.customerEmail,
    subject: `Confirmación de Reserva - ${booking.hotelName} (${booking.confirmationCode})`,
    html,
  });
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error);
    return false;
  }
}
