<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import timeIllustration from '../assets/time-illustration.svg'
import { czasTools } from '../manifest'
import { czasPath, czasSiteUrl, useCzasSeo } from '../seo/useCzasSeo'

const categories = ['Wszystkie', 'Daty', 'Godziny'] as const
const category = ref<(typeof categories)[number]>('Wszystkie')
const visibleTools = computed(() =>
  category.value === 'Wszystkie'
    ? czasTools
    : czasTools.filter((tool) => tool.category === category.value),
)
const faq = [
  {
    question: 'Jak liczona jest różnica między datami?',
    answer:
      'Kalkulator porównuje wybrane dni kalendarzowe i pokazuje liczbę pełnych dni między nimi. Uwzględnia długość miesięcy oraz lata przestępne.',
  },
  {
    question: 'Czy można obliczyć czas pracy przez północ?',
    answer:
      'Tak. Jeśli godzina zakończenia jest wcześniejsza niż rozpoczęcia, kalkulator czasu pracy traktuje koniec zmiany jako następny dzień. Przerwę trzeba odjąć osobno.',
  },
  {
    question: 'Czy daty i godziny są wysyłane na serwer?',
    answer:
      'Obliczenia wykonują się w przeglądarce. Narzędzia nie wymagają konta ani przesyłania wpisanych dat do serwera.',
  },
  {
    question: 'Czy odliczanie do wydarzenia aktualizuje się samo?',
    answer:
      'Wynik jest liczony względem bieżącej daty przy otwarciu strony. Następnego dnia wystarczy ponownie otworzyć narzędzie, aby zobaczyć aktualny wynik.',
  },
]

useCzasSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Czas — kalkulatory dat i godzin',
      url: czasSiteUrl,
      inLanguage: 'pl-PL',
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
  <div class="time-page">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"
            ><Clock3 :size="16" aria-hidden="true" /> Wszystko w swoim czasie</span
          >
          <h1>Terminy pod kontrolą. <em>Chwile dla siebie.</em></h1>
          <p>
            Od ważnej daty w kalendarzu po minuty spędzone w pracy. Siedem prostych narzędzi, dzięki
            którym planowanie nie zaczyna się od liczenia na palcach.
          </p>
          <a href="#kalkulatory" class="hero-cta"
            >Znajdź kalkulator <ArrowRight :size="18" aria-hidden="true"
          /></a>
          <div class="hero-points">
            <span><Check :size="16" aria-hidden="true" /> Daty i godziny</span
            ><span><Check :size="16" aria-hidden="true" /> Wynik od razu</span
            ><span><Check :size="16" aria-hidden="true" /> Bez konta</span>
          </div>
        </div>
        <div class="hero-art">
          <img
            :src="timeIllustration"
            width="680"
            height="530"
            alt="Ilustracja zegara, kalendarza i kart z odliczaniem dni oraz czasu pracy"
          />
        </div>
      </div>
    </section>
    <section class="topic-strip" aria-label="Zakres narzędzi">
      <div>
        <CalendarDays :size="24" aria-hidden="true" /><strong>Daty</strong
        ><small>Różnice, terminy, wiek i odliczanie</small>
      </div>
      <div>
        <Clock3 :size="24" aria-hidden="true" /><strong>Godziny</strong
        ><small>Czas pracy i proste przeliczenia</small>
      </div>
      <div>
        <Sparkles :size="24" aria-hidden="true" /><strong>Bez komplikacji</strong
        ><small>Wpisz dane i odczytaj wynik</small>
      </div>
    </section>
    <section id="kalkulatory" class="tools-section">
      <div class="section-heading">
        <div>
          <p class="section-kicker">NARZĘDZIA NA KAŻDĄ CHWILĘ</p>
          <h2>Co chcesz dziś policzyć?</h2>
          <p>
            Wybierz temat i przejdź do kalkulatora. Daty i godziny przeliczysz bez szukania wzoru.
          </p>
        </div>
        <span class="tool-count">07 <small>kalkulatorów</small></span>
      </div>
      <div class="category-tabs" role="group" aria-label="Filtruj kalkulatory czasu">
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
          :to="czasPath(`/${tool.id}`)"
          class="tool-card"
          :class="[
            { featured: category === 'Wszystkie' && index === 0 },
            tool.category === 'Daty' ? 'date' : 'hour',
          ]"
          ><span class="card-top"
            ><span class="card-category">{{ tool.category }}</span
            ><ArrowUpRight :size="20" aria-hidden="true" /></span
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
          <h2>Wybierz właściwy punkt w kalendarzu.</h2>
          <p>
            Dobry wynik zaczyna się od dobrych danych. Przy obliczeniach terminów zawsze upewnij
            się, czy chodzi o dni kalendarzowe, czy o dni robocze.
          </p>
        </div>
        <div class="guide-list">
          <article>
            <span>01</span>
            <div>
              <h3>Planujesz termin?</h3>
              <p>
                <RouterLink :to="czasPath('/roznica-miedzy-datami')"
                  >Różnica między datami</RouterLink
                >
                pokaże odstęp między dniami, a kalkulator
                <RouterLink :to="czasPath('/data-za-liczbe-dni')"
                  >daty za określoną liczbę dni</RouterLink
                >
                wskaże nowy termin. Oba narzędzia operują na dniach kalendarzowych.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Rozliczasz godziny?</h3>
              <p>
                Podaj początek i koniec zmiany, aby zobaczyć
                <RouterLink :to="czasPath('/czas-pracy')">czas pracy</RouterLink>. Gdy potrzebujesz
                innego zapisu, przelicz godziny na minuty albo rozbij minuty na godziny.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Czekasz na wydarzenie?</h3>
              <p>
                <RouterLink :to="czasPath('/odliczanie-do-daty')">Odliczanie do daty</RouterLink>
                pokaże liczbę dni pozostałych do urlopu, urodzin lub terminu projektu. Wynik
                aktualizuje się przy ponownym otwarciu strony.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <div class="faq-wrap">
      <FaqSection :items="faq" title="Pytania o daty, godziny i odliczanie" />
    </div>
  </div>
</template>

<style scoped>
.time-page {
  color: #2d2851;
  background: #faf9fd;
}
.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 75% 30%, #6455a6 0, transparent 40%),
    linear-gradient(118deg, #332d6e, #49408b 65%, #6556a7);
}
.hero::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.2;
  background-image:
    linear-gradient(#e6ddff34 1px, transparent 1px),
    linear-gradient(90deg, #e6ddff34 1px, transparent 1px);
  background-size: 55px 55px;
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
  padding: 0.55rem 0.9rem;
  border: 1px solid #d8ccff70;
  border-radius: 999px;
  background: #ffffff15;
  color: #ece4ff;
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
  max-width: 650px;
  margin-top: 1.7rem;
  font-size: clamp(3.1rem, 5.2vw, 5.5rem);
  font-weight: 800;
  line-height: 1.07;
}
.hero h1 em {
  color: #f2c1a6;
  font-style: normal;
}
.hero-copy > p {
  max-width: 580px;
  margin-top: 1.4rem;
  color: #e0d9f7;
  font-size: 1.06rem;
  line-height: 1.8;
}
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 2rem;
  padding: 0.95rem 1.2rem;
  border-radius: 12px;
  background: #f1c4a8;
  color: #393068;
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
}
.hero-cta:hover {
  background: #ffe0cd;
}
.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.25rem;
  margin-top: 1.8rem;
  color: #e2dcf7;
  font-size: 0.8rem;
  font-weight: 700;
}
.hero-points span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.hero-points svg {
  color: #f1c4a8;
}
.hero-art img {
  width: min(100%, 680px);
  height: auto;
  filter: drop-shadow(0 20px 25px #1e174a66);
}
.topic-strip {
  width: min(100% - 2.5rem, 1280px);
  margin: -1px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid #e5e1f0;
  border-radius: 0 0 18px 18px;
  background: #fff;
  box-shadow: 0 12px 30px #30275c10;
}
.topic-strip > div {
  display: grid;
  grid-template-columns: 34px 1fr;
  column-gap: 0.8rem;
  align-items: center;
  padding: 1.4rem;
}
.topic-strip > div + div {
  border-left: 1px solid #e5e1f0;
}
.topic-strip svg {
  grid-row: span 2;
  color: #7a6ab3;
}
.topic-strip strong {
  font-family: var(--font-heading);
}
.topic-strip small {
  color: #89829f;
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
  color: #aa746b;
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
  color: #77708e;
  line-height: 1.65;
}
.tool-count {
  color: #ddd7ef;
  font-family: var(--font-heading);
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1;
}
.tool-count small {
  display: block;
  color: #8c83a4;
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
  border: 1px solid #dcd5ec;
  border-radius: 999px;
  background: #fff;
  color: #706595;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}
.category-tabs button.active {
  border-color: #4e438d;
  background: #4e438d;
  color: #fff;
}
.category-tabs button:not(.active):hover {
  background: #f0ecfa;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.tool-card {
  --card: #e8e3f5;
  --ink: #7e6eb3;
  position: relative;
  min-height: 235px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid #352e6510;
  border-radius: 22px;
  background: var(--card);
  color: #352e64;
  text-decoration: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tool-card.hour {
  --card: #f3e6db;
  --ink: #b88171;
}
.tool-card:nth-child(3n) {
  --card: #e0edf0;
  --ink: #6a929f;
}
.tool-card.featured {
  grid-column: span 2;
  background: #e1daf2;
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px #3226671a;
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
  top: 36%;
  right: 1rem;
  color: var(--ink);
  opacity: 0.3;
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 4vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.08em;
  transform: rotate(-9deg);
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
  max-width: 350px;
}
.card-bottom strong {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 800;
}
.card-bottom small {
  color: #6e6685;
  font-size: 0.82rem;
  line-height: 1.55;
}
.guide-section {
  margin-top: 6rem;
  background: #eeebf7;
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
  color: #776d91;
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
  border: 1px solid #dfd8ee;
  border-radius: 17px;
  background: #fff;
}
.guide-list article > span {
  color: #bc8e80;
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
  color: #766e8b;
  font-size: 0.83rem;
  line-height: 1.7;
}
.guide-list a {
  color: #51458f;
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
    border-top: 1px solid #e5e1f0;
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
