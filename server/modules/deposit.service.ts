/**
 * Regla única de depósitos — fuente de verdad para toda la plataforma.
 *
 * Thresholds (días al check-in desde hoy):
 *   ≤ 10 días → 100% pago completo (MSI elegible si precio ≥ $7,000)
 *   ≤ 24 días →  70% anticipo
 *   ≤ 89 días →  50% anticipo
 *   > 89 días →  30% anticipo
 *
 * Fuente canónica: server/routes.ts `serverGetDeposit()` implementa la misma lógica.
 * Este módulo se importa desde ota-b2c-routes.ts para el endpoint /api/calculate-deposit.
 */

export interface DepositBreakdown {
  percent: number;
  label: string;
  policy: string;
  depositAmount: number;
  balanceAmount: number;
  daysUntilCheckIn: number;
  nonRefundable: boolean;
}

export function calculateDeposit(checkInDate: Date, totalAmount: number): DepositBreakdown {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ci = new Date(checkInDate);
  ci.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((ci.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  let percent: number;
  let label: string;
  let policy: string;

  if (days <= 10) {
    percent = 100;
    label = "Pago total requerido";
    policy = "10 días o menos al check-in — pago completo no reembolsable";
  } else if (days <= 24) {
    percent = 70;
    label = "70% anticipo";
    policy = "11-24 días al check-in — 70% anticipo no reembolsable";
  } else if (days <= 89) {
    percent = 50;
    label = "50% anticipo";
    policy = "25-89 días al check-in — 50% anticipo";
  } else {
    percent = 30;
    label = "30% anticipo";
    policy = "90+ días al check-in — 30% anticipo";
  }

  const depositAmount = Math.ceil(totalAmount * percent / 100);
  const balanceAmount = Math.max(0, totalAmount - depositAmount);

  return {
    percent,
    label,
    policy,
    depositAmount,
    balanceAmount,
    daysUntilCheckIn: days,
    nonRefundable: percent === 100,
  };
}
