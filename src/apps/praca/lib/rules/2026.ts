/**
 * Parametry wersjonujemy według roku podatkowego. Reguły rozliczane narastająco
 * (np. PIT-0, progi PIT i roczne rozliczenie zdrowotnej) wymagają osobnego modelu.
 * Źródła i zakres uproszczeń: ../METODOLOGIA.md.
 */
export const rules2026 = {
  year: 2026,
  uop: {
    employee: { pension: 0.0976, disability: 0.015, sickness: 0.0245 },
    health: 0.09,
    youngReliefLimit: 85_528,
    pensionDisabilityAnnualBaseLimit: 282_600,
    kup: { standard: 250, elevated: 300 },
    employer: {
      pension: 0.0976,
      disability: 0.065,
      accident: 0.0167,
      laborFund: 0.0245,
      guaranteedFund: 0.001,
    },
    ppk: { employee: 0.02, employer: 0.015 },
  },
  b2b: {
    social: {
      start: { withSickness: 0, withoutSickness: 0 },
      preferential: { withSickness: 456.18, withoutSickness: 420.86 },
      full: { withSickness: 1926.76, withoutSickness: 1788.29 },
    },
    health: {
      scaleRate: 0.09,
      linearRate: 0.049,
      januaryMinimum: 314.96,
      minimumFromFebruary: 432.54,
      lumpThresholds: [60_000, 300_000],
      lumpAmounts: [498.35, 830.58, 1495.04],
    },
    linearTaxRate: 0.19,
    linearHealthDeductionLimit: 14_100,
  },
  scale: { annualThreshold: 120_000, lowerRate: 0.12, upperRate: 0.32, annualReduction: 3600 },
} as const
