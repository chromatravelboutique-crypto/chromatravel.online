/**
 * MOTOR DE PRECIOS — Fénix Traveler + Chroma Travel
 *
 * Fórmulas:
 *   tarifaNeta  = tarifaPublica × 0.85         (15% comisión incluida en precio proveedor)
 *   precioVenta = tarifaNeta × 1.05            (5% margen agencia = precio SPEI/efectivo)
 *   precioTarj  = precioVenta / (1 - 0.0418)  (Clip 3.6% + IVA 16% = 4.18% efectivo)
 *   precioMSI   = precioVenta / (1 - tasaMSI) (sobretasa Clip MSI pasa al cliente)
 *   fenixPts    = floor(precioVenta × tierPct) (por tier de valor de reserva)
 *
 * Tiers por valor de tarifa neta:
 *   BASICO  < $12,000       → MSI 3 meses         · 1% Fénix Points
 *   MEDIO   $12,000–$34,999 → MSI 3 y 6 meses    · 2% Fénix Points
 *   PREMIUM ≥ $35,000       → MSI 3, 6 y 12 meses · 3% Fénix Points
 *
 * Reglas MSI:
 *   - Solo pago TOTAL (nunca anticipos/depósitos parciales)
 *   - precioVenta mínimo $7,000 MXN
 *   - Sobretasa con IVA la absorbe el cliente; agencia siempre recibe precioVenta
 */

// ── TIERS POR VALOR DE RESERVA ────────────────────────────────────────────────

export type BloqueoTier = 'BASICO' | 'MEDIO' | 'PREMIUM';

export const BLOQUEO_TIER_CONFIG: Record<BloqueoTier, {
  label: string;
  fenixPointsPct: number;
  msiPlazos: number[];
}> = {
  BASICO: {
    label: 'Básico',
    fenixPointsPct: 0.01,   // 1%
    msiPlazos: [3],
  },
  MEDIO: {
    label: 'Medio',
    fenixPointsPct: 0.02,   // 2%
    msiPlazos: [3, 6],
  },
  PREMIUM: {
    label: 'Premium',
    fenixPointsPct: 0.03,   // 3%
    msiPlazos: [3, 6, 12],
  },
};

/** Determina el tier por tarifa neta del bloqueo */
export function getBloqueoTier(tarifaNeta: number): BloqueoTier {
  if (tarifaNeta < 12000) return 'BASICO';
  if (tarifaNeta < 35000) return 'MEDIO';
  return 'PREMIUM';
}

// ── TASAS CLIP ────────────────────────────────────────────────────────────────

/**
 * Tasas Clip MSI 2026 — comisión total con IVA.
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

/** Monto mínimo de precioVenta para ofrecer MSI */
export const MSI_MONTO_MINIMO = 7000;

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface MSIOpcion {
  plazo: number;
  /** Precio total que paga el cliente */
  precioTotal: number;
  /** Sobretasa en MXN */
  sobretasa: number;
  /** Mensualidad aproximada */
  mensualidad: number;
}

export interface PricingConfig {
  /** Comisión mayorista YA INCLUIDA en precio público (ej: 0.15 = 15%) */
  comisionMayoristaIncluida: number;
  /** Margen agencia sobre tarifa neta */
  margen: number;
  /** Comisión Clip efectiva con IVA (3.6% × 1.16 = 4.18%) */
  comisionClip: number;
}

export const PRICING_CONFIG_DEFAULT: PricingConfig = {
  comisionMayoristaIncluida: 0.15,
  margen: 0.05,
  comisionClip: 0.0418,
};

export interface PricingInput {
  /** Precio público total (del proveedor, con 15% incluido) */
  tarifaPublicaPPPN: number;
  adultos: number;
  menores: number;
  juniors: number;
  infantes: number;
  noches: number;
  /** @deprecated - Tier por valor se calcula automáticamente */
  kuaniTier?: string;
  /** Puntos Fénix existentes del cliente para redimir */
  kuaniPuntosCliente?: number;
  /** Si se pasa precio ya calculado (suma de todos los pasajeros × noches) */
  precioHabitacionTotal?: number;
}

export interface PricingOutput {
  /** Precio público total (proveedor) */
  tarifaPublicaTotal:  number;
  /** Precio neto (lo que paga la agencia al proveedor) */
  tarifaNeta:          number;
  /** Precio de venta = precio SPEI/efectivo (tarifaNeta × 1.05) */
  precioVenta:         number;
  /** Precio tarjeta Clip contado (divide method — agencia recibe precioVenta exacto) */
  precioTarjeta:       number;
  /** Comisión Clip contado en MXN */
  comisionClipMonto:   number;
  /** Ganancia bruta agencia en MXN */
  gananciaAgencia:     number;
  /** Tier del bloqueo por valor */
  bloqueoTier:         BloqueoTier;
  /** % Fénix Points del tier */
  fenixPointsPct:      number;
  /** Puntos Fénix que genera esta reserva */
  kuaniGenerados:      number;
  /** Descuento aplicado por redimir puntos (máx = gananciaAgencia) */
  kuaniDescuento:      number;
  /** Precio SPEI después de descuento Fénix Points */
  precioEfectivoFinal: number;
  /** Precio tarjeta contado después de descuento Fénix Points */
  precioTarjetaFinal:  number;
  /** Precio por persona (efectivo) */
  precioPorPersona:    number;
  /** Opciones MSI disponibles según tier y monto (solo en pago total) */
  msiOpciones:         MSIOpcion[];
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

export function calcularPrecio(
  input: PricingInput,
  config: PricingConfig = PRICING_CONFIG_DEFAULT
): PricingOutput {
  const {
    tarifaPublicaPPPN,
    adultos, menores, juniors, noches,
    kuaniPuntosCliente = 0,
    precioHabitacionTotal,
  } = input;

  const { comisionMayoristaIncluida, margen, comisionClip } = config;

  if (comisionClip >= 1) throw new Error('comisionClip debe ser < 1');
  if (comisionMayoristaIncluida >= 1) throw new Error('comisionMayorista debe ser < 1');

  // ── 1. PRECIO BASE ────────────────────────────────────────────────────────
  const pax = Math.max(1, adultos + menores + juniors);
  const tarifaPublicaTotal = precioHabitacionTotal != null
    ? precioHabitacionTotal
    : r2(tarifaPublicaPPPN * pax * noches);

  if (tarifaPublicaTotal <= 0) return zero();

  // ── 2. TARIFA NETA + MARGEN + TIER ───────────────────────────────────────
  const tarifaNeta       = r2(tarifaPublicaTotal * (1 - comisionMayoristaIncluida));
  const gananciaAgencia  = r2(tarifaNeta * margen);
  const precioVenta      = r2(tarifaNeta * (1 + margen));

  const bloqueoTier      = getBloqueoTier(tarifaNeta);
  const tierConfig       = BLOQUEO_TIER_CONFIG[bloqueoTier];
  const fenixPointsPct   = tierConfig.fenixPointsPct;

  // ── 3. PRECIO TARJETA CONTADO (divide method) ─────────────────────────────
  const precioTarjeta    = r2(precioVenta / (1 - comisionClip));
  const comisionClipMonto = r2(precioTarjeta - precioVenta);

  // ── 4. FÉNIX POINTS ───────────────────────────────────────────────────────
  const kuaniGenerados   = Math.floor(precioVenta * fenixPointsPct);

  // ── 5. DESCUENTO POR REDENCIÓN (máx = gananciaAgencia para proteger el 5%)
  const maxDescuento     = gananciaAgencia; // nunca sacrifica el costo de la agencia
  const kuaniDescuento   = r2(Math.min(kuaniPuntosCliente, maxDescuento));
  const precioEfectivoFinal = r2(Math.max(0, precioVenta - kuaniDescuento));
  const precioTarjetaFinal  = r2(precioEfectivoFinal / (1 - comisionClip));

  // ── 6. PRECIO POR PERSONA ─────────────────────────────────────────────────
  const precioPorPersona = r2(precioEfectivoFinal / pax);

  // ── 7. OPCIONES MSI (tier + monto mínimo, solo pago total) ───────────────
  const msiOpciones: MSIOpcion[] = precioVenta >= MSI_MONTO_MINIMO
    ? tierConfig.msiPlazos.map(plazo => {
        const tasa       = MSI_RATES[plazo];
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
    bloqueoTier,
    fenixPointsPct,
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
    bloqueoTier: 'BASICO', fenixPointsPct: 0.01,
    kuaniGenerados: 0, kuaniDescuento: 0,
    precioEfectivoFinal: 0, precioTarjetaFinal: 0, precioPorPersona: 0,
    msiOpciones: [],
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Helper: desde datos de un bloqueo individual */
export function calcularPrecioBloqueo(params: {
  precioHabitacion: number;
  adultos: number;
  menores: number;
  juniors: number;
  infantes: number;
  noches: number;
  /** @deprecated ignorado — tier se calcula por tarifaNeta automáticamente */
  kuaniTier?: string;
  kuaniPuntos?: number;
  config?: PricingConfig;
}): PricingOutput {
  return calcularPrecio(
    {
      tarifaPublicaPPPN:    0,
      precioHabitacionTotal: params.precioHabitacion,
      adultos:  params.adultos,
      menores:  params.menores,
      juniors:  params.juniors,
      infantes: params.infantes,
      noches:   params.noches,
      kuaniPuntosCliente: params.kuaniPuntos,
    },
    params.config ?? PRICING_CONFIG_DEFAULT
  );
}

/**
 * Calcula el precio para un plazo MSI específico.
 * Solo válido para PAGO TOTAL — nunca anticipos.
 * Retorna null si el monto < mínimo, el plazo no existe o no aplica al tier.
 */
export function calcularOpcionMSI(
  precioVenta: number,
  tarifaNeta: number,
  plazo: number
): MSIOpcion | null {
  if (precioVenta < MSI_MONTO_MINIMO) return null;
  const tier = getBloqueoTier(tarifaNeta);
  if (!BLOQUEO_TIER_CONFIG[tier].msiPlazos.includes(plazo)) return null;
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

// Mantener compatibilidad con código que importa KuaniTier
export type KuaniTier = BloqueoTier;
export const KUANI_PCT_BY_TIER = {
  BASICO:        0.01,
  MEDIO:         0.02,
  PREMIUM:       0.03,
  ESTANDAR:      0.01,
  'PREMIUM PLUS': 0.02,
  LUXURY:        0.03,
} as const;
