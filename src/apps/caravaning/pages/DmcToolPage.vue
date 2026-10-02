<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw, Scale } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/apps/caravaning/components/ui/button'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import { numberShareField, useShareableCalculator } from '@/shared/composables/useShareableCalculator'

const carDmc = ref<number | string>('')
const trailerDmc = ref<number | string>('')
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  numberShareField('auto', carDmc, { min: 1, integer: true, allowEmpty: true }),
  numberShareField('przyczepa', trailerDmc, { min: 1, integer: true, allowEmpty: true }),
])

const totalDmc = computed(() => Number(carDmc.value) + Number(trailerDmc.value))
const hasBothValues = computed(() => Number(carDmc.value) > 0 && Number(trailerDmc.value) > 0)

const formattedTotal = computed(() =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(totalDmc.value),
)

const licenseRecommendation = computed(() => {
  if (!hasBothValues.value) {
    return {
      category: '—',
      explanation: 'Uzupełnij DMC obu pojazdów, aby zobaczyć podpowiedź.',
    }
  }

  const carMass = Number(carDmc.value)
  const trailerMass = Number(trailerDmc.value)

  if (carMass > 3500 || trailerMass > 3500) {
    return {
      category: 'Poza zakresem',
      explanation:
        'DMC jednego z pojazdów przekracza 3500 kg. Sprawdź wymagania dla odpowiedniej kategorii.',
    }
  }

  if (trailerMass <= 750) {
    return {
      category: 'B',
      explanation: 'Orientacyjnie: samochód do 3500 kg z przyczepą lekką do 750 kg.',
    }
  }

  if (totalDmc.value <= 3500) {
    return {
      category: 'B',
      explanation: 'Orientacyjnie: łączne DMC zestawu nie przekracza 3500 kg.',
    }
  }

  if (totalDmc.value <= 4250) {
    return {
      category: 'B96',
      explanation:
        'Orientacyjnie: przyczepa cięższa niż 750 kg, a łączne DMC nie przekracza 4250 kg.',
    }
  }

  return {
    category: 'B+E',
    explanation: 'Orientacyjnie dla zestawu powyżej 4250 kg z przyczepą o DMC do 3500 kg.',
  }
})

const resetCalculator = () => {
  carDmc.value = ''
  trailerDmc.value = ''
}

const frequentlyAskedQuestions = [
  {
    question: 'Jak obliczyć łączne DMC samochodu i przyczepy?',
    answer:
      'Dodaj DMC samochodu i DMC przyczepy odczytane z dokumentów pojazdów. Kalkulator pokazuje wyłącznie arytmetyczną sumę tych dwóch wartości.',
  },
  {
    question: 'Czy wynik oznacza rzeczywistą masę zestawu podczas podróży?',
    answer:
      'Nie. To suma dopuszczalnych mas całkowitych, a nie rzeczywista masa samochodu, przyczepy ani załadowanego zestawu.',
  },
  {
    question: 'Jak kalkulator orientacyjnie dobiera kategorię prawa jazdy?',
    answer:
      'Podpowiedź uwzględnia DMC samochodu, DMC przyczepy i ich sumę. Rozróżnia przyczepę lekką do 750 kg, zakres B96 do 4250 kg oraz orientacyjny próg B+E powyżej 4250 kg.',
  },
  {
    question: 'Czy podpowiedź kategorii prawa jazdy jest wiążąca?',
    answer:
      'Nie. To orientacyjna informacja oparta na DMC, a nie potwierdzenie uprawnień. Sprawdź aktualne przepisy, dokumenty pojazdów oraz dopuszczalne masy przyczepy dla samochodu.',
  },
  {
    question: 'Kiedy wynik jest poza zakresem kalkulatora?',
    answer:
      'Kalkulator nie określa kategorii, gdy DMC samochodu lub przyczepy przekracza 3500 kg. W takiej sytuacji sprawdź wymagania dla kategorii obejmujących cięższe pojazdy i zestawy.',
  },
  {
    question: 'Gdzie sprawdzić wymagania dotyczące prawa jazdy?',
    answer:
      'Sprawdź aktualne brzmienie art. 6 ustawy o kierujących pojazdami oraz dane pojazdów w ich dokumentach. W razie wątpliwości skonsultuj się z właściwym urzędem.',
  },
]

useCaravaningSeo('dmc', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Kalkulator DMC zestawu',
      description: 'Bezpłatny kalkulator sumujący DMC samochodu i przyczepy kempingowej.',
      url: `${siteUrl}/kalkulator-dmc`,
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
      <p class="mt-6 text-sm font-semibold text-primary">Bezpiecznie zaplanuj zestaw</p>
      <h1 class="mt-2 font-heading text-3xl font-bold tracking-normal sm:text-4xl">
        Kalkulator DMC zestawu
      </h1>
      <p class="mt-3 text-base leading-7 text-muted-foreground">
        Zacznij od danych w dokumentach pojazdów. Zestaw DMC samochodu i przyczepy, aby świadomiej
        zaplanować podróż oraz sprawdzić orientacyjną kategorię uprawnień.
      </p>
    </div>

    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)] lg:gap-8">
      <section
        aria-labelledby="calculator-heading"
        class="caravaning-form-panel border border-border bg-card p-5 sm:p-8"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="calculator-heading" class="font-heading text-lg font-semibold tracking-normal">
              Dane pojazdów
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Wprowadź wartości z dowodów rejestracyjnych.
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

        <form class="mt-8 space-y-6" @submit.prevent>
          <div class="space-y-2">
            <label for="car-dmc" class="text-sm font-medium">DMC samochodu</label>
            <div class="relative">
              <input
                id="car-dmc"
                v-model.number="carDmc"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                placeholder="np. 2500"
                class="h-12 w-full rounded-md border border-input bg-background px-4 pr-14 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
              <span
                class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >kg</span
              >
            </div>
          </div>

          <div class="space-y-2">
            <label for="trailer-dmc" class="text-sm font-medium">DMC przyczepy</label>
            <div class="relative">
              <input
                id="trailer-dmc"
                v-model.number="trailerDmc"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                placeholder="np. 1500"
                class="h-12 w-full rounded-md border border-input bg-background px-4 pr-14 text-base tabular-nums outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
              <span
                class="absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
                >kg</span
              >
            </div>
          </div>
        </form>

        <p class="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Podpowiedź jest orientacyjna i nie uwzględnia wszystkich ograniczeń pojazdu ani sytuacji
          prawnej kierowcy.
        </p>
      </section>

      <section
        aria-live="polite"
        aria-label="Wynik kalkulacji"
        class="caravaning-result-panel flex min-h-72 flex-col justify-between bg-[#17362f] p-6 text-white sm:p-8"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-100">Wynik kalkulacji</p>
            <h2 class="mt-1 font-heading text-xl font-semibold tracking-normal">
              Łączne DMC zestawu
            </h2>
          </div>
          <span
            class="flex size-11 items-center justify-center rounded-md border border-white/15 bg-white/10"
          >
            <Scale class="size-5 text-emerald-100" aria-hidden="true" />
          </span>
        </div>

        <div class="py-8">
          <p
            v-if="hasBothValues"
            class="font-heading text-5xl font-bold tabular-nums tracking-normal sm:text-6xl"
          >
            {{ formattedTotal }}
            <span class="text-2xl font-medium text-white/70 sm:text-3xl">kg</span>
          </p>
          <p v-else class="max-w-xs text-base leading-7 text-white/70">
            Uzupełnij DMC samochodu i przyczepy, aby zobaczyć wynik.
          </p>
        </div>

        <div class="border-t border-white/20 pt-5">
          <p class="text-xs font-semibold uppercase text-emerald-100">
            Orientacyjny rodzaj prawa jazdy
          </p>
          <div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p class="font-heading text-3xl font-bold tracking-normal text-white">
              {{ licenseRecommendation.category }}
            </p>
            <p class="max-w-sm text-sm leading-6 text-white/85">
              {{ licenseRecommendation.explanation }}
            </p>
          </div>
        </div>
        <ShareResultButton :get-url="buildShareUrl" :disabled="!hasBothValues || !canShareInputs" class="mt-6 self-start" />
      </section>
    </div>

    <aside
      class="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
    >
      <strong>Wynik orientacyjny, nie porada prawna.</strong>
      Potwierdź kategorię w aktualnych przepisach i sprawdź dokumenty oraz ograniczenia techniczne
      samochodu i przyczepy.
    </aside>

    <section class="mt-12 grid gap-8 border-t border-border pt-10 md:grid-cols-2">
      <div>
        <h2 class="font-heading text-xl font-semibold tracking-normal">
          Jak obliczyć łączne DMC zestawu?
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          Wpisz DMC samochodu oraz DMC przyczepy z ich dokumentów rejestracyjnych. Kalkulator dodaje
          obie wartości i podaje wynik w kilogramach. DMC to dopuszczalna masa całkowita, a nie
          rzeczywista masa pojazdu w danej podróży.
        </p>
      </div>
      <div>
        <h2 class="font-heading text-xl font-semibold tracking-normal">
          Wynik a uprawnienia kierowcy
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          Kalkulator podaje orientacyjną kategorię na podstawie DMC samochodu, DMC przyczepy i sumy
          zestawu. Sama podpowiedź nie wystarcza do potwierdzenia uprawnień; uwzględnij parametry
          obu pojazdów i aktualne przepisy.
        </p>
        <a
          href="https://eli.gov.pl/api/acts/DU/2024/1210/text.html"
          target="_blank"
          rel="noreferrer"
          class="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4"
        >
          Ustawa o kierujących pojazdami, art. 6
        </a>
        <p class="mt-2 text-xs leading-5 text-muted-foreground">
          Przed wyjazdem sprawdź aktualny tekst przepisów oraz wartości i ograniczenia wpisane w
          dokumentach pojazdów.
        </p>
      </div>
    </section>

    <section aria-labelledby="faq-heading" class="mt-12 border-t border-border pt-10">
      <h2 id="faq-heading" class="font-heading text-2xl font-bold tracking-normal">
        Najczęstsze pytania o DMC zestawu
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
