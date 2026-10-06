<script setup lang="ts">
import { computed } from 'vue'
import { money, monthNames } from '../lib/calculations'
import type { B2bPlanImpact } from '../lib/b2b-plan-impact'

const props = defineProps<{ impact: B2bPlanImpact }>()

const changedMonthLabels = computed(() =>
  props.impact.changedMonths.map((month) => monthNames[month - 1]).join(', '),
)
const signedMoney = (amount: number) => `${amount > 0 ? '+' : ''}${money(amount)}`
</script>

<template>
  <section
    class="mt-9 rounded-[25px] border border-[#d9e7d9] bg-[#fffefa] p-5 sm:p-7"
    aria-labelledby="b2b-plan-impact-heading"
    aria-live="polite"
  >
    <p class="text-xs font-extrabold uppercase tracking-[.15em] text-[#a97e5a]">
      DWA WARIANTY · TEN SAM ROK
    </p>
    <h2
      id="b2b-plan-impact-heading"
      class="mt-2 font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[#214d38] sm:text-3xl"
    >
      Co zmienia Twój plan faktur?
    </h2>
    <p class="mt-2 max-w-3xl text-sm leading-6 text-[#667e6b]">
      Porównujemy 12 pełnych faktur bazowych z Twoim planem. Koszty, forma podatku i składki są w
      obu wariantach takie same; każdy rok liczymy osobno, wraz z szacowanym wyrównaniem zdrowotnej.
    </p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-[#dce8db] bg-white p-5">
        <h3 class="font-bold text-[#214d38]">Bez zmian w fakturach</h3>
        <p class="mt-1 text-xs text-[#667e6b]">
          12 faktur po {{ money(impact.baseline.months[0]?.invoice ?? 0) }}
        </p>
        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-[#667e6b]">Faktury w roku</dt>
            <dd class="font-semibold text-[#214d38]">
              {{ money(impact.baseline.totals.invoice) }}
            </dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2 border-t border-[#e5ede2] pt-3">
            <dt class="font-semibold text-[#214d38]">Zostaje po obciążeniach</dt>
            <dd class="font-bold text-[#214d38]">
              {{ money(impact.baseline.netAfterHealthSettlement) }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="rounded-xl border border-[#bddcc5] bg-[#eaf5e9] p-5">
        <h3 class="font-bold text-[#214d38]">Twój plan faktur</h3>
        <p class="mt-1 text-xs text-[#667e6b]">
          {{
            impact.changedMonths.length
              ? `Inne kwoty: ${changedMonthLabels}`
              : 'Kwoty takie jak w wariancie bazowym'
          }}
        </p>
        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-[#667e6b]">Faktury w roku</dt>
            <dd class="font-semibold text-[#214d38]">{{ money(impact.planned.totals.invoice) }}</dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2 border-t border-[#cce2cf] pt-3">
            <dt class="font-semibold text-[#214d38]">Zostaje po obciążeniach</dt>
            <dd class="font-bold text-[#214d38]">
              {{ money(impact.planned.netAfterHealthSettlement) }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="mt-4 grid gap-3 rounded-xl bg-[#214d38] p-5 text-white sm:grid-cols-2">
      <div>
        <p class="text-xs text-white/75">Zmiana sumy faktur</p>
        <strong class="mt-1 block text-xl">{{ signedMoney(impact.invoiceDifference) }}</strong>
      </div>
      <div>
        <p class="text-xs text-white/75">Zmiana kwoty, która zostaje</p>
        <strong class="mt-1 block text-xl">{{ signedMoney(impact.netDifference) }}</strong>
      </div>
    </div>
    <p class="mt-4 text-xs leading-5 text-[#667e6b]">
      Różnica dotyczy tylko zmiany faktur w podanych miesiącach. To szacunek rocznego wyniku po
      obciążeniach, nie harmonogram płatności ani prognoza salda konta.
    </p>
  </section>
</template>
