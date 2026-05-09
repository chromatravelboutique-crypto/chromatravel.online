/**
 * Invoicing Service - CFDI Electronic Invoicing (Mexico)
 * 
 * This module provides integration structure for CFDI 4.0 electronic invoicing
 * through providers like Facturapi, Facturama, or FiscalAPI.
 * 
 * Required Environment Variables:
 * - CFDI_PROVIDER: "facturapi" | "facturama" | "fiscalapi" | "none" (default: none)
 * - CFDI_API_KEY: API key for the selected provider
 * - CFDI_API_SECRET: API secret (if required by provider)
 * - CFDI_SANDBOX: "true" | "false" (default: true for testing)
 * 
 * Required User Setup:
 * - CSD (Certificado de Sello Digital) uploaded to provider
 * - FIEL configured in provider portal
 * - RFC and fiscal data configured
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productCode: string; // SAT product code (e.g., "90111800" for travel services)
  unitCode: string; // SAT unit code (e.g., "E48" for service unit)
  taxRate?: number;
}

export interface InvoiceCustomer {
  rfc: string;
  name: string;
  email: string;
  fiscalRegime: string; // SAT regime code (e.g., "612", "601")
  usoCfdi: string; // CFDI use (e.g., "G03")
  zipCode: string;
  address?: string;
}

export interface CreateInvoiceRequest {
  type: "factura" | "proforma";
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  paymentForm: string; // SAT payment form code
  paymentMethod: string; // "PUE" | "PPD"
  currency: string;
  exchangeRate?: number;
  notes?: string;
  bookingId?: string;
  brandId?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  uuid?: string; // CFDI UUID from SAT
  folio?: string;
  series?: string;
  total?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
}

export interface InvoicingConfig {
  provider: "facturapi" | "facturama" | "fiscalapi" | "none";
  apiKey: string;
  apiSecret: string;
  sandbox: boolean;
  baseUrl: string;
}

class InvoicingService {
  private config: InvoicingConfig;

  constructor() {
    const provider = (process.env.CFDI_PROVIDER || "none") as InvoicingConfig["provider"];
    
    this.config = {
      provider,
      apiKey: process.env.CFDI_API_KEY || "",
      apiSecret: process.env.CFDI_API_SECRET || "",
      sandbox: process.env.CFDI_SANDBOX !== "false",
      baseUrl: this.getBaseUrl(provider),
    };
  }

  private getBaseUrl(provider: string): string {
    const urls: Record<string, { sandbox: string; production: string }> = {
      facturapi: {
        sandbox: "https://www.facturapi.io/v2",
        production: "https://www.facturapi.io/v2",
      },
      facturama: {
        sandbox: "https://apisandbox.facturama.mx",
        production: "https://api.facturama.mx",
      },
      fiscalapi: {
        sandbox: "https://sandbox.fiscalapi.com/v2",
        production: "https://api.fiscalapi.com/v2",
      },
    };

    const providerUrls = urls[provider];
    if (!providerUrls) return "";
    
    return this.config.sandbox ? providerUrls.sandbox : providerUrls.production;
  }

  isConfigured(): boolean {
    return (
      this.config.provider !== "none" &&
      !!this.config.apiKey &&
      !!this.config.baseUrl
    );
  }

  getStatus(): { provider: string; configured: boolean; sandbox: boolean } {
    return {
      provider: this.config.provider,
      configured: this.isConfigured(),
      sandbox: this.config.sandbox,
    };
  }

  /**
   * Create a proforma (quote) - does NOT require SAT stamping
   * Used for pre-booking quotes and estimates
   */
  async createProforma(request: CreateInvoiceRequest): Promise<InvoiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Invoicing service not configured. Set CFDI_PROVIDER and CFDI_API_KEY.",
      };
    }

    console.log(`[Invoicing] Creating proforma for ${request.customer.rfc}`);
    console.log(`[Invoicing] Provider: ${this.config.provider}`);
    console.log(`[Invoicing] Items: ${request.items.length}`);

    return {
      success: false,
      error: "Proforma creation not implemented. Configure CFDI provider to enable.",
    };
  }

  /**
   * Create and stamp a CFDI invoice (factura fiscal)
   * Requires CSD and FIEL configured in provider
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Invoicing service not configured. Set CFDI_PROVIDER and CFDI_API_KEY.",
      };
    }

    console.log(`[Invoicing] Creating CFDI invoice for ${request.customer.rfc}`);
    console.log(`[Invoicing] Provider: ${this.config.provider}`);
    console.log(`[Invoicing] Sandbox mode: ${this.config.sandbox}`);

    return {
      success: false,
      error: "Invoice creation not implemented. Configure CFDI provider to enable.",
    };
  }

  /**
   * Cancel an existing stamped invoice
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceResult> {
    if (!this.isConfigured()) {
      return { success: false, error: "Invoicing service not configured." };
    }

    console.log(`[Invoicing] Cancelling invoice ${invoiceId}: ${reason}`);

    return {
      success: false,
      error: "Invoice cancellation not implemented.",
    };
  }

  /**
   * Download invoice PDF
   */
  async downloadPdf(invoiceId: string): Promise<{ success: boolean; data?: Buffer; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Invoicing service not configured." };
    }

    return { success: false, error: "PDF download not implemented." };
  }

  /**
   * Download invoice XML
   */
  async downloadXml(invoiceId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Invoicing service not configured." };
    }

    return { success: false, error: "XML download not implemented." };
  }

  /**
   * Get SAT product codes for travel services
   */
  getCommonProductCodes(): Record<string, string> {
    return {
      "hotel": "90111800", // Servicios de hoteles y moteles
      "travel_agency": "90121500", // Agencias de viajes
      "tour": "90121501", // Servicios de operadores turísticos
      "transportation": "78111800", // Servicios de transporte de pasajeros
      "cruise": "78121500", // Servicios de transporte marítimo de pasajeros
      "insurance": "84131501", // Servicios de seguros de viajes
      "commission": "80111600", // Servicios de intermediación comercial
    };
  }

  /**
   * Get SAT fiscal regimes
   */
  getFiscalRegimes(): Record<string, string> {
    return {
      "601": "General de Ley Personas Morales",
      "603": "Personas Morales con Fines no Lucrativos",
      "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
      "606": "Arrendamiento",
      "608": "Demás ingresos",
      "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
      "611": "Ingresos por Dividendos (socios y accionistas)",
      "612": "Personas Físicas con Actividades Empresariales y Profesionales",
      "614": "Ingresos por intereses",
      "615": "Régimen de los ingresos por obtención de premios",
      "616": "Sin obligaciones fiscales",
      "620": "Sociedades Cooperativas de Producción",
      "621": "Incorporación Fiscal",
      "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
      "623": "Opcional para Grupos de Sociedades",
      "624": "Coordinados",
      "625": "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
      "626": "Régimen Simplificado de Confianza",
    };
  }
}

export const invoicingService = new InvoicingService();
export default invoicingService;
