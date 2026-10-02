<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, Fuel, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/apps/caravaning/components/ui/button'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'

const oneWayDistance = ref<number | string>('')
const consumption = ref<number | string>('')
const includeTrailerConsumption = ref(false)
const fuelPrice = ref<number | string>('')
const tankCapacity = ref<number | string>('')

const hasRequiredInputs = computed(() =>
  [oneWayDistance.value, consumption.value, fuelPrice.value].every((value) => Number(value) > 0),
)
const hasTankCapacity = computed(() => Number(tankCapacity.value) > 0)
const effectiveConsumption = computed(
  () => Number(consumption.value) * (includeTrailerConsumption.value ? 1.2 : 1),
)

const oneWayFuel = computed(() => (Number(oneWayDistance.value) * effectiveConsumption.value) / 100)
const roundTripFuel = computed(() => oneWayFuel.value * 2)
const oneWayCost = computed(() => oneWayFuel.value * Number(fuelPrice.value))
const roundTripCost = computed(() => oneWayCost.value * 2)
const estimatedRefuels = computed(() => {
  if (!hasTankCapacity.value || !hasRequiredInputs.value) return null
  return Math.max(Math.ceil(roundTripFuel.value / Number(tankCapacity.value)) - 1, 0)
})

const numberFormatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })
const currencyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
})

const formatNumber = (value: number) => numberFormatter.format(value)
const formatCurrency = (value: number) => currencyFormatter.format(value)

const resetCalculator = () => {
  oneWayDistance.value = ''
  consumption.value = ''
  includeTrailerConsumption.value = false
  fuelPrice.value = ''
  tankCapacity.value = ''
}

const frequentlyAskedQuestions = [
  {
    question: 'Jak obliczyć zużycie paliwa na trasie?',
    answer:
      'Kalkulator mnoży dystans w jedną stronę przez średnie spalanie i dzieli wynik przez 100. Dla przykładu 300 km przy spalaniu 8 l/100 km oznacza około 24 l paliwa w jedną stronę.',
  },
  {
    question: 'Jak obliczany jest koszt przejazdu?',
    answer:
      'Koszt to szacowane zużycie paliwa pomnożone przez podaną cenę za litr. Koszt w obie strony zakłada taki sam dystans i spalanie w drodze powrotnej.',
  },
  {
    question: 'Jak kalkulator szacuje liczbę tankowań?',
    answer:
      'Po podaniu opcjonalnej pojemności baku kalkulator szacuje tankowania dla trasy w obie strony, zakładając pełny bak na starcie. Wynik nie uwzględnia rezerwy ani dostępności stacji.',
  },
  {
    question: 'Czy muszę podać pojemność baku?',
    answer:
      'Nie. Dystans, spalanie i cena paliwa wystarczą do obliczenia zużycia oraz kosztów. Pojemność baku jest potrzebna tylko do oszacowania liczby tankowań.',
  },
  {
    question: 'Czy kalkulator uwzględnia spalanie z przyczepą?',
    answer:
      'Tak. Zaznacz opcję uwzględnienia przyczepy, a kalkulator doliczy do podanego średniego spalania 20%. To szacunek — rzeczywista różnica zależy między innymi od prędkości, obciążenia, pogody, trasy i przyczepy.',
  },
]

useCaravaningSeo('consumption', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Kalkulator spalania i kosztu paliwa',
      description:
        'Oblicz zużycie paliwa, koszt przejazdu w jedną stronę i w obie strony oraz szacowaną liczbę tankowań.',
      url: `${siteUrl}/kalkulator-kosztow-podrozy`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: frequentlyAskedQuestions.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
})
</script>

<template>
  <div class="caravaning-tool-page mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <RouterLink
      :to="{ name: 'caravaning' }"
      class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Wszystkie narzędzia
    </RouterLink>

    <div class="caravaning-tool-intro">
      <p class="mt-6 text-sm font-semibold text-primary">Zaplanuj paliwo i budżet drogi</p>
      <h1 class="mt-2 font-heading text-3xl font-bold tracking-normal sm:text-4xl">
        Kalkulator spalania
      </h1>
      <p class="mt-3 text-base leading-7 text-muted-foreground">
        Oblicz zużycie paliwa, koszt przejazdu w jedną stronę i w obie strony oraz szacowaną liczbę
        tankowań.
      </p>
    </div>

    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)] lg:gap-8">
      <section
        aria-labelledby="fuel-form-heading"
        class="caravaning-form-panel border border-border bg-card p-5 sm:p-8"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="fuel-form-heading" class="font-heading text-lg font-semibold tracking-normal">
              Dane podróży
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Podaj wartości dla trasy w jedną stronę.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Wyczyść formularz"
            @click="resetCalculator"
          >
            <RotateCcw class="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form class="mt-8 space-y-5" @submit.prevent>
          <div class="grid gap-5 lg:grid-cols-2">
            <div class="space-y-2">
              <label for="one-way-distance" class="text-sm font-medium"
                >Dystans w jedną stronę</label
              >
              <div class="relative">
                <input
                  id="one-way-distance"
                  v-model.number="oneWayDistance"
                  type="number"
                  inputmode="decimal"
                  min="1"
                  step="1"
                  placeholder="np. 350"
                  class="h-12 w-full rounded-md border border-input bg-background px-4 pr-16 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <span
                  class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >
                  km
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <label for="fuel-consumption" class="text-sm font-medium">Średnie spalanie</label>
              <div class="relative">
                <input
                  id="fuel-consumption"
                  v-model.number="consumption"
                  type="number"
                  inputmode="decimal"
                  min="0.1"
                  step="0.1"
                  placeholder="np. 8,5"
                  class="h-12 w-full rounded-md border border-input bg-background px-4 pr-24 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <span
                  class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >
                  l/100 km
                </span>
              </div>
            </div>
          </div>

          <label
            for="trailer-consumption-uplift"
            class="flex cursor-pointer items-start gap-3 border border-border bg-muted/20 p-3"
          >
            <input
              id="trailer-consumption-uplift"
              v-model="includeTrailerConsumption"
              type="checkbox"
              class="mt-1 size-4 shrink-0 accent-[#315848]"
            />
            <span>
              <span class="block text-sm font-medium">Uwzględnij spalanie z przyczepą (+20%)</span>
              <span class="mt-1 block text-xs leading-5 text-muted-foreground">
                Dodamy 20% do podanego średniego spalania.
              </span>
            </span>
          </label>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="fuel-price" class="text-sm font-medium">Cena paliwa</label>
              <div class="relative">
                <input
                  id="fuel-price"
                  v-model.number="fuelPrice"
                  type="number"
                  inputmode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="np. 6,50"
                  class="h-12 w-full rounded-md border border-input bg-background px-4 pr-12 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <span
                  class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >
                  zł/l
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <label for="tank-capacity" class="text-sm font-medium">
                Pojemność baku <span class="font-normal text-muted-foreground">(opcjonalnie)</span>
              </label>
              <div class="relative">
                <input
                  id="tank-capacity"
                  v-model.number="tankCapacity"
                  type="number"
                  inputmode="decimal"
                  min="1"
                  step="1"
                  placeholder="np. 60"
                  class="h-12 w-full rounded-md border border-input bg-background px-4 pr-14 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <span
                  class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >
                  l
                </span>
              </div>
              <p class="text-xs leading-5 text-muted-foreground">
                Potrzebna tylko do oszacowania liczby tankowań.
              </p>
            </div>
          </div>
        </form>

        <p class="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Jeśli podasz pojemność baku, szacunek tankowań założy pełny bak na starcie. Rzeczywisty
          wynik zależy od warunków jazdy, obciążenia, rezerwy paliwa i dostępności stacji.
        </p>
      </section>

      <section
        aria-live="polite"
        aria-label="Wyniki kalkulatora spalania"
        class="caravaning-result-panel flex flex-col bg-[#17362f] p-6 text-white sm:p-8"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-100">Szacowany koszt</p>
            <h2 class="mt-1 font-heading text-xl font-semibold tracking-normal">W obie strony</h2>
          </div>
          <span
            class="flex size-11 items-center justify-center rounded-md border border-white/15 bg-white/10"
          >
            <Fuel class="size-5 text-emerald-100" aria-hidden="true" />
          </span>
        </div>

        <div class="py-7">
          <p
            v-if="hasRequiredInputs"
            class="font-heading text-5xl font-bold tabular-nums tracking-normal sm:text-6xl"
          >
            {{ formatCurrency(roundTripCost) }}
          </p>
          <p v-else class="max-w-xs text-base leading-7 text-white/70">
            Uzupełnij dystans, spalanie i cenę paliwa, aby zobaczyć wyniki.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-x-5 gap-y-5 border-t border-white/20 pt-5">
          <div>
            <p class="text-xs font-semibold uppercase text-emerald-100">Paliwo, jedna strona</p>
            <p class="mt-1 text-lg font-semibold tabular-nums">
              {{ hasRequiredInputs ? `${formatNumber(oneWayFuel)} l` : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-emerald-100">Koszt, jedna strona</p>
            <p class="mt-1 text-lg font-semibold tabular-nums">
              {{ hasRequiredInputs ? formatCurrency(oneWayCost) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-emerald-100">Dystans łącznie</p>
            <p class="mt-1 text-lg font-semibold tabular-nums">
              {{ hasRequiredInputs ? `${formatNumber(Number(oneWayDistance) * 2)} km` : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-emerald-100">
              {{ includeTrailerConsumption ? 'Spalanie z narzutem' : 'Spalanie bazowe' }}
            </p>
            <p class="mt-1 text-lg font-semibold tabular-nums">
              {{ hasRequiredInputs ? `${formatNumber(effectiveConsumption)} l/100 km` : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-emerald-100">Tankowania</p>
            <p class="mt-1 text-lg font-semibold tabular-nums">
              {{ estimatedRefuels ?? '—' }}
            </p>
            <p v-if="hasRequiredInputs && !hasTankCapacity" class="mt-1 text-xs text-white/60">
              Podaj pojemność baku
            </p>
          </div>
        </div>

        <p class="mt-auto border-t border-white/20 pt-5 text-xs leading-5 text-white/70">
          Szacowane zużycie paliwa w obie strony:
          {{ hasRequiredInputs ? `${formatNumber(roundTripFuel)} l` : '—' }}.
        </p>
      </section>
    </div>

    <section class="mt-12 border-t border-border pt-10">
      <h2 class="font-heading text-xl font-semibold tracking-normal">
        Jak liczymy koszty podróży?
      </h2>
      <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Zużycie paliwa to dystans pomnożony przez średnie spalanie i podzielony przez 100. Koszt
        przejazdu wynika z pomnożenia zużycia przez cenę litra. Wynik w obie strony zakłada ten sam
        dystans i spalanie w drodze powrotnej. Opcja przyczepy dodaje do spalania bazowego narzut
        20%.
      </p>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Szacowana liczba tankowań zakłada pełny bak na starcie i tankowanie po wykorzystaniu
        pojemności zbiornika. Nie uwzględnia rezerwy, postojów ani różnic w spalaniu.
      </p>
    </section>

    <section aria-labelledby="fuel-faq-heading" class="mt-12 border-t border-border pt-10">
      <h2 id="fuel-faq-heading" class="font-heading text-2xl font-bold tracking-normal">
        Najczęstsze pytania o spalanie i koszt podróży
      </h2>
      <div class="mt-5 divide-y divide-border border-y border-border">
        <details v-for="item in frequentlyAskedQuestions" :key="item.question" class="py-4">
          <summary class="cursor-pointer font-medium">{{ item.question }}</summary>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{{ item.answer }}</p>
        </details>
      </div>
    </section>
  </div>
</template>
