<script setup lang="ts">
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, Scale, Wallet } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import workIllustration from '../assets/work-illustration.svg'
import { pracaPath, pracaSiteName, pracaSiteUrl, usePracaSeo } from '../seo/usePracaSeo'

const tools = [
  {
    path: '/ile-na-reke-uop',
    icon: BriefcaseBusiness,
    tag: 'Umowa o pracę',
    number: '01',
    title: 'Ile na rękę z UoP?',
    text: 'Od kwoty brutto do szacunkowej wypłaty netto, składek i całkowitego kosztu pracodawcy.',
    tone: 'sage',
  },
  {
    path: '/ile-na-reke-b2b',
    icon: Wallet,
    tag: 'Działalność gospodarcza',
    number: '02',
    title: 'Ile zostaje z faktury B2B?',
    text: 'Zobacz szacunkowy wynik B2B w każdym miesiącu 2026 roku oraz roczną sumę po kosztach, składkach i podatku.',
    tone: 'sand',
  },
  {
    path: '/b2b-vs-uop',
    icon: Scale,
    tag: 'Porównanie ofert',
    number: '03',
    title: 'B2B czy UoP?',
    text: 'Zestaw dwie propozycje w skali 2026 roku. Porównaj sumy netto i różnicę miesiąc po miesiącu.',
    tone: 'blue',
  },
]
const faq = [
  {
    question: 'Czym różni się wynagrodzenie brutto od netto?',
    answer:
      'Brutto to kwota z umowy przed potrąceniami. Netto, czyli „na rękę”, to kwota po odjęciu składek i zaliczki na podatek. Wynik zależy też od ulg i ustawień danej osoby.',
  },
  {
    question: 'Jak obliczyć wynagrodzenie netto z umowy o pracę?',
    answer:
      'Podaj miesięczne brutto i ustaw opcje, które dotyczą Twojej sytuacji, na przykład PPK lub ulgę dla młodych. Kalkulator pokaże orientacyjną wypłatę, składki i koszt pracodawcy.',
  },
  {
    question: 'Czy faktura B2B jest porównywalna z pensją brutto?',
    answer:
      'Nie bezpośrednio. Z faktury przedsiębiorca pokrywa koszty działalności, składki i podatek. Poza kwotą netto warto porównać także urlop, chorobowe, benefity i stabilność współpracy.',
  },
  {
    question: 'Co oznacza całkowity koszt pracodawcy?',
    answer:
      'To więcej niż pensja brutto pracownika, ponieważ obejmuje również składki finansowane przez pracodawcę. Ten koszt pomaga uczciwiej ocenić budżet oferty.',
  },
  {
    question: 'Czy wyższe netto na B2B oznacza lepszą ofertę?',
    answer:
      'Nie zawsze. Na B2B część ryzyk i wydatków bierzesz na siebie. Przed decyzją zestaw wynik z płatnym urlopem, okresami bez zleceń, sprzętem i kosztami księgowości.',
  },
  {
    question: 'Czy wyniki kalkulatorów są wiążące?',
    answer:
      'Nie. To szacunki pomocne przy planowaniu i rozmowie o ofercie, a nie porada podatkowa. Ostateczne rozliczenie zależy od indywidualnej sytuacji i obowiązujących zasad.',
  },
]

usePracaSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: pracaSiteName, url: pracaSiteUrl },
    { '@type': 'WebSite', name: pracaSiteName, url: pracaSiteUrl, inLanguage: 'pl-PL' },
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
  <div class="work-page">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"
            ><BriefcaseBusiness :size="16" aria-hidden="true" /> Decyzje zawodowe oparte na
            liczbach</span
          >
          <h1>Twoja praca. <em>Twoje warunki.</em></h1>
          <p>
            Kwota z oferty to dopiero początek rozmowy. Sprawdź, ile możesz otrzymać na rękę na UoP
            i B2B, a potem porównaj scenariusze z uwzględnieniem kosztów i składek.
          </p>
          <div class="hero-actions">
            <RouterLink :to="pracaPath('/b2b-vs-uop')" class="hero-cta"
              >Porównaj oferty <ArrowRight :size="18" aria-hidden="true" /></RouterLink
            ><a href="#kalkulatory" class="hero-link"
              >Zobacz narzędzia <ArrowUpRight :size="17" aria-hidden="true"
            /></a>
          </div>
          <div class="hero-points">
            <span><Check :size="16" aria-hidden="true" /> UoP i B2B</span
            ><span><Check :size="16" aria-hidden="true" /> Własne założenia</span
            ><span><Check :size="16" aria-hidden="true" /> Czytelne porównanie</span>
          </div>
        </div>
        <div class="hero-art">
          <img
            :src="workIllustration"
            width="680"
            height="530"
            alt="Ilustracja dwóch kart ofert UoP i B2B zestawionych do porównania"
          />
        </div>
      </div>
    </section>
    <section class="topic-strip" aria-label="Co można policzyć">
      <div>
        <BriefcaseBusiness :size="24" aria-hidden="true" /><strong>UoP</strong
        ><small>Pensja netto i koszt pracodawcy</small>
      </div>
      <div>
        <Wallet :size="24" aria-hidden="true" /><strong>B2B</strong
        ><small>Faktura po kosztach, składkach i podatku</small>
      </div>
      <div>
        <Scale :size="24" aria-hidden="true" /><strong>Porównanie</strong
        ><small>Dwa scenariusze obok siebie</small>
      </div>
    </section>
    <section id="kalkulatory" class="tools-section">
      <div class="section-heading">
        <div>
          <p class="section-kicker">NARZĘDZIA DO LEPSZEJ DECYZJI</p>
          <h2>Najpierw liczby, potem wybór.</h2>
          <p>
            Wybierz formę współpracy lub zestaw dwie oferty. Kalkulatory pokazują, jak z kwoty
            wejściowej powstaje szacunkowy wynik.
          </p>
        </div>
        <span class="tool-count">03 <small>kalkulatory</small></span>
      </div>
      <div class="tool-grid">
        <RouterLink
          v-for="tool in tools"
          :key="tool.path"
          :to="pracaPath(tool.path)"
          class="tool-card"
          :class="`tool-card--${tool.tone}`"
          ><span class="card-top"
            ><span class="card-tag">{{ tool.tag }}</span
            ><ArrowUpRight :size="21" aria-hidden="true" /></span
          ><span class="card-icon"
            ><component :is="tool.icon" :size="38" :stroke-width="1.8" aria-hidden="true" /></span
          ><span class="card-content"
            ><small>{{ tool.number }} / PRZELICZ WŁASNY SCENARIUSZ</small
            ><strong>{{ tool.title }}</strong
            ><span>{{ tool.text }}</span></span
          ></RouterLink
        >
      </div>
    </section>
    <section class="guide-section">
      <div class="guide-inner">
        <div>
          <p class="section-kicker">PRAKTYCZNY PORADNIK</p>
          <h2>Oferta to więcej niż jedna kwota.</h2>
          <p>
            Porównanie ma sens, gdy patrzysz nie tylko na przelew, ale również na warunki współpracy
            i koszty, które ponosisz samodzielnie.
          </p>
        </div>
        <div class="guide-list">
          <article>
            <span>01</span>
            <div>
              <h3>Zacznij od kwoty wyjściowej</h3>
              <p>
                Na UoP wpisz wynagrodzenie brutto. Na B2B podaj wartość faktury netto bez VAT. To
                różne podstawy, więc nie porównuj ich bezpośrednio.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Dodaj warunki swojej sytuacji</h3>
              <p>
                Składki, koszty firmy, forma opodatkowania, PPK i ulgi wpływają na szacunek. Sprawdź
                kilka wariantów, zamiast zakładać jeden „uniwersalny” wynik.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Spójrz poza miesięczne netto</h3>
              <p>
                <RouterLink :to="pracaPath('/b2b-vs-uop')">Porównanie B2B vs UoP</RouterLink> jest
                punktem wyjścia. Urlop, chorobowe, benefity, sprzęt i stabilność zleceń mogą zmienić
                ocenę oferty.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <div class="faq-wrap">
      <FaqSection :items="faq" title="Pytania o wynagrodzenie i formy współpracy" />
    </div>
  </div>
</template>

<style scoped>
.work-page {
  color: #234537;
  background: #fafbf8;
}
.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 78% 26%, #387456 0, transparent 40%),
    linear-gradient(120deg, #123b2d, #20533e 65%, #2b674b);
}
.hero::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.18;
  background-image:
    linear-gradient(#d5f0d536 1px, transparent 1px),
    linear-gradient(90deg, #d5f0d536 1px, transparent 1px);
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
  border: 1px solid #bdddc070;
  border-radius: 999px;
  background: #ffffff14;
  color: #e1f2da;
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
  color: #d8e9ae;
  font-style: normal;
}
.hero-copy > p {
  max-width: 580px;
  margin-top: 1.4rem;
  color: #d0e7d8;
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
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
}
.hero-cta {
  padding: 0.96rem 1.2rem;
  border-radius: 12px;
  background: #d9e9b3;
  color: #1d4732;
}
.hero-cta:hover {
  background: #ebf4cf;
}
.hero-link {
  color: #e3f1dd;
}
.hero-link:hover {
  color: #fff;
}
.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.25rem;
  margin-top: 1.8rem;
  color: #d2e6d7;
  font-size: 0.8rem;
  font-weight: 700;
}
.hero-points span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.hero-points svg {
  color: #d9e9b3;
}
.hero-art img {
  width: min(100%, 680px);
  height: auto;
  filter: drop-shadow(0 20px 25px #0b2e2255);
}
.topic-strip {
  width: min(100% - 2.5rem, 1280px);
  margin: -1px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid #dce8d9;
  border-radius: 0 0 18px 18px;
  background: #fffefa;
  box-shadow: 0 12px 30px #1e493010;
}
.topic-strip > div {
  display: grid;
  grid-template-columns: 34px 1fr;
  column-gap: 0.8rem;
  align-items: center;
  padding: 1.4rem;
}
.topic-strip > div + div {
  border-left: 1px solid #dce8d9;
}
.topic-strip svg {
  grid-row: span 2;
  color: #56846a;
}
.topic-strip strong {
  font-family: var(--font-heading);
}
.topic-strip small {
  color: #7d9081;
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
  color: #a97e5a;
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
  max-width: 580px;
  margin-top: 0.8rem;
  color: #6f8375;
  line-height: 1.65;
}
.tool-count {
  color: #d2e2d0;
  font-family: var(--font-heading);
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1;
}
.tool-count small {
  display: block;
  color: #859789;
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
  --card: #e0efe0;
  --ink: #608c6c;
  position: relative;
  min-height: 294px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 1.55rem;
  border: 1px solid #254a3210;
  border-radius: 22px;
  background: var(--card);
  color: #294e39;
  text-decoration: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tool-card--sand {
  --card: #f5eadb;
  --ink: #a7835a;
}
.tool-card--blue {
  --card: #e0ecec;
  --ink: #649096;
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px #234d321b;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
}
.card-tag {
  padding: 0.33rem 0.62rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.card-icon {
  position: absolute;
  top: 82px;
  right: 1.3rem;
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border: 2px solid currentColor;
  border-radius: 25px;
  color: var(--ink);
  opacity: 0.35;
  transform: rotate(9deg);
}
.card-content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.4rem;
}
.card-content small {
  color: var(--ink);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.card-content strong {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
}
.card-content > span {
  color: #647969;
  font-size: 0.84rem;
  line-height: 1.6;
}
.guide-section {
  margin-top: 6rem;
  background: #e8f0e6;
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
  max-width: 430px;
  margin-top: 1.2rem;
  color: #6c816f;
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
  border: 1px solid #d6e5d3;
  border-radius: 17px;
  background: #fffefa;
}
.guide-list article > span {
  color: #ba916b;
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
  color: #6b806e;
  font-size: 0.83rem;
  line-height: 1.7;
}
.guide-list a {
  color: #2d6b4a;
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
    border-top: 1px solid #dce8d9;
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
