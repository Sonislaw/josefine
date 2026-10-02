<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowUpRight, Check, Coins, ReceiptText, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import moneyIllustration from '../assets/money-illustration.svg'
import { pieniadzeTools } from '../manifest'
import {
  pieniadzePath,
  pieniadzeSiteName,
  pieniadzeSiteUrl,
  usePieniadzeSeo,
} from '../seo/usePieniadzeSeo'

const categories = ['Wszystkie', 'VAT', 'Procenty', 'Zakupy', 'Biznes', 'Na co dzień'] as const
const category = ref<(typeof categories)[number]>('Wszystkie')
const visibleTools = computed(() =>
  category.value === 'Wszystkie'
    ? pieniadzeTools
    : pieniadzeTools.filter((tool) => tool.category === category.value),
)
const faq = [
  {
    question: 'Jak działają kalkulatory finansowe?',
    answer:
      'Wpisz własne wartości, a wynik pojawi się od razu w przeglądarce. Narzędzia pokazują obliczenia orientacyjne i nie zastępują indywidualnego rozliczenia.',
  },
  {
    question: 'Jaką stawkę VAT wybrać?',
    answer:
      'Wybierz stawkę właściwą dla produktu lub usługi. Nie każda transakcja podlega tej samej stawce, więc przed użyciem wyniku na fakturze sprawdź aktualne zasady dla swojej sytuacji.',
  },
  {
    question: 'Czym różni się marża od narzutu?',
    answer:
      'Marża odnosi zysk do ceny sprzedaży, a narzut do kosztu zakupu. Z tych samych kwot otrzymasz różne wartości procentowe, dlatego warto użyć właściwego kalkulatora.',
  },
  {
    question: 'Jak porównać produkty o różnych wielkościach opakowań?',
    answer:
      'Policz cenę jednostkową, na przykład za kilogram lub litr. Dzięki temu można porównać produkty o podobnej jakości, nawet jeśli mają różne gramatury i ceny na półce.',
  },
]

usePieniadzeSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: pieniadzeSiteName, url: pieniadzeSiteUrl, inLanguage: 'pl-PL' },
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
  <div class="money-page">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"
            ><Coins :size="16" aria-hidden="true" /> Liczby, które mają sens</span
          >
          <h1>Małe obliczenia. <em>Lepsze decyzje.</em></h1>
          <p>
            VAT na fakturze, rabat w sklepie, marża w firmie czy rachunek ze znajomymi. Zamiast
            zgadywać — wpisz liczby i zobacz, co naprawdę z nich wynika.
          </p>
          <a href="#kalkulatory" class="hero-cta"
            >Wybierz kalkulator <ArrowRight :size="18" aria-hidden="true"
          /></a>
          <div class="hero-points">
            <span><Check :size="16" aria-hidden="true" /> 11 narzędzi</span
            ><span><Check :size="16" aria-hidden="true" /> Wynik na bieżąco</span
            ><span><Check :size="16" aria-hidden="true" /> Bez konta</span>
          </div>
        </div>
        <div class="hero-art">
          <img
            :src="moneyIllustration"
            width="680"
            height="530"
            alt="Ilustracja rozliczenia brutto, netto i VAT z kartami rabatu oraz procentów"
          />
        </div>
      </div>
    </section>
    <section class="topic-strip" aria-label="Zakres kalkulatorów">
      <div>
        <ReceiptText :size="24" aria-hidden="true" /><strong>VAT i ceny</strong
        ><small>Brutto, netto i cena jednostkowa</small>
      </div>
      <div>
        <Sparkles :size="24" aria-hidden="true" /><strong>Procenty</strong
        ><small>Rabat, podwyżka, zmiana i udział</small>
      </div>
      <div>
        <Coins :size="24" aria-hidden="true" /><strong>Codzienne wydatki</strong
        ><small>Rachunek, napiwek i zakup</small>
      </div>
    </section>
    <section id="kalkulatory" class="tools-section">
      <div class="section-heading">
        <div>
          <p class="section-kicker">PORZĄDEK W LICZBACH</p>
          <h2>Co dziś chcesz przeliczyć?</h2>
          <p>
            Wybierz kategorię. Każdy kalkulator prowadzi od własnych danych do czytelnego wyniku.
          </p>
        </div>
        <span class="tool-count">11 <small>kalkulatorów</small></span>
      </div>
      <div class="category-tabs" role="group" aria-label="Filtruj kalkulatory pieniędzy">
        <button
          v-for="item in categories"
          :key="item"
          type="button"
          :aria-pressed="category === item"
          :class="{ active: category === item }"
          @click="category = item"
        >
          {{ item }}
        </button>
      </div>
      <div class="tool-grid">
        <RouterLink
          v-for="(tool, index) in visibleTools"
          :key="tool.id"
          :to="pieniadzePath(`/${tool.id}`)"
          class="tool-card"
          :class="[
            { featured: category === 'Wszystkie' && index === 0 },
            `tone-${tool.category.replaceAll(' ', '-')}`,
          ]"
          ><span class="card-top"
            ><span class="card-category">{{ tool.category }}</span
            ><ArrowUpRight :size="21" aria-hidden="true" /></span
          ><span class="card-symbol" aria-hidden="true">{{ tool.symbol }}</span
          ><span class="card-bottom"
            ><strong>{{ tool.title }}</strong
            ><small>{{ tool.description }}</small></span
          ></RouterLink
        >
      </div>
    </section>
    <section class="guide-section">
      <div class="guide-inner">
        <div>
          <p class="section-kicker">PRAKTYCZNY PORADNIK</p>
          <h2>Najpierw ustal, co porównujesz.</h2>
          <p>
            Procent jest przydatny tylko wtedy, gdy znasz jego podstawę. Cena brutto, koszt zakupu i
            rachunek na osobę odpowiadają na różne pytania — dlatego mają osobne narzędzia.
          </p>
        </div>
        <div class="guide-list">
          <article>
            <span>01</span>
            <div>
              <h3>Sprawdź cenę i podatek</h3>
              <p>
                <RouterLink :to="pieniadzePath('/brutto-netto')">Brutto → netto</RouterLink>
                rozdziela cenę końcową na podstawę i VAT. Kalkulator
                <RouterLink :to="pieniadzePath('/netto-brutto')">netto → brutto</RouterLink> pomaga
                zaplanować cenę z podatkiem. W obu przypadkach dobierz stawkę właściwą dla
                transakcji.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Porównaj oferty uczciwie</h3>
              <p>
                Po rabacie spójrz nie tylko na procent obniżki, lecz także na cenę końcową. Dla
                produktów o różnych opakowaniach użyj
                <RouterLink :to="pieniadzePath('/cena-jednostkowa')">ceny jednostkowej</RouterLink>.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Rozdziel koszty i zysk</h3>
              <p>
                W biznesie <RouterLink :to="pieniadzePath('/marza')">marża</RouterLink> odnosi zysk
                do ceny sprzedaży, a
                <RouterLink :to="pieniadzePath('/narzut')">narzut</RouterLink> do kosztu. Przy
                wspólnych wydatkach zacznij od
                <RouterLink :to="pieniadzePath('/podzial-rachunku')">podziału rachunku</RouterLink>.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <div class="faq-wrap"><FaqSection :items="faq" title="Pytania o codzienne obliczenia" /></div>
  </div>
</template>

<style scoped>
.money-page {
  color: #213c59;
  background: #f9fafc;
}
.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 78% 31%, #37699d 0, transparent 40%),
    linear-gradient(120deg, #123256, #1d4877 65%, #326295);
}
.hero::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.19;
  background-image:
    linear-gradient(#d9eaff36 1px, transparent 1px),
    linear-gradient(90deg, #d9eaff36 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(90deg, transparent 10%, #000);
}
.hero-inner {
  position: relative;
  width: min(100% - 2.5rem, 1280px);
  min-height: 560px;
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 1.5rem;
}
.hero-copy {
  z-index: 1;
  padding-block: 4.5rem;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.88rem;
  border: 1px solid #bad4e970;
  border-radius: 999px;
  background: #ffffff14;
  color: #e8f3fa;
  font-size: 0.8rem;
  font-weight: 800;
}
h1,
h2,
h3 {
  font-family: var(--font-heading);
  letter-spacing: -0.055em;
}
.hero h1 {
  max-width: 640px;
  margin-top: 1.7rem;
  font-size: clamp(3.1rem, 5.2vw, 5.5rem);
  font-weight: 800;
  line-height: 1.07;
}
.hero h1 em {
  color: #f8d67a;
  font-style: normal;
}
.hero-copy > p {
  max-width: 580px;
  margin-top: 1.4rem;
  color: #d4e6f3;
  font-size: 1.06rem;
  line-height: 1.8;
}
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 2rem;
  padding: 0.96rem 1.2rem;
  border-radius: 12px;
  background: #f5d77f;
  color: #173c5f;
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
}
.hero-cta:hover {
  background: #ffe6a2;
}
.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.25rem;
  margin-top: 1.8rem;
  color: #d9e8f3;
  font-size: 0.8rem;
  font-weight: 700;
}
.hero-points span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.hero-points svg {
  color: #f8d67a;
}
.hero-art img {
  width: min(100%, 680px);
  height: auto;
  filter: drop-shadow(0 20px 25px #10274f66);
}
.topic-strip {
  width: min(100% - 2.5rem, 1280px);
  margin: -1px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid #dce7f0;
  border-radius: 0 0 18px 18px;
  background: #fff;
  box-shadow: 0 12px 30px #153f6810;
}
.topic-strip > div {
  display: grid;
  grid-template-columns: 34px 1fr;
  column-gap: 0.8rem;
  align-items: center;
  padding: 1.4rem;
}
.topic-strip > div + div {
  border-left: 1px solid #dce7f0;
}
.topic-strip svg {
  grid-row: span 2;
  color: #4a7ba5;
}
.topic-strip strong {
  font-family: var(--font-heading);
}
.topic-strip small {
  color: #7c8d9d;
  font-size: 0.76rem;
}
.tools-section,
.faq-wrap {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
}
.tools-section {
  padding-top: 6rem;
  scroll-margin-top: 2rem;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}
.section-kicker {
  color: #a97c4c;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}
.section-heading h2,
.guide-inner h2 {
  margin-top: 0.7rem;
  font-size: clamp(2.2rem, 3.4vw, 3.4rem);
  font-weight: 800;
  line-height: 1.14;
}
.section-heading p:last-child {
  max-width: 570px;
  margin-top: 0.8rem;
  color: #6d8292;
  line-height: 1.65;
}
.tool-count {
  color: #cadce9;
  font-family: var(--font-heading);
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1;
}
.tool-count small {
  display: block;
  color: #8093a2;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
}
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block: 2rem 1.2rem;
}
.category-tabs button {
  padding: 0.65rem 1.05rem;
  border: 1px solid #d7e2ed;
  border-radius: 999px;
  background: #fff;
  color: #5c758b;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}
.category-tabs button.active {
  border-color: #1c4b78;
  background: #1c4b78;
  color: #fff;
}
.category-tabs button:not(.active):hover {
  background: #eaf2f9;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.tool-card {
  --card: #e3edf5;
  --ink: #6389ab;
  position: relative;
  min-height: 235px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid #203b5c10;
  border-radius: 22px;
  background: var(--card);
  color: #224462;
  text-decoration: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tool-card.featured {
  grid-column: span 2;
  background: #dcebf5;
}
.tool-card.tone-Procenty {
  --card: #e3e9f3;
  --ink: #657fa9;
}
.tool-card.tone-Zakupy {
  --card: #f6ead8;
  --ink: #ae875a;
}
.tool-card.tone-Biznes {
  --card: #e3eee4;
  --ink: #668f70;
}
.tool-card.tone-Na-co-dzień {
  --card: #f2e8ed;
  --ink: #a77991;
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px #163d6019;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
}
.card-category {
  padding: 0.32rem 0.62rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.card-symbol {
  position: absolute;
  top: 35%;
  right: 1rem;
  color: var(--ink);
  opacity: 0.27;
  font-family: var(--font-heading);
  font-size: clamp(2.8rem, 4.3vw, 4.8rem);
  font-weight: 800;
  letter-spacing: -0.08em;
  transform: rotate(-10deg);
}
.featured .card-symbol {
  right: 2.5rem;
  font-size: clamp(4rem, 5.8vw, 6rem);
}
.card-bottom {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.45rem;
  max-width: 370px;
}
.card-bottom strong {
  font-family: var(--font-heading);
  font-size: 1.22rem;
  font-weight: 800;
}
.card-bottom small {
  color: #667d8e;
  font-size: 0.82rem;
  line-height: 1.55;
}
.guide-section {
  margin-top: 6rem;
  background: #e9f0f5;
}
.guide-inner {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  gap: 4rem;
  padding-block: 5rem;
}
.guide-inner > div:first-child > p:last-child {
  max-width: 420px;
  margin-top: 1.2rem;
  color: #6c8394;
  line-height: 1.75;
}
.guide-list {
  display: grid;
  gap: 0.8rem;
}
.guide-list article {
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 0.8rem;
  padding: 1.25rem;
  border: 1px solid #d8e4ea;
  border-radius: 17px;
  background: #fff;
}
.guide-list article > span {
  color: #c6a065;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}
.guide-list h3 {
  font-size: 1.05rem;
  font-weight: 800;
}
.guide-list p {
  margin-top: 0.45rem;
  color: #6b8090;
  font-size: 0.83rem;
  line-height: 1.7;
}
.guide-list a {
  color: #245e87;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.faq-wrap {
  padding-top: 3.5rem;
}
@media (max-width: 850px) {
  .hero-inner {
    display: block;
  }
  .hero-copy {
    padding-block: 4rem 0;
  }
  .hero-art {
    max-width: 580px;
    margin-inline: auto;
  }
  .topic-strip {
    grid-template-columns: 1fr;
  }
  .topic-strip > div + div {
    border-left: 0;
    border-top: 1px solid #dce7f0;
  }
  .guide-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
@media (max-width: 580px) {
  .hero h1 {
    font-size: clamp(3rem, 11vw, 4rem);
  }
  .hero-copy > p {
    font-size: 1rem;
  }
  .tool-count {
    display: none;
  }
  .tool-grid {
    grid-template-columns: 1fr;
  }
  .tool-card.featured {
    grid-column: span 1;
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
