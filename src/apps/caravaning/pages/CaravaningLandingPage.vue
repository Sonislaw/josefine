<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  ClipboardCheck,
  Fuel,
  ShieldCheck,
  Weight,
} from '@lucide/vue'
import { Button } from '@/apps/caravaning/components/ui/button'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'

interface ToolItem {
  title: string
  description: string
  icon: Component
  to?: string
}

const tools: ToolItem[] = [
  {
    title: 'Kalkulator DMC',
    description: 'Dodaj DMC samochodu i przyczepy, aby obliczyć łączną wartość zestawu.',
    icon: Weight,
    to: '/karawaning/kalkulator-dmc',
  },
  {
    title: 'Checklista przed wyjazdem',
    description: 'Odznacz punkty przed podpięciem przyczepy, po zaczepieniu i tuż przed ruszeniem.',
    icon: ClipboardCheck,
    to: '/karawaning/checklista-przed-wyjazdem',
  },
  {
    title: 'Kalkulator spalania',
    description: 'Oblicz paliwo, koszt przejazdu i szacowaną liczbę tankowań.',
    icon: Fuel,
    to: '/karawaning/kalkulator-spalania',
  },
]

useCaravaningSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: siteName,
      url: siteUrl,
      inLanguage: 'pl-PL',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
})
</script>

<template>
  <div>
    <section
      class="relative isolate flex min-h-[440px] items-center overflow-hidden bg-[#17362f] sm:min-h-[500px]"
    >
      <img
        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85"
        alt="Górska droga prowadząca przez zielony krajobraz"
        class="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div
        class="absolute inset-0 -z-10 bg-gradient-to-r from-[#102a25]/95 via-[#102a25]/80 to-[#102a25]/35"
      />

      <div class="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div class="max-w-2xl">
          <div class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-100">
            <ShieldCheck class="size-4" aria-hidden="true" />
            Mądrze zaplanuj każdą podróż
          </div>
          <h1
            class="font-heading text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl"
          >
            Narzędzia dla caravaningowców
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            Kalkulatory, planery i przydatne narzędzia dla podróżujących z przyczepą kempingową.
          </p>
          <nav class="mt-8 flex items-center gap-3" aria-label="Szybki dost?p do narz?dzi">
            <RouterLink
              to="/karawaning/kalkulator-dmc"
              aria-label="Kalkulator DMC"
              title="Kalkulator DMC"
              class="flex size-12 items-center justify-center border border-white/20 bg-white/10 text-white transition-colors hover:bg-emerald-700"
            >
              <Weight class="size-5" aria-hidden="true" />
            </RouterLink>
            <RouterLink
              to="/karawaning/checklista-przed-wyjazdem"
              aria-label="Checklista przed wyjazdem"
              title="Checklista przed wyjazdem"
              class="flex size-12 items-center justify-center border border-white/20 bg-white/10 text-white transition-colors hover:bg-emerald-700"
            >
              <ClipboardCheck class="size-5" aria-hidden="true" />
            </RouterLink>
            <RouterLink
              to="/karawaning/kalkulator-spalania"
              aria-label="Kalkulator spalania"
              title="Kalkulator spalania"
              class="flex size-12 items-center justify-center border border-white/20 bg-white/10 text-white transition-colors hover:bg-emerald-700"
            >
              <Fuel class="size-5" aria-hidden="true" />
            </RouterLink>
          </nav>
        </div>
      </div>
      <div class="absolute bottom-0 right-0 hidden h-1.5 w-1/3 bg-emerald-600 sm:block" />
    </section>

    <section id="narzedzia" class="scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div class="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary">Centrum narzędzi</p>
            <h2 class="mt-2 font-heading text-2xl font-bold tracking-normal sm:text-3xl">
              Przygotuj się do drogi
            </h2>
          </div>
          <p class="max-w-md text-sm leading-6 text-muted-foreground">
            Wszystko, co przydaje się przed wyjazdem i podczas planowania kolejnych kilometrów.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(tool, index) in tools"
            :key="tool.title"
            class="flex min-h-56 flex-col border border-border bg-card p-5 transition-colors hover:border-primary/40 sm:p-6"
            :class="index === 0 ? 'border-primary/30 bg-primary/[0.025]' : ''"
          >
            <div class="flex items-start justify-between gap-4">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"
              >
                <component :is="tool.icon" class="size-5" aria-hidden="true" />
              </span>
              <span
                v-if="!tool.to"
                class="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                Wkrótce
              </span>
            </div>
            <h3 class="mt-5 font-heading text-lg font-semibold tracking-normal">
              {{ tool.title }}
            </h3>
            <p class="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
              {{ tool.description }}
            </p>
            <div class="mt-5">
              <Button v-if="tool.to" as-child variant="outline" size="sm">
                <RouterLink :to="tool.to">
                  Otwórz
                  <ArrowRight class="size-4" aria-hidden="true" />
                </RouterLink>
              </Button>
              <Button v-else variant="outline" size="sm" disabled>Wkrótce</Button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section aria-labelledby="caravaning-guide-heading" class="border-t border-border bg-muted/20">
      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold text-primary">Praktyczny poradnik</p>
          <h2 id="caravaning-guide-heading" class="mt-2 font-heading text-2xl font-bold tracking-normal sm:text-3xl">
            Caravaning z przyczepa: zaplanuj podroz i przygotuj zestaw
          </h2>
          <p class="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            Podrozowanie z przyczepa kempingowa daje swobode wyboru trasy i miejsca postoju, ale wymaga
            dobrego przygotowania samochodu oraz calego zestawu. Przed wyjazdem warto sprawdzic
            dopuszczalne masy pojazdow, oszacowac zuzycie paliwa i przejsc przez najwazniejsze punkty
            kontroli. Zebrane tu narzedzia pomagaja uporzadkowac te czynnosci przed ruszeniem w droge.
          </p>
        </div>
        <div class="mt-8 grid gap-8 border-t border-border pt-8 md:grid-cols-3">
          <article>
            <h3 class="font-heading text-lg font-semibold tracking-normal">Sprawdz DMC samochodu i przyczepy</h3>
            <p class="mt-3 text-sm leading-6 text-muted-foreground">
              Dopuszczalna masa calkowita ma znaczenie przy doborze samochodu i planowaniu obciazenia.
              Skorzystaj z <RouterLink to="/karawaning/kalkulator-dmc" class="font-medium text-primary underline underline-offset-4">kalkulatora DMC</RouterLink>,
              aby zestawic wartosci i ocenic parametry pojazdow. Porownaj wynik z danymi w dowodach
              rejestracyjnych i wymaganiami dotyczacymi uprawnien kierowcy.
            </p>
          </article>
          <article>
            <h3 class="font-heading text-lg font-semibold tracking-normal">Oszacuj spalanie i koszt paliwa</h3>
            <p class="mt-3 text-sm leading-6 text-muted-foreground">
              Jazda z przyczepa moze zwiekszyc zuzycie paliwa, dlatego warto uwzglednic je w budzecie
              wyjazdu. <RouterLink to="/karawaning/kalkulator-spalania" class="font-medium text-primary underline underline-offset-4">Kalkulator spalania</RouterLink>
              pomoze oszacowac ilosc potrzebnego paliwa, koszt przejazdu i liczbe tankowan na podstawie
              planowanego dystansu oraz spalania zestawu.
            </p>
          </article>
          <article>
            <h3 class="font-heading text-lg font-semibold tracking-normal">Przejdz checkliste przed wyjazdem</h3>
            <p class="mt-3 text-sm leading-6 text-muted-foreground">
              Przed ruszeniem sprawdz zamkniecie okien i klap, zabezpieczenie wnetrza, zaczep,
              polaczenie elektryczne oraz oswietlenie. <RouterLink to="/karawaning/checklista-przed-wyjazdem" class="font-medium text-primary underline underline-offset-4">Checklista przed wyjazdem</RouterLink>
              pozwala odhaczac kolejne punkty i zapisac postep w przegladarce, by wrocic do przygotowan
              w dowolnym momencie.
            </p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
