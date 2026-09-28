<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, ClipboardCheck, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/apps/caravaning/components/ui/button'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'

interface ChecklistItem {
  id: string
  label: string
}

interface ChecklistSection {
  id: string
  title: string
  description: string
  items: ChecklistItem[]
}

const STORAGE_KEY = 'caravaning-departure-checklist'

const sections: ChecklistSection[] = [
  {
    id: 'before-hitching',
    title: 'Przed podpięciem przyczepy',
    description: 'Zamknij i zabezpiecz wnętrze, zanim zaczniesz manewr zaczepiania.',
    items: [
      { id: 'supports-up', label: 'Podniesione podpory' },
      { id: 'roof-windows', label: 'Zamknięte okna dachowe' },
      { id: 'windows', label: 'Zamknięte wszystkie okna' },
      { id: 'doors-hatches', label: 'Zamknięte drzwi i klapy zewnętrzne' },
      { id: 'fridge-locked', label: 'Zablokowana lodówka' },
      { id: 'step-in', label: 'Schowany stopień wejściowy' },
      { id: 'mains-disconnected', label: 'Odłączone zasilanie zewnętrzne 230 V' },
    ],
  },
  {
    id: 'after-hitching',
    title: 'Po podpięciu',
    description: 'Sprawdź połączenie mechaniczne i elektryczne zestawu.',
    items: [
      { id: 'breakaway-cable', label: 'Wpięta linka bezpieczeństwa' },
      { id: '13-pin', label: 'Podłączona wtyczka 13 PIN' },
      { id: 'lights', label: 'Działają światła: pozycyjne, stop i kierunkowskazy' },
      { id: 'hitch-secured', label: 'Zabezpieczony zaczep' },
      { id: 'jockey-wheel', label: 'Podniesione koło podporowe' },
    ],
  },
  {
    id: 'before-departure',
    title: 'Przed ruszeniem',
    description: 'Ostatnie punkty wewnątrz przyczepy i przy samochodzie.',
    items: [
      { id: 'cupboards', label: 'Zamknięte szafki i zabezpieczone luźne przedmioty' },
      { id: 'water-pump', label: 'Wyłączona pompa wody' },
      { id: 'gas-off', label: 'Zakręcony gaz' },
      { id: 'tyre-pressure', label: 'Sprawdzone ciśnienie w oponach samochodu i przyczepy' },
      { id: 'mirrors', label: 'Ustawione lusterka' },
      { id: 'documents', label: 'Dokumenty i klucze przy sobie' },
    ],
  },
]

const allItems = sections.flatMap((section) => section.items)
const checked = ref<Record<string, boolean>>({})

const checkedCount = computed(() => allItems.filter((item) => checked.value[item.id]).length)
const totalCount = allItems.length
const progressPercent = computed(() => Math.round((checkedCount.value / totalCount) * 100))
const isComplete = computed(() => checkedCount.value === totalCount)

const sectionProgress = computed(() =>
  sections.map((section) => {
    const done = section.items.filter((item) => checked.value[item.id]).length
    return {
      ...section,
      done,
      total: section.items.length,
      complete: done === section.items.length,
    }
  }),
)

const resetChecklist = () => {
  checked.value = Object.fromEntries(allItems.map((item) => [item.id, false]))
}

const frequentlyAskedQuestions = [
  {
    question: 'Do czego służy checklista przed wyjazdem?',
    answer:
      'To lista kontrolna dla zestawu samochód plus przyczepa kempingowa. Pomaga kolejno zamknąć wnętrze, sprawdzić podpięcie i dokończyć przygotowanie tuż przed ruszeniem.',
  },
  {
    question: 'Czy muszę odhaczać punkty w podanej kolejności?',
    answer:
      'Kolejność sekcji odpowiada typowemu przebiegowi: najpierw przygotowanie przyczepy, potem podpięcie, na końcu kontrola przed jazdą. Możesz odznaczać punkty w innej kolejności, jeśli Twój zestaw tego wymaga.',
  },
  {
    question: 'Czy stan listy zostaje zapisany?',
    answer:
      'Tak, wyłącznie w tej przeglądarce, na Twoim urządzeniu. Nic nie jest wysyłane na serwer. Możesz wyczyścić listę przyciskiem resetu.',
  },
  {
    question: 'Czy lista zastępuje przegląd techniczny zestawu?',
    answer:
      'Nie. To przypomnienie typowych czynności przed wyjazdem, a nie diagnostyka. Przed dłuższą trasą sprawdź stan ogumienia, hamulców, zaczepu i oświetlenia zgodnie z instrukcją pojazdów.',
  },
]

useCaravaningSeo('checklist', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Checklista przed wyjazdem z przyczepą',
      description:
        'Lista kontrolna przed podpięciem przyczepy, po zaczepieniu i tuż przed ruszeniem.',
      url: `${siteUrl}/checklista-przed-wyjazdem`,
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

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>
      checked.value = Object.fromEntries(
        allItems.map((item) => [item.id, Boolean(parsed[item.id])]),
      )
    }
  } catch {
    resetChecklist()
  }

  watch(
    checked,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:pb-10">
    <RouterLink
      :to="{ name: 'caravaning' }"
      class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Wszystkie narzędzia
    </RouterLink>

    <div class="max-w-3xl">
      <p class="mt-6 text-sm font-semibold text-primary">Spokojnie ruszaj w drogę</p>
      <h1 class="mt-2 font-heading text-3xl font-bold tracking-normal sm:text-4xl">
        Checklista przed wyjazdem
      </h1>
      <p class="mt-3 text-base leading-7 text-muted-foreground">
        Oznacz kolejne punkty przed podpięciem przyczepy, po zaczepieniu i tuż przed ruszeniem.
      </p>
    </div>

    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)] lg:gap-8">
      <section aria-labelledby="checklist-heading" class="border border-border bg-card p-5 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="checklist-heading" class="font-heading text-lg font-semibold tracking-normal">
              Lista kontrolna
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Odznaczaj punkty na bieżąco. Stan zostaje w tej przeglądarce.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Wyczyść listę" @click="resetChecklist">
            <RotateCcw class="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div class="mt-8 space-y-8">
          <fieldset v-for="section in sections" :key="section.id" class="space-y-3">
            <legend class="font-heading text-base font-semibold tracking-normal">
              {{ section.title }}
            </legend>
            <p class="text-sm text-muted-foreground">{{ section.description }}</p>
            <label
              v-for="item in section.items"
              :key="item.id"
              :for="`check-${item.id}`"
              class="flex cursor-pointer items-start gap-3 border border-border bg-muted/20 p-3 transition-colors"
              :class="checked[item.id] ? 'border-primary/40 bg-primary/[0.04]' : ''"
            >
              <input
                :id="`check-${item.id}`"
                v-model="checked[item.id]"
                type="checkbox"
                class="mt-1 size-4 shrink-0 accent-[#315848]"
              />
              <span
                class="text-sm leading-6"
                :class="checked[item.id] ? 'text-muted-foreground line-through' : ''"
              >
                {{ item.label }}
              </span>
            </label>
          </fieldset>
        </div>

        <p class="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Lista nie zastępuje kontroli technicznej zestawu. Dostosuj punkty do swojej przyczepy i
          instrukcji pojazdów.
        </p>
      </section>

      <section
        aria-live="polite"
        aria-label="Postęp checklisty"
        class="hidden self-start bg-[#17362f] p-6 text-white sm:p-8 lg:block"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-100">Postęp</p>
            <h2 class="mt-1 font-heading text-xl font-semibold tracking-normal">
              {{ isComplete ? 'Gotowi do drogi' : 'Przygotowanie zestawu' }}
            </h2>
          </div>
          <span
            class="flex size-11 items-center justify-center rounded-md border border-white/15 bg-white/10"
          >
            <ClipboardCheck class="size-5 text-emerald-100" aria-hidden="true" />
          </span>
        </div>

        <div class="py-6">
          <p class="font-heading text-5xl font-bold tabular-nums tracking-normal sm:text-6xl">
            {{ checkedCount }}
            <span class="text-2xl font-medium text-white/70 sm:text-3xl">/ {{ totalCount }}</span>
          </p>
          <p class="mt-3 max-w-xs text-sm leading-6 text-white/70">
            {{
              isComplete
                ? 'Wszystkie punkty odznaczone. Jeszcze raz rzuć okiem na zaczep i światła.'
                : 'Odznaczaj punkty, aby zobaczyć, ile zostało do wyjazdu.'
            }}
          </p>
        </div>

        <div class="space-y-4 border-t border-white/20 pt-5">
          <div>
            <div
              class="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-emerald-100"
            >
              <span>Ukończenie</span>
              <span class="tabular-nums">{{ progressPercent }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/15" role="presentation">
              <div
                class="h-full bg-emerald-300 transition-all"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>
          <ul class="space-y-2 text-sm text-white/85">
            <li
              v-for="section in sectionProgress"
              :key="section.id"
              class="flex justify-between gap-3"
            >
              <span>{{ section.title }}</span>
              <span class="tabular-nums text-white/70">{{ section.done }}/{{ section.total }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section
      aria-live="polite"
      aria-label="Postęp checklisty"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#17362f] px-4 py-3 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.16)] lg:hidden"
    >
      <div class="mx-auto flex max-w-7xl items-center gap-3">
        <ClipboardCheck class="size-5 shrink-0 text-emerald-100" aria-hidden="true" />
        <p class="shrink-0 text-sm font-semibold tabular-nums">
          {{ checkedCount }}<span class="text-white/70"> / {{ totalCount }}</span>
        </p>
        <div
          class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
          role="presentation"
        >
          <div
            class="h-full rounded-full bg-emerald-300 transition-all"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <span class="shrink-0 text-xs tabular-nums text-emerald-100">{{ progressPercent }}%</span>
      </div>
    </section>

    <section class="mt-12 grid gap-8 border-t border-border pt-10 md:grid-cols-2 lg:pb-0">
      <div>
        <h2 class="font-heading text-xl font-semibold tracking-normal">Jak korzystać z listy?</h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          Zacznij od zamknięcia i zabezpieczenia przyczepy, zanim ją podpinasz. Po zaczepieniu
          sprawdź linkę, wtyczkę, światła, zamek zaczepu i koło podporowe. Tuż przed ruszeniem
          zamknij szafki, wyłącz pompę, zakręć gaz i skontroluj opony oraz lusterka.
        </p>
      </div>
      <div>
        <h2 class="font-heading text-xl font-semibold tracking-normal">
          Czego lista nie obejmuje?
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          Checklista nie zastępuje przeglądu hamulców, stanu ogumienia, ładunku ani ograniczeń
          wynikających z DMC. Przed dłuższą trasą porównaj punkty z instrukcją swojej przyczepy.
        </p>
      </div>
    </section>

    <section aria-labelledby="checklist-faq-heading" class="mt-12 border-t border-border pt-10">
      <h2 id="checklist-faq-heading" class="font-heading text-2xl font-bold tracking-normal">
        Najczęstsze pytania o checklistę przed wyjazdem
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
