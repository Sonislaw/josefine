<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowUpRight, Check, House, Ruler, ShoppingBasket, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import DomRoomPlanner from '../components/DomRoomPlanner.vue'
import houseIllustration from '../assets/house-illustration.svg'
import { domTools } from '../manifest'
import { domPath, domSiteName, domSiteUrl, useDomSeo } from '../seo/useDomSeo'

const categories = ['Wszystkie', 'Wymiary', 'Rachunki', 'Remont'] as const
const activeCategory = ref<(typeof categories)[number]>('Wszystkie')
const visibleTools = computed(() => activeCategory.value === 'Wszystkie' ? domTools : domTools.filter((tool) => tool.category === activeCategory.value))

const faq = [
  { question: 'Jak korzystać z kalkulatorów Dom?', answer: 'Wybierz narzędzie, wpisz wymiary lub ceny w opisanych jednostkach, a wynik pojawi się od razu. Przy polach możesz używać polskiego przecinka dziesiętnego.' },
  { question: 'Czy mogę użyć wymiarów pokoju w kilku kalkulatorach?', answer: 'Tak. W panelu na stronie głównej wpisz długość, szerokość i wysokość prostokątnego pokoju. Zobaczysz powierzchnię podłogi i ścian, obwód oraz kubaturę. Linki do paneli i płytek przeniosą metraż podłogi, link do listew przeniesie długość i szerokość, a link do farby otworzy tryb pokoju z wpisanymi wymiarami.' },
  { question: 'Czy kalkulatory nadają się do planowania remontu?', answer: 'Tak, pomagają oszacować ilość farby, płytek i paczek paneli. Przy zakupie sprawdź także zalecenia producenta, zapas na docinki oraz rzeczywiste wymiary pomieszczenia.' },
  { question: 'Co obejmują kalkulatory kosztu prądu i wody?', answer: 'Prąd liczymy z mocy, liczby godzin i ceny za kWh. Wodę liczymy z zużycia w m³ i podanej ceny za m³. Kalkulatory nie doliczają automatycznie opłat stałych.' },
  { question: 'Czy wpisane dane są wysyłane na serwer?', answer: 'Same obliczenia wykonują się w przeglądarce. Więcej informacji o danych technicznych i analityce znajdziesz w polityce prywatności.' },
]

useDomSeo('home', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: domSiteName, url: domSiteUrl, inLanguage: 'pl-PL' },
    { '@type': 'FAQPage', mainEntity: faq.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ],
})
</script>

<template>
  <div>
    <section class="hero">
      <div class="hero-inner"><div class="hero-copy"><span class="eyebrow"><House :size="16" aria-hidden="true" /> Małe rachunki, duża wygoda</span><h1>Policz to<br /><em>po domowemu.</em></h1><p>Podaj wymiary pokoju raz, a potem przejdź do farby, płytek lub paneli z gotowym metrażem. Osiem prostych kalkulatorów pomaga też zapanować nad domowymi rachunkami.</p><a class="hero-cta" href="#kalkulatory">Sprawdź kalkulatory <ArrowRight :size="18" aria-hidden="true" /></a><div class="hero-assurances"><span><Check :size="16" /> Bez konta</span><span><Check :size="16" /> Wynik od razu</span><span><Check :size="16" /> Czytelne wzory</span></div></div><div class="hero-art"><img :src="houseIllustration" width="680" height="560" alt="Izometryczny pokój z wymiarami 5 na 4 metry i powierzchnią 20 metrów kwadratowych" /><div class="art-note"><Ruler :size="18" aria-hidden="true" /> Pomysł zaczyna się od dobrego pomiaru</div></div></div>
    </section>

    <section class="topic-strip" aria-label="Zakres kalkulatorów"><div><span class="topic-number">01</span><strong>Wymiary</strong><small>Powierzchnia, obwód i kubatura</small></div><div><span class="topic-number">02</span><strong>Rachunki</strong><small>Prąd i woda pod kontrolą</small></div><div><span class="topic-number">03</span><strong>Remont</strong><small>Farba, płytki i panele</small></div></section>

    <DomRoomPlanner />

    <section class="shopping-teaser"><div class="teaser-icon"><ShoppingBasket :size="30" aria-hidden="true" /></div><div><p class="section-kicker">OD OBLICZEŃ DO ZAKUPÓW</p><h2>Mój remont, jedna lista.</h2><p>Zapisuj wyniki paneli, płytek i listew, a podane ceny zobaczysz razem. Lista zostaje w tej przeglądarce — bez konta i bez synchronizacji.</p></div><RouterLink :to="domPath('/moj-remont')">Otwórz listę <ArrowUpRight :size="18" aria-hidden="true" /></RouterLink></section>

    <section id="kalkulatory" class="tools-section"><div class="section-heading"><div><p class="section-kicker"><Sparkles :size="16" aria-hidden="true" /> TWOJA SKRZYNKA NARZĘDZI</p><h2>Co dziś planujesz?</h2><p>Wybierz temat. Każdy kalkulator podpowie, jak powstaje wynik.</p></div><span class="tool-count">08 <small>kalkulatorów</small></span></div><div class="category-tabs" role="group" aria-label="Filtruj kalkulatory"><button v-for="category in categories" :key="category" type="button" :aria-pressed="activeCategory === category" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button></div><div class="tool-grid"><RouterLink v-for="(tool, index) in visibleTools" :key="tool.id" :to="domPath(`/${tool.id}`)" class="tool-card" :class="[`tool-card--${tool.accent}`, { 'tool-card--featured': activeCategory === 'Wszystkie' && index === 0 }]"><span class="card-top"><span class="card-category">{{ tool.category }}</span><ArrowUpRight :size="21" aria-hidden="true" /></span><span class="card-symbol" aria-hidden="true">{{ tool.symbol }}</span><span class="card-bottom"><strong>{{ tool.title }}</strong><small>{{ tool.description }}</small></span></RouterLink></div></section>

    <section class="guide-section"><div class="guide-inner"><div class="guide-title"><p class="section-kicker">JAK TO DZIAŁA</p><h2>Od pomysłu<br />do konkretu.</h2><p>Obliczenia mają pomagać w decyzji, nie ją utrudniać. Dlatego przy każdym wyniku widzisz także wzór i krótkie wyjaśnienie.</p></div><div class="guide-steps"><div><span>01</span><strong>Zmierz lub sprawdź</strong><p>Przygotuj wymiary, dane urządzenia albo informacje z opakowania produktu.</p></div><div><span>02</span><strong>Wpisz wartości</strong><p>Podaj liczby w opisanych jednostkach. Wynik przelicza się automatycznie.</p></div><div><span>03</span><strong>Zaplanuj zakupy</strong><p>Porównaj wynik z ceną i zaleceniami producenta. Przy materiałach uwzględnij zapas.</p></div></div></div></section>

    <div class="faq-wrap"><FaqSection :items="faq" title="Pytania o domowe obliczenia" /></div>
  </div>
</template>

<style scoped>
.hero { position: relative; overflow: hidden; background: radial-gradient(circle at 83% 24%, #f9efdc 0, transparent 36%), linear-gradient(118deg, #e3eddf, #eef1e5 68%, #e2e9da); }
.hero::before { position: absolute; inset: 0; background-image: linear-gradient(#91b19c1c 1px, transparent 1px), linear-gradient(90deg, #91b19c1c 1px, transparent 1px); background-size: 56px 56px; content: ''; mask-image: linear-gradient(90deg, transparent 12%, black 100%); }
.hero-inner { position: relative; width: min(100% - 2.5rem, 1280px); min-height: 570px; margin-inline: auto; display: grid; grid-template-columns: .98fr 1.02fr; align-items: center; gap: 1.5rem; }
.hero-copy { position: relative; z-index: 1; padding-block: 4.5rem; }
.eyebrow { display: inline-flex; align-items: center; gap: .5rem; padding: .55rem .9rem; border: 1px solid #9bbc9d; border-radius: 999px; background: #f7fbf3a8; color: #315f48; font-size: .8rem; font-weight: 800; }
h1, h2 { font-family: var(--font-heading); letter-spacing: -.06em; }
.hero h1 { margin-top: 1.75rem; font-size: clamp(3.25rem, 5.6vw, 5.9rem); font-weight: 800; line-height: 1.04; }
.hero h1 em { color: #b3674e; font-style: normal; }
.hero-copy > p { max-width: 590px; margin-top: 1.55rem; color: #506b5a; font-size: 1.08rem; line-height: 1.8; }
.hero-cta { display: inline-flex; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem 1.2rem; border-radius: 13px; background: #275340; box-shadow: 0 10px 25px #27534024; color: white; font-size: .9rem; font-weight: 800; text-decoration: none; transition: transform .2s, background .2s; }
.hero-cta:hover { transform: translateY(-2px); background: #1b422f; }
.hero-assurances { display: flex; flex-wrap: wrap; gap: .7rem 1.3rem; margin-top: 1.8rem; color: #567260; font-size: .8rem; font-weight: 700; }
.hero-assurances span { display: inline-flex; align-items: center; gap: .3rem; }
.hero-assurances svg { color: #458967; }
.hero-art { position: relative; display: grid; place-items: center; }
.hero-art img { width: min(100%, 680px); height: auto; filter: drop-shadow(0 20px 24px #2e634626); }
.art-note { position: absolute; right: 1rem; bottom: 1.8rem; display: inline-flex; align-items: center; gap: .45rem; padding: .7rem .9rem; border: 1px solid #e4e6d5; border-radius: 11px; background: #fffdf2; box-shadow: 0 10px 30px #3257431c; color: #48705a; font-size: .77rem; font-weight: 800; transform: rotate(3deg); }
.topic-strip { width: min(100% - 2.5rem, 1280px); margin: -1px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #e6e9da; border-radius: 0 0 18px 18px; background: #fffefa; box-shadow: 0 12px 30px #2b493610; }
.topic-strip > div { display: grid; grid-template-columns: auto 1fr; column-gap: 1rem; align-items: center; padding: 1.5rem; }
.topic-strip > div + div { border-left: 1px solid #e8eadf; }
.topic-number { grid-row: span 2; color: #bdc8b7; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; }
.topic-strip strong { font-family: var(--font-heading); font-size: 1rem; }
.topic-strip small { margin-top: .1rem; color: #7c8a7d; font-size: .75rem; }
.shopping-teaser { width: min(100% - 2.5rem, 1280px); margin: 4rem auto 0; display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem 2rem; border: 1px solid #d3e3cf; border-radius: 22px; background: #eff5e9; }
.teaser-icon { flex: 0 0 64px; display: grid; place-items: center; height: 64px; border-radius: 18px; background: #d8e9d2; color: #2d6142; }
.shopping-teaser h2 { margin-top: .35rem; font-size: clamp(1.35rem, 2.4vw, 2rem); }
.shopping-teaser p:last-child { margin-top: .35rem; color: #647a68; font-size: .82rem; line-height: 1.55; }
.shopping-teaser > a { display: inline-flex; align-items: center; gap: .5rem; flex: 0 0 auto; margin-left: auto; padding: .75rem 1rem; border-radius: 10px; background: #28573e; color: #fff; font-size: .8rem; font-weight: 800; text-decoration: none; }
.shopping-teaser > a:hover { background: #1d4530; }
.tools-section, .faq-wrap { width: min(100% - 2.5rem, 1280px); margin-inline: auto; }
.tools-section { padding-top: 6.5rem; scroll-margin-top: 1.5rem; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; }
.section-kicker { display: inline-flex; align-items: center; gap: .45rem; color: #aa654b; font-size: .74rem; font-weight: 800; letter-spacing: .16em; }
.section-heading h2, .guide-title h2 { margin-top: .7rem; font-size: clamp(2.2rem, 3.5vw, 3.4rem); font-weight: 800; line-height: 1.13; }
.section-heading p:last-child { margin-top: .85rem; color: #6e7d70; line-height: 1.65; }
.tool-count { color: #cbd9c6; font-family: var(--font-heading); font-size: 4.5rem; font-weight: 800; line-height: 1; }
.tool-count small { display: block; margin-top: .3rem; color: #7c8d7f; font-family: var(--font-sans); font-size: .72rem; font-weight: 700; text-align: right; }
.category-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-block: 2rem 1.2rem; }
.category-tabs button { padding: .65rem 1.05rem; border: 1px solid #d5dfd0; border-radius: 999px; background: #fffefa; color: #587161; font-size: .8rem; font-weight: 800; cursor: pointer; }
.category-tabs button.active { border-color: #275340; background: #275340; color: white; }
.category-tabs button:not(.active):hover { background: #edf4e9; }
.tool-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.tool-card { --card-bg: #e6efdf; --card-ink: #4c7656; position: relative; min-height: 235px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 1.55rem; border: 1px solid #244f3d10; border-radius: 22px; background: var(--card-bg); color: #253d31; text-decoration: none; transition: transform .2s, box-shadow .2s; }
.tool-card:hover { transform: translateY(-4px); box-shadow: 0 18px 33px #2b49361b; }
.tool-card--featured { grid-column: span 2; background: #dcebd9; }
.tool-card--sage { --card-bg: #e1efdf; --card-ink: #517d58; }
.tool-card--sand { --card-bg: #f4ead9; --card-ink: #9d7951; }
.tool-card--blue { --card-bg: #dfece9; --card-ink: #4e858b; }
.tool-card--peach { --card-bg: #f7e4d8; --card-ink: #b56f52; }
.card-top { display: flex; align-items: center; justify-content: space-between; color: var(--card-ink); }
.card-category { padding: .32rem .6rem; border: 1px solid currentColor; border-radius: 999px; font-size: .67rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.card-symbol { position: absolute; top: 34%; right: 1rem; color: var(--card-ink); opacity: .2; font-family: var(--font-heading); font-size: clamp(3.2rem, 5vw, 5.3rem); font-weight: 800; letter-spacing: -.08em; line-height: 1; transform: rotate(-11deg); }
.tool-card--featured .card-symbol { right: 3rem; font-size: 7rem; }
.card-bottom { position: relative; z-index: 1; display: block; max-width: 360px; }
.card-bottom strong { display: block; font-family: var(--font-heading); font-size: 1.22rem; font-weight: 800; }
.card-bottom small { display: block; margin-top: .45rem; color: #596c5c; font-size: .81rem; line-height: 1.55; }
.guide-section { margin-top: 6.5rem; background: #eaf0e4; }
.guide-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: grid; grid-template-columns: .8fr 1.2fr; gap: 4rem; padding-block: 5rem; }
.guide-title > p:last-child { max-width: 390px; margin-top: 1.3rem; color: #617766; line-height: 1.75; }
.guide-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; align-items: stretch; }
.guide-steps > div { padding: 1.5rem; border: 1px solid #d6e2d0; border-radius: 17px; background: #fcfdf7; }
.guide-steps span { color: #c38469; font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; }
.guide-steps strong { display: block; margin-top: 1.4rem; font-family: var(--font-heading); font-size: 1rem; }
.guide-steps p { margin-top: .7rem; color: #718174; font-size: .82rem; line-height: 1.65; }
.faq-wrap { padding-top: 3.5rem; }
@media (max-width: 1050px) { .hero-inner { grid-template-columns: 1fr .9fr; } .guide-inner { grid-template-columns: 1fr; gap: 2rem; } }
@media (max-width: 800px) { .hero-inner { display: block; } .hero-copy { padding-block: 4rem 0; } .hero-art { max-width: 580px; margin-inline: auto; } .topic-strip { grid-template-columns: 1fr; } .topic-strip > div + div { border-left: 0; border-top: 1px solid #e8eadf; } .shopping-teaser { flex-wrap: wrap; } .shopping-teaser > a { margin-left: 0; } .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .guide-steps { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 560px) { .hero h1 { font-size: clamp(3rem, 12vw, 4rem); } .hero-copy > p { font-size: 1rem; } .art-note { right: 0; bottom: 0; font-size: .66rem; } .tool-count { display: none; } .tool-grid { grid-template-columns: 1fr; } .tool-card--featured { grid-column: span 1; } .guide-steps { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .hero-cta, .tool-card { transition: none; } }
</style>
