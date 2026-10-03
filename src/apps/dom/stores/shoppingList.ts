import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// This browser-only list belongs to Dom. Other modules may have different purchase models.
export const domShoppingListStorageKey = 'josefine:dom:shopping-list:v1'

export const shoppingKinds = {
  panels: { label: 'Panele podłogowe', unit: 'pacz.', path: '/liczba-paczek-paneli' },
  underlay: { label: 'Podkład pod panele', unit: 'opak.', path: '/liczba-paczek-paneli' },
  tilePieces: { label: 'Płytki', unit: 'szt.', path: '/liczba-plytek' },
  tileBoxes: { label: 'Płytki', unit: 'kart.', path: '/liczba-plytek' },
  skirting: { label: 'Listwy przypodłogowe', unit: 'szt.', path: '/obwod-prostokata' },
  paintCans: { label: 'Farba', unit: 'pusz.', path: '/ilosc-farby' },
} as const

export type ShoppingKind = keyof typeof shoppingKinds
type StandardKind = Exclude<ShoppingKind, 'paintCans'>
// Paint adds one optional branch to the existing v1 envelope; older saved items still validate.
export type ShoppingDraft =
  | { kind: StandardKind; quantity: number; cost: number | null }
  | { kind: 'paintCans'; quantity: number; cost: number | null; packageSizeLiters: number }
export type ShoppingItem = ShoppingDraft & { id: string }

function isDraft(value: unknown): value is ShoppingDraft {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const basic =
    typeof item.kind === 'string' &&
    Object.hasOwn(shoppingKinds, item.kind) &&
    typeof item.quantity === 'number' &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0 &&
    (item.cost === null ||
      (typeof item.cost === 'number' && Number.isFinite(item.cost) && item.cost >= 0))
  if (!basic) return false
  return (
    item.kind !== 'paintCans' ||
    (typeof item.packageSizeLiters === 'number' &&
      Number.isFinite(item.packageSizeLiters) &&
      item.packageSizeLiters > 0 &&
      Number.isFinite((item.quantity as number) * item.packageSizeLiters))
  )
}

function isItem(value: unknown): value is ShoppingItem {
  return (
    isDraft(value) &&
    typeof (value as ShoppingItem).id === 'string' &&
    (value as ShoppingItem).id.length > 0
  )
}

function parseSavedItems(raw: string): ShoppingItem[] {
  const data: unknown = JSON.parse(raw)
  if (!data || typeof data !== 'object') throw new Error('Invalid shopping list')
  const saved = data as { version?: unknown; items?: unknown }
  if (saved.version !== 1 || !Array.isArray(saved.items) || !saved.items.every(isItem)) {
    throw new Error('Unsupported shopping list')
  }
  return saved.items
}

export const useDomShoppingList = defineStore('dom-shopping-list', () => {
  const items = ref<ShoppingItem[]>([])
  const hydrated = ref(false)
  const storageError = ref(false)

  const knownTotal = computed(
    () =>
      items.value.reduce(
        (total, item) => total + (item.cost === null ? 0 : Math.round(item.cost * 100)),
        0,
      ) / 100,
  )
  const unknownPriceCount = computed(() => items.value.filter((item) => item.cost === null).length)

  function hydrate() {
    if (hydrated.value || typeof window === 'undefined') return
    hydrated.value = true
    try {
      const raw = window.localStorage.getItem(domShoppingListStorageKey)
      items.value = raw === null ? [] : parseSavedItems(raw)
      storageError.value = false
    } catch {
      storageError.value = true
    }
  }

  function persist(): boolean {
    try {
      window.localStorage.setItem(
        domShoppingListStorageKey,
        JSON.stringify({ version: 1, items: items.value }),
      )
      storageError.value = false
      return true
    } catch {
      storageError.value = true
      return false
    }
  }

  function addItems(drafts: ShoppingDraft[]): boolean {
    hydrate()
    if (!drafts.length || !drafts.every(isDraft) || typeof window === 'undefined') return false
    items.value.push(...drafts.map((draft) => ({ ...draft, id: window.crypto.randomUUID() })))
    return persist()
  }

  function removeItem(id: string) {
    hydrate()
    items.value = items.value.filter((item) => item.id !== id)
    persist()
  }

  function clearItems() {
    hydrate()
    items.value = []
    persist()
  }

  // Keep an open second tab in sync without sharing state across applications.
  function refreshFromStorage() {
    hydrated.value = false
    hydrate()
  }

  return {
    items,
    hydrated,
    storageError,
    knownTotal,
    unknownPriceCount,
    hydrate,
    addItems,
    removeItem,
    clearItems,
    refreshFromStorage,
  }
})
