<script setup lang="ts">
import { computed, ref } from 'vue'
import { money, monthNames } from '../lib/calculations'
import { calculateInvoiceAfterBreak, type InvoiceBreakBilling } from '../lib/invoice-break'

const props = defineProps<{
  baseInvoice: number
  overrides: readonly (number | '' | null)[]
}>()
const emit = defineEmits<{
  apply: [monthIndex: number, invoice: number]
  restoreBase: [monthIndex: number]
}>()

const monthIndex = ref(0)
const billing = ref<InvoiceBreakBilling>('daily')
const contractDays = ref<number | ''>(20)
const nonBillableDays = ref<number | ''>(5)

const estimate = computed(() => {
  if (contractDays.value === '' || nonBillableDays.value === '') return null
  return calculateInvoiceAfterBreak({
    baseInvoice: props.baseInvoice,
    billing: billing.value,
    contractDays: contractDays.value,
    nonBillableDays: nonBillableDays.value,
  })
})
const selectedOverride = computed(() => props.overrides[monthIndex.value] ?? null)
const alreadyApplied = computed(
  () => estimate.value !== null && selectedOverride.value === estimate.value.invoice,
)
const canApply = computed(
  () =>
    billing.value === 'daily' &&
    estimate.value !== null &&
    estimate.value.reduction > 0 &&
    !alreadyApplied.value,
)

function applyEstimate() {
  if (!canApply.value || !estimate.value) return
  emit('apply', monthIndex.value, estimate.value.invoice)
}

function restoreBaseInvoice() {
  if (billing.value !== 'fixed' || selectedOverride.value === null) return
  emit('restoreBase', monthIndex.value)
}
</script>

<template>
  <details class="mt-5 rounded-xl border border-[#cbdcc9] bg-white p-4">
    <summary class="cursor-pointer font-bold text-[#214d38]">
      Przelicz przerwę w fakturowaniu
    </summary>
    <div class="mt-4 space-y-4 text-sm text-[#315a42]">
      <p class="leading-6 text-[#667e6b]">
        Pomocnik wylicza kwotę faktury dla jednego miesiąca z bazowej faktury
        <strong class="text-[#214d38]">{{ money(baseInvoice) }}</strong
        >. Niczego nie zmienia, dopóki nie zapiszesz propozycji w planie.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block font-semibold">
          Miesiąc
          <select
            v-model.number="monthIndex"
            class="mt-1 block h-11 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
          >
            <option v-for="(month, index) in monthNames" :key="month" :value="index">
              {{ month }}
            </option>
          </select>
        </label>
        <label class="block font-semibold">
          Rozliczenie przerwy według kontraktu
          <select
            v-model="billing"
            class="mt-1 block h-11 w-full rounded-lg border border-[#d9e1db] bg-white px-3"
          >
            <option value="daily">Faktura zależy od liczby dni</option>
            <option value="fixed">Pełna faktura mimo przerwy</option>
          </select>
        </label>
        <label class="block font-semibold">
          Dni rozliczeniowe w miesiącu
          <input
            v-model.number="contractDays"
            type="number"
            min="1"
            max="31"
            step="1"
            class="mt-1 block h-11 w-full rounded-lg border border-[#d9e1db] px-3"
          />
        </label>
        <label class="block font-semibold">
          Dni bez fakturowania
          <input
            v-model.number="nonBillableDays"
            type="number"
            min="0"
            :max="contractDays"
            step="1"
            class="mt-1 block h-11 w-full rounded-lg border border-[#d9e1db] px-3"
          />
        </label>
      </div>

      <p v-if="!estimate" role="alert" class="rounded-lg bg-[#fff3ee] p-3 text-[#963c28]">
        Podaj od 1 do 31 dni rozliczeniowych i nie więcej dni przerwy niż dni rozliczeniowych.
      </p>
      <div v-else class="rounded-xl bg-[#eef6e9] p-4" aria-live="polite">
        <p class="text-xs font-bold uppercase tracking-wide text-[#567461]">
          Proponowana faktura za {{ monthNames[monthIndex] }}
        </p>
        <strong class="mt-1 block text-2xl text-[#174a32]">{{ money(estimate.invoice) }}</strong>
        <p class="mt-1 text-xs leading-5 text-[#567461]">
          <template v-if="billing === 'daily'">
            Bazowa faktura × ({{ contractDays }} − {{ nonBillableDays }}) / {{ contractDays }}.
            Zmniejszenie o {{ money(estimate.reduction) }}.
          </template>
          <template v-else> Przy założeniu pełnej faktury przerwa nie zmienia jej kwoty. </template>
        </p>
      </div>

      <p v-if="selectedOverride !== null" class="text-xs leading-5 text-[#946442]">
        {{ monthNames[monthIndex] }} ma już własną kwotę faktury:
        {{ selectedOverride === '' ? 'nieuzupełnioną' : money(selectedOverride) }}.
        <template v-if="canApply">Zapisanie propozycji zastąpi tę kwotę.</template>
      </p>
      <button
        v-if="billing === 'fixed' && selectedOverride !== null"
        type="button"
        class="rounded-lg border border-[#17613f] px-4 py-2.5 font-bold text-[#17613f] hover:bg-[#eef6e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17613f]"
        @click="restoreBaseInvoice"
      >
        Przywróć bazową fakturę w tym miesiącu
      </button>
      <p
        v-if="billing === 'daily' && estimate?.reduction === 0"
        class="text-xs leading-5 text-[#667e6b]"
      >
        Faktura się nie zmienia, więc nie trzeba zapisywać osobnej kwoty.
      </p>
      <p v-if="alreadyApplied" class="text-xs font-semibold text-[#17613f]">
        Ta kwota jest już zapisana w planie.
      </p>
      <button
        v-if="canApply"
        type="button"
        class="rounded-lg bg-[#17613f] px-4 py-2.5 font-bold text-white hover:bg-[#124c32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17613f]"
        @click="applyEstimate"
      >
        {{ selectedOverride === null ? 'Dodaj kwotę do planu' : 'Zastąp kwotę w planie' }}
      </button>
      <p class="text-xs leading-5 text-[#667e6b]">
        To proste przeliczenie według wpisanych dni i zasad kontraktu, nie ustalenie prawa do
        płatnego wolnego. W kalkulatorze B2B koszty i składki nadal są liczone także przy fakturze 0
        zł.
        <a
          href="https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/jakie-sa-roznice-pomiedzy-umowa-o-prace-a-umowami-cywilnoprawnymi"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold underline"
          >Porównaj prawa UoP i warunki B2B w PIP</a
        >.
      </p>
    </div>
  </details>
</template>
