import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { isRoomDimensions, type RoomDimensions } from '../lib/room-metrics'
import { isRoomLaborRates, type RoomLaborRates } from '../lib/room-budget'

// This browser-only list belongs to Dom. Other modules may have different purchase models.
export const legacyDomShoppingListStorageKey = 'josefine:dom:shopping-list:v1'
export const domShoppingListStorageKey = 'josefine:dom:shopping-list:v2'

export const shoppingKinds = {
  panels: { label: 'Panele podłogowe', unit: 'pacz.', path: '/liczba-paczek-paneli' },
  underlay: { label: 'Podkład pod panele', unit: 'opak.', path: '/liczba-paczek-paneli' },
  tilePieces: { label: 'Płytki', unit: 'szt.', path: '/liczba-plytek' },
  tileBoxes: { label: 'Płytki', unit: 'kart.', path: '/liczba-plytek' },
  tileAdhesiveBags: { label: 'Klej do płytek', unit: 'work.', path: '/klej-do-plytek' },
  groutPacks: { label: 'Fuga', unit: 'opak.', path: '/kalkulator-fugi' },
  skirting: { label: 'Listwy przypodłogowe', unit: 'szt.', path: '/obwod-prostokata' },
  paintCans: { label: 'Farba', unit: 'pusz.', path: '/ilosc-farby' },
  wallpaperRolls: { label: 'Tapeta', unit: 'rol.', path: '/liczba-rolek-tapety' },
} as const

export type ShoppingKind = keyof typeof shoppingKinds
type StandardKind = Exclude<
  ShoppingKind,
  'paintCans' | 'groutPacks' | 'tilePieces' | 'tileBoxes' | 'tileAdhesiveBags'
>
// New purchase details are optional on old entries, preserving existing v1/v2 saved lists.
export type ShoppingDraft =
  | { kind: StandardKind; quantity: number; cost: number | null }
  | {
      kind: 'tilePieces' | 'tileBoxes'
      quantity: number
      cost: number | null
      tileSurface?: 'floor' | 'walls'
      tileLengthCm?: number
      tileWidthCm?: number
      piecesPerBox?: number
      tiledAreaM2?: number
    }
  | {
      kind: 'tileAdhesiveBags'
      quantity: number
      cost: number | null
      tileSurface: 'floor' | 'walls'
      packageWeightKg: number
    }
  | {
      kind: 'paintCans'
      quantity: number
      cost: number | null
      packageSizeLiters: number
      paintVariant?: 'main' | 'accent'
    }
  | { kind: 'groutPacks'; quantity: number; cost: number | null; packageWeightKg: number }
export type ShoppingItem = ShoppingDraft & { id: string; roomId: string | null; purchased: boolean }
type StoredShoppingItem = ShoppingDraft & {
  id: string
  roomId: string | null
  purchased?: boolean
}
export type ShoppingRoom = {
  id: string
  name: string
  dimensions?: RoomDimensions
  laborRates?: RoomLaborRates
}

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
  if (item.kind === 'tilePieces' || item.kind === 'tileBoxes')
    return (
      (item.tileSurface === undefined ||
        item.tileSurface === 'floor' ||
        item.tileSurface === 'walls') &&
      (item.tileLengthCm === undefined ||
        (typeof item.tileLengthCm === 'number' &&
          Number.isFinite(item.tileLengthCm) &&
          item.tileLengthCm > 0 &&
          item.tileLengthCm <= 300)) &&
      (item.tileWidthCm === undefined ||
        (typeof item.tileWidthCm === 'number' &&
          Number.isFinite(item.tileWidthCm) &&
          item.tileWidthCm > 0 &&
          item.tileWidthCm <= 300)) &&
      (item.tileLengthCm === undefined) === (item.tileWidthCm === undefined) &&
      (item.piecesPerBox === undefined ||
        (item.kind === 'tileBoxes' &&
          typeof item.piecesPerBox === 'number' &&
          Number.isSafeInteger(item.piecesPerBox) &&
          item.piecesPerBox > 0)) &&
      (item.tiledAreaM2 === undefined ||
        ((item.tileSurface === 'floor' || item.tileSurface === 'walls') &&
          typeof item.tiledAreaM2 === 'number' &&
          Number.isFinite(item.tiledAreaM2) &&
          item.tiledAreaM2 > 0 &&
          item.tiledAreaM2 <= 4_000_000))
    )
  if (item.kind === 'tileAdhesiveBags')
    return (
      (item.tileSurface === 'floor' || item.tileSurface === 'walls') &&
      typeof item.packageWeightKg === 'number' &&
      Number.isFinite(item.packageWeightKg) &&
      item.packageWeightKg > 0 &&
      item.packageWeightKg <= 1000 &&
      Number.isFinite((item.quantity as number) * item.packageWeightKg)
    )
  if (item.kind === 'groutPacks')
    return (
      typeof item.packageWeightKg === 'number' &&
      Number.isFinite(item.packageWeightKg) &&
      item.packageWeightKg > 0 &&
      Number.isFinite((item.quantity as number) * item.packageWeightKg)
    )
  return (
    item.kind !== 'paintCans' ||
    (typeof item.packageSizeLiters === 'number' &&
      Number.isFinite(item.packageSizeLiters) &&
      item.packageSizeLiters > 0 &&
      Number.isFinite((item.quantity as number) * item.packageSizeLiters) &&
      (item.paintVariant === undefined ||
        item.paintVariant === 'main' ||
        item.paintVariant === 'accent'))
  )
}

function isLegacyItem(value: unknown): value is ShoppingDraft & { id: string } {
  return (
    isDraft(value) &&
    typeof (value as ShoppingItem).id === 'string' &&
    (value as ShoppingItem).id.length > 0
  )
}

function isItemWithRoom(value: unknown): value is StoredShoppingItem {
  return (
    isLegacyItem(value) &&
    ((value as StoredShoppingItem).roomId === null ||
      typeof (value as StoredShoppingItem).roomId === 'string') &&
    ((value as StoredShoppingItem).purchased === undefined ||
      typeof (value as StoredShoppingItem).purchased === 'boolean')
  )
}

function isRoom(value: unknown): value is ShoppingRoom {
  if (!value || typeof value !== 'object') return false
  const room = value as Partial<ShoppingRoom>
  return (
    typeof room.id === 'string' &&
    room.id.length > 0 &&
    typeof room.name === 'string' &&
    room.name.trim().length > 0 &&
    room.name.length <= 40 &&
    (room.dimensions === undefined || isRoomDimensions(room.dimensions)) &&
    (room.laborRates === undefined || isRoomLaborRates(room.laborRates))
  )
}

function parseLegacyItems(raw: string): ShoppingItem[] {
  const data: unknown = JSON.parse(raw)
  if (!data || typeof data !== 'object') throw new Error('Invalid shopping list')
  const saved = data as { version?: unknown; items?: unknown }
  if (saved.version !== 1 || !Array.isArray(saved.items) || !saved.items.every(isLegacyItem)) {
    throw new Error('Unsupported shopping list')
  }
  return saved.items.map((item) => ({ ...item, roomId: null, purchased: false }))
}

function parseSavedState(raw: string): { rooms: ShoppingRoom[]; items: ShoppingItem[] } {
  const data: unknown = JSON.parse(raw)
  if (!data || typeof data !== 'object') throw new Error('Invalid shopping list')
  const saved = data as { version?: unknown; rooms?: unknown; items?: unknown }
  if (
    saved.version !== 2 ||
    !Array.isArray(saved.rooms) ||
    !saved.rooms.every(isRoom) ||
    !Array.isArray(saved.items) ||
    !saved.items.every(isItemWithRoom)
  ) {
    throw new Error('Unsupported shopping list')
  }
  const roomIds = new Set(saved.rooms.map((room) => room.id))
  if (
    roomIds.size !== saved.rooms.length ||
    !saved.items.every(
      (item) =>
        item.roomId === null || (typeof item.roomId === 'string' && roomIds.has(item.roomId)),
    )
  ) {
    throw new Error('Invalid shopping list references')
  }
  // v2 entries saved before purchase tracking have no flag and remain "do kupienia".
  return {
    rooms: saved.rooms,
    items: saved.items.map((item) => ({ ...item, purchased: item.purchased === true })),
  }
}

function cleanRoomName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export const useDomShoppingList = defineStore('dom-shopping-list', () => {
  const items = ref<ShoppingItem[]>([])
  const rooms = ref<ShoppingRoom[]>([])
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
      if (raw !== null) {
        const state = parseSavedState(raw)
        rooms.value = state.rooms
        items.value = state.items
        storageError.value = false
      } else {
        const legacy = window.localStorage.getItem(legacyDomShoppingListStorageKey)
        rooms.value = []
        items.value = legacy === null ? [] : parseLegacyItems(legacy)
        storageError.value = legacy === null ? false : !persist()
      }
    } catch {
      storageError.value = true
    }
  }

  function persist(): boolean {
    try {
      window.localStorage.setItem(
        domShoppingListStorageKey,
        JSON.stringify({ version: 2, rooms: rooms.value, items: items.value }),
      )
      storageError.value = false
      return true
    } catch {
      storageError.value = true
      return false
    }
  }

  function addItems(drafts: ShoppingDraft[], roomId: string | null = null): boolean {
    hydrate()
    if (
      !drafts.length ||
      !drafts.every(isDraft) ||
      typeof window === 'undefined' ||
      (roomId !== null && !rooms.value.some((room) => room.id === roomId))
    )
      return false
    items.value.push(
      ...drafts.map((draft) => ({
        ...draft,
        id: window.crypto.randomUUID(),
        roomId,
        purchased: false,
      })),
    )
    return persist()
  }

  function canUseRoomName(name: string, exceptId: string | null = null): boolean {
    const normalized = name.toLocaleLowerCase('pl-PL')
    return (
      name.length > 0 &&
      name.length <= 40 &&
      normalized !== 'bez pomieszczenia' &&
      !rooms.value.some(
        (room) => room.id !== exceptId && room.name.toLocaleLowerCase('pl-PL') === normalized,
      )
    )
  }

  function createRoom(rawName: string): string | null {
    hydrate()
    const name = cleanRoomName(rawName)
    if (!canUseRoomName(name) || typeof window === 'undefined') return null
    const id = window.crypto.randomUUID()
    rooms.value.push({ id, name })
    persist()
    return id
  }

  function renameRoom(id: string, rawName: string): boolean {
    hydrate()
    const room = rooms.value.find((entry) => entry.id === id)
    const name = cleanRoomName(rawName)
    if (!room || !canUseRoomName(name, id)) return false
    room.name = name
    persist()
    return true
  }

  function setRoomDimensions(id: string, dimensions: RoomDimensions | null): boolean {
    hydrate()
    const room = rooms.value.find((entry) => entry.id === id)
    if (!room || (dimensions !== null && !isRoomDimensions(dimensions))) return false
    if (dimensions === null) delete room.dimensions
    else room.dimensions = { ...dimensions }
    persist()
    return true
  }

  function setRoomLaborRates(id: string, rates: RoomLaborRates | null): boolean {
    hydrate()
    const room = rooms.value.find((entry) => entry.id === id)
    if (!room || (rates !== null && !isRoomLaborRates(rates))) return false
    // Optional fields preserve the existing v2 storage envelope and older saved rooms.
    if (rates === null || Object.keys(rates).length === 0) delete room.laborRates
    else room.laborRates = { ...rates }
    persist()
    return true
  }

  function deleteRoom(id: string): boolean {
    hydrate()
    if (!rooms.value.some((room) => room.id === id)) return false
    // Deleting a room never deletes purchases; they return to the unassigned group.
    items.value = items.value.map((item) => (item.roomId === id ? { ...item, roomId: null } : item))
    rooms.value = rooms.value.filter((room) => room.id !== id)
    persist()
    return true
  }

  function assignItem(itemId: string, roomId: string | null): boolean {
    hydrate()
    const item = items.value.find((entry) => entry.id === itemId)
    if (!item || (roomId !== null && !rooms.value.some((room) => room.id === roomId))) return false
    item.roomId = roomId
    persist()
    return true
  }

  function updateItemPurchase(
    itemId: string,
    quantity: number,
    unitPriceCents: number | null,
  ): boolean {
    hydrate()
    const item = items.value.find((entry) => entry.id === itemId)
    if (
      !item ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      (unitPriceCents !== null &&
        (!Number.isSafeInteger(unitPriceCents) ||
          unitPriceCents < 0 ||
          !Number.isSafeInteger(unitPriceCents * quantity)))
    )
      return false

    // The stored cost is the total for this line; the edit form works with a unit price.
    const cost = unitPriceCents === null ? null : (unitPriceCents * quantity) / 100
    if (!isDraft({ ...item, quantity, cost })) return false
    item.quantity = quantity
    item.cost = cost
    persist()
    return true
  }

  function setItemPurchased(itemId: string, purchased: boolean): boolean {
    hydrate()
    const item = items.value.find((entry) => entry.id === itemId)
    if (!item || typeof purchased !== 'boolean') return false
    if (item.purchased === purchased) return true
    item.purchased = purchased
    persist()
    return true
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
    rooms,
    hydrated,
    storageError,
    knownTotal,
    unknownPriceCount,
    hydrate,
    addItems,
    createRoom,
    renameRoom,
    setRoomDimensions,
    setRoomLaborRates,
    deleteRoom,
    assignItem,
    updateItemPurchase,
    setItemPurchased,
    removeItem,
    clearItems,
    refreshFromStorage,
  }
})
