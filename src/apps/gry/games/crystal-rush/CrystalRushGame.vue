<script setup lang="ts">
import { computed } from 'vue'
import { CONFIG, clamp, dashCooldown, magnetRadius, movementSpeed } from './config'
import { useCrystalRush } from './useCrystalRush'
const {
  canvas,
  root,
  overlay,
  hud,
  sound,
  storageAvailable,
  error,
  announcement,
  debug,
  development,
  start,
  togglePause,
  upgrade,
  dash,
  toggleSound,
} = useCrystalRush()
const time = computed(
  () =>
    `${Math.floor(hud.value.elapsed / 60)}:${String(Math.floor(hud.value.elapsed % 60)).padStart(2, '0')}`,
)
const energyMaxed = computed(
  () => hud.value.fullCooldown <= CONFIG.dash.minimumCooldown && hud.value.hp === CONFIG.player.hp,
)
const dashProgress = computed(() => clamp(1 - hud.value.cooldown / hud.value.fullCooldown, 0, 1))
const format = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 1 })
</script>

<template>
  <div
    ref="root"
    class="crystal-game"
    :style="{ '--arena-ratio': `${hud.arena.width} / ${hud.arena.height}` }"
  >
    <header class="crystal-heading">
      <div>
        <p class="eyebrow">◈ ZGRANA / ARCADE <span>REFLEKS. RYZYKO. JESZCZE JEDEN.</span></p>
        <h1>Jeszcze jeden <span>kryształ.</span></h1>
        <p>Zbieraj. Rób uniki. Nie daj się złapać.</p>
      </div>
      <button type="button" class="sound-button" :aria-pressed="sound" @click="toggleSound">
        ♪ Dźwięk {{ sound ? 'wł.' : 'wył.' }}
      </button>
    </header>
    <div class="crystal-layout">
      <div class="arena-column">
        <div class="arena-shell">
          <canvas
            ref="canvas"
            tabindex="0"
            width="900"
            height="600"
            aria-label="Arena gry. Ruch: WASD, strzałki lub przeciąganie palcem. Spacja: zryw. P lub Escape: pauza."
            >Twoja przeglądarka musi obsługiwać Canvas 2D, aby wyświetlić grę.</canvas
          >
          <div class="crystal-hud" aria-label="Stan gry">
            <div>
              <span class="hud-label">PUNKTY</span><strong>{{ hud.score }}</strong
              ><span class="combo">×{{ hud.combo }} <small>następny kryształ</small></span>
            </div>
            <div class="hud-right">
              <span class="hud-label"
                >{{ time }} <span class="meteor-count">· Meteory: {{ hud.meteors }}</span></span
              ><span class="hearts" :aria-label="`Życia: ${hud.hp} z 3`"
                ><span v-for="n in 3" :key="n" :class="{ empty: n > hud.hp }" aria-hidden="true"
                  >♥</span
                ></span
              >
            </div>
          </div>
          <div
            v-if="hud.mode !== 'playing'"
            ref="overlay"
            class="game-overlay"
            role="dialog"
            :aria-label="
              hud.mode === 'upgrade'
                ? 'Wybór ulepszenia'
                : hud.mode === 'gameover'
                  ? 'Koniec rundy'
                  : hud.mode === 'paused'
                    ? 'Pauza'
                    : 'Rozpocznij grę'
            "
          >
            <div v-if="hud.mode === 'menu'" class="overlay-content">
              <span class="crystal-mark" aria-hidden="true">◈</span>
              <p class="eyebrow">JESZCZE JEDNA PRÓBA?</p>
              <h2>Mały statek.<br />Duży apetyt na rekord.</h2>
              <p>
                Zbieraj kryształy, łącz serie i przebijaj się przez meteory zrywem. Masz trzy życia.
              </p>
              <p class="start-warning">
                Meteory nadciągają bez końca — z każdą chwilą jest ich więcej.
              </p>
              <button type="button" class="primary" :disabled="!!error" @click="start">
                Zaczynamy →</button
              ><small>WASD / strzałki lub palec · Spacja / ⚡ ZRYW</small>
            </div>
            <div v-else-if="hud.mode === 'paused'" class="overlay-content">
              <p class="eyebrow">CHWILA ODDECHU</p>
              <h2>Pauza.</h2>
              <p>Czas, meteory i Twoja seria czekają. Wróć do gry, kiedy będziesz gotowy.</p>
              <button type="button" class="primary" @click="togglePause">Wracam do gry →</button>
            </div>
            <div v-else-if="hud.mode === 'upgrade'" class="upgrade-content">
              <p class="eyebrow">POZIOM {{ hud.level }}</p>
              <h2>Twój statek. Twój wybór.</h2>
              <p class="upgrade-intro">Wybierz ulepszenie i wracaj do gry z chwilą ochrony.</p>
              <div class="upgrade-grid">
                <button type="button" class="upgrade-card" @click="upgrade('speed')">
                  <span aria-hidden="true">↗</span><strong>Silnik</strong
                  ><small>+12% bazowej prędkości</small
                  ><b
                    >{{ format(hud.speed) }} →
                    {{ format(movementSpeed(hud.upgrades.speed + 1)) }} jedn./s</b
                  ><em>Szybszy ruch. Zryw bez zmian.</em></button
                ><button type="button" class="upgrade-card" @click="upgrade('magnet')">
                  <span aria-hidden="true">◎</span><strong>Magnes</strong
                  ><small>+35 do zasięgu</small
                  ><b
                    >{{ format(hud.magnet) }} →
                    {{ format(magnetRadius(hud.upgrades.magnet + 1)) }}</b
                  ><em>Przyciągaj kryształy z daleka.</em></button
                ><button
                  type="button"
                  class="upgrade-card"
                  :disabled="energyMaxed"
                  @click="upgrade('energy')"
                >
                  <span aria-hidden="true">ϟ</span><strong>Energia</strong
                  ><small>{{
                    hud.fullCooldown > CONFIG.dash.minimumCooldown
                      ? 'Szybszy zryw i +1 życie'
                      : '+1 życie'
                  }}</small
                  ><b
                    >{{ format(hud.fullCooldown) }} →
                    {{ format(dashCooldown(hud.upgrades.energy + 1)) }} s · ♥ {{ hud.hp }} →
                    {{ Math.min(3, hud.hp + 1) }}</b
                  ><em>{{
                    energyMaxed ? 'Maksimum — pełne zdrowie' : 'Leczenie maksymalnie do 3 żyć.'
                  }}</em>
                </button>
              </div>
            </div>
            <div v-else class="overlay-content">
              <p class="eyebrow">
                {{ hud.newRecord ? 'NOWY REKORD!' : 'DOBRY LOT. JESZCZE RAZ?' }}
              </p>
              <h2 class="final-score">{{ hud.score }}<small>punktów</small></h2>
              <p>
                {{ time }} przetrwania · Poziom {{ hud.level }}<br />Twój rekord: {{ hud.best }}
              </p>
              <button type="button" class="primary" @click="start">Jeszcze raz ↗</button>
            </div>
          </div>
        </div>
        <div class="arena-controls">
          <button
            type="button"
            class="pause-button"
            :disabled="hud.mode !== 'playing' && hud.mode !== 'paused'"
            @click="togglePause"
          >
            {{ hud.mode === 'paused' ? '▶ Wznów' : 'Ⅱ Pauza' }} <kbd>P / Esc</kbd></button
          ><button
            type="button"
            class="dash-button"
            :disabled="hud.mode !== 'playing' || hud.cooldown > 0"
            @pointerdown.prevent="dash"
            @click="$event.detail === 0 && dash()"
          >
            ⚡ ZRYW <span>{{ hud.cooldown > 0 ? `${hud.cooldown.toFixed(1)} s` : 'Spacja' }}</span>
          </button>
        </div>
        <p v-if="error" class="error-note" role="alert">{{ error }}</p>
        <p class="storage-note" :class="{ warning: !storageAvailable }">
          {{
            storageAvailable
              ? '↳ Rekord zapisujemy tylko w tej przeglądarce. Bez konta, bez rankingu online.'
              : 'Pamięć przeglądarki jest niedostępna. Rekord tej sesji może nie przetrwać odświeżenia.'
          }}
        </p>
      </div>
      <aside class="crystal-sidebar">
        <section class="stat-card record-card">
          <p class="eyebrow">TWÓJ OSOBISTY REKORD <span aria-hidden="true">✧</span></p>
          <strong>{{ hud.best }}</strong>
          <p>Jeden dobry zryw robi różnicę.</p>
        </section>
        <section class="stat-card">
          <div class="stat-label">
            <span>⚡ ZRYW</span
            ><strong>{{ hud.cooldown <= 0 ? 'GOTOWY' : `${hud.cooldown.toFixed(1)} s` }}</strong>
          </div>
          <progress :value="dashProgress" max="1" aria-label="Odnowienie zrywu" />
          <p>W zrywie jesteś odporny.<br />Meteor na drodze? +15 punktów.</p>
        </section>
        <section class="stat-card">
          <div class="stat-label">
            <span>POZIOM {{ hud.level }}</span
            ><strong>{{ hud.xp }} / {{ hud.xpRequired }} XP</strong>
          </div>
          <progress
            :value="hud.xp"
            :max="hud.xpRequired"
            aria-label="Doświadczenie do kolejnego poziomu"
          />
          <p>Kryształ = 1 XP.<br />Awans = wybór ulepszenia.</p>
        </section>
        <section class="stat-card instruction-card">
          <p class="eyebrow">JAK ZŁAPAĆ DOBRY RYTM</p>
          <h2>Nie stój.<br /><span>Jeszcze jeden jest blisko.</span></h2>
          <ul>
            <li>
              <span aria-hidden="true">◈</span>
              <p>
                <strong>Łącz kryształy w serię</strong>Zbieraj je co najwyżej co 2,8 s. Mnożnik
                kolejnego kryształu rośnie do ×5.
              </p>
            </li>
            <li>
              <span aria-hidden="true">ϟ</span>
              <p>
                <strong>Zostaw sobie wyjście</strong>Zryw trwa 0,22 s. Przebija się przez meteory,
                ale nie daje XP.
              </p>
            </li>
            <li>
              <span aria-hidden="true">↗</span>
              <p>
                <strong>Ruszaj się po całej arenie</strong>Meteory pościgowe nadciągają ze
                wszystkich stron. Ich napływ stale przyspiesza.
              </p>
            </li>
          </ul>
        </section>
      </aside>
    </div>
    <details v-if="development" class="debug">
      <summary @click="debug = !debug">Diagnostyka deweloperska</summary>
      <p v-if="debug">
        Czas aktywny: {{ hud.elapsed.toFixed(2) }} s · Aktywne meteory: {{ hud.meteors }} ·
        Wszystkie narodziny: {{ hud.births }} · FPS: {{ hud.fps }}
      </p>
    </details>
    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
    <footer class="crystal-footer">
      ◈ Nie musisz zebrać wszystkich. Ale ten jeden…<span>1 gracz / bez końca / Twój rekord</span>
    </footer>
  </div>
</template>

<style scoped>
.crystal-game {
  background: #0b1018;
  color: #edf3ff;
  padding: 36px max(24px, calc((100% - 1260px) / 2)) 0;
  font:
    14px/1.6 'DM Sans',
    system-ui,
    sans-serif;
}
.crystal-game * {
  box-sizing: border-box;
}
.crystal-game h1,
.crystal-game h2,
.crystal-game p {
  margin: 0;
}
.crystal-game button {
  font: inherit;
  cursor: pointer;
  min-height: 44px;
}
.crystal-game button:disabled {
  cursor: default;
  opacity: 0.45;
}
.crystal-game :focus-visible {
  outline: 3px solid #a9f477;
  outline-offset: 3px;
}
.eyebrow {
  color: #a9b7cc;
  font-size: 10px;
  letter-spacing: 0.15em;
  font-weight: 700;
}
.crystal-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}
.crystal-heading .eyebrow span {
  margin-left: 24px;
  font-size: 8px;
  color: #8a98ac;
}
.crystal-heading h1 {
  font-size: clamp(29px, 3.5vw, 46px);
  font-weight: 650;
  letter-spacing: -0.05em;
  line-height: 1.1;
  margin: 18px 0 12px;
}
.crystal-heading h1 span {
  color: #a9f477;
}
.crystal-heading p:not(.eyebrow) {
  color: #9dacbf;
}
.sound-button,
.pause-button {
  background: #121a26;
  border: 1px solid #253042;
  border-radius: 9px;
  color: #bdc9d9;
  padding: 9px 14px;
  white-space: nowrap;
}
.sound-button {
  align-self: start;
  font-size: 12px !important;
}
.crystal-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 245px;
  gap: 24px;
  align-items: start;
}
.arena-column {
  min-width: 0;
}
.arena-shell {
  position: relative;
  border: 1px solid #304054;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 22px 70px #0005;
  background: #101a27;
  aspect-ratio: var(--arena-ratio, 3 / 2);
}
.arena-shell canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.arena-shell canvas:focus-visible {
  outline-offset: -4px;
}
.crystal-hud {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  justify-content: space-between;
  padding: 16px 21px;
  pointer-events: none;
  background: linear-gradient(#101a27e6, transparent);
}
.hud-label {
  display: block;
  color: #a9b7cc;
  font-size: 10px;
  letter-spacing: 0.08em;
}
.crystal-hud strong {
  font-size: 31px;
  line-height: 1.2;
}
.combo {
  display: inline-block;
  margin-left: 14px;
  font-size: 19px;
  color: #a9f477;
}
.combo small {
  font-size: 9px;
  color: #9dacbf;
}
.hud-right {
  text-align: right;
}
.hearts {
  display: block;
  color: #ff7185;
  font-size: 22px;
  letter-spacing: 4px;
}
.hearts .empty {
  color: #4c3644;
}
.game-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #0b1018d9;
  backdrop-filter: blur(4px);
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  align-items: safe center;
  justify-content: center;
  padding: 25px;
  text-align: center;
}
.overlay-content {
  max-width: 390px;
  margin: auto;
}
.crystal-mark {
  display: block;
  font-size: 50px;
  line-height: 1;
  margin-bottom: 15px;
  color: #a9f477;
  text-shadow: 0 0 30px #a9f47755;
}
.game-overlay h2 {
  font-size: clamp(24px, 3vw, 35px);
  letter-spacing: -0.05em;
  font-weight: 600;
  line-height: 1.15;
  margin: 14px 0;
}
.game-overlay p:not(.eyebrow) {
  font-size: 13px;
  color: #a9b7cc;
}
.game-overlay .start-warning {
  color: #c9d7bb;
  font-size: 11px;
  margin-top: 12px;
}
.primary {
  background: #a9f477;
  color: #17221a;
  border: 0;
  border-radius: 8px;
  padding: 12px 25px;
  font-weight: 750 !important;
  margin: 22px 0 12px;
}
.primary:hover {
  background: #bfff96;
}
.overlay-content > small {
  display: block;
  color: #8a98ac;
  font-size: 10px;
}
.upgrade-content {
  width: 100%;
  margin: auto;
}
.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 23px;
}
.upgrade-card {
  text-align: left;
  background: #152235;
  border: 1px solid #344662;
  border-radius: 12px;
  color: #edf3ff;
  padding: 18px 15px;
}
.upgrade-card:hover:not(:disabled) {
  border-color: #a9f477;
  background: #1c2e30;
}
.upgrade-card > span {
  display: block;
  font-size: 30px;
  color: #a9f477;
}
.upgrade-card strong {
  display: block;
  font-size: 18px;
  margin: 8px 0;
}
.upgrade-card small,
.upgrade-card b,
.upgrade-card em {
  display: block;
  font-style: normal;
  font-size: 11px;
  color: #a9b7cc;
}
.upgrade-card b {
  margin: 13px 0 8px;
  color: #a9f477;
  font-size: 12px;
}
.game-overlay .final-score {
  font-size: 64px;
  color: #a9f477;
}
.final-score small {
  display: block;
  font-size: 13px;
  color: #a9b7cc;
  letter-spacing: 0;
}
.arena-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 17px;
}
.pause-button {
  font-size: 12px !important;
}
.pause-button kbd {
  color: #8a98ac;
  font-size: 10px;
  margin-left: 14px;
}
.dash-button {
  padding: 12px 23px;
  background: #a9f477;
  color: #17221a;
  border: 0;
  border-radius: 9px;
  font-weight: 800 !important;
  touch-action: manipulation;
}
.dash-button span {
  margin-left: 22px;
  font-size: 10px;
  font-weight: 500;
}
.storage-note {
  color: #8a98ac;
  font-size: 11px;
  margin-top: 15px !important;
}
.storage-note.warning,
.error-note {
  color: #ffc68a;
}
.error-note {
  margin-top: 10px !important;
}
.stat-card {
  padding: 20px;
  border: 1px solid #253042;
  background: #121a26;
  border-radius: 16px;
  margin-bottom: 14px;
}
.record-card {
  background: linear-gradient(140deg, #192b2b, #121a26);
}
.record-card .eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.record-card .eyebrow span {
  color: #a9f477;
  font-size: 24px;
}
.record-card > strong {
  display: block;
  font-size: 45px;
  color: #a9f477;
  font-weight: 600;
  letter-spacing: -0.05em;
  margin: 3px 0;
}
.stat-card p:not(.eyebrow) {
  font-size: 11px;
  color: #9dacbf;
}
.stat-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 10px;
  letter-spacing: 0.06em;
}
.stat-label strong {
  color: #a9f477;
}
.stat-card progress {
  display: block;
  width: 100%;
  height: 5px;
  margin: 13px 0;
  border: none;
  border-radius: 5px;
  background: #253042;
  accent-color: #a9f477;
}
progress::-webkit-progress-bar {
  background: #253042;
  border-radius: 5px;
}
progress::-webkit-progress-value {
  background: #a9f477;
  border-radius: 5px;
}
progress::-moz-progress-bar {
  background: #a9f477;
}
.instruction-card h2 {
  font-size: 20px;
  line-height: 1.3;
  letter-spacing: -0.04em;
  margin: 16px 0;
}
.instruction-card h2 span {
  color: #a9f477;
}
.instruction-card ul {
  padding: 0;
  margin: 20px 0 0;
  list-style: none;
}
.instruction-card li {
  display: flex;
  gap: 10px;
  margin-top: 17px;
}
.instruction-card li > span {
  font-size: 20px;
  color: #a9f477;
}
.instruction-card li strong {
  display: block;
  font-size: 12px;
  color: #d4dfef;
  margin-bottom: 4px;
}
.crystal-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 11px;
  color: #8a98ac;
  padding: 25px 0;
  border-top: 1px solid #253042;
  margin-top: 35px;
}
.debug {
  color: #8a98ac;
  font-size: 11px;
  margin-top: 20px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 1000px) {
  .crystal-game {
    padding-inline: 20px;
  }
  .crystal-layout {
    grid-template-columns: minmax(0, 1fr) 215px;
    gap: 16px;
  }
  .crystal-heading .eyebrow span {
    display: none;
  }
  .combo small {
    display: none;
  }
  .upgrade-card {
    padding: 10px;
  }
  .upgrade-card em {
    display: none;
  }
  .game-overlay {
    padding: 17px;
  }
  .crystal-mark {
    font-size: 34px;
    margin-bottom: 6px;
  }
}
@media (max-width: 800px) {
  .crystal-layout {
    grid-template-columns: 1fr;
  }
  .crystal-sidebar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .stat-card {
    padding: 15px;
    margin: 0;
  }
  .instruction-card {
    grid-column: 1 / -1;
  }
  .instruction-card ul {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .record-card > strong {
    font-size: 32px;
  }
  .crystal-hud {
    padding: 12px 16px;
  }
}
@media (max-width: 600px) {
  .crystal-game {
    padding: 16px 10px 0;
    --mobile-arena-height: clamp(300px, calc(100svh - 260px), 560px);
  }
  .crystal-heading {
    position: relative;
    align-items: start;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .crystal-heading h1 {
    font-size: clamp(23px, 6vw, 30px);
    margin-bottom: 6px;
  }
  .crystal-heading .eyebrow {
    padding-right: 110px;
  }
  .crystal-heading p:not(.eyebrow) {
    font-size: 12px;
  }
  .crystal-heading .sound-button {
    position: absolute;
    right: 0;
    top: -10px;
    min-height: 44px;
    padding: 8px 11px;
  }
  .crystal-heading > div {
    width: 100%;
  }
  .crystal-heading h1 {
    margin-top: 13px;
  }
  .arena-shell {
    border-radius: 13px;
    aspect-ratio: auto;
    min-height: var(--mobile-arena-height);
  }
  .arena-shell canvas {
    position: absolute;
    inset: 0;
  }
  .arena-column {
    scroll-margin-top: 12px;
  }
  .game-overlay {
    /* Content owns its height: no nested scroll and no cropped start/upgrade buttons.
       During play the canvas keeps a viewport-sized box and a uniform world transform. */
    position: relative;
    inset: auto;
    min-height: var(--mobile-arena-height);
    overflow: visible;
    padding: 15px;
    align-items: center;
  }
  .overlay-content {
    margin: auto;
  }
  .crystal-mark {
    display: none;
  }
  .game-overlay h2 {
    font-size: 24px;
    margin: 8px 0;
  }
  .game-overlay p:not(.eyebrow) {
    font-size: 12px;
  }
  .primary {
    margin: 12px 0 8px;
  }
  .overlay-content > small {
    margin-bottom: 7px;
  }
  .upgrade-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .upgrade-card {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: 0 8px;
    padding: 8px 12px;
  }
  .upgrade-card > span {
    grid-row: 1 / 4;
    align-self: center;
  }
  .upgrade-card strong {
    font-size: 16px;
    margin: 0;
  }
  .upgrade-card b {
    margin: 2px 0;
  }
  .crystal-hud {
    padding: 9px 12px;
  }
  .crystal-hud strong {
    font-size: 22px;
  }
  .hud-label {
    font-size: 8px;
  }
  .combo {
    font-size: 15px;
    margin-left: 8px;
  }
  .hearts {
    font-size: 18px;
  }
  .crystal-sidebar {
    grid-template-columns: 1fr 1fr;
  }
  .record-card {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
  }
  .record-card p:not(.eyebrow) {
    display: none;
  }
  .instruction-card ul {
    display: block;
  }
  .crystal-footer {
    flex-direction: column;
    gap: 7px;
  }
  .dash-button {
    flex: 1;
  }
  .arena-controls {
    margin-top: 10px;
  }
  .arena-controls button {
    min-height: 48px;
  }
  .pause-button kbd {
    display: none;
  }
  .dash-button span {
    margin-left: 12px;
  }
  .game-overlay .final-score {
    font-size: 42px;
  }
  .game-overlay .start-warning {
    font-size: 10px;
  }
}
</style>
