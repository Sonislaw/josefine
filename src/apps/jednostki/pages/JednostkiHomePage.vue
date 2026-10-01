<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Check, MousePointer2, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import orbitIllustration from '../assets/conversion-orbit.svg'
import { jednostkiTools } from '../manifest'
import { jednostkiPath, jednostkiSiteName, jednostkiSiteUrl, useJednostkiSeo } from '../seo/useJednostkiSeo'

const faq = [
  { question: 'Jak korzystać z przeliczników jednostek?', answer: 'Wybierz rodzaj przeliczenia, wpisz wartość i wskaż jednostkę źródłową oraz docelową. Wynik pojawi się od razu. Przyciskiem zamiany kierunku szybko odwrócisz przeliczenie.' },
  { question: 'Czy wyniki są dokładne?', answer: 'Kalkulatory korzystają ze stałych współczynników jednostek. Wyniki na ekranie są zaokrąglane do czytelnej liczby miejsc po przecinku; obliczenia są wykonywane na pełnej precyzji liczb JavaScript.' },
  { question: 'Jakiego galona używa kalkulator?', answer: 'Przelicznik litrów używa galona płynnego USA (US liquid gallon), który ma dokładnie 3,785411784 litra. Galon brytyjski ma inną pojemność.' },
  { question: 'Czy mogę wpisywać liczby z przecinkiem?', answer: 'Tak. Polskie liczby dziesiętne, na przykład 2,5, oraz zapis z kropką są akceptowane. Przeliczenia wykonują się w przeglądarce.' },
]

useJednostkiSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: jednostkiSiteName, url: jednostkiSiteUrl, inLanguage: 'pl-PL' },
    { '@type': 'FAQPage', mainEntity: faq.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ],
})
</script>

<template>
  <div>
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"><Sparkles :size="16" aria-hidden="true" /> 7 prostych przeliczników</span>
          <h1>Jedna liczba.<br /><span>Nowa perspektywa.</span></h1>
          <p>Centymetry i cale, kilometry i mile, kilogramy i funty. Wpisz wartość, a resztę policzymy od razu — bez szukania wzoru.</p>
          <a href="#narzedzia" class="hero-cta">Wybierz przelicznik <ArrowRight :size="19" aria-hidden="true" /></a>
          <div class="hero-points"><span><Check :size="17" /> Wynik od razu</span><span><Check :size="17" /> W obie strony</span><span><Check :size="17" /> Bez rejestracji</span></div>
        </div>
        <div class="hero-art"><img :src="orbitIllustration" width="620" height="540" alt="Ilustracja jednostek cm, cale, °C, °F, kg, funty, litry i galony" /></div>
      </div>
    </section>

    <section class="quick-facts" aria-label="Przykładowe przeliczenia">
      <div class="fact"><span>01 / DŁUGOŚĆ</span><strong>1 cal <b>=</b> 2,54 cm</strong></div>
      <div class="fact"><span>02 / TEMPERATURA</span><strong>0°C <b>=</b> 32°F</strong></div>
      <div class="fact"><span>03 / OBJĘTOŚĆ</span><strong>1 m³ <b>=</b> 1 000 l</strong></div>
    </section>

    <section id="narzedzia" class="tools-section">
      <div class="section-intro"><div><p class="section-kicker">BIBLIOTEKA NARZĘDZI</p><h2>Co dziś przeliczamy?</h2><p>Wybierz kategorię, wpisz liczbę i zobacz wynik. Każde narzędzie ma także krótkie wyjaśnienie i przykłady.</p></div><span class="tool-count">07 <small>przeliczników</small></span></div>
      <div class="tool-grid">
        <RouterLink v-for="(tool, index) in jednostkiTools" :key="tool.id" :to="jednostkiPath(`/${tool.id}`)" class="tool-card" :class="[`tool-card--${tool.accent}`, { 'tool-card--featured': index === 0 }]">
          <span class="card-top"><span class="card-category">{{ tool.category }}</span><ArrowUpRight :size="21" aria-hidden="true" /></span>
          <span class="card-symbol" aria-hidden="true">{{ tool.symbol }}</span>
          <span class="card-bottom"><strong>{{ tool.title }}</strong><small>{{ tool.description }}</small></span>
        </RouterLink>
      </div>
    </section>

    <section class="how-section"><div class="how-inner"><div class="how-lead"><span class="how-icon"><MousePointer2 :size="25" /></span><p class="section-kicker">PROSTO I KONKRETNIE</p><h2>Od pytania do wyniku<br />w kilka sekund.</h2></div><div class="how-copy"><p>Przeliczniki pomagają wtedy, gdy jednostki na etykiecie, mapie lub rachunku nie są tymi, których używasz na co dzień. Każdą wartość możesz podać z przecinkiem lub kropką, a kierunek przeliczenia zmienić jednym przyciskiem.</p><p>Stosujemy dokładne współczynniki dla cali, mil, funtów, galonów US, arów i hektarów. Przy temperaturze używamy właściwego wzoru ze zmianą punktu zerowego. Dane wpisane do narzędzi są przeliczane lokalnie w przeglądarce.</p></div></div></section>

    <div class="faq-wrap"><FaqSection :items="faq" title="Pytania o przeliczanie jednostek" /></div>
  </div>
</template>

<style scoped>
.hero { position: relative; overflow: hidden; background: linear-gradient(120deg, #122750 0%, #1d3266 58%, #34437e 100%); color: white; }
.hero-grid { position: absolute; inset: 0; opacity: .2; background-image: linear-gradient(#dbe2ff25 1px, transparent 1px), linear-gradient(90deg, #dbe2ff25 1px, transparent 1px); background-size: 54px 54px; mask-image: linear-gradient(90deg, transparent 10%, black 100%); }
.hero-inner { position: relative; width: min(100% - 2.5rem, 1280px); min-height: 550px; margin-inline: auto; display: grid; grid-template-columns: 1fr .9fr; align-items: center; gap: 2rem; }
.hero-copy { position: relative; z-index: 1; padding-block: 5rem; }
.eyebrow { display: inline-flex; align-items: center; gap: .55rem; padding: .6rem .9rem; border: 1px solid #ffffff38; border-radius: 999px; background: #ffffff12; color: #e5e9ff; font-size: .82rem; font-weight: 700; letter-spacing: .04em; }
h1, h2 { font-family: var(--font-heading); letter-spacing: -.055em; }
.hero h1 { max-width: 770px; margin-top: 1.8rem; font-size: clamp(3rem, 5.3vw, 5.4rem); line-height: 1.08; font-weight: 800; }
.hero h1 span { color: #c2caff; }
.hero-copy > p { max-width: 600px; margin-top: 1.5rem; color: #d7dff7; font-size: 1.1rem; line-height: 1.8; }
.hero-cta { display: inline-flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2.1rem; padding: 1rem 1.25rem; border-radius: 14px; background: #d5ddff; color: #192e60; font-size: .92rem; font-weight: 800; text-decoration: none; transition: transform .2s, background .2s; }
.hero-cta:hover { transform: translateY(-2px); background: white; }
.hero-points { display: flex; flex-wrap: wrap; gap: .65rem 1.3rem; margin-top: 2rem; color: #d7dff7; font-size: .8rem; font-weight: 600; }
.hero-points span { display: inline-flex; align-items: center; gap: .35rem; }
.hero-points svg { color: #a5efce; }
.hero-art { align-self: stretch; display: grid; place-items: center; }
.hero-art img { width: min(100%, 620px); height: auto; filter: drop-shadow(0 18px 32px #08163c44); }
.quick-facts { width: min(100% - 2.5rem, 1280px); margin: -1px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #e5e9f1; border-top: 0; border-radius: 0 0 22px 22px; background: white; box-shadow: 0 16px 35px #182a5610; }
.fact { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.4rem 1.8rem; }
.fact + .fact { border-left: 1px solid #e9edf4; }
.fact span { color: #7a88a4; font-size: .69rem; font-weight: 800; letter-spacing: .12em; }
.fact strong { white-space: nowrap; font-family: var(--font-heading); font-size: 1.15rem; }
.fact b { color: #7d8ad5; }
.tools-section, .faq-wrap { width: min(100% - 2.5rem, 1280px); margin-inline: auto; }
.tools-section { padding-top: 6.5rem; scroll-margin-top: 1.5rem; }
.section-intro { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; }
.section-kicker { color: #687bc6; font-size: .75rem; font-weight: 800; letter-spacing: .18em; }
.section-intro h2, .how-section h2 { margin-top: .7rem; font-size: clamp(2rem, 3vw, 3.2rem); line-height: 1.15; font-weight: 800; }
.section-intro p:last-child { max-width: 650px; margin-top: .85rem; color: #65718b; line-height: 1.7; }
.tool-count { color: #c2cae3; font-family: var(--font-heading); font-size: 4.5rem; font-weight: 800; line-height: 1; }
.tool-count small { display: block; margin-top: .4rem; color: #697693; font-family: var(--font-sans); font-size: .72rem; font-weight: 700; text-align: right; }
.tool-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.tool-card { --card-bg: #eef2ff; --card-ink: #354e9f; position: relative; min-height: 225px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 1.45rem; border: 1px solid #1724470d; border-radius: 22px; background: var(--card-bg); color: #172447; text-decoration: none; transition: transform .2s, box-shadow .2s; }
.tool-card:hover { transform: translateY(-5px); box-shadow: 0 18px 35px #1724471b; }
.tool-card:focus-visible, .hero-cta:focus-visible { outline: 3px solid #8291ff; outline-offset: 3px; }
.tool-card--featured { grid-column: span 2; background: #dfe6ff; }
.tool-card--peach { --card-bg: #fbe9df; --card-ink: #9c574f; }
.tool-card--lilac { --card-bg: #e9e5fa; --card-ink: #7159b1; }
.tool-card--mint { --card-bg: #ddf3e9; --card-ink: #35735e; }
.tool-card--sky { --card-bg: #dfecf9; --card-ink: #436eaa; }
.tool-card--yellow { --card-bg: #fbf0d9; --card-ink: #996b2f; }
.card-top { display: flex; justify-content: space-between; align-items: center; color: var(--card-ink); }
.card-category { padding: .35rem .6rem; border: 1px solid currentColor; border-radius: 999px; font-size: .69rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.card-symbol { position: absolute; top: 36%; right: .2rem; color: var(--card-ink); opacity: .16; font-family: var(--font-heading); font-size: clamp(2.5rem, 4vw, 4.5rem); font-weight: 800; letter-spacing: -.06em; white-space: nowrap; transform: rotate(-12deg); }
.tool-card--featured .card-symbol { right: 1.5rem; font-size: 5rem; opacity: .2; }
.card-bottom { position: relative; z-index: 1; display: block; max-width: 300px; }
.card-bottom strong { display: block; font-family: var(--font-heading); font-size: 1.22rem; font-weight: 800; }
.card-bottom small { display: block; margin-top: .45rem; color: #43506c; font-size: .81rem; line-height: 1.55; }
.how-section { margin-top: 6.5rem; background: #e9ecf6; }
.how-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; padding-block: 5rem; }
.how-icon { display: inline-grid; place-items: center; width: 56px; height: 56px; margin-bottom: 1.3rem; border-radius: 16px; background: #d6defb; color: #354e9f; }
.how-copy { display: grid; align-content: center; gap: 1rem; color: #58647d; line-height: 1.85; }
.faq-wrap { padding-top: 3.5rem; }
@media (max-width: 1100px) { .hero-inner { grid-template-columns: 1.1fr .9fr; } .quick-facts { grid-template-columns: 1fr; } .fact + .fact { border-left: 0; border-top: 1px solid #e9edf4; } .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .hero-inner { display: block; } .hero-copy { padding-block: 4rem 1rem; } .hero-art { max-width: 460px; margin-inline: auto; } .hero-points { padding-bottom: .5rem; } .section-intro { align-items: start; } .tool-count { display: none; } .how-inner { grid-template-columns: 1fr; gap: 1.8rem; padding-block: 4rem; } }
@media (max-width: 540px) { .hero h1 { font-size: clamp(2.6rem, 11vw, 3.5rem); } .hero-copy > p { font-size: 1rem; } .tool-grid { grid-template-columns: 1fr; } .tool-card--featured { grid-column: span 1; } .fact { padding: 1.2rem; } .fact strong { font-size: 1rem; } }
@media (prefers-reduced-motion: reduce) { .hero-cta, .tool-card { transition: none; } }
</style>
