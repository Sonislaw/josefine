<template>
  <!-- Module navigation belongs in the shared shell; modules remain independent of the layout. -->
  <aside class="sidebar" aria-label="Główna nawigacja"><nav><RouterLink to="/">Dashboard</RouterLink><RouterLink to="/karawaning">Caravaning</RouterLink><RouterLink to="/praca">Praca</RouterLink><RouterLink to="/pieniadze">Pieniądze</RouterLink><RouterLink to="/czas">Czas</RouterLink><RouterLink to="/jednostki">Jednostki</RouterLink><RouterLink to="/dom">Dom</RouterLink><RouterLink to="/motoryzacja">Motoryzacja</RouterLink></nav></aside>
</template>
<style scoped>.sidebar { width: 200px; padding: 1.5rem 2rem; border-right: 1px solid #ddd; } nav { display: grid; gap: .75rem; } a { color: inherit; } .router-link-active { font-weight: 700; } @media (max-width: 700px) { .sidebar { width: auto; border-right: 0; border-bottom: 1px solid #ddd; padding: 1rem 1.25rem; } nav { display: flex; gap: 1rem; flex-wrap: wrap; } }</style>
