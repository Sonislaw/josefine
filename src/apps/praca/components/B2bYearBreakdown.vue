<script setup lang="ts">
import { money, monthNames } from '../lib/calculations'
import type { B2bYearEvent, B2bYearResult } from '../lib/b2b-year'

defineProps<{ result: B2bYearResult }>()

const eventLabels: Record<B2bYearEvent, string> = {
  'health-60k': 'Przekroczono 60 tys. zł przychodu dla zdrowotnej',
  'health-300k': 'Przekroczono 300 tys. zł przychodu dla zdrowotnej',
  'pit-threshold': 'Przekroczono próg PIT',
  'zus-transition': 'Koniec ulgi na start — składki preferencyjne',
}
</script>

<template>
  <section
    class="mt-9 rounded-[25px] border border-[#d9e7d9] bg-[#fffefa] p-5 sm:p-7"
    aria-labelledby="b2b-year-heading"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-extrabold uppercase tracking-[.15em] text-[#a97e5a]">
          ROK 2026 · B2B
        </p>
        <h2
          id="b2b-year-heading"
          class="mt-2 font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[#214d38] sm:text-3xl"
        >
          Firma miesiąc po miesiącu
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-[#667e6b]">
          Stała faktura i koszty przez 12 miesięcy. Podatek i progi zdrowotnej liczymy narastająco,
          więc wynik nie jest po prostu mnożeniem jednego miesiąca przez dwanaście.
        </p>
      </div>
      <div class="rounded-xl bg-[#e8f0e6] px-4 py-3 text-right">
        <span class="block text-xs text-[#667e6b]">Suma po miesięcznych obciążeniach</span>
        <strong class="text-lg text-[#214d38]">{{ money(result.totals.net) }}</strong>
      </div>
    </div>

    <div class="mt-6 space-y-2 md:hidden">
      <details
        v-for="item in result.months"
        :key="item.month"
        class="rounded-xl border border-[#dce8db] bg-white p-4"
        :open="item.month === 1"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-[#214d38]"
        >
          <span class="capitalize">{{ monthNames[item.month - 1] }}</span>
          <span>{{ money(item.net) }}</span>
        </summary>
        <div v-if="item.events.length" class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="event in item.events"
            :key="event"
            class="rounded-full bg-[#fff1e4] px-2 py-1 text-xs font-semibold text-[#8f5135]"
            >{{ eventLabels[event] }}</span
          >
        </div>
        <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#e5ede2] pt-3 text-xs">
          <dt>Faktura bez VAT</dt>
          <dd class="text-right font-semibold">{{ money(item.invoice) }}</dd>
          <dt>Koszty</dt>
          <dd class="text-right font-semibold">{{ money(item.costs) }}</dd>
          <dt>Składki społeczne</dt>
          <dd class="text-right font-semibold">{{ money(item.social) }}</dd>
          <dt>Zdrowotna</dt>
          <dd class="text-right font-semibold">{{ money(item.health) }}</dd>
          <dt>Podatek</dt>
          <dd class="text-right font-semibold">{{ money(item.tax) }}</dd>
        </dl>
      </details>
    </div>

    <div class="mt-6 hidden overflow-x-auto rounded-xl border border-[#dce8db] md:block">
      <table class="w-full min-w-[850px] border-collapse bg-white text-left text-xs lg:text-sm">
        <caption class="sr-only">
          Szacunek rozliczenia B2B za 12 miesięcy 2026 roku
        </caption>
        <thead class="bg-[#edf3e9] text-[#315a42]">
          <tr>
            <th scope="col" class="px-3 py-3">Miesiąc</th>
            <th scope="col" class="px-3 py-3 text-right">Faktura</th>
            <th scope="col" class="px-3 py-3 text-right">Koszty</th>
            <th scope="col" class="px-3 py-3 text-right">Społeczne</th>
            <th scope="col" class="px-3 py-3 text-right">Zdrowotna</th>
            <th scope="col" class="px-3 py-3 text-right">Podatek</th>
            <th scope="col" class="px-3 py-3 text-right">Zostaje</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in result.months"
            :key="item.month"
            class="border-t border-[#e5ede2] align-top"
          >
            <th scope="row" class="px-3 py-3 font-semibold capitalize text-[#214d38]">
              {{ monthNames[item.month - 1] }}
              <span
                v-for="event in item.events"
                :key="event"
                class="mt-1 block text-[.68rem] font-semibold normal-case leading-4 text-[#9c583b]"
                >{{ eventLabels[event] }}</span
              >
            </th>
            <td class="px-3 py-3 text-right">{{ money(item.invoice) }}</td>
            <td class="px-3 py-3 text-right">{{ money(item.costs) }}</td>
            <td class="px-3 py-3 text-right">{{ money(item.social) }}</td>
            <td class="px-3 py-3 text-right">{{ money(item.health) }}</td>
            <td class="px-3 py-3 text-right">{{ money(item.tax) }}</td>
            <td class="px-3 py-3 text-right font-bold text-[#214d38]">{{ money(item.net) }}</td>
          </tr>
        </tbody>
        <tfoot class="border-t-2 border-[#cbdcc9] bg-[#f2f7ee] font-bold text-[#214d38]">
          <tr>
            <th scope="row" class="px-3 py-3">Razem</th>
            <td class="px-3 py-3 text-right">{{ money(result.totals.invoice) }}</td>
            <td class="px-3 py-3 text-right">{{ money(result.totals.costs) }}</td>
            <td class="px-3 py-3 text-right">{{ money(result.totals.social) }}</td>
            <td class="px-3 py-3 text-right">{{ money(result.totals.health) }}</td>
            <td class="px-3 py-3 text-right">{{ money(result.totals.tax) }}</td>
            <td class="px-3 py-3 text-right">{{ money(result.totals.net) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <p v-if="result.healthSettlement" class="mt-4 text-sm leading-6 text-[#667e6b]">
      Po roku może dojść jeszcze szacowana dopłata zdrowotnej:
      <strong class="text-[#214d38]">{{ money(result.healthSettlement) }}</strong
      >. Nie jest ujęta w miesięcznych wypłatach powyżej.
    </p>
  </section>
</template>
