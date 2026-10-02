<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ArrowUpRight, Check, ClipboardCheck, Fuel, Route, Weight } from '@lucide/vue'
import FaqSection from '@/shared/components/FaqSection.vue'
import journeyIllustration from '../assets/journey-illustration.svg'
import { siteName, siteUrl, useCaravaningSeo } from '../seo/useCaravaningSeo'

interface JourneyTool {
  title: string
  description: string
  detail: string
  category: string
  number: string
  icon: Component
  to: { name: string }
  tone: string
}

const tools: JourneyTool[] = [
  {
    title: 'Kalkulator DMC',
    description: 'Zestaw masy samochodu i przyczepy, zanim zaplanujesz trasę.',
    detail: 'DMC zestawu i orientacyjna kategoria uprawnień',
    category: 'Bezpieczeństwo',
    number: '01',
    icon: Weight,
    to: { name: 'caravaning-dmc' },
    tone: 'sage',
  },
  {
    title: 'Koszt podróży',
    description: 'Oszacuj paliwo, budżet przejazdu i tankowania w obie strony.',
    detail: 'Spalanie, dystans i cena paliwa',
    category: 'Planowanie',
    number: '02',
    icon: Fuel,
    to: { name: 'caravaning-fuel' },
    tone: 'sand',
  },
  {
    title: 'Checklista przed wyjazdem',
    description: 'Przejdź po kolei przez kontrolę przyczepy i połączenia z autem.',
    detail: 'Lista podzielona na trzy etapy',
    category: 'Przygotowanie',
    number: '03',
    icon: ClipboardCheck,
    to: { name: 'caravaning-checklist' },
    tone: 'blue',
  },
]

const faq = [
  {
    question: 'Od czego zacząć planowanie wyjazdu z przyczepą?',
    answer:
      'Sprawdź DMC obu pojazdów i parametry dopuszczalne dla samochodu. Następnie oszacuj dystans, spalanie i koszt paliwa. Tuż przed wyjazdem przejdź checklistę kontroli zestawu.',
  },
  {
    question: 'Czy kalkulator DMC pokazuje rzeczywistą masę zestawu?',
    answer:
      'Nie. Dodaje dopuszczalne masy całkowite z dokumentów. Rzeczywistą masę załadowanego zestawu można ustalić przez ważenie.',
  },
  {
    question: 'Czy koszt podróży uwzględnia jazdę z przyczepą?',
    answer:
      'Możesz dodać orientacyjną korektę spalania. Rzeczywiste zużycie zależy od samochodu, masy zestawu, prędkości, trasy i pogody.',
  },
  {
    question: 'Czy mogę przerwać checklistę i wrócić później?',
    answer:
      'Tak. Zaznaczone punkty są zapisywane lokalnie w przeglądarce, więc możesz wrócić do przygotowań na tym samym urządzeniu.',
  },
]

useCaravaningSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: siteName, url: siteUrl },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: siteName,
      url: siteUrl,
      inLanguage: 'pl-PL',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
})
</script>

<template>
  <div class="journey-page">
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"
            ><Route :size="16" aria-hidden="true" /> Spokojna droga zaczyna się od planu</span
          >
          <h1>Zanim ruszysz, <em>miej wszystko policzone.</em></h1>
          <p>
            Przyczepa daje wolność wyboru trasy. Dobry plan daje spokój po drodze. Sprawdź masę
            zestawu, oszacuj koszt paliwa i przejdź ostatnią kontrolę przed wyjazdem.
          </p>
          <div class="hero-actions">
            <a href="#narzedzia" class="hero-cta"
              >Zobacz narzędzia <ArrowRight :size="18" aria-hidden="true" /></a
            ><RouterLink :to="{ name: 'caravaning-checklist' }" class="hero-link"
              >Przejdź checklistę <ArrowUpRight :size="17" aria-hidden="true"
            /></RouterLink>
          </div>
          <div class="hero-points">
            <span><Check :size="16" aria-hidden="true" /> Bez konta</span
            ><span><Check :size="16" aria-hidden="true" /> Wyniki od razu</span
            ><span><Check :size="16" aria-hidden="true" /> Plan na Twoich zasadach</span>
          </div>
        </div>
        <div class="hero-art">
          <img
            :src="journeyIllustration"
            width="680"
            height="530"
            alt="Ilustracja przyczepy kempingowej na drodze oraz kart planowania podróży"
          />
        </div>
      </div>
    </section>

    <section class="route-strip" aria-label="Etapy przygotowania podróży">
      <div>
        <span>01 / SPRAWDŹ</span><strong>Parametry zestawu</strong
        ><small>Samochód, przyczepa i DMC</small>
      </div>
      <div>
        <span>02 / ZAPLANUJ</span><strong>Budżet drogi</strong
        ><small>Dystans, spalanie i paliwo</small>
      </div>
      <div>
        <span>03 / WYRUSZ</span><strong>Ostatnia kontrola</strong
        ><small>Checklista przed wyjazdem</small>
      </div>
    </section>

    <section id="narzedzia" class="tools-section">
      <div class="section-heading">
        <div>
          <p class="section-kicker">TWOJE CENTRUM PRZYGOTOWAŃ</p>
          <h2>Wybierz kolejny krok.</h2>
          <p>
            Trzy narzędzia prowadzą Cię od parametrów pojazdów do ostatniego spojrzenia przed
            ruszeniem.
          </p>
        </div>
        <span class="section-count">03 <small>narzędzia</small></span>
      </div>
      <div class="tool-grid">
        <RouterLink
          v-for="tool in tools"
          :key="tool.number"
          :to="tool.to"
          class="tool-card"
          :class="`tool-card--${tool.tone}`"
          ><span class="card-top"
            ><span class="card-category">{{ tool.category }}</span
            ><ArrowUpRight :size="21" aria-hidden="true" /></span
          ><span class="card-icon"
            ><component :is="tool.icon" :size="36" :stroke-width="1.8" aria-hidden="true" /></span
          ><span class="card-content"
            ><small>{{ tool.number }} / {{ tool.detail }}</small
            ><strong>{{ tool.title }}</strong
            ><span>{{ tool.description }}</span></span
          ></RouterLink
        >
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-inner">
        <div>
          <p class="section-kicker">PRAKTYCZNY PORADNIK</p>
          <h2>Wolność podróżowania lubi konkrety.</h2>
          <p class="guide-lead">
            Zanim wybierzesz miejsce postoju, poświęć chwilę na liczby i kontrolę zestawu. To proste
            kroki, które pomagają ograniczyć niespodzianki po drodze.
          </p>
        </div>
        <div class="guide-steps">
          <article>
            <span>01</span>
            <div>
              <h3>Najpierw sprawdź DMC</h3>
              <p>
                Odczytaj dopuszczalne masy z dokumentów auta i przyczepy.
                <RouterLink :to="{ name: 'caravaning-dmc' }">Kalkulator DMC</RouterLink> zestawi je
                w jednym miejscu. Wynik porównaj z danymi technicznymi pojazdów i wymaganiami
                dotyczącymi uprawnień.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Policz budżet przejazdu</h3>
              <p>
                Przyczepa może zwiększyć spalanie. Podaj dystans, średnie zużycie paliwa i cenę za
                litr w
                <RouterLink :to="{ name: 'caravaning-fuel' }"
                  >kalkulatorze kosztów podróży</RouterLink
                >, a potem dodaj rezerwę na postoje i zmianę warunków jazdy.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Przejdź kontrolę przed ruszeniem</h3>
              <p>
                Sprawdź okna, klapy, zaczep, oświetlenie i luźne przedmioty.
                <RouterLink :to="{ name: 'caravaning-checklist' }">Checklista wyjazdowa</RouterLink>
                porządkuje punkty w etapach i zapamiętuje postęp w przeglądarce.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <div class="faq-wrap">
      <FaqSection :items="faq" title="Pytania przed podróżą z przyczepą" />
    </div>
  </div>
</template>

<style scoped>
.journey-page {
  background: #fbfaf5;
  color: #203a32;
}
.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 75% 25%, #3c6b55 0, transparent 39%),
    linear-gradient(120deg, #123a30, #1b4939 62%, #315943);
}
.hero::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.2;
  background-image:
    linear-gradient(#c8e1bc36 1px, transparent 1px),
    linear-gradient(90deg, #c8e1bc36 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(90deg, transparent 15%, #000);
}
.hero-grid {
  position: relative;
  width: min(100% - 2.5rem, 1280px);
  min-height: 565px;
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 2rem;
}
.hero-copy {
  z-index: 1;
  padding-block: 4.5rem;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.52rem 0.82rem;
  border: 1px solid #aed6ac66;
  border-radius: 999px;
  background: #ffffff15;
  color: #e2efd6;
  font-size: 0.8rem;
  font-weight: 800;
}
h1,
h2,
h3 {
  font-family: var(--font-heading);
  letter-spacing: -0.05em;
}
.hero h1 {
  max-width: 640px;
  margin-top: 1.6rem;
  font-size: clamp(3.2rem, 5.2vw, 5.5rem);
  font-weight: 800;
  line-height: 1.07;
}
.hero h1 em {
  color: #e5d29b;
  font-style: normal;
}
.hero-copy > p {
  max-width: 580px;
  margin-top: 1.4rem;
  color: #d0e2d4;
  font-size: 1.06rem;
  line-height: 1.8;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  margin-top: 2rem;
}
.hero-cta,
.hero-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
}
.hero-cta {
  padding: 0.98rem 1.2rem;
  border-radius: 12px;
  background: #e5d29b;
  color: #214239;
}
.hero-cta:hover {
  background: #f5e6b9;
}
.hero-link {
  color: #e3f1db;
}
.hero-link:hover {
  color: #fff;
}
.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.25rem;
  margin-top: 1.8rem;
  color: #cbe1d0;
  font-size: 0.78rem;
  font-weight: 700;
}
.hero-points span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.hero-points svg {
  color: #e5d29b;
}
.hero-art {
  position: relative;
  display: grid;
  place-items: center;
}
.hero-art img {
  width: min(100%, 680px);
  height: auto;
  filter: drop-shadow(0 20px 25px #092b2055);
}
.route-strip {
  width: min(100% - 2.5rem, 1280px);
  margin: -1px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid #e5e9d9;
  border-radius: 0 0 19px 19px;
  background: #fffdf5;
  box-shadow: 0 12px 27px #21493911;
}
.route-strip > div {
  display: grid;
  gap: 0.25rem;
  padding: 1.4rem 1.6rem;
}
.route-strip > div + div {
  border-left: 1px solid #e5e9d9;
}
.route-strip span {
  color: #b38763;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
.route-strip strong {
  font-family: var(--font-heading);
  font-size: 1rem;
}
.route-strip small {
  color: #7b8b7b;
  font-size: 0.76rem;
}
.tools-section,
.faq-wrap {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
}
.tools-section {
  padding-top: 6rem;
  scroll-margin-top: 5rem;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}
.section-kicker {
  color: #aa7252;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}
.section-heading h2,
.guide-inner h2 {
  margin-top: 0.7rem;
  font-size: clamp(2.25rem, 3.5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.13;
}
.section-heading p:last-child {
  max-width: 580px;
  margin-top: 0.8rem;
  color: #6d806e;
  line-height: 1.65;
}
.section-count {
  color: #cbd9c7;
  font-family: var(--font-heading);
  font-size: 4.6rem;
  font-weight: 800;
  line-height: 1;
}
.section-count small {
  display: block;
  margin-top: 0.2rem;
  color: #829484;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
.tool-card {
  --card: #e1efe0;
  --ink: #547d5b;
  position: relative;
  min-height: 292px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 1.55rem;
  border: 1px solid #234a3012;
  border-radius: 22px;
  background: var(--card);
  color: #254234;
  text-decoration: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px #1c46301c;
}
.tool-card--sand {
  --card: #f4ead7;
  --ink: #a38153;
}
.tool-card--blue {
  --card: #e1ecea;
  --ink: #5a8a88;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
}
.card-category {
  padding: 0.35rem 0.65rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.card-icon {
  position: absolute;
  top: 79px;
  right: 1.3rem;
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border: 2px solid currentColor;
  border-radius: 24px;
  color: var(--ink);
  opacity: 0.35;
  transform: rotate(9deg);
}
.card-content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.35rem;
}
.card-content small {
  color: var(--ink);
  font-size: 0.72rem;
  font-weight: 800;
}
.card-content strong {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
}
.card-content > span {
  max-width: 340px;
  color: #607366;
  font-size: 0.85rem;
  line-height: 1.6;
}
.guide-section {
  margin-top: 6.2rem;
  background: #e8eee4;
}
.guide-inner {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 4rem;
  padding-block: 5rem;
}
.guide-lead {
  max-width: 400px;
  margin-top: 1.2rem;
  color: #667969;
  line-height: 1.78;
}
.guide-steps {
  display: grid;
  gap: 0.8rem;
}
.guide-steps article {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 1rem;
  padding: 1.2rem;
  border: 1px solid #d5e2d2;
  border-radius: 16px;
  background: #fffdf7;
}
.guide-steps article > span {
  color: #bc8a68;
  font-family: var(--font-heading);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
}
.guide-steps h3 {
  font-size: 1.05rem;
  font-weight: 800;
}
.guide-steps p {
  margin-top: 0.45rem;
  color: #63766a;
  font-size: 0.84rem;
  line-height: 1.7;
}
.guide-steps a {
  color: #2b654b;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.faq-wrap {
  padding-top: 3.5rem;
  padding-bottom: 5rem;
}
@media (max-width: 850px) {
  .hero-grid {
    display: block;
  }
  .hero-copy {
    padding-block: 4rem 0;
  }
  .hero-art {
    max-width: 580px;
    margin-inline: auto;
  }
  .route-strip {
    grid-template-columns: 1fr;
  }
  .route-strip > div + div {
    border-left: 0;
    border-top: 1px solid #e5e9d9;
  }
  .guide-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
@media (max-width: 620px) {
  .hero h1 {
    font-size: clamp(3rem, 11vw, 4rem);
  }
  .hero-copy > p {
    font-size: 1rem;
  }
  .section-count {
    display: none;
  }
  .tool-grid {
    grid-template-columns: 1fr;
  }
  .guide-inner {
    padding-block: 4rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tool-card {
    transition: none;
  }
}
</style>
