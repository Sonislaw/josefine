<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import {
  calcB2b,
  calcUop,
  money,
  taxForms,
  zusVariants,
  type TaxForm,
  type ZusVariant,
} from '../lib/calculations'
import { pracaPath, pracaSiteName, pracaSiteUrl, usePracaSeo } from '../seo/usePracaSeo'
import FaqSection from '@/shared/components/FaqSection.vue'

const props = defineProps<{ mode: 'uop' | 'b2b' | 'comparison' }>()
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
const uop = computed(() => calcUop(gross.value, under26.value, elevatedKup.value, ppk.value))
const b2b = computed(() =>
  calcB2b(invoice.value, costs.value, form.value, rate.value, zus.value, sickness.value),
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
    ? 'Zobacz, jak z wynagrodzenia brutto powstaje szacunkowa wypłata na rękę i ile może wynosić całkowity koszt pracodawcy.'
    : props.mode === 'b2b'
      ? 'Przelicz kwotę faktury na szacunkowy dochód po kosztach działalności, składkach i podatku.'
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
const difference = computed(() => b2b.value.net - uop.value.net)
const reset = () => {
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
            'Kalkulator wynagrodzenia UoP odejmuje od pensji brutto składki społeczne pracownika, składkę zdrowotną oraz szacowaną zaliczkę PIT. Następnie pokazuje kwotę netto, czyli wypłatę na rękę.',
        },
        {
          question: 'Czy kalkulator brutto-netto uwzględnia ulgę dla młodych?',
          answer:
            'Tak. Zaznaczenie opcji dla osoby poniżej 26. roku życia zeruje PIT w uproszczonym wyliczeniu. W praktyce trzeba pamiętać o ustawowym limicie ulgi i innych źródłach przychodu.',
        },
        {
          question: 'Jak PPK wpływa na wynagrodzenie na rękę?',
          answer:
            'Wpłata pracownika do PPK obniża miesięczną wypłatę netto. Jednocześnie pracodawca i państwo mogą finansować dodatkowe wpłaty, dlatego PPK warto oceniać w perspektywie długoterminowych oszczędności.',
        },
        {
          question: 'Dlaczego wypłata z umowy o pracę może się różnić?',
          answer:
            'Na kwotę netto wpływają między innymi PIT-2, koszty uzyskania przychodu, premie, absencje, ulgi, PPK oraz rozliczenie rocznych limitów. Wynik kalkulatora ma charakter orientacyjny.',
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
              'To różnica miesięcznych wyników netto pomnożona przez 12. Nie jest gwarantowanym zyskiem, ponieważ nie obejmuje wszystkich kosztów i korzyści, na przykład płatnego urlopu czy przerw między zleceniami.',
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
          <label v-if="mode !== 'b2b'" class="block"
            ><span class="text-sm font-semibold">{{
              mode === 'comparison' ? 'Brutto UoP miesięcznie' : 'Wynagrodzenie brutto miesięcznie'
            }}</span
            ><input
              v-model.number="gross"
              type="number"
              min="0"
              step="100"
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
              step="100"
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
                <option :value="8.5">8,5%</option>
                <option :value="12">12%</option>
                <option :value="15">15%</option>
                <option :value="17">17%</option>
              </select></label
            ><label class="block"
              ><span class="text-sm font-semibold">Koszty działalności miesięcznie</span
              ><input
                v-model.number="costs"
                type="number"
                min="0"
                step="100"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] px-4" /></label
            ><label class="block"
              ><span class="text-sm font-semibold">Składki społeczne ZUS</span
              ><select
                v-model="zus"
                class="mt-2 h-12 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
              >
                <option v-for="item in zusVariants" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select></label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="sickness" type="checkbox" class="accent-[#17613f]" /> Opłacam
              dobrowolne chorobowe</label
            ></template
          >
          <template v-if="mode !== 'b2b'"
            ><p
              v-if="mode === 'comparison'"
              class="border-t border-[#e1e7e2] pt-5 text-sm font-bold"
            >
              Ustawienia umowy o pracę
            </p>
            <label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="under26" type="checkbox" class="accent-[#17613f]" /> Mam mniej niż 26
              lat</label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="elevatedKup" type="checkbox" class="accent-[#17613f]" /> Podwyższone
              koszty uzyskania przychodu</label
            ><label class="flex gap-3 rounded-lg border border-[#e1e7e2] p-3 text-sm font-semibold"
              ><input v-model="ppk" type="checkbox" class="accent-[#17613f]" /> Uczestniczę w
              PPK</label
            ></template
          >
        </div>
      </section>
      <section
        class="result-panel rounded-2xl bg-[#123b2d] p-5 text-white shadow-lg sm:p-7"
        aria-live="polite"
      >
        <template v-if="mode === 'uop'"
          ><p class="text-sm text-emerald-100">Szacunkowe wynagrodzenie netto</p>
          <p class="mt-2 text-5xl font-bold">{{ money(uop.net) }}</p>
          <p class="mt-1 text-sm text-white/65">na rękę miesięcznie</p>
          <div class="mt-7 space-y-3 border-t border-white/15 pt-5 text-sm">
            <div class="flex justify-between">
              <span>Brutto</span><strong>{{ money(gross) }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Składki społeczne</span><span>− {{ money(uop.social) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Zdrowotna</span><span>− {{ money(uop.health) }}</span>
            </div>
            <div class="flex justify-between">
              <span>PIT</span><span>− {{ money(uop.tax) }}</span>
            </div>
            <div class="flex justify-between border-t border-white/15 pt-3 font-bold">
              <span>Rocznie na rękę</span><span>{{ money(uop.net * 12) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Koszt pracodawcy</span><strong>{{ money(uop.employerCost) }}</strong>
            </div>
          </div></template
        ><template v-else-if="mode === 'b2b'"
          ><p class="text-sm text-emerald-100">Szacunkowo zostaje</p>
          <p class="mt-2 text-5xl font-bold">{{ money(b2b.net) }}</p>
          <p class="mt-1 text-sm text-white/65">po kosztach, składkach i podatku</p>
          <div class="mt-7 space-y-3 border-t border-white/15 pt-5 text-sm">
            <div class="flex justify-between">
              <span>Faktura</span><strong>{{ money(invoice) }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Koszty</span><span>− {{ money(costs) }}</span>
            </div>
            <div class="flex justify-between">
              <span>ZUS</span><span>− {{ money(b2b.social) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Zdrowotna</span><span>− {{ money(b2b.health) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Podatek</span><span>− {{ money(b2b.tax) }}</span>
            </div>
            <div class="flex justify-between border-t border-white/15 pt-3 font-bold">
              <span>Rocznie na rękę</span><span>{{ money(b2b.net * 12) }}</span>
            </div>
          </div></template
        ><template v-else
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
              {{ money(Math.abs(difference) * 12) }} rocznie
            </p>
          </div></template
        >
        <p class="mt-6 border-t border-white/15 pt-4 text-xs leading-5 text-white/60">
          Założenia: uproszczona kalkulacja na 2026 r. Wynik zależy od indywidualnej sytuacji i nie
          stanowi porady podatkowej.
        </p>
      </section>
    </div>
    <section class="explanation">
      <div>
        <p class="intro-kicker">JAK CZYTAĆ WYNIK</p>
        <h2>Od liczby do decyzji.</h2>
      </div>
      <p>
        To przybliżenie pomocne przy planowaniu budżetu i porównywaniu ofert. Kalkulator nie
        uwzględnia wszystkich ulg, limitów, dodatkowych źródeł dochodu ani zmian przepisów.
      </p>
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
