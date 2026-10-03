<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowUpRight, ShoppingBasket, Trash2 } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDomShoppingList, shoppingKinds } from '../stores/shoppingList'
import { domPath, domSiteName, domSiteUrl, useDomSeo } from '../seo/useDomSeo'

useDomSeo('shopping-list', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Mój remont — lista zakupów',
  url: `${domSiteUrl}/moj-remont`,
  isPartOf: { '@type': 'WebSite', name: domSiteName, url: domSiteUrl },
})

const list = useDomShoppingList()
const { items, hydrated, storageError, knownTotal, unknownPriceCount } = storeToRefs(list)
const pricedCount = computed(() => items.value.length - unknownPriceCount.value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)

function clearAll() {
  if (window.confirm('Usunąć wszystkie pozycje z listy Mój remont?')) list.clearItems()
}
</script>

<template>
  <article class="shopping-page">
    <RouterLink class="back-link" :to="domPath('/')"
      ><ArrowLeft :size="17" aria-hidden="true" /> Kalkulatory Dom</RouterLink
    >

    <header class="page-hero">
      <div class="hero-copy">
        <p class="eyebrow">PLAN ZAKUPÓW</p>
        <h1>Mój remont<span>.</span></h1>
        <p>
          W jednym miejscu zbierz materiały policzone w kalkulatorach Dom. Panele, płytki i listwy
          zapiszesz z wyniku, a ceny dodasz tylko wtedy, gdy je znasz.
        </p>
      </div>
      <div class="hero-graphic" aria-hidden="true">
        <ShoppingBasket :size="76" :stroke-width="1.3" /><span>Twój plan<br />pod ręką</span>
      </div>
    </header>

    <div class="local-note">
      <strong>Lista jest tylko na tym urządzeniu.</strong>
      <span
        >Zapisujemy ją w pamięci tej przeglądarki. Nie synchronizuje się między telefonem a
        komputerem; wyczyszczenie danych przeglądarki lub tryb prywatny mogą ją usunąć.</span
      >
    </div>

    <p v-if="storageError" class="storage-warning" role="alert">
      Przeglądarka nie pozwala teraz odczytać lub zapisać listy. Zmiany mogą zniknąć po odświeżeniu
      strony.
    </p>

    <div v-if="!hydrated" class="list-card" role="status">Wczytywanie listy…</div>
    <div v-else-if="items.length" class="content-grid">
      <section class="list-card" aria-labelledby="items-heading">
        <div class="list-heading">
          <div>
            <p class="eyebrow">ZAPISANE WYNIKI</p>
            <h2 id="items-heading">
              Materiały <span>{{ items.length }}</span>
            </h2>
          </div>
          <button type="button" class="clear-button" @click="clearAll">
            <Trash2 :size="16" aria-hidden="true" /> Wyczyść listę
          </button>
        </div>
        <ul class="items-list">
          <li v-for="item in items" :key="item.id" class="item-row">
            <div class="item-icon"><ShoppingBasket :size="21" aria-hidden="true" /></div>
            <div class="item-copy">
              <strong>{{ shoppingKinds[item.kind].label }}</strong
              ><span
                >{{ formatCount(item.quantity) }} {{ shoppingKinds[item.kind].unit }} ·
                <RouterLink :to="domPath(shoppingKinds[item.kind].path)"
                  >Otwórz kalkulator <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink
              ></span>
            </div>
            <div class="item-end">
              <strong>{{ item.cost === null ? 'Cena niepodana' : formatMoney(item.cost) }}</strong
              ><button
                type="button"
                :aria-label="`Usuń pozycję: ${shoppingKinds[item.kind].label}, ${item.quantity} ${shoppingKinds[item.kind].unit}`"
                @click="list.removeItem(item.id)"
              >
                <Trash2 :size="17" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>
        <p class="snapshot-note">
          Pozycje są zapisanymi wynikami. Ponowne obliczenie w kalkulatorze nie zmieni listy — usuń
          starą pozycję i dodaj nową, jeśli zmieniasz plan.
        </p>
      </section>

      <aside class="summary-card" aria-labelledby="summary-heading">
        <p class="eyebrow">KOSZTORYS</p>
        <h2 id="summary-heading">Suma podanych cen</h2>
        <strong class="total">{{ pricedCount ? formatMoney(knownTotal) : 'Brak cen' }}</strong>
        <p v-if="unknownPriceCount">
          Liczba pozycji bez ceny: {{ unknownPriceCount }}. Nie uwzględniono ich w sumie, więc nie
          jest to pełny koszt remontu.
        </p>
        <p v-else>
          To orientacyjny koszt zapisanych materiałów. Nie obejmuje robocizny, transportu ani innych
          zakupów.
        </p>
      </aside>
    </div>

    <section v-else class="empty-card" aria-labelledby="empty-heading">
      <div class="empty-icon"><ShoppingBasket :size="34" aria-hidden="true" /></div>
      <h2 id="empty-heading">Lista jeszcze czeka na pierwszy zakup.</h2>
      <p>
        Policz potrzebną ilość materiału, a następnie wybierz „Dodaj do Mojego remontu” obok wyniku.
        Zacznij od jednego z trzech planów:
      </p>
      <div class="start-links">
        <RouterLink :to="domPath('/liczba-paczek-paneli')"
          >Panele <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink
        ><RouterLink :to="domPath('/liczba-plytek')"
          >Płytki <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink
        ><RouterLink :to="domPath('/obwod-prostokata')"
          >Listwy <ArrowUpRight :size="16" aria-hidden="true"
        /></RouterLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.shopping-page {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
  padding-block: 2.5rem 1rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #54725e;
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin-top: 1.4rem;
  padding: clamp(1.6rem, 4vw, 3.2rem);
  border-radius: 26px;
  background: linear-gradient(115deg, #e4efdd, #faf1e2);
}
.eyebrow {
  color: #a96b4d;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h1,
h2 {
  font-family: var(--font-heading);
  letter-spacing: -0.055em;
}
h1 {
  margin-top: 0.6rem;
  font-size: clamp(2.7rem, 6vw, 5.2rem);
  line-height: 1.05;
}
h1 span {
  color: #b77356;
}
.hero-copy > p:last-child {
  max-width: 660px;
  margin-top: 1.2rem;
  color: #536c5c;
  line-height: 1.75;
}
.hero-graphic {
  flex: 0 0 210px;
  display: grid;
  place-items: center;
  min-height: 190px;
  border: 1px solid #b9cfb3;
  border-radius: 26px;
  background: #f8fcf3;
  color: #315d42;
  transform: rotate(5deg);
}
.hero-graphic span {
  margin-top: -1.6rem;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
}
.local-note {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-block: 1.5rem;
  padding: 1rem 1.2rem;
  border: 1px solid #dce7d9;
  border-radius: 14px;
  background: #f6faf1;
  color: #526b57;
  font-size: 0.78rem;
  line-height: 1.6;
}
.local-note strong {
  color: #315c42;
}
.storage-warning {
  margin-bottom: 1.2rem;
  padding: 1rem;
  border: 1px solid #e3c6ad;
  border-radius: 12px;
  background: #fff2e6;
  color: #8a4c33;
  font-size: 0.85rem;
}
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: start;
  gap: 1.2rem;
}
.list-card,
.summary-card,
.empty-card {
  padding: clamp(1.3rem, 3vw, 2rem);
  border: 1px solid #e0e6d9;
  border-radius: 22px;
  background: #fffefa;
}
.list-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.list-heading h2,
.summary-card h2,
.empty-card h2 {
  margin-top: 0.45rem;
  font-size: clamp(1.4rem, 2vw, 2rem);
}
.list-heading h2 span {
  color: #a4b5a1;
}
.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  background: transparent;
  color: #a15543;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.clear-button:hover {
  text-decoration: underline;
}
.items-list {
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 0;
  border-top: 1px solid #edf0e8;
}
.item-icon {
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  height: 42px;
  border-radius: 12px;
  background: #eaf2e6;
  color: #39714c;
}
.item-copy {
  flex: 1;
  min-width: 0;
}
.item-copy strong {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.97rem;
}
.item-copy span {
  display: block;
  margin-top: 0.25rem;
  color: #758575;
  font-size: 0.74rem;
}
.item-copy a {
  color: #38694b;
  font-weight: 800;
  white-space: nowrap;
}
.item-copy a svg {
  display: inline;
  vertical-align: middle;
}
.item-end {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.item-end strong {
  color: #31593e;
  font-size: 0.8rem;
  text-align: right;
  white-space: nowrap;
}
.item-end button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #b16751;
  cursor: pointer;
}
.item-end button:hover {
  background: #fbede7;
}
.snapshot-note {
  margin-top: 0.65rem;
  color: #7a8b7c;
  font-size: 0.72rem;
  line-height: 1.6;
}
.summary-card {
  background: #e7f0e2;
}
.summary-card .total {
  display: block;
  margin-top: 1.2rem;
  color: #28543c;
  font-family: var(--font-heading);
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  letter-spacing: -0.05em;
}
.summary-card > p:last-child {
  margin-top: 1rem;
  color: #5f7966;
  font-size: 0.78rem;
  line-height: 1.65;
}
.empty-card {
  padding-block: 3.2rem;
  text-align: center;
}
.empty-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  margin-inline: auto;
  border-radius: 20px;
  background: #e8f1e4;
  color: #386d4b;
}
.empty-card h2 {
  margin-top: 1.2rem;
}
.empty-card p {
  max-width: 590px;
  margin: 0.8rem auto 0;
  color: #718272;
  line-height: 1.7;
}
.start-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 1.5rem;
}
.start-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #28573e;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
}
.start-links a:hover {
  background: #1d4530;
}
@media (max-width: 830px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .hero-graphic {
    display: none;
  }
  .item-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .item-end {
    width: 100%;
    justify-content: space-between;
    padding-left: 3.35rem;
  }
  .list-heading {
    align-items: flex-start;
  }
}
</style>
