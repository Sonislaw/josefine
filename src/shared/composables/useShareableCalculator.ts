import { computed, onMounted, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'

type WritableValue<T> = { value: T }

export interface ShareField {
  key: string
  read: () => string | null
  restore: (raw: string) => void
}

interface NumberOptions {
  min?: number
  max?: number
  integer?: boolean
  allowEmpty?: boolean
  choices?: readonly number[]
}

/** Only declared fields are read from a shared URL; invalid values leave form defaults intact. */
export function numberShareField<T extends number | string>(
  key: string,
  model: WritableValue<T>,
  options: NumberOptions = {},
): ShareField {
  const parse = (raw: string): number | '' | null => {
    if (raw === '') return options.allowEmpty ? '' : null
    if (raw.length > 40 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null
    const value = Number(raw)
    if (!Number.isFinite(value)) return null
    if (options.integer && !Number.isSafeInteger(value)) return null
    if (options.min !== undefined && value < options.min) return null
    if (options.max !== undefined && value > options.max) return null
    if (options.choices && !options.choices.includes(value)) return null
    return value
  }

  return {
    key,
    read: () => {
      const raw = String(model.value)
      return parse(raw) === null ? null : raw
    },
    restore: (raw) => {
      const value = parse(raw)
      if (value !== null) model.value = value as T
    },
  }
}

export function textShareField(
  key: string,
  model: WritableValue<string>,
  isValid: (value: string) => boolean = () => true,
): ShareField {
  const valid = (value: string) => value.length <= 100 && isValid(value)
  return {
    key,
    read: () => (valid(model.value) ? model.value : null),
    restore: (raw) => {
      if (valid(raw)) model.value = raw
    },
  }
}

export function choiceShareField<T extends string>(
  key: string,
  model: WritableValue<T>,
  choices: readonly T[],
): ShareField {
  return {
    key,
    read: () => (choices.includes(model.value) ? model.value : null),
    restore: (raw) => {
      if (choices.includes(raw as T)) model.value = raw as T
    },
  }
}

export function booleanShareField(key: string, model: WritableValue<boolean>): ShareField {
  return {
    key,
    read: () => (model.value ? '1' : '0'),
    restore: (raw) => {
      if (raw === '1' || raw === '0') model.value = raw === '1'
    },
  }
}

/**
 * Module calculators only declare their input fields. The shared layer handles local paths,
 * clean subdomain paths and SSG hydration without serializing the calculated output.
 */
export function useShareableCalculator(fields: MaybeRefOrGetter<readonly ShareField[]>) {
  const route = useRoute()

  const restoreFromUrl = () => {
    for (const field of toValue(fields)) {
      const value = route.query[field.key]
      if (typeof value === 'string') field.restore(value)
    }
  }

  // SSG HTML has no query state; restore only after hydration to avoid a mismatch.
  onMounted(restoreFromUrl)
  watch(() => route.fullPath, restoreFromUrl)

  const canShareInputs = computed(() => toValue(fields).every((field) => field.read() !== null))

  const buildShareUrl = () => {
    const url = new URL(route.path, window.location.origin)
    for (const field of toValue(fields)) {
      const value = field.read()
      if (value !== null) url.searchParams.set(field.key, value)
    }
    return url.href
  }

  return { buildShareUrl, canShareInputs }
}
