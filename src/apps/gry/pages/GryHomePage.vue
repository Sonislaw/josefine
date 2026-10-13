<script setup lang="ts">
import GameCards from '../components/GameCards.vue'
import { games } from '../manifest'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('home', {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Gry — Zgrana',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: games.map((game, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: game.title,
      url: new URL(gryPath(`/${game.id}`), grySiteUrl).href,
    })),
  },
})
</script>
<template>
  <div class="games-home">
    <header class="home-hero">
      <div>
        <p class="kicker">ZGRANA / MIEJSCE NA DOBRĄ ROZGRYWKĘ</p>
        <h1>Oderwij się.<br /><span>Twój ruch.</span></h1>
        <p class="lead">
          Małe gry, duża frajda. Bez konta i instalowania.<br />Wybierz swój tytuł i daj sobie
          chwilę dobrej zabawy.
        </p>
        <a href="#gry" class="discover">Znajdź swoją grę <span>↘</span></a>
      </div>
      <div class="hero-orbit" aria-hidden="true">
        <div class="orbit-circle"></div>
        <span class="hero-piece hero-piece-one">ϟ</span
        ><span class="hero-piece hero-piece-two">↔</span
        ><span class="orbit-label">MNIEJ SCROLLOWANIA.<br />WIĘCEJ GRANIA.</span
        ><span class="orbit-star">✧</span>
      </div>
    </header>
    <section id="gry" class="catalog">
      <div class="section-title">
        <div>
          <p class="kicker">WYBIERZ SWOJĄ ARENĘ</p>
          <h2>W co dziś gramy?</h2>
        </div>
        <span>{{ String(games.length).padStart(2, '0') }} / STARTUJEMY</span>
      </div>
      <GameCards />
    </section>
    <section class="home-benefits">
      <div>
        <span>01 / OD RAZU</span>
        <h2>Otwierasz i grasz.</h2>
        <p>
          Wszystko działa w przeglądarce. Na komputerze, tablecie lub telefonie — bez zakładania
          konta.
        </p>
      </div>
      <div>
        <span>02 / PO SWOJEMU</span>
        <h2>Solo albo razem.</h2>
        <p>
          Przetrwaj noc w Ostatniej latarni, rozwijaj Małe królestwo, ułóż linię w Klockach lub
          pobij rekord w „Jeszcze jeden kryształ”. W Warcabach zmierz się z komputerem lub zaproś
          drugą osobę do wspólnej planszy.
        </p>
      </div>
      <div>
        <span>03 / TAKŻE OFFLINE</span>
        <h2>Zabierz grę ze sobą.</h2>
        <p>Pobierz Warcaby jako jeden plik HTML. Otwórz go w przeglądarce i graj bez internetu.</p>
      </div>
    </section>
    <section class="home-faq">
      <p class="kicker">ZANIM ZROBISZ PIERWSZY RUCH</p>
      <h2>Kilka szybkich odpowiedzi</h2>
      <details>
        <summary>Czy gry są bezpłatne?</summary>
        <p>
          Tak. Możesz grać bez opłat i bez konta. Punkty w Warcabach są wyłącznie oznaczeniem
          postępów i niczego nie kupują.
        </p>
      </details>
      <details>
        <summary>Czy mogę zagrać z kimś przez internet?</summary>
        <p>
          Warcaby obsługują komputer lub dwie osoby na jednym urządzeniu. „Jeszcze jeden kryształ”,
          Klocki, Małe królestwo i Ostatnia latarnia to gry jednoosobowe. Nie ma tu rozgrywek
          sieciowych.
        </p>
      </details>
      <details>
        <summary>Czy mogę wrócić do przerwanej partii?</summary>
        <p>
          W Małym królestwie zapisujemy osadę, a w Klockach całą rundę — wrócisz do swojej planszy w
          tej samej przeglądarce. W Warcabach pozostają jedynie lokalne punkty doświadczenia, a w
          „Jeszcze jeden kryształ” — rekord i ustawienie dźwięku, bez zapisu trwającej rozgrywki.
          Ostatnia latarnia zachowuje rekordy, odblokowanych bohaterów i dźwięk, ale nie bieżącą
          wyprawę.
        </p>
      </details>
    </section>
  </div>
</template>
<style scoped>
.games-home {
  width: min(90%, 1280px);
  margin: auto;
}
.home-hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  min-height: 550px;
  gap: 40px;
  padding-block: 55px;
}
.kicker {
  color: #b9c8ab;
  font-size: 10px;
  letter-spacing: 0.17em;
  font-weight: 700;
}
.home-hero h1 {
  margin: 23px 0;
  font-size: clamp(52px, 6.7vw, 88px);
  letter-spacing: -0.065em;
  line-height: 1.02;
  font-weight: 600;
}
.home-hero h1 span {
  color: #d5ef89;
}
.lead {
  color: #a4b0a5;
  font-size: 16px;
  line-height: 1.8;
}
.discover {
  display: inline-flex;
  gap: 42px;
  margin-top: 30px;
  padding: 13px 21px;
  background: #d5ef89;
  border-radius: 8px;
  color: #17221a;
  font-weight: 700;
  text-decoration: none;
  font-size: 13px;
}
.hero-orbit {
  position: relative;
  height: 390px;
}
.orbit-circle {
  position: absolute;
  width: 330px;
  max-width: 95%;
  aspect-ratio: 1;
  border: 1px solid #40503d;
  border-radius: 50%;
  left: 8%;
  top: 15px;
}
.orbit-circle::before {
  content: '';
  position: absolute;
  inset: 35px;
  border: 1px dashed #40503d;
  border-radius: 50%;
}
.hero-piece {
  position: absolute;
  display: grid;
  place-items: center;
  width: 170px;
  height: 170px;
  border: 8px double #e2e8c1;
  border-radius: 50%;
  box-shadow:
    0 15px #84916c,
    0 30px 35px #0005;
  background: linear-gradient(135deg, #f2f4d5, #cbd5ac);
  color: #536442;
  font-size: 100px;
  transform: rotate(-20deg);
}
.hero-piece-one {
  left: 5%;
  top: 55px;
}
.hero-piece-two {
  right: 7%;
  top: 165px;
  background: linear-gradient(135deg, #ba7459, #874831);
  color: #f4d0a1;
  border-color: #c58a60;
  box-shadow:
    0 15px #623621,
    0 30px 35px #0005;
  transform: rotate(15deg);
}
.orbit-label {
  position: absolute;
  bottom: 10px;
  left: 0;
  font-size: 10px;
  color: #a4b0a5;
  letter-spacing: 0.15em;
}
.orbit-star {
  position: absolute;
  right: 10%;
  top: 2px;
  font-size: 66px;
  color: #d5ef89;
}
.catalog {
  padding: 35px 0 65px;
  border-top: 1px solid #2b3731;
  scroll-margin-top: 20px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 28px;
}
.section-title h2,
.home-faq h2 {
  font-size: 33px;
  letter-spacing: -0.04em;
  margin-top: 8px;
}
.section-title > span {
  color: #a4b0a5;
  font-size: 10px;
  letter-spacing: 0.12em;
}
.home-benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 45px;
  border-block: 1px solid #2b3731;
  padding: 40px 0;
}
.home-benefits span {
  color: #b9c8ab;
  font-size: 10px;
  letter-spacing: 0.15em;
}
.home-benefits h2 {
  font-size: 21px;
  margin: 16px 0 9px;
}
.home-benefits p,
.home-faq p:not(.kicker) {
  color: #a4b0a5;
  line-height: 1.8;
  font-size: 14px;
}
.home-faq {
  margin: 65px 0 85px;
}
.home-faq h2 {
  margin-bottom: 25px;
}
.home-faq details {
  padding: 20px 0;
  border-bottom: 1px solid #2b3731;
}
.home-faq summary {
  cursor: pointer;
  font-size: 16px;
}
.home-faq details p {
  padding-top: 15px;
  max-width: 800px;
}
@media (max-width: 750px) {
  .home-hero {
    gap: 15px;
    min-height: 450px;
  }
  .hero-piece {
    width: 125px;
    height: 125px;
    font-size: 75px;
  }
  .hero-piece-two {
    right: 0;
  }
  .hero-orbit {
    height: 325px;
  }
  .home-benefits {
    gap: 22px;
  }
  .section-title > span {
    display: none;
  }
}
@media (max-width: 560px) {
  .games-home {
    width: calc(100% - 30px);
  }
  .home-hero {
    grid-template-columns: 1fr;
    padding: 35px 0 10px;
  }
  .hero-orbit {
    width: 300px;
    max-width: 100%;
    margin: auto;
    height: 300px;
  }
  .hero-piece-one {
    top: 35px;
  }
  .hero-piece-two {
    top: 125px;
  }
  .orbit-circle {
    width: 240px;
  }
  .home-benefits {
    grid-template-columns: 1fr;
  }
  .section-title h2,
  .home-faq h2 {
    font-size: 28px;
  }
}
</style>
