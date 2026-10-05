<script setup lang="ts">
import { money, monthNames } from '../lib/calculations'
import type { B2bYearEvent } from '../lib/b2b-year'
import type { UopLimitEvent } from '../lib/uop-year'
import type { WorkYearComparison } from '../lib/work-year-comparison'

defineProps<{ result: WorkYearComparison }>()

const uopEventLabels: Record<UopLimitEvent, string> = {
  'young-relief': 'Limit ulgi dla młodych',
  'pit-threshold': 'Próg PIT',
  'social-base': 'Limit składek emerytalno-rentowych',
}
const b2bEventLabels: Record<B2bYearEvent, string> = {
  'health-60k': 'Próg zdrowotnej: 60 tys. zł',
  'health-300k': 'Próg zdrowotnej: 300 tys. zł',
  'pit-threshold': 'Próg PIT',
  'zus-transition': 'Koniec ulgi na start',
}
</script>

<template>
  <section
    class="mt-9 rounded-[25px] border border-[#d9e7d9] bg-[#fffefa] p-5 sm:p-7"
    aria-labelledby="work-year-comparison-heading"
  >
    <p class="text-xs font-extrabold uppercase tracking-[.15em] text-[#a97e5a]">
      12 MIESIĘCY · {{ result.year }}
    </p>
    <h2
      id="work-year-comparison-heading"
      class="mt-2 font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[#214d38] sm:text-3xl"
    >
      Różnica miesiąc po miesiącu
    </h2>
    <p class="mt-2 max-w-3xl text-sm leading-6 text-[#667e6b]">
      Oba scenariusze liczymy narastająco. Dodatnia różnica oznacza, że w danym miesiącu więcej
      środków zostaje z B2B. Ewentualną dopłatę zdrowotnej na ryczałcie pokazujemy osobno pod
      tabelą, bo jest rozliczana po roku.
    </p>

    <div class="mt-6 space-y-2 md:hidden">
      <div
        v-for="item in result.months"
        :key="item.month"
        class="rounded-xl border border-[#dce8db] bg-white p-4"
      >
        <h3 class="font-bold capitalize text-[#214d38]">{{ monthNames[item.month - 1] }}</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt>UoP netto</dt>
          <dd class="text-right font-semibold">{{ money(item.uop.net) }}</dd>
          <dt>B2B po obciążeniach</dt>
          <dd class="text-right font-semibold">{{ money(item.b2b.net) }}</dd>
          <dt class="border-t border-[#e5ede2] pt-2 font-bold">Różnica na B2B</dt>
          <dd class="border-t border-[#e5ede2] pt-2 text-right font-bold text-[#214d38]">
            {{ item.difference > 0 ? '+' : '' }}{{ money(item.difference) }}
          </dd>
        </dl>
        <div
          v-if="item.uop.events.length || item.b2b.events.length"
          class="mt-3 flex flex-wrap gap-1.5"
        >
          <span
            v-for="event in item.uop.events"
            :key="`uop-${event}`"
            class="rounded-full bg-[#e8f0e6] px-2 py-1 text-xs font-semibold text-[#315a42]"
            >UoP: {{ uopEventLabels[event] }}</span
          >
          <span
            v-for="event in item.b2b.events"
            :key="`b2b-${event}`"
            class="rounded-full bg-[#fff1e4] px-2 py-1 text-xs font-semibold text-[#8f5135]"
            >B2B: {{ b2bEventLabels[event] }}</span
          >
        </div>
      </div>
    </div>

    <div class="mt-6 hidden overflow-x-auto rounded-xl border border-[#dce8db] md:block">
      <table class="w-full min-w-[680px] border-collapse bg-white text-left text-sm">
        <caption class="sr-only">
          Roczne porównanie wynagrodzenia UoP i B2B w
          {{
            result.year
          }}
          roku
        </caption>
        <thead class="bg-[#edf3e9] text-[#315a42]">
          <tr>
            <th scope="col" class="px-4 py-3">Miesiąc</th>
            <th scope="col" class="px-4 py-3 text-right">UoP netto</th>
            <th scope="col" class="px-4 py-3 text-right">B2B po obciążeniach</th>
            <th scope="col" class="px-4 py-3 text-right">Różnica na B2B</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in result.months"
            :key="item.month"
            class="border-t border-[#e5ede2] align-top"
          >
            <th scope="row" class="px-4 py-3 font-semibold capitalize text-[#214d38]">
              {{ monthNames[item.month - 1] }}
              <span
                v-for="event in item.uop.events"
                :key="`uop-${event}`"
                class="mt-1 block text-xs font-medium normal-case text-[#315a42]"
                >UoP: {{ uopEventLabels[event] }}</span
              >
              <span
                v-for="event in item.b2b.events"
                :key="`b2b-${event}`"
                class="mt-1 block text-xs font-medium normal-case text-[#9c583b]"
                >B2B: {{ b2bEventLabels[event] }}</span
              >
            </th>
            <td class="px-4 py-3 text-right">{{ money(item.uop.net) }}</td>
            <td class="px-4 py-3 text-right">{{ money(item.b2b.net) }}</td>
            <td class="px-4 py-3 text-right font-bold text-[#214d38]">
              {{ item.difference > 0 ? '+' : '' }}{{ money(item.difference) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="border-t-2 border-[#cbdcc9] bg-[#f2f7ee] font-bold text-[#214d38]">
          <tr>
            <th scope="row" class="px-4 py-3">
              {{ result.b2b.healthSettlement > 0 ? 'Razem, przed dopłatą' : 'Razem' }}
            </th>
            <td class="px-4 py-3 text-right">{{ money(result.uop.totals.net) }}</td>
            <td class="px-4 py-3 text-right">{{ money(result.b2b.totals.net) }}</td>
            <td class="px-4 py-3 text-right">
              {{ result.monthlyDifferenceTotal > 0 ? '+' : ''
              }}{{ money(result.monthlyDifferenceTotal) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div
      v-if="result.b2b.healthSettlement"
      class="mt-4 rounded-xl bg-[#fff1e4] p-4 text-sm leading-6 text-[#674b3b]"
    >
      <strong
        >Po roku: szacowana dopłata zdrowotnej B2B {{ money(result.b2b.healthSettlement) }}.</strong
      >
      Po jej uwzględnieniu różnica roczna na B2B wynosi
      {{ result.differenceAfterHealthSettlement > 0 ? '+' : ''
      }}{{ money(result.differenceAfterHealthSettlement) }}. Nie doliczamy dopłaty do żadnego
      miesiąca w tabeli.
    </div>
  </section>
</template>
