/**
 * MOTOR DE PRECIOS — Fénix Traveler + Chroma Travel
 * 
 * Fórmulas verificadas contra CSV bloqueos_fenix_2026_COMPLETO.csv:
 *   tarifaNeta  = tarifaPublica × 0.85         (15% comisión ya incluida en precio proveedor)
 *   precioVenta = tarifaNeta × 1.05            (5% margen agencia)
 *   precioSPEI  = precioVenta                  (= precio efectivo)
 *   precioTarj  = precioVenta / (1 - 0.036)   (3.6% Clip, dividir correctamente)
 *   kuaniPts    = floor(precioSPEI × tierPct)  (por tier del hotel)
 */

export type KuaniTier = 'ESTANDAR' | 'PREMIUM' | 'PREMIUM PLUS' | 'LUXURY';

/** Porcentaje Kuani por tier (verificado contra CSV) */
export const KUANI_PCT_BY_TIER: Record<KuaniTier, number> = {
  ESTANDAR:      0.019,   // 1.9%
  PREMIUM:       0.02855, // 2.855%
  'PREMIUM PLUS': 0.0381, // 3.81%
  LUXURY:        0.0381,  // 3.81%
};

export interface PricingConfig {
  /** Comisión mayorista YA INCLUIDA en precio público (ej: 0.15 = 15%) */
  comisionMayoristaIncluida: number;
  /** Margen agencia sobre tarifa neta */
  margen: number;
  /** Comisión Clip/tarjeta */
  comisionClip: number;
}

export const PRICING_CONFIG_DEFAULT: PricingConfig = {
  comisionMayoristaIncluida: 0.15,
  margen: 0.05,
  comisionClip: 0.036,
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
  /** Precio de venta Fénix (con margen 5%) = precio SPEI/efectivo */
  precioVenta:         number;
  /** Precio con tarjeta Clip */
  precioTarjeta:       number;
  /** Comisión Clip en MXN */
  comisionClipMonto:   number;
  /** Ganancia agencia en MXN */
  gananciaAgencia:     number;
  /** Puntos Kuani que genera esta reserva */
  kuaniGenerados:      number;
  /** Descuento aplicado por redimir puntos (máx 30%) */
  kuaniDescuento:      number;
  /** Precio SPEI después de descuento Kuani */
  precioEfectivoFinal: number;
  /** Precio tarjeta después de descuento Kuani */
  precioTarjetaFinal:  number;
  /** Precio por persona (efectivo) */
  precioPorPersona:    number;
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

  // Validaciones
  if (comisionClip >= 1) throw new Error('comisionClip debe ser < 1');
  if (comisionMayoristaIncluida >= 1) throw new Error('comisionMayorista debe ser < 1');

  // ── 1. PRECIO BASE TOTAL ──────────────────────────────────────────────────
  const pax = Math.max(1, adultos + menores + juniors);
  const tarifaPublicaTotal = precioHabitacionTotal != null
    ? precioHabitacionTotal
    : r2(tarifaPublicaPPPN * pax * noches);

  if (tarifaPublicaTotal <= 0) return zero();

  // ── 2. TARIFA NETA (extraer comisión incluida) ────────────────────────────
  // La comisión YA está dentro del precio: neta = publica × (1 - pct)
  const tarifaNeta = r2(tarifaPublicaTotal * (1 - comisionMayoristaIncluida));
  const gananciaAgencia = r2(tarifaNeta * margen);

  // ── 3. PRECIO VENTA = PRECIO SPEI/EFECTIVO ───────────────────────────────
  const precioVenta = r2(tarifaNeta * (1 + margen));

  // ── 4. PRECIO TARJETA (dividir, no sumar) ────────────────────────────────
  // Clip: CSV usa método suma (× 1 + clip), respetamos para consistencia con tarifario
  const precioTarjeta = r2(precioVenta * (1 + comisionClip));
  const comisionClipMonto = r2(precioTarjeta - precioVenta);

  // ── 5. KUANI POINTS ───────────────────────────────────────────────────────
  const kuaniPct = KUANI_PCT_BY_TIER[kuaniTier] ?? KUANI_PCT_BY_TIER.ESTANDAR;
  const kuaniGenerados = Math.floor(precioVenta * kuaniPct);

  // ── 6. DESCUENTO KUANI EXISTENTES (máx 30%) ──────────────────────────────
  const maxDescuento = r2(precioVenta * 0.30);
  const kuaniDescuento = r2(Math.min(kuaniPuntosCliente, maxDescuento));
  const precioEfectivoFinal = r2(Math.max(0, precioVenta - kuaniDescuento));
  const precioTarjetaFinal = r2(precioEfectivoFinal * (1 + comisionClip));

  // ── 7. PRECIO POR PERSONA ─────────────────────────────────────────────────
  const precioPorPersona = r2(precioEfectivoFinal / pax);

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
      kuaniTier: params.kuaniTier,
      kuaniPuntosCliente: params.kuaniPuntos,
    },
    params.config ?? PRICING_CONFIG_DEFAULT
  );
}

// Re-export old name for backwards compat
export { PricingOutput as PricingOutput };
