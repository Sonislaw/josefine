<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowUpRight, Check, Fuel, Gauge, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import roadIllustration from '../assets/road-illustration.svg'
import { motoryzacjaTools } from '../manifest'
import { motoryzacjaPath, motoryzacjaSiteName, motoryzacjaSiteUrl, useMotoryzacjaSeo } from '../seo/useMotoryzacjaSeo'

const categories = ['Wszystkie', 'Paliwo', 'Koszty', 'Podróż'] as const
const activeCategory = ref<(typeof categories)[number]>('Wszystkie')
const visibleTools = computed(() => activeCategory.value === 'Wszystkie' ? motoryzacjaTools : motoryzacjaTools.filter((tool) => tool.category === activeCategory.value))

const faq = [
  { question: 'Jak działają kalkulatory Motoryzacja?', answer: 'Wybierz narzędzie, wpisz dystans, paliwo lub czas w podanych jednostkach, a wynik zostanie obliczony w przeglądarce. Każda strona pokazuje także wzór i przykład.' },
  { question: 'Czy koszt przejazdu obejmuje wszystkie wydatki?', answer: 'Nie. Kalkulator podaje koszt paliwa przy wpisanym spalaniu i cenie za litr. Parking, płatne drogi i inne koszty podróży dolicz osobno.' },
  { question: 'Czy zasięg i czas podróży są dokładne?', answer: 'To szacunki oparte na podanym średnim spalaniu lub prędkości. Ruch drogowy, pogoda, obciążenie auta i postoje mogą zmienić rzeczywisty wynik.' },
  { question: 'Czy mogę wpisywać liczby z przecinkiem?', answer: 'Tak. Kalkulatory przyjmują polski przecinek dziesiętny oraz kropkę, na przykład 6,5 lub 6.5.' },
]

useMotoryzacjaSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: motoryzacjaSiteName, url: motoryzacjaSiteUrl, inLanguage: 'pl-PL' },
    { '@type': 'FAQPage', mainEntity: faq.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ],
})
</script>

<template>
  <div>
    <section class="hero"><div class="hero-grid" aria-hidden="true"></div><div class="hero-inner"><div class="hero-copy"><span class="hero-eyebrow"><Gauge :size="16" aria-hidden="true" /> Kalkulatory dla kierowców</span><h1>Jedź z planem.<br /><span>Policz trasę.</span></h1><p>Spalanie, koszt paliwa, zasięg, średnia prędkość i czas podróży — pięć prostych narzędzi, dzięki którym liczby na trasie stają się jasne.</p><a href="#kalkulatory" class="hero-cta">Wybierz kalkulator <ArrowRight :size="19" aria-hidden="true" /></a><div class="hero-points"><span><Check :size="16" /> Wynik od razu</span><span><Check :size="16" /> Czytelne wzory</span><span><Check :size="16" /> Bez rejestracji</span></div></div><div class="hero-art"><img :src="roadIllustration" width="680" height="560" alt="Ilustracja trasy z samochodem oraz przykładowym spalaniem, zasięgiem i prędkością" /></div></div></section>

    <section class="route-strip" aria-label="Przykładowe obliczenia"><div><span>01 / SPALANIE</span><strong>32 l / 400 km <b>→</b> 8 l/100 km</strong></div><div><span>02 / ZASIĘG</span><strong>40 l / 8 l/100 km <b>→</b> 500 km</strong></div><div><span>03 / CZAS</span><strong>180 km / 60 km/h <b>→</b> 3 godz.</strong></div></section>

    <section id="kalkulatory" class="tools-section"><div class="section-heading"><div><p class="section-kicker"><Sparkles :size="15" aria-hidden="true" /> TWÓJ ZESTAW DROGOWY</p><h2>Co chcesz obliczyć?</h2><p>Wybierz narzędzie, wpisz liczby i ruszaj dalej z lepszym planem.</p></div><span class="tool-count">05 <small>kalkulatorów</small></span></div><div class="category-tabs" role="group" aria-label="Filtruj kalkulatory"><button v-for="category in categories" :key="category" type="button" :aria-pressed="activeCategory === category" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button></div><div class="tool-grid"><RouterLink v-for="(tool, index) in visibleTools" :key="tool.id" :to="motoryzacjaPath(`/${tool.id}`)" class="tool-card" :class="[`tool-card--${tool.accent}`, { 'tool-card--featured': activeCategory === 'Wszystkie' && index === 0 }]"><span class="card-top"><span class="card-category">{{ tool.category }}</span><ArrowUpRight :size="21" aria-hidden="true" /></span><span class="card-symbol" aria-hidden="true">{{ tool.symbol }}</span><span class="card-bottom"><strong>{{ tool.title }}</strong><small>{{ tool.description }}</small></span></RouterLink></div></section>

    <section class="guide-section"><div class="guide-inner"><div class="guide-lead"><span class="guide-icon"><Fuel :size="25" aria-hidden="true" /></span><p class="section-kicker">DANE ROBIĄ RÓŻNICĘ</p><h2>Dobry plan zaczyna się przed wyjazdem.</h2></div><div class="guide-copy"><p>Do oszacowania kosztu trasy wystarczą trzy informacje: dystans, średnie spalanie i cena za litr. Jeśli nie znasz spalania auta, oblicz je najpierw na podstawie ostatniego tankowania.</p><p>Wyniki pomagają w planowaniu, ale warunki na drodze zmieniają się. Zasięg traktuj z rezerwą paliwa, a do czasu przejazdu dodaj postoje i możliwe opóźnienia.</p></div></div></section>

    <div class="faq-wrap"><FaqSection :items="faq" title="Pytania o kalkulatory dla kierowców" /></div>
  </div>
</template>

<style scoped>
.hero { position: relative; overflow: hidden; background: radial-gradient(circle at 79% 40%, #285364 0, transparent 42%), linear-gradient(120deg, #102d3a, #143948 61%, #1c4854); color: #fff; }
.hero-grid { position: absolute; inset: 0; opacity: .2; background-image: linear-gradient(#dcefe334 1px, transparent 1px), linear-gradient(90deg, #dcefe334 1px, transparent 1px); background-size: 55px 55px; mask-image: linear-gradient(90deg, transparent 4%, black 100%); }
.hero-inner { position: relative; width: min(100% - 2.5rem, 1280px); min-height: 560px; margin-inline: auto; display: grid; grid-template-columns: .95fr 1.05fr; align-items: center; gap: 1.4rem; }
.hero-copy { position: relative; z-index: 1; padding-block: 4.5rem; }
.hero-eyebrow { display: inline-flex; align-items: center; gap: .5rem; padding: .57rem .88rem; border: 1px solid #a5d5ad50; border-radius: 999px; background: #ffffff12; color: #d3f0c7; font-size: .8rem; font-weight: 800; }
h1, h2 { font-family: var(--font-heading); letter-spacing: -.055em; }
.hero h1 { margin-top: 1.8rem; font-size: clamp(3rem, 5.3vw, 5.5rem); font-weight: 800; line-height: 1.07; }
.hero h1 span { color: #cef18c; }
.hero-copy > p { max-width: 600px; margin-top: 1.55rem; color: #c9ddd5; font-size: 1.08rem; line-height: 1.82; }
.hero-cta { display: inline-flex; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem 1.22rem; border-radius: 12px; background: #d0ef8d; box-shadow: 0 12px 24px #071b283d; color: #183d3c; font-size: .9rem; font-weight: 800; text-decoration: none; transition: transform .2s, background .2s; }
.hero-cta:hover { transform: translateY(-2px); background: #e3f7b4; }
.hero-points { display: flex; flex-wrap: wrap; gap: .65rem 1.3rem; margin-top: 1.9rem; color: #cde0d8; font-size: .8rem; font-weight: 700; }
.hero-points span { display: inline-flex; align-items: center; gap: .35rem; }
.hero-points svg { color: #ccef93; }
.hero-art { display: grid; place-items: center; }
.hero-art img { width: min(100%, 680px); height: auto; filter: drop-shadow(0 22px 26px #0617214d); }
.route-strip { width: min(100% - 2.5rem, 1280px); margin: -1px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #dde7dc; border-radius: 0 0 19px 19px; background: #fcfefb; box-shadow: 0 12px 30px #14313d12; }
.route-strip > div { display: grid; gap: .4rem; padding: 1.35rem 1.6rem; }
.route-strip > div + div { border-left: 1px solid #e4ece5; }
.route-strip span { color: #889f93; font-size: .68rem; font-weight: 800; letter-spacing: .13em; }
.route-strip strong { color: #28484a; font-family: var(--font-heading); font-size: .98rem; white-space: nowrap; }
.route-strip b { margin-inline: .2rem; color: #ce805d; }
.tools-section, .faq-wrap { width: min(100% - 2.5rem, 1280px); margin-inline: auto; }
.tools-section { padding-top: 6.5rem; scroll-margin-top: 1.5rem; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; }
.section-kicker { display: inline-flex; align-items: center; gap: .45rem; color: #bd7856; font-size: .73rem; font-weight: 800; letter-spacing: .16em; }
.section-heading h2, .guide-lead h2 { margin-top: .7rem; font-size: clamp(2.1rem, 3.4vw, 3.4rem); font-weight: 800; line-height: 1.16; }
.section-heading p:last-child { margin-top: .85rem; color: #6d867a; line-height: 1.65; }
.tool-count { color: #c5d8ca; font-family: var(--font-heading); font-size: 4.5rem; font-weight: 800; line-height: 1; }
.tool-count small { display: block; margin-top: .3rem; color: #799184; font-family: var(--font-sans); font-size: .72rem; font-weight: 700; text-align: right; }
.category-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-block: 2rem 1.2rem; }
.category-tabs button { padding: .63rem 1.05rem; border: 1px solid #cfdfd3; border-radius: 999px; background: #fcfefb; color: #547368; font-size: .8rem; font-weight: 800; cursor: pointer; }
.category-tabs button.active { border-color: #173e48; background: #173e48; color: #fff; }
.category-tabs button:not(.active):hover { background: #e9f4e7; }
.tool-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.tool-card { --card-bg: #e6f0dd; --card-ink: #638b60; position: relative; min-height: 237px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 1.55rem; border: 1px solid #14313d10; border-radius: 22px; background: var(--card-bg); color: #1e3b3f; text-decoration: none; transition: transform .2s, box-shadow .2s; }
.tool-card:hover { transform: translateY(-4px); box-shadow: 0 18px 33px #14313d1c; }
.tool-card--featured { grid-column: span 2; background: #dceecb; }
.tool-card--lime { --card-bg: #e3f1cf; --card-ink: #67915e; }
.tool-card--peach { --card-bg: #f8e3d4; --card-ink: #bf785b; }
.tool-card--blue { --card-bg: #dceaf0; --card-ink: #578292; }
.tool-card--sand { --card-bg: #f2eadc; --card-ink: #a78459; }
.tool-card--lilac { --card-bg: #e8e7f2; --card-ink: #8176aa; }
.card-top { display: flex; align-items: center; justify-content: space-between; color: var(--card-ink); }
.card-category { padding: .32rem .62rem; border: 1px solid currentColor; border-radius: 999px; font-size: .67rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.card-symbol { position: absolute; top: 36%; right: .8rem; color: var(--card-ink); opacity: .23; font-family: var(--font-heading); font-size: clamp(3rem, 4.8vw, 5.2rem); font-weight: 800; letter-spacing: -.075em; line-height: 1; transform: rotate(-10deg); }
.tool-card--featured .card-symbol { right: 2.2rem; font-size: clamp(4.2rem, 6.5vw, 6.8rem); }
.card-bottom { position: relative; z-index: 1; display: block; max-width: 370px; }
.card-bottom strong { display: block; font-family: var(--font-heading); font-size: 1.23rem; font-weight: 800; }
.card-bottom small { display: block; margin-top: .46rem; color: #58736a; font-size: .81rem; line-height: 1.55; }
.guide-section { margin-top: 6.5rem; background: #e5efe9; }
.guide-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: grid; grid-template-columns: .85fr 1.15fr; gap: 4rem; padding-block: 5rem; }
.guide-icon { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 1.35rem; border-radius: 17px; background: #cee3d2; color: #3d7463; }
.guide-copy { display: grid; align-content: center; gap: 1.2rem; color: #607d70; line-height: 1.85; }
.faq-wrap { padding-top: 3.5rem; }
@media (max-width: 1080px) { .route-strip { grid-template-columns: 1fr; } .route-strip > div + div { border-left: 0; border-top: 1px solid #e4ece5; } .hero-inner { grid-template-columns: 1fr .9fr; } }
@media (max-width: 800px) { .hero-inner { display: block; } .hero-copy { padding-block: 4rem 0; } .hero-art { max-width: 590px; margin-inline: auto; } .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .guide-inner { grid-template-columns: 1fr; gap: 2rem; padding-block: 4rem; } }
@media (max-width: 560px) { .hero h1 { font-size: clamp(2.9rem, 11vw, 3.8rem); } .hero-copy > p { font-size: 1rem; } .tool-count { display: none; } .tool-grid { grid-template-columns: 1fr; } .tool-card--featured { grid-column: span 1; } .route-strip strong { font-size: .86rem; } }
@media (prefers-reduced-motion: reduce) { .hero-cta, .tool-card { transition: none; } }
</style>
