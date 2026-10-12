<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { games } from '../manifest'
import { gryPath } from '../seo/useGrySeo'
</script>
<template>
  <div class="game-cards">
    <RouterLink v-for="game in games" :key="game.id" :to="gryPath(`/${game.id}`)" class="game-card"
      ><div class="card-art" aria-hidden="true">
        <img :src="game.cover" alt="" class="game-cover" width="300" height="260" />
        <span class="art-badge">{{ game.symbol }} TWÓJ RUCH</span>
      </div>
      <div class="card-copy">
        <div class="card-labels">
          <span>{{ game.category }}</span
          ><span>{{ game.players }}</span>
        </div>
        <h2>{{ game.title }}</h2>
        <p>{{ game.description }}</p>
        <div class="card-play"><strong>Zagraj teraz</strong><span>↗</span></div>
      </div></RouterLink
    >
  </div>
</template>
<style scoped>
.game-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr));
  gap: 24px;
}
.game-card {
  max-width: 640px;
  color: #e9ecde;
  border: 1px solid #3d4a38;
  border-radius: 20px;
  overflow: hidden;
  background: #16211f;
  text-decoration: none;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
.game-card:hover {
  transform: translateY(-4px);
  border-color: #d5ef89;
}
.card-art {
  height: 250px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(ellipse at 60% 55%, #4e6340, #1e3029 65%);
}
.game-cover {
  width: 300px;
  max-width: 100%;
  height: 260px;
  object-fit: contain;
}
.art-badge {
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: #d5ef89;
  color: #26362e;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.card-copy {
  padding: 28px;
}
.card-labels {
  display: flex;
  gap: 9px;
}
.card-labels span {
  color: #c6d3bd;
  border: 1px solid #3d4a38;
  border-radius: 30px;
  padding: 3px 10px;
  font-size: 10px;
}
.card-copy h2 {
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.2;
  margin: 18px 0 12px;
}
.card-copy p {
  font-size: 14px;
  line-height: 1.7;
  color: #a4b0a5;
}
.card-play {
  margin-top: 25px;
  border-top: 1px solid #2b3731;
  padding-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d5ef89;
  font-size: 14px;
}
.card-play > span {
  font-size: 25px;
}
@media (prefers-reduced-motion: reduce) {
  .game-card {
    transition: none;
  }
}
</style>
