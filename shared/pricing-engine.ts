/**
 * MOTOR DE PRECIOS — Fénix Traveler + Chroma Travel
 *
 * Fórmulas:
 *   tarifaNeta  = tarifaPublica × 0.85         (15% comisión incluida en precio proveedor)
 *   precioVenta = tarifaNeta × 1.05            (5% margen agencia = precio SPEI/efectivo)
 *   precioTarj  = precioVenta / (1 - 0.0418)  (Clip 3.6% + IVA 16% = 4.18% efectivo)
 *   precioMSI   = precioVenta / (1 - tasaMSI) (sobretasa Clip MSI pasa al cliente)
 *   kuaniPts    = floor(precioVenta × tierPct) (por tier del hotel)
 *
 * Reglas MSI:
 *   - Solo pago TOTAL (no anticipos/depósitos parciales)
 *   - Monto mínimo: $7,000 MXN sobre precioVenta
 *   - Plazos: 3, 6, 9, 12, 18, 24 meses
 *   - Sobretasa incluye IVA y la absorbe el cliente (no la agencia)
 */

export type KuaniTier = 'ESTANDAR' | 'PREMIUM' | 'PREMIUM PLUS' | 'LUXURY';

/** Porcentaje Kuani por tier */
export const KUANI_PCT_BY_TIER: Record<KuaniTier, number> = {
  ESTANDAR:       0.019,   // 1.9%
  PREMIUM:        0.02855, // 2.855%
  'PREMIUM PLUS': 0.0381,  // 3.81%
  LUXURY:         0.0381,  // 3.81%
};

/**
 * Tasas Clip MSI 2026 — comisión total con IVA que carga el banco.
 * El cliente paga la sobretasa (la agencia siempre recibe precioVenta).
 * Fuente: tarifario Clip 2026.
 */
export const MSI_RATES: Record<number, number> = {
  3:  0.0948,  //  9.48% con IVA
  6:  0.1296,  // 12.96% con IVA
  9:  0.1702,  // 17.02% con IVA
  12: 0.1899,  // 18.99% con IVA
  18: 0.2653,  // 26.53% con IVA
  24: 0.3569,  // 35.69% con IVA
};

export const MSI_PLAZOS = [3, 6, 9, 12, 18, 24] as const;

/** Monto mínimo de precioVenta para ofrecer MSI */
export const MSI_MONTO_MINIMO = 7000;

export interface MSIOpcion {
  plazo: number;
  /** Precio total que paga el cliente (precioVenta + sobretasa) */
  precioTotal: number;
  /** Sobretasa en MXN (lo que paga el cliente extra vs SPEI) */
  sobretasa: number;
  /** Mensualidad aproximada */
  mensualidad: number;
}

export interface PricingConfig {
  /** Comisión mayorista YA INCLUIDA en precio público (ej: 0.15 = 15%) */
  comisionMayoristaIncluida: number;
  /** Margen agencia sobre tarifa neta */
  margen: number;
  /** Comisión Clip efectiva con IVA (3.6% × 1.16 = 4.176% ≈ 4.18%) */
  comisionClip: number;
}

export const PRICING_CONFIG_DEFAULT: PricingConfig = {
  comisionMayoristaIncluida: 0.15,
  margen: 0.05,
  comisionClip: 0.0418, // 3.6% + IVA 16% = 4.18% efectivo
};

export interface PricingInput {
  /** Precio público por persona por noche (del proveedor, con 15% incluido) */
  tarifaPublicaPPPN: number;
  adultos: number;
  menores: number;
  juniors: number;
  infantes: number;
  noches: number;
  /** Tier Kuani del hotel */
  kuaniTier?: KuaniTier;
  /** Puntos Kuani existentes del cliente para redimir */
  kuaniPuntosCliente?: number;
  /** Si se pasa precio ya calculado por habitación (suma de todos los pasajeros × noches) */
  precioHabitacionTotal?: number;
}

export interface PricingOutput {
  /** Precio público total (proveedor) */
  tarifaPublicaTotal:  number;
  /** Precio neto (sin la comisión del mayorista) */
  tarifaNeta:          number;
  /** Precio de venta (con margen 5%) = precio SPEI/efectivo */
  precioVenta:         number;
  /** Precio con tarjeta Clip — pago de contado (divide method, agencia recibe precioVenta) */
  precioTarjeta:       number;
  /** Comisión Clip en MXN (contado) */
  comisionClipMonto:   number;
  /** Ganancia agencia en MXN */
  gananciaAgencia:     number;
  /** Puntos Kuani que genera esta reserva */
  kuaniGenerados:      number;
  /** Descuento aplicado por redimir puntos (máx 30%) */
  kuaniDescuento:      number;
  /** Precio SPEI después de descuento Kuani */
  precioEfectivoFinal: number;
  /** Precio tarjeta contado después de descuento Kuani */
  precioTarjetaFinal:  number;
  /** Precio por persona (efectivo) */
  precioPorPersona:    number;
  /** Opciones MSI disponibles (solo si precioVenta ≥ $7,000) */
  msiOpciones:         MSIOpcion[];
}

export function calcularPrecio(
  input: PricingInput,
  config: PricingConfig = PRICING_CONFIG_DEFAULT
): PricingOutput {
  const {
    tarifaPublicaPPPN,
    adultos, menores, juniors, noches,
    kuaniTier = 'ESTANDAR',
    kuaniPuntosCliente = 0,
    precioHabitacionTotal,
  } = input;

  const { comisionMayoristaIncluida, margen, comisionClip } = config;

  if (comisionClip >= 1) throw new Error('comisionClip debe ser < 1');
  if (comisionMayoristaIncluida >= 1) throw new Error('comisionMayorista debe ser < 1');

  // ── 1. PRECIO BASE TOTAL ──────────────────────────────────────────────────
  const pax = Math.max(1, adultos + menores + juniors);
  const tarifaPublicaTotal = precioHabitacionTotal != null
    ? precioHabitacionTotal
    : r2(tarifaPublicaPPPN * pax * noches);

  if (tarifaPublicaTotal <= 0) return zero();

  // ── 2. TARIFA NETA + MARGEN ───────────────────────────────────────────────
  const tarifaNeta    = r2(tarifaPublicaTotal * (1 - comisionMayoristaIncluida));
  const gananciaAgencia = r2(tarifaNeta * margen);
  const precioVenta   = r2(tarifaNeta * (1 + margen));

  // ── 3. PRECIO TARJETA CONTADO (divide method) ─────────────────────────────
  // Divide garantiza que la agencia recibe exactamente precioVenta tras la comisión Clip.
  const precioTarjeta    = r2(precioVenta / (1 - comisionClip));
  const comisionClipMonto = r2(precioTarjeta - precioVenta);

  // ── 4. KUANI POINTS ───────────────────────────────────────────────────────
  const kuaniPct      = KUANI_PCT_BY_TIER[kuaniTier] ?? KUANI_PCT_BY_TIER.ESTANDAR;
  const kuaniGenerados = Math.floor(precioVenta * kuaniPct);

  // ── 5. DESCUENTO KUANI (máx 30% de precioVenta) ──────────────────────────
  const maxDescuento      = r2(precioVenta * 0.30);
  const kuaniDescuento    = r2(Math.min(kuaniPuntosCliente, maxDescuento));
  const precioEfectivoFinal = r2(Math.max(0, precioVenta - kuaniDescuento));
  const precioTarjetaFinal  = r2(precioEfectivoFinal / (1 - comisionClip));

  // ── 6. PRECIO POR PERSONA ─────────────────────────────────────────────────
  const precioPorPersona = r2(precioEfectivoFinal / pax);

  // ── 7. OPCIONES MSI (solo si precioVenta ≥ $7,000 — pago total) ──────────
  const msiOpciones: MSIOpcion[] = precioVenta >= MSI_MONTO_MINIMO
    ? MSI_PLAZOS.map(plazo => {
        const tasa = MSI_RATES[plazo];
        const precioTotal = r2(precioVenta / (1 - tasa));
        return {
          plazo,
          precioTotal,
          sobretasa:   r2(precioTotal - precioVenta),
          mensualidad: r2(precioTotal / plazo),
        };
      })
    : [];

  return {
    tarifaPublicaTotal,
    tarifaNeta,
    precioVenta,
    precioTarjeta,
    comisionClipMonto,
    gananciaAgencia,
    kuaniGenerados,
    kuaniDescuento,
    precioEfectivoFinal,
    precioTarjetaFinal,
    precioPorPersona,
    msiOpciones,
  };
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function zero(): PricingOutput {
  return {
    tarifaPublicaTotal: 0, tarifaNeta: 0, precioVenta: 0,
    precioTarjeta: 0, comisionClipMonto: 0, gananciaAgencia: 0,
    kuaniGenerados: 0, kuaniDescuento: 0,
    precioEfectivoFinal: 0, precioTarjetaFinal: 0, precioPorPersona: 0,
    msiOpciones: [],
  };
}

/** Helper: desde datos de un bloqueo individual */
export function calcularPrecioBloqueo(params: {
  precioHabitacion: number;
  adultos: number;
  menores: number;
  juniors: number;
  infantes: number;
  noches: number;
  kuaniTier?: KuaniTier;
  kuaniPuntos?: number;
  config?: PricingConfig;
}): PricingOutput {
  return calcularPrecio(
    {
      tarifaPublicaPPPN: 0,
      precioHabitacionTotal: params.precioHabitacion,
      adultos:  params.adultos,
      menores:  params.menores,
      juniors:  params.juniors,
      infantes: params.infantes,
      noches:   params.noches,
      kuaniTier:          params.kuaniTier,
      kuaniPuntosCliente: params.kuaniPuntos,
    },
    params.config ?? PRICING_CONFIG_DEFAULT
  );
}

/**
 * Calcula el precio para un plazo MSI específico.
 * Retorna null si el monto es menor al mínimo o el plazo no existe.
 * Solo válido para PAGO TOTAL — nunca para anticipos.
 */
export function calcularOpcionMSI(
  precioVenta: number,
  plazo: number
): MSIOpcion | null {
  if (precioVenta < MSI_MONTO_MINIMO) return null;
  const tasa = MSI_RATES[plazo];
  if (!tasa) return null;
  const precioTotal = r2(precioVenta / (1 - tasa));
  return {
    plazo,
    precioTotal,
    sobretasa:   r2(precioTotal - precioVenta),
    mensualidad: r2(precioTotal / plazo),
  };
}
