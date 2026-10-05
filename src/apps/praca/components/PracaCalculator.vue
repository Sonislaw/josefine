<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import {
  calcB2b,
  calcUop,
  defaultPeriod,
  isValidAmount,
  lumpRates,
  monthNames,
  money,
  taxForms,
  zusVariants,
  type TaxForm,
  type ZusVariant,
} from '../lib/calculations'
import { calcUopYear } from '../lib/uop-year'
import { calcB2bYear } from '../lib/b2b-year'
import { pracaPath, pracaSiteName, pracaSiteUrl, usePracaSeo } from '../seo/usePracaSeo'
import FaqSection from '@/shared/components/FaqSection.vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import UopYearBreakdown from './UopYearBreakdown.vue'
import B2bYearBreakdown from './B2bYearBreakdown.vue'
import {
  booleanShareField,
  choiceShareField,
  numberShareField,
  useShareableCalculator,
} from '@/shared/composables/useShareableCalculator'

const props = defineProps<{ mode: 'uop' | 'b2b' | 'comparison' }>()
const year = ref<2026>(defaultPeriod.year)
const month = ref(defaultPeriod.month)
const period = computed(() => ({ year: year.value, month: month.value }))
const gross = ref(props.mode === 'comparison' ? 15_000 : 12_000)
const invoice = ref(props.mode === 'comparison' ? 18_000 : 20_000)
const costs = ref(1_000),
  form = ref<TaxForm>('linear'),
  rate = ref(12),
  zus = ref<ZusVariant>('full')
const sickness = ref(false),
  under26 = ref(false),
  elevatedKup = ref(false),
  ppk = ref(false)
const uopShareFields = [
  numberShareField('brutto', gross, { min: 0 }),
  booleanShareField('ponizej26', under26),
  booleanShareField('podwyzszone-kup', elevatedKup),
  booleanShareField('ppk', ppk),
]
const b2bShareFields = [
  numberShareField('faktura', invoice, { min: 0 }),
  numberShareField('koszty', costs, { min: 0 }),
  choiceShareField('forma', form, ['scale', 'linear', 'lump']),
  numberShareField('stawka', rate, { choices: [8.5, 12, 15, 17] }),
  choiceShareField('zus', zus, ['start', 'preferential', 'full']),
  booleanShareField('chorobowe', sickness),
]
const { buildShareUrl, canShareInputs } = useShareableCalculator(() => [
  numberShareField('rok', year, { choices: [2026], integer: true }),
  ...(props.mode === 'comparison'
    ? [numberShareField('miesiac', month, { min: 1, max: 12, integer: true })]
    : []),
  ...(props.mode === 'b2b' ? [] : uopShareFields),
  ...(props.mode === 'uop' ? [] : b2bShareFields),
])
const validInputs = computed(
  () =>
    (props.mode === 'b2b' || isValidAmount(gross.value)) &&
    (props.mode === 'uop' || (isValidAmount(invoice.value) && isValidAmount(costs.value))) &&
    Number.isInteger(month.value) &&
    month.value >= 1 &&
    month.value <= 12 &&
    (props.mode === 'uop' ||
      form.value !== 'lump' ||
      lumpRates.includes(rate.value as (typeof lumpRates)[number])),
)
const uop = computed(() =>
  validInputs.value && props.mode === 'comparison'
    ? calcUop(
        {
          gross: gross.value,
          under26: under26.value,
          elevatedKup: elevatedKup.value,
          ppk: ppk.value,
        },
        period.value,
      )
    : null,
)
const uopYear = computed(() =>
  validInputs.value && props.mode === 'uop'
    ? calcUopYear(
        {
          gross: gross.value,
          under26: under26.value,
          elevatedKup: elevatedKup.value,
          ppk: ppk.value,
        },
        year.value,
      )
    : null,
)
const b2b = computed(() =>
  validInputs.value && props.mode === 'comparison'
    ? calcB2b(
        {
          invoice: invoice.value,
          costs: costs.value,
          form: form.value,
          rate: rate.value,
          zus: zus.value,
          sickness: sickness.value,
        },
        period.value,
      )
    : null,
)
const b2bYear = computed(() =>
  validInputs.value && props.mode === 'b2b'
    ? calcB2bYear(
        {
          invoice: invoice.value,
          costs: costs.value,
          form: form.value,
          rate: rate.value,
          zus: zus.value,
          sickness: sickness.value,
        },
        year.value,
      )
    : null,
)
const path = computed(() =>
  props.mode === 'uop'
    ? '/ile-na-reke-uop'
    : props.mode === 'b2b'
      ? '/ile-na-reke-b2b'
      : '/b2b-vs-uop',
)
const seoKey = computed(() =>
  props.mode === 'uop' ? 'uop' : props.mode === 'b2b' ? 'b2b' : 'comparison',
)
const title = computed(() =>
  props.mode === 'uop'
    ? 'Kalkulator wynagrodzenia UoP'
    : props.mode === 'b2b'
      ? 'Kalkulator wynagrodzenia B2B'
      : 'B2B czy UoP — porównaj oferty',
)
const introText = computed(() =>
  props.mode === 'uop'
    ? 'Zobacz wypłatę na rękę w każdym miesiącu 2026 roku oraz sumę dwunastu wypłat. Kalkulator uwzględnia narastające limity ulgi dla młodych, PIT i składek emerytalno-rentowych.'
    : props.mode === 'b2b'
      ? 'Zobacz, ile może zostać z faktur B2B miesiąc po miesiącu w 2026 roku. Symulacja śledzi narastająco podatek i progi składki zdrowotnej.'
      : 'Zestaw dwa warianty współpracy i zobacz różnicę w miesięcznym oraz rocznym wyniku.',
)
const introSymbol = computed(() =>
  props.mode === 'uop' ? 'UoP' : props.mode === 'b2b' ? 'B2B' : '↔',
)
const relatedTools = [
  { mode: 'uop', path: '/ile-na-reke-uop', title: 'Ile na rękę z UoP?' },
  { mode: 'b2b', path: '/ile-na-reke-b2b', title: 'Ile na rękę z B2B?' },
  { mode: 'comparison', path: '/b2b-vs-uop', title: 'B2B vs UoP' },
] as const
const difference = computed(() => (b2b.value && uop.value ? b2b.value.net - uop.value.net : 0))
const reset = () => {
  year.value = defaultPeriod.year
  month.value = defaultPeriod.month
  gross.value = props.mode === 'comparison' ? 15_000 : 12_000
  invoice.value = props.mode === 'comparison' ? 18_000 : 20_000
  costs.value = 1_000
  form.value = 'linear'
  rate.value = 12
  zus.value = 'full'
  sickness.value = under26.value = elevatedKup.value = ppk.value = false
}
const faqs = computed(() =>
  props.mode === 'uop'
    ? [
        {
          question: 'Jak obliczane jest wynagrodzenie netto na UoP?',
          answer:
            'Kalkulator liczy oddzielnie 12 wypłat: od miesięcznej pensji brutto odejmuje składki społeczne, zdrowotną, szacowaną zaliczkę PIT i ewentualną wpłatę pracownika do PPK. Wynik roczny jest sumą tych wypłat.',
        },
        {
          question: 'Czy kalkulator brutto-netto uwzględnia ulgę dla młodych?',
          answer:
            'Tak. W wariancie UoP limit ulgi jest liczony narastająco w trakcie 2026 roku. Przyjmujemy jednak, że osoba spełnia warunek wieku przez cały rok i nie korzysta z limitu u innych płatników.',
        },
        {
          question: 'Jak PPK wpływa na wynagrodzenie na rękę?',
          answer:
            'Wpłata pracownika do PPK obniża miesięczną wypłatę netto. Jednocześnie pracodawca i państwo mogą finansować dodatkowe wpłaty, dlatego PPK warto oceniać w perspektywie długoterminowych oszczędności.',
        },
        {
          question: 'Dlaczego wypłata z umowy o pracę może się różnić?',
          answer:
            'W ciągu roku może zmienić się stawka zaliczki PIT albo wysokość składek emerytalno-rentowych po osiągnięciu limitu ich podstawy. Na rzeczywistą wypłatę wpływają również premie, nieobecności, inne przychody i indywidualne oświadczenia.',
        },
        {
          question: 'Czy roczna suma netto jest wynikiem rozliczenia PIT?',
          answer:
            'Nie. To suma dwunastu szacowanych wypłat przy stałym brutto i przyjętych ustawieniach. Ostateczne rozliczenie podatku może być inne, zwłaszcza przy dodatkowych dochodach, ulgach lub zmianie sytuacji w trakcie roku.',
        },
      ]
    : props.mode === 'b2b'
      ? [
          {
            question: 'Ile zostaje na rękę z faktury B2B?',
            answer:
              'Od kwoty netto faktury B2B należy odjąć koszty działalności, składki społeczne ZUS, składkę zdrowotną i podatek. Kalkulator pokazuje szacowaną kwotę pozostającą przedsiębiorcy po tych obciążeniach.',
          },
          {
            question: 'Czy kwota faktury B2B zawiera VAT?',
            answer:
              'Nie. Kalkulator przyjmuje wartość netto faktury, bez VAT. VAT rozlicza się osobno i co do zasady nie jest ani przychodem, ani kosztem przedsiębiorcy.',
          },
          {
            question: 'Czy ryczałt uwzględnia koszty firmy?',
            answer:
              'Koszty obniżają środki, które zostają w firmie, ale na ryczałcie nie zmniejszają podstawy opodatkowania tak jak na skali lub podatku liniowym. Dlatego przy wysokich kosztach warto porównać różne formy opodatkowania.',
          },
          {
            question: 'Czym różni się skala, liniowy i ryczałt?',
            answer:
              'Skala podatkowa korzysta z progów i kwoty zmniejszającej podatek, liniowy stosuje stałą stawkę 19%, a ryczałt liczy podatek od przychodu według właściwej stawki. Wybór zależy od branży, kosztów i sytuacji podatnika.',
          },
          {
            question: 'Dlaczego wynik B2B zmienia się w ciągu roku?',
            answer:
              'Symulacja śledzi przychód i dochód narastająco. Na skali może zmienić się stawka zaliczki PIT, a na ryczałcie po przekroczeniu progów przychodu wzrasta miesięczna składka zdrowotna.',
          },
          {
            question: 'Czy po roku trzeba dopłacić składkę zdrowotną na ryczałcie?',
            answer:
              'Może tak być. Roczna stawka zdrowotna zależy od całorocznego przychodu i dotyczy wszystkich miesięcy objętych ubezpieczeniem. Kalkulator pokazuje szacowaną dopłatę osobno od sumy miesięcznych wyników.',
          },
        ]
      : [
          {
            question: 'Czy faktura B2B odpowiada pensji brutto na UoP?',
            answer:
              'Nie. Faktura B2B jest przychodem firmy, z którego trzeba opłacić podatki, ZUS i koszty działalności. Pensja brutto na UoP nie jest też pełnym kosztem firmy, dlatego porównanie powinno obejmować całość warunków.',
          },
          {
            question: 'Co uwzględnić przy porównaniu B2B i UoP?',
            answer:
              'Oprócz miesięcznego wynagrodzenia netto porównaj płatny urlop, zwolnienie chorobowe, benefity, okres wypowiedzenia, koszty księgowości, sprzętu oraz stabilność współpracy. Dopiero wtedy porównanie B2B vs UoP jest miarodajne.',
          },
          {
            question: 'Co pokazuje różnica roczna między B2B a UoP?',
            answer:
              'To jedynie różnica dla 12 identycznych miesięcy. Nie jest rocznym rozliczeniem i nie uwzględnia narastających limitów, płatnego urlopu ani przerw między zleceniami.',
          },
          {
            question: 'Czy wyższe netto na B2B zawsze oznacza lepszą ofertę?',
            answer:
              'Nie zawsze. Wyższa wypłata z B2B może wiązać się z większą odpowiedzialnością, koniecznością samodzielnego opłacania składek i brakiem świadczeń pracowniczych. Kalkulator pomaga policzyć kwoty, ale decyzję warto oprzeć także na warunkach współpracy.',
          },
        ],
)
usePracaSeo(seoKey.value, {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: title.value,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: `${pracaSiteUrl}${path.value}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      publisher: { '@type': 'Organization', name: pracaSiteName, url: pracaSiteUrl },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.value.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
})
</script>

<template>
  <div class="work-tool-page mx-auto max-w-7xl px-5 py-8 sm:py-12 lg:px-8">
    <RouterLink
      :to="pracaPath('/')"
      class="inline-flex items-center gap-2 text-sm font-medium text-[#66736b] hover:text-[#17613f]"
      ><ArrowLeft class="size-4" /> Wszystkie kalkulatory</RouterLink
    >
    <header class="tool-intro">
      <div class="intro-copy">
        <p class="intro-kicker">
          {{
            mode === 'comparison'
              ? 'Sprawdź, która oferta bardziej się opłaca'
              : 'Przelicz wynagrodzenie'
          }}
        </p>
        <h1>{{ title }}</h1>
        <p>{{ introText }} Zmieniaj wartości, aby sprawdzić własny scenariusz.</p>
      </div>
      <span class="intro-symbol" aria-hidden="true">{{ introSymbol }}</span>
    </header>
    <div class="mt-9 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
      <section class="form-panel rounded-2xl border border-[#e1e7e2] bg-white p-5 shadow-sm sm:p-7">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Dane do obliczeń</h2>
            <p class="mt-1 text-sm text-[#66736b]">
              Zmień wartości, aby zobaczyć aktualny szacunek.
            </p>
          </div>
          <button
            class="grid size-10 place-items-center rounded-lg border border-[#e1e7e2]"
            aria-label="Przywróć wartości początkowe"
            @click="reset"
          >
            <RotateCcw class="size-4" />
          </button>
        </div>
        <div class="mt-7 space-y-5">
          <label v-if="mode === 'comparison'" class="block"
            ><span class="text-sm font-semibold">Miesiąc obliczeń · {{ year }}</span>
            <select
              v-model.number="month"
              class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
            >
              <option v-for="(name, index) in monthNames" :key="name" :value="index + 1">
                {{ name }}
              </option>
            </select>
            <span class="mt-1 block text-xs text-[#66736b]"
              >Miesiąc wpływa na minimum składki zdrowotnej B2B; pozostałe wyniki są miesięcznym
              szacunkiem.</span
            >
          </label>
          <label v-if="mode !== 'b2b'" class="block"
            ><span class="text-sm font-semibold">{{
              mode === 'comparison' ? 'Brutto UoP miesięcznie' : 'Wynagrodzenie brutto miesięcznie'
            }}</span
            ><input
              v-model.number="gross"
              type="number"
              min="0"
              step="0.01"
              class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] px-4 text-lg font-semibold outline-none focus:border-[#25815c]"
          /></label>
          <label v-if="mode !== 'uop'" class="block"
            ><span class="text-sm font-semibold">{{
              mode === 'comparison' ? 'Faktura B2B netto / miesiąc' : 'Miesięczna faktura netto'
            }}</span
            ><input
              v-model.number="invoice"
              type="number"
              min="0"
              step="0.01"
              class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] px-4 text-lg font-semibold outline-none focus:border-[#25815c]"
          /></label>
          <template v-if="mode !== 'uop'"
            ><label class="block"
              ><span class="text-sm font-semibold">Forma opodatkowania</span
              ><select
                v-model="form"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
              >
                <option v-for="item in taxForms" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select></label
            ><label v-if="form === 'lump'" class="block"
              ><span class="text-sm font-semibold">Stawka ryczałtu</span
              ><select
                v-model.number="rate"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
              >
                <option v-for="option in lumpRates" :key="option" :value="option">
                  {{ option }}%
                </option>
              </select></label
            ><label class="block"
              ><span class="text-sm font-semibold">Koszty działalności miesięcznie</span
              ><input
                v-model.number="costs"
                type="number"
                min="0"
                step="0.01"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] px-4" /></label
            ><label class="block"
              ><span class="text-sm font-semibold">Składki społeczne ZUS</span
              ><select
                v-model="zus"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
              >
                <option v-for="item in zusVariants" :key="item.value" :value="item.value">
                  {{
                    mode === 'b2b' && item.value === 'start'
                      ? 'Ulga na start → preferencyjny ZUS'
                      : item.label
                  }}
                </option>
              </select></label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="sickness" type="checkbox" class="accent-[#17613f]" /> Opłacam
              dobrowolne chorobowe</label
            >
            <p v-if="mode === 'b2b' && zus === 'start'" class="text-xs leading-5 text-[#66736b]">
              Zakładamy start działalności 1 stycznia: bez składek społecznych do czerwca, od lipca
              składki preferencyjne, jeśli spełniasz warunki ulgi.
            </p></template
          >
          <template v-if="mode !== 'b2b'"
            ><p
              v-if="mode === 'comparison'"
              class="border-t border-[#e1e7e2] pt-5 text-sm font-bold"
            >
              Ustawienia umowy o pracę
            </p>
            <label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="under26" type="checkbox" class="accent-[#17613f]" />
              {{
                mode === 'uop'
                  ? 'Ulga dla młodych przysługuje mi przez cały rok'
                  : 'Mam mniej niż 26 lat i niewyczerpany limit ulgi'
              }}</label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="elevatedKup" type="checkbox" class="accent-[#17613f]" /> Podwyższone
              koszty uzyskania przychodu</label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="ppk" type="checkbox" class="accent-[#17613f]" /> Uczestniczę w
              PPK</label
            ></template
          >
        </div>
        <p
          v-if="!validInputs"
          role="alert"
          class="mt-5 rounded-lg border border-[#e6a592] bg-[#fff3ee] p-3 text-sm text-[#963c28]"
        >
          Wpisz nieujemne kwoty z maksymalnie dwoma miejscami po przecinku.
        </p>
      </section>
      <section
        class="result-panel rounded-2xl bg-[#123b2d] p-5 text-white shadow-lg sm:p-7"
        aria-live="polite"
      >
        <template v-if="!validInputs">
          <p class="text-lg font-bold">Sprawdź dane wejściowe</p>
          <p class="mt-2 text-sm text-white/75">Wynik pojawi się po poprawieniu kwot.</p>
        </template>
        <template v-else-if="mode === 'uop' && uopYear"
          ><p class="text-sm text-emerald-100">Suma szacowanych wypłat netto · {{ year }}</p>
          <p class="mt-2 text-[clamp(2rem,8vw,3rem)] font-bold">{{ money(uopYear.totals.net) }}</p>
          <p class="mt-1 text-sm text-white/65">12 miesięcy ze stałym wynagrodzeniem brutto</p>
          <div class="mt-7 space-y-3 border-t border-white/15 pt-5 text-sm">
            <div class="flex justify-between">
              <span>Brutto w roku</span><strong>{{ money(uopYear.totals.gross) }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Składki społeczne</span><span>− {{ money(uopYear.totals.social) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Zdrowotna</span><span>− {{ money(uopYear.totals.health) }}</span>
            </div>
            <div class="flex justify-between">
              <span>PIT pobrany w roku</span><span>− {{ money(uopYear.totals.tax) }}</span>
            </div>
            <div v-if="ppk" class="flex justify-between">
              <span>PPK pracownika</span><span>− {{ money(uopYear.totals.ppkEmployee) }}</span>
            </div>
            <div class="flex justify-between border-t border-white/15 pt-3 font-bold">
              <span>Styczeń na rękę</span><span>{{ money(uopYear.months[0]?.net ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Grudzień na rękę</span><span>{{ money(uopYear.months[11]?.net ?? 0) }}</span>
            </div>
            <div class="flex justify-between border-t border-white/15 pt-3">
              <span>Koszt pracodawcy w roku</span
              ><strong>{{ money(uopYear.totals.employerCost) }}</strong>
            </div>
          </div></template
        ><template v-else-if="mode === 'b2b' && b2bYear"
          ><p class="text-sm text-emerald-100">Suma po miesięcznych obciążeniach · {{ year }}</p>
          <p class="mt-2 text-[clamp(2rem,8vw,3rem)] font-bold">{{ money(b2bYear.totals.net) }}</p>
          <p class="mt-1 text-sm text-white/65">12 miesięcy ze stałą fakturą i kosztami</p>
          <div class="mt-7 space-y-3 border-t border-white/15 pt-5 text-sm">
            <div class="flex justify-between">
              <span>Faktury w roku</span><strong>{{ money(b2bYear.totals.invoice) }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Koszty</span><span>− {{ money(b2bYear.totals.costs) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Składki społeczne</span><span>− {{ money(b2bYear.totals.social) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Zdrowotna</span><span>− {{ money(b2bYear.totals.health) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Szacowane zaliczki PIT</span><span>− {{ money(b2bYear.totals.tax) }}</span>
            </div>
            <div v-if="form === 'lump'" class="flex justify-between border-t border-white/15 pt-3">
              <span>Szacowana dopłata zdrowotnej po roku</span
              ><span>− {{ money(b2bYear.healthSettlement) }}</span>
            </div>
            <div v-if="form === 'lump'" class="flex justify-between font-bold">
              <span>Po uwzględnieniu dopłaty</span
              ><strong>{{ money(b2bYear.netAfterHealthSettlement) }}</strong>
            </div>
          </div></template
        ><template v-else-if="uop && b2b"
          ><p class="text-sm text-emerald-100">Porównanie miesięcznego netto</p>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-white/10 p-4">
              <p class="text-sm text-white/70">UoP</p>
              <strong class="mt-1 block text-2xl">{{ money(uop.net) }}</strong>
            </div>
            <div class="rounded-xl bg-[#a9e4bd] p-4 text-[#123b2d]">
              <p class="text-sm opacity-75">B2B</p>
              <strong class="mt-1 block text-2xl">{{ money(b2b.net) }}</strong>
            </div>
          </div>
          <div class="mt-5 rounded-xl border border-white/15 p-4">
            <p class="text-sm text-white/70">Różnica miesięczna na B2B</p>
            <strong class="mt-1 block text-3xl"
              >{{ difference >= 0 ? '+' : '−' }}{{ money(Math.abs(difference)) }}</strong
            >
            <p class="mt-1 text-sm text-white/70">
              {{ difference >= 0 ? 'więcej' : 'mniej' }} ·
              {{ money(Math.abs(difference) * 12) }} dla 12 podobnych miesięcy*
            </p>
          </div></template
        >
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!validInputs || !canShareInputs"
          class="mt-6"
        />
        <p
          v-if="mode === 'uop'"
          class="mt-6 border-t border-white/15 pt-4 text-xs leading-5 text-white/60"
        >
          Suma 12 szacowanych wypłat w {{ year }} r., nie wynik zeznania rocznego. Zakładamy jeden
          etat, stałe brutto i PIT-2 u tego pracodawcy. To nie jest porada podatkowa.
        </p>
        <p
          v-else-if="mode === 'b2b'"
          class="mt-6 border-t border-white/15 pt-4 text-xs leading-5 text-white/60"
        >
          Szacunek 12 miesięcy w {{ year }} r. przy stałych przychodach i kosztach. Dopłata
          zdrowotnej na ryczałcie nie jest miesięczną wypłatą. To nie jest zeznanie roczne ani
          porada podatkowa.
        </p>
        <p v-else class="mt-6 border-t border-white/15 pt-4 text-xs leading-5 text-white/60">
          Szacunek pojedynczego miesiąca 2026. *Mnożenie przez 12 nie jest rozliczeniem rocznym.
          Wynik nie stanowi porady podatkowej.
        </p>
      </section>
    </div>
    <UopYearBreakdown v-if="mode === 'uop' && uopYear" :result="uopYear" />
    <B2bYearBreakdown v-if="mode === 'b2b' && b2bYear" :result="b2bYear" />
    <section class="explanation">
      <div>
        <p class="intro-kicker">JAK CZYTAĆ WYNIK</p>
        <h2>Od liczby do decyzji.</h2>
      </div>
      <div class="text-sm leading-7 text-[#667e6b]">
        <p v-if="mode === 'uop'">
          Roczna suma jest złożona z dwunastu miesięcznych wypłat, a nie z pomnożenia jednej kwoty.
          Próg PIT, limit ulgi dla młodych i limit podstawy składek emerytalno-rentowych są śledzone
          narastająco. To nadal szacunek przy stałej pensji, nie rozliczenie PIT.
        </p>
        <p v-else-if="mode === 'b2b'">
          To symulacja dwunastu faktur, a nie wynik jednej pomnożony przez 12. Podatek liczymy
          narastająco, zaś przy ryczałcie pokazujemy także możliwą dopłatę zdrowotnej po roku.
          Rzeczywiste terminy płatności składek i zaliczek mogą przesunąć koszty między miesiącami.
        </p>
        <p v-else>
          To przybliżenie pomocne przy planowaniu budżetu. Uwzględnia tylko wpisane dane i pokazuje
          reprezentatywny miesiąc, nie faktyczną zaliczkę ani zeznanie roczne.
        </p>
        <details class="mt-3 rounded-xl border border-[#dde9db] bg-white p-4">
          <summary class="cursor-pointer font-bold text-[#214d38]">
            Założenia i ograniczenia obliczeń
          </summary>
          <ul class="mt-3 list-disc space-y-1 pl-5">
            <li>
              UoP: jeden etat, pełny miesiąc, PIT-2 z pomniejszeniem o 300 zł, standardowa stopa
              wypadkowa 1,67%. Wpłatę pracodawcy do PPK opodatkowujemy w tym samym miesiącu.
            </li>
            <li v-if="mode === 'uop'">
              Ulga dla młodych zakłada prawo do zwolnienia przez cały rok; jej limit, próg PIT i
              limit podstawy składek są liczone narastająco. Nie uwzględniamy innych płatników ani
              ukończenia 26 lat w trakcie roku.
            </li>
            <li v-if="mode === 'comparison'">
              W porównaniu miesięcznym ulga dla młodych zakłada niewyczerpany limit. Progi i limity
              roczne nie są tam śledzone narastająco.
            </li>
            <li v-if="mode === 'b2b'">
              B2B: faktura bez VAT, stała przez cały rok. Ulga na start zakłada początek
              działalności 1 stycznia i przejście na składki preferencyjne od lipca, jeśli
              przysługują. Składkę zdrowotną przypisujemy do miesiąca uzyskania dochodu; nie
              odtwarzamy przesunięcia wpłaty o miesiąc. Dla liniowego uwzględniamy limit odliczenia
              zapłaconej zdrowotnej 14 100 zł, a dla ryczałtu odliczenie 50% składki oraz możliwą
              dopłatę po roku.
            </li>
            <li v-if="mode === 'comparison'">
              B2B: faktura bez VAT; przy ryczałcie próg zdrowotnej szacujemy z 12 takich samych
              faktur. Dostępne są cztery wybrane stawki ryczałtu — dobierz właściwą dla
              działalności.
            </li>
            <li>
              Nie uwzględniamy innych przychodów, dodatkowych ulg ani pełnego rozliczenia rocznego.
              Miesięczne porównanie B2B vs UoP nadal nie uwzględnia odliczeń składki zdrowotnej.
            </li>
          </ul>
          <p class="mt-3">
            Źródła:
            <a
              class="underline"
              href="https://www.podatki.gov.pl/podatki-osobiste/pit/stawki-i-limity"
              target="_blank"
              rel="noopener noreferrer"
              >podatki.gov.pl</a
            >
            i
            <a
              class="underline"
              href="https://www.zus.pl/pl/firmy/przedsiebiorco-przeczytaj-wazne/kalkulator-skladki-zdrowotnej"
              target="_blank"
              rel="noopener noreferrer"
              >ZUS</a
            >
            <template v-if="mode === 'b2b'">
              oraz
              <a
                class="underline"
                href="https://podatki.gov.pl/ulgi-i-odliczenia/odliczenie-skladek-na-ubezpieczenie-zdrowotne-pit"
                target="_blank"
                rel="noopener noreferrer"
                >odliczenie zdrowotnej</a
              >
            </template>
            .
          </p>
        </details>
      </div>
    </section>
    <FaqSection :items="faqs" :title="`Pytania o: ${title}`" />
    <section class="related">
      <div class="related-heading">
        <div>
          <p class="intro-kicker">SPRAWDŹ RÓWNIEŻ</p>
          <h2>Porównaj inny scenariusz</h2>
        </div>
        <RouterLink :to="pracaPath('/')">Wszystkie kalkulatory</RouterLink>
      </div>
      <div class="related-grid">
        <RouterLink
          v-for="item in relatedTools.filter((candidate) => candidate.mode !== mode)"
          :key="item.mode"
          :to="pracaPath(item.path)"
          ><span>{{
            item.mode === 'comparison' ? 'Porównanie ofert' : item.mode.toUpperCase()
          }}</span
          ><strong>{{ item.title }}</strong></RouterLink
        >
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-intro {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin-top: 1.6rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid #d9e7d9;
  border-radius: 25px;
  background:
    radial-gradient(circle at 86% 20%, #d7ead5, transparent 38%),
    linear-gradient(120deg, #eaf3e6, #fbf7e8);
}
.tool-intro::after {
  position: absolute;
  right: 10%;
  bottom: -105px;
  width: 245px;
  height: 245px;
  border: 1px solid #bdd9c3;
  border-radius: 50%;
  content: '';
}
.intro-copy {
  position: relative;
  z-index: 1;
}
.intro-kicker {
  color: #5d8b6b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.tool-intro h1 {
  margin-top: 0.7rem;
  color: #204d37;
  font-family: var(--font-heading);
  font-size: clamp(2.2rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.1;
}
.tool-intro .intro-copy > p:last-child {
  max-width: 690px;
  margin-top: 1rem;
  color: #657d69;
  line-height: 1.75;
}
.intro-symbol {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  min-width: 165px;
  min-height: 125px;
  padding: 1rem;
  border: 1px solid #c7ddc9;
  border-radius: 25px;
  background: #fffdf5;
  color: #3c8059;
  box-shadow: 0 16px 30px #123b2d18;
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  transform: rotate(6deg);
}
.form-panel {
  box-shadow: 0 16px 38px #123b2d10;
}
.result-panel {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 85% 0, #276348, #123b2d 58%, #0d2d23);
  box-shadow: 0 16px 34px #123b2d27;
}
.result-panel::after {
  position: absolute;
  right: -46px;
  bottom: -100px;
  width: 230px;
  height: 230px;
  border: 1px solid #ffffff35;
  border-radius: 50%;
  content: '';
  pointer-events: none;
}
.explanation {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
  margin-top: 2rem;
  padding: 2rem;
  border: 1px solid #dde9db;
  border-radius: 22px;
  background: #fffefa;
}
.explanation h2,
.related h2 {
  margin-top: 0.6rem;
  color: #214d38;
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.explanation > p {
  align-self: center;
  color: #667e6b;
  font-size: 0.9rem;
  line-height: 1.8;
}
.related {
  margin-top: 3rem;
}
.related-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.related-heading a {
  color: #2c7550;
  font-size: 0.82rem;
  font-weight: 800;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.2rem;
}
.related-grid a {
  display: grid;
  align-content: space-between;
  min-height: 128px;
  padding: 1.2rem;
  border: 1px solid #dce8db;
  border-radius: 16px;
  background: #fffefa;
  color: #264f39;
  text-decoration: none;
}
.related-grid a:hover {
  border-color: #9ac4a6;
}
.related-grid span {
  color: #829b87;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}
.related-grid strong {
  font-family: var(--font-heading);
}
@media (max-width: 700px) {
  .intro-symbol {
    min-width: 100px;
    min-height: 100px;
    font-size: 1.6rem;
  }
  .explanation {
    grid-template-columns: 1fr;
  }
  .related-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 500px) {
  .intro-symbol {
    display: none;
  }
  .tool-intro {
    padding: 1.5rem;
  }
}
</style>
