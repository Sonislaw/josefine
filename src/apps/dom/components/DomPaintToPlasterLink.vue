<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{ area: number | null }>()
const to = computed(() => {
  if (props.area === null || !Number.isFinite(props.area) || props.area <= 0 || props.area > 10_000)
    return null
  return {
    path: domPath('/kalkulator-gladzi'),
    query: { area: String(Number(props.area.toFixed(6))) },
  }
})
</script>

<template>
  <section v-if="to" class="plaster-followup" aria-label="Przygotowanie ścian do malowania">
    <div>
      <span>PRZED MALOWANIEM</span><strong>Potrzebujesz gładzi?</strong>
      <p>
        Przeniesiemy powierzchnię do kalkulatora gładzi. Zużycie produktu i opakowanie uzupełnisz
        tam osobno.
      </p>
    </div>
    <RouterLink :to="to">Policz gładź <ArrowUpRight :size="17" aria-hidden="true" /></RouterLink>
  </section>
</template>

<style scoped>
.plaster-followup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid #d9e5d7;
  border-radius: 18px;
  background: linear-gradient(110deg, #edf5ec, #faf6e9);
}
.plaster-followup span {
  color: #aa694d;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.plaster-followup strong {
  display: block;
  margin-top: 0.3rem;
  color: #28533c;
  font-family: var(--font-heading);
  font-size: 1.05rem;
}
.plaster-followup p {
  max-width: 650px;
  margin-top: 0.35rem;
  color: #6b806f;
  font-size: 0.75rem;
  line-height: 1.5;
}
.plaster-followup a {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  background: #2c6548;
  color: #fff;
  font-size: 0.77rem;
  font-weight: 800;
  text-decoration: none;
}
.plaster-followup a:hover {
  background: #22553c;
}
.plaster-followup a:focus-visible {
  outline: 2px solid #22553c;
  outline-offset: 3px;
}
</style>
