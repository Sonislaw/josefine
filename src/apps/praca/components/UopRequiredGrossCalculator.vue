<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight, RotateCcw, Target } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { defaultPeriod, isValidAmount, money, monthNames } from '../lib/calculations'
import { findRequiredUopGross, type UopNetGoal } from '../lib/uop-required-gross'
import { pracaPath, pracaSiteName, pracaSiteUrl, usePracaSeo } from '../seo/usePracaSeo'
import FaqSection from '@/shared/components/FaqSection.vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import UopYearBreakdown from './UopYearBreakdown.vue'
import {
  booleanShareField,
  choiceShareField,
  numberShareField,
  useShareableCalculator,
} from '@/shared/composables/useShareableCalculator'

const year = ref<2026>(defaultPeriod.year)
const targetNet = ref(9_000)
const goal = ref<UopNetGoal>('average')
const under26 = ref(false)
const elevatedKup = ref(false)
const ppk = ref(false)
const validInputs = computed(() => isValidAmount(targetNet.value))
const result = computed(() =>
  validInputs.value
    ? findRequiredUopGross(
        targetNet.value,
        goal.value,
        {
          under26: under26.value,
          elevatedKup: elevatedKup.value,
          ppk: ppk.value,
        },
        year.value,
      )
    : null,
)
const { buildShareUrl, canShareInputs } = useShareableCalculator(() => [
  numberShareField('rok', year, { choices: [2026], integer: true }),
  numberShareField('netto', targetNet, { min: 0, max: 100_000_000 }),
  choiceShareField('cel', goal, ['average', 'every-month']),
  booleanShareField('ponizej26', under26),
  booleanShareField('podwyzszone-kup', elevatedKup),
  booleanShareField('ppk', ppk),
])
const reset = () => {
  year.value = defaultPeriod.year
  targetNet.value = 9_000
  goal.value = 'average'
  under26.value = elevatedKup.value = ppk.value = false
}

const faqs = [
  {
    question: 'Ile brutto potrzeba, żeby otrzymywać 9 000 zł netto na UoP?',
    answer:
      'Wpisz 9 000 zł w polu docelowej wypłaty i wybierz, czy chodzi o średnią z dwunastu miesięcy, czy o minimum w każdym miesiącu. Potrzebne brutto zależy od PPK, kosztów uzyskania przychodu, ulgi dla młodych oraz zmian podatku i składek w ciągu roku. Kalkulator pokaże pierwszą pełną kwotę złotych brutto spełniającą wybrany cel przy przyjętych ustawieniach.',
  },
  {
    question: 'Czym różni się średnie netto od minimum w każdym miesiącu?',
    answer:
      'Średnie netto to suma dwunastu szacowanych wypłat podzielona przez 12. W tym wariancie poszczególne miesiące mogą być niższe od celu. Wariant „co najmniej w każdym miesiącu” wymaga, aby żadna z dwunastu wypłat nie spadła poniżej wpisanej kwoty; dlatego potrzebne brutto może być wyższe.',
  },
  {
    question: 'Dlaczego to samo brutto nie daje identycznego netto przez cały rok?',
    answer:
      'Próg PIT, limit ulgi dla młodych oraz roczny limit podstawy składek emerytalno-rentowych są śledzone narastająco. Po przekroczeniu limitu skład wypłaty może się zmienić. Tabela pokazuje miesiąc po miesiącu, skąd bierze się różnica.',
  },
  {
    question: 'Czy jest to kwota brutto gwarantowana przez pracodawcę?',
    answer:
      'Nie. To symulacja jednego etatu, stałej pensji brutto i dwunastu pełnych miesięcy pracy w 2026 roku. Zakładamy PIT-2 u jednego pracodawcy i brak innych dochodów. Premie, nieobecności, inne ulgi i indywidualne oświadczenia mogą zmienić rzeczywisty przelew.',
  },
]

usePracaSeo('uop-gross', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Kalkulator netto na brutto UoP',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: new URL(pracaPath('/netto-na-brutto-uop'), pracaSiteUrl).href,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      publisher: { '@type': 'Organization', name: pracaSiteName, url: pracaSiteUrl },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:pt-12 lg:px-8">
    <RouterLink
      :to="pracaPath('/')"
      class="inline-flex items-center gap-2 text-sm font-semibold text-[#66736b] hover:text-[#17613f]"
    >
      <ArrowLeft class="size-4" aria-hidden="true" /> Wszystkie kalkulatory
    </RouterLink>

    <header
      class="relative mt-6 overflow-hidden rounded-[26px] border border-[#d8e7d7] bg-[#eaf3e6] p-6 sm:p-10"
    >
      <div class="relative z-10 max-w-3xl">
        <p class="text-xs font-extrabold uppercase tracking-[.18em] text-[#4e8b65]">
          OD CELU NETTO DO PENSJI BRUTTO
        </p>
        <h1
          class="mt-3 font-[var(--font-heading)] text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-[-.05em] text-[#214d38]"
        >
          Ile brutto potrzebujesz, żeby zarabiać tyle na rękę?
        </h1>
        <p class="mt-5 max-w-2xl text-base leading-8 text-[#526e5a]">
          Podaj docelową wypłatę netto na umowie o pracę. Pokażemy potrzebne miesięczne brutto i
          rozpiszemy wszystkie 12 wypłat w {{ year }} roku — także po zmianie progów i limitów.
        </p>
      </div>
      <div
        class="pointer-events-none absolute -right-12 -top-12 grid size-64 rotate-12 place-items-center rounded-[3rem] border border-[#b8d5bc] bg-white/50 text-[#6aa17a] sm:right-8 sm:top-1/2 sm:-translate-y-1/2"
        aria-hidden="true"
      >
        <Target class="size-28" :stroke-width="1.3" />
      </div>
    </header>

    <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
      <section
        class="rounded-[22px] border border-[#e0e8dd] bg-white p-5 shadow-sm sm:p-7"
        aria-labelledby="target-form-heading"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="target-form-heading" class="text-xl font-bold text-[#214d38]">Twój cel</h2>
            <p class="mt-1 text-sm leading-6 text-[#66736b]">
              Wynik aktualizuje się po zmianie danych.
            </p>
          </div>
          <button
            type="button"
            class="grid size-10 shrink-0 place-items-center rounded-lg border border-[#dce8db] text-[#315a42]"
            aria-label="Przywróć wartości początkowe"
            @click="reset"
          >
            <RotateCcw class="size-4" aria-hidden="true" />
          </button>
        </div>

        <label class="mt-7 block">
          <span class="text-sm font-semibold text-[#214d38]"
            >Ile chcesz dostawać na rękę miesięcznie?</span
          >
          <span class="relative mt-2 block">
            <input
              v-model.number="targetNet"
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              class="h-14 w-full rounded-xl border border-[#d7e3d7] bg-[#fcfefb] px-4 pr-14 text-xl font-bold text-[#214d38] outline-none focus:border-[#25815c]"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6b8370]"
              >zł</span
            >
          </span>
        </label>

        <fieldset class="mt-6">
          <legend class="text-sm font-semibold text-[#214d38]">Co ma oznaczać ta kwota?</legend>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <label
              class="cursor-pointer rounded-xl border p-4 text-sm"
              :class="
                goal === 'average' ? 'border-[#67a47d] bg-[#eef7ec]' : 'border-[#e0e8dd] bg-white'
              "
            >
              <span class="flex items-start gap-2"
                ><input
                  v-model="goal"
                  type="radio"
                  value="average"
                  class="mt-1 accent-[#17613f]"
                /><span
                  ><strong class="block text-[#214d38]">Średnio w roku</strong
                  ><span class="mt-1 block leading-6 text-[#66736b]"
                    >Suma 12 wypłat podzielona przez 12.</span
                  ></span
                ></span
              >
            </label>
            <label
              class="cursor-pointer rounded-xl border p-4 text-sm"
              :class="
                goal === 'every-month'
                  ? 'border-[#67a47d] bg-[#eef7ec]'
                  : 'border-[#e0e8dd] bg-white'
              "
            >
              <span class="flex items-start gap-2"
                ><input
                  v-model="goal"
                  type="radio"
                  value="every-month"
                  class="mt-1 accent-[#17613f]"
                /><span
                  ><strong class="block text-[#214d38]">W każdym miesiącu</strong
                  ><span class="mt-1 block leading-6 text-[#66736b]"
                    >Żadna wypłata nie spadnie poniżej celu.</span
                  ></span
                ></span
              >
            </label>
          </div>
        </fieldset>

        <div class="mt-7 space-y-3 border-t border-[#e1e9df] pt-5">
          <p class="text-sm font-bold text-[#214d38]">Ustawienia UoP</p>
          <label
            class="flex gap-3 rounded-xl border border-[#e1e9df] p-3 text-sm font-semibold text-[#344f3b]"
            ><input v-model="under26" type="checkbox" class="accent-[#17613f]" /> Ulga dla młodych
            przysługuje mi przez cały rok</label
          >
          <label
            class="flex gap-3 rounded-xl border border-[#e1e9df] p-3 text-sm font-semibold text-[#344f3b]"
            ><input v-model="elevatedKup" type="checkbox" class="accent-[#17613f]" /> Podwyższone
            koszty uzyskania przychodu</label
          >
          <label
            class="flex gap-3 rounded-xl border border-[#e1e9df] p-3 text-sm font-semibold text-[#344f3b]"
            ><input v-model="ppk" type="checkbox" class="accent-[#17613f]" /> Uczestniczę w
            PPK</label
          >
        </div>
        <p
          v-if="!validInputs"
          role="alert"
          class="mt-5 rounded-xl border border-[#e6a592] bg-[#fff3ee] p-3 text-sm text-[#963c28]"
        >
          Wpisz nieujemną kwotę z maksymalnie dwoma miejscami po przecinku.
        </p>
      </section>

      <section
        class="relative overflow-hidden rounded-[22px] bg-[#123b2d] p-5 text-white shadow-lg sm:p-7"
        aria-live="polite"
        aria-labelledby="gross-result-heading"
      >
        <p class="text-xs font-bold uppercase tracking-[.15em] text-[#b4debd]">
          WYNIK DLA {{ year }} ROKU
        </p>
        <h2 id="gross-result-heading" class="mt-2 text-lg font-bold">Potrzebna pensja brutto</h2>
        <template v-if="!validInputs">
          <p class="mt-5 text-sm text-white/75">Wynik pojawi się po poprawieniu kwoty.</p>
        </template>
        <template v-else-if="result">
          <strong class="mt-4 block break-words text-[clamp(2.2rem,6vw,3.2rem)] leading-tight">{{
            money(result.gross)
          }}</strong>
          <p class="mt-1 text-sm text-white/70">miesięcznie · stałe brutto przez 12 miesięcy</p>
          <dl class="mt-7 space-y-3 border-t border-white/20 pt-5 text-sm">
            <div class="flex flex-wrap justify-between gap-2">
              <dt>Średnio na rękę / miesiąc</dt>
              <dd class="font-bold">{{ money(result.averageMonthlyNet) }}</dd>
            </div>
            <div class="flex flex-wrap justify-between gap-2">
              <dt>Najniższa wypłata · {{ monthNames[result.lowestMonth - 1] }}</dt>
              <dd class="font-bold">{{ money(result.lowestMonthlyNet) }}</dd>
            </div>
            <div class="flex flex-wrap justify-between gap-2 border-t border-white/20 pt-3">
              <dt>Na rękę w całym roku</dt>
              <dd class="font-bold">{{ money(result.annualNet) }}</dd>
            </div>
          </dl>
          <p
            v-if="goal === 'average' && result.lowestMonthlyNet < targetNet"
            class="mt-5 rounded-xl bg-white/10 p-3 text-xs leading-6 text-white/85"
          >
            Cel dotyczy średniej: niektóre miesięczne wypłaty mogą być niższe niż
            {{ money(targetNet) }}. Wybierz „W każdym miesiącu”, jeśli potrzebujesz takiej kwoty w
            każdym przelewie.
          </p>
          <p
            v-else-if="goal === 'every-month'"
            class="mt-5 rounded-xl bg-white/10 p-3 text-xs leading-6 text-white/85"
          >
            Każda z 12 szacowanych wypłat osiąga co najmniej {{ money(targetNet) }}.
          </p>
        </template>
        <p v-else class="mt-5 text-sm leading-6 text-white/75">
          Nie udało się osiągnąć tego celu w obsługiwanym zakresie brutto. Sprawdź wpisaną kwotę.
        </p>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!validInputs || !canShareInputs || !result"
          class="mt-6"
        />
        <p class="mt-6 border-t border-white/20 pt-4 text-xs leading-6 text-white/65">
          Szacunek dla jednego etatu, PIT-2 u jednego pracodawcy i 12 pełnych miesięcy przy stałym
          brutto. Szukamy pierwszej pełnej kwoty złotych spełniającej cel. To nie jest zeznanie
          roczne ani porada podatkowa.
        </p>
      </section>
    </div>

    <UopYearBreakdown v-if="result" :result="result.yearResult" />

    <section
      class="mt-9 grid gap-6 rounded-[22px] border border-[#dce8db] bg-[#fffefa] p-6 md:grid-cols-[.75fr_1.25fr] sm:p-8"
    >
      <div>
        <p class="text-xs font-extrabold uppercase tracking-[.15em] text-[#a97e5a]">
          JAK CZYTAĆ WYNIK
        </p>
        <h2
          class="mt-3 font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[#214d38]"
        >
          Cel netto to nie jedna magiczna kwota brutto.
        </h2>
      </div>
      <div class="space-y-3 text-sm leading-7 text-[#58715e]">
        <p>
          Obliczamy 12 wypłat dla kolejnych miesięcy i sprawdzamy, jaka najniższa pełna kwota
          złotych brutto spełnia wybrany warunek. Podatek i limity są liczone narastająco, więc nie
          mnożymy wyniku jednego miesiąca przez 12.
        </p>
        <p>
          Przyjmujemy stałe wynagrodzenie, brak premii i innych dochodów, PIT-2 z pomniejszeniem
          zaliczki o 300 zł oraz prawo do ulgi dla młodych przez cały rok, jeśli ją zaznaczysz. Nie
          modelujemy zwolnień chorobowych, urlopu bezpłatnego ani rozliczenia rocznego PIT.
        </p>
        <p>
          Podstawy zasad:
          <a
            class="font-semibold underline"
            href="https://www.podatki.gov.pl/podatki-osobiste/pit/stawki-i-limity"
            target="_blank"
            rel="noopener noreferrer"
            >skala PIT</a
          >,
          <a
            class="font-semibold underline"
            href="https://www.podatki.gov.pl/poradniki-i-informatory/pit-2-pit-2a-pit-3-zasady-skladania-oswiadczen-o-stosowaniu-pomniejszenia-zaliczki-o-kwote-zmniejszajaca-podatek-112-124-lub-136"
            target="_blank"
            rel="noopener noreferrer"
            >PIT-2</a
          >
          i
          <a
            class="font-semibold underline"
            href="https://www.zus.pl/pl/pracujacy/system-ubezpieczen-spolecznych-w-polsce/ustalanie-podstawy-wymiaru-skladek-na-ubezpieczenia-spoleczne"
            target="_blank"
            rel="noopener noreferrer"
            >limit składek ZUS</a
          >.
        </p>
      </div>
    </section>

    <FaqSection :items="faqs" title="Pytania o przeliczanie netto na brutto UoP" />
    <section class="mt-10 rounded-[22px] bg-[#eaf3e6] p-6 sm:p-8">
      <p class="text-xs font-extrabold uppercase tracking-[.15em] text-[#4e8b65]">
        SPRAWDŹ RÓWNIEŻ
      </p>
      <h2 class="mt-2 font-[var(--font-heading)] text-2xl font-bold text-[#214d38]">
        Masz kwotę brutto albo ofertę B2B?
      </h2>
      <div class="mt-5 flex flex-wrap gap-3">
        <RouterLink
          :to="pracaPath('/ile-na-reke-uop')"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#214d38]"
          >Brutto → netto UoP <ArrowRight class="size-4" aria-hidden="true"
        /></RouterLink>
        <RouterLink
          :to="pracaPath('/b2b-vs-uop')"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#214d38]"
          >Porównaj UoP i B2B <ArrowRight class="size-4" aria-hidden="true"
        /></RouterLink>
      </div>
    </section>
  </div>
</template>
