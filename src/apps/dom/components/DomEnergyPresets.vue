<script setup lang="ts">
import { AirVent, ArrowUpRight, CookingPot, Monitor, Refrigerator } from '@lucide/vue'
import { energyPresets, type EnergyPreset } from '../lib/energy-presets'

const props = defineProps<{
  power: string
  hours: string
  dailyHours: string
  daysPerWeek: string
}>()
const emit = defineEmits<{ select: [preset: EnergyPreset] }>()

const icons = {
  fridge: Refrigerator,
  oven: CookingPot,
  airConditioner: AirVent,
  computer: Monitor,
}

function selected(preset: EnergyPreset) {
  return (
    props.power === preset.powerWatts &&
    props.hours === preset.hoursPerUseDay &&
    props.dailyHours === preset.hoursPerUseDay &&
    props.daysPerWeek === preset.daysPerWeek
  )
}
</script>

<template>
  <div class="energy-presets" aria-labelledby="energy-presets-title">
    <div class="presets-heading">
      <strong id="energy-presets-title">Wybierz przykład urządzenia</strong>
      <p>
        Uzupełnimy moc i czas pracy. Cenę energii oraz wszystkie wartości możesz zmienić poniżej.
      </p>
    </div>
    <div class="presets-grid">
      <button
        v-for="preset in energyPresets"
        :key="preset.id"
        type="button"
        class="preset-card"
        :class="{ 'preset-card--selected': selected(preset) }"
        :aria-pressed="selected(preset)"
        @click="emit('select', preset)"
      >
        <span class="preset-top">
          <span class="preset-icon"
            ><component :is="icons[preset.id]" :size="20" aria-hidden="true"
          /></span>
          <ArrowUpRight :size="16" aria-hidden="true" />
        </span>
        <strong>{{ preset.label }}</strong>
        <span class="preset-values"
          >{{ preset.powerWatts }} W · {{ preset.hoursPerUseDay }} h/dzień ·
          {{ preset.daysPerWeek }} dni/tydz.</span
        >
        <small>{{ preset.description }}</small>
      </button>
    </div>
    <p class="presets-note">
      To orientacyjne założenia, nie wartości gwarantowane. Sprawdź dane swojego urządzenia;
      prognoza roczna zakłada taki sam harmonogram przez cały rok, także dla klimatyzacji.
    </p>
  </div>
</template>

<style scoped>
.energy-presets {
  margin-top: 1.5rem;
}
.presets-heading strong {
  color: #355b43;
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.presets-heading p,
.presets-note {
  margin-top: 0.35rem;
  color: #6f8173;
  font-size: 0.72rem;
  line-height: 1.55;
}
.presets-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.85rem;
}
.preset-card {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid #d8e5d7;
  border-radius: 13px;
  background: #fffefa;
  color: #29533a;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}
.preset-card:hover {
  border-color: #83ad8b;
  background: #f1f8ed;
  transform: translateY(-2px);
}
.preset-card:focus-visible {
  outline: 2px solid #285b42;
  outline-offset: 2px;
}
.preset-card--selected {
  border-color: #39805a;
  background: #eaf5e8;
  box-shadow: inset 0 0 0 1px #39805a;
}
.preset-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  color: #568069;
}
.preset-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e4f0df;
  color: #416f53;
}
.preset-card strong {
  margin-top: 0.1rem;
  font-family: var(--font-heading);
  font-size: 0.93rem;
}
.preset-values {
  color: #355b43;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.4;
}
.preset-card small {
  color: #75877a;
  font-size: 0.67rem;
  line-height: 1.45;
}
.presets-note {
  margin-top: 0.75rem;
}
@media (max-width: 540px) {
  .presets-grid {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .preset-card {
    transition: none;
  }
}
</style>
