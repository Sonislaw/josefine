import type { MotoryzacjaToolId } from '../manifest'

interface ToolContent {
  intro: string
  how: string
  faqs: Array<{ question: string; answer: string }>
}

/** These explanations and answers are visible in the prerendered HTML of each tool. */
export const motoryzacjaSeoContent: Record<MotoryzacjaToolId, ToolContent> = {
  'spalanie-paliwa': {
    intro: 'Średnie spalanie mówi, ile litrów paliwa samochód zużył na 100 kilometrów. Najłatwiej je sprawdzić po tankowaniu: zanotuj liczbę dolanych litrów oraz dystans przejechany od poprzedniego pełnego tankowania.',
    how: 'Podziel ilość zużytego paliwa przez liczbę przejechanych kilometrów i pomnóż przez 100. Jeśli na 400 km zużyto 32 litry, średnie spalanie wynosi 8 l/100 km.',
    faqs: [
      { question: 'Jak policzyć spalanie w litrach na 100 km?', answer: 'Zużyte litry podziel przez dystans w kilometrach, a wynik pomnóż przez 100. Na przykład 32 l ÷ 400 km × 100 = 8 l/100 km.' },
      { question: 'Dlaczego spalanie z kalkulatora różni się od komputera pokładowego?', answer: 'Komputer pokładowy może korzystać z innych danych i zaokrągleń. Na wynik wpływają też warunki jazdy oraz dokładność pomiaru zatankowanego paliwa.' },
    ],
  },
  'koszt-przejazdu': {
    intro: 'Koszt przejazdu pomaga zaplanować budżet trasy jeszcze przed wyjazdem. Wystarczy dystans, typowe spalanie samochodu i cena litra paliwa. Kalkulator pokazuje koszt paliwa oraz liczbę litrów potrzebnych na przejazd.',
    how: 'Dystans w kilometrach podziel przez 100 i pomnóż przez spalanie w l/100 km. Otrzymaną liczbę litrów pomnóż przez cenę za litr. Wynik ma charakter szacunkowy, bo spalanie zmienia się podczas jazdy.',
    faqs: [
      { question: 'Ile paliwa potrzeba na 250 km przy spalaniu 7 l/100 km?', answer: 'Na takiej trasie samochód zużyje orientacyjnie 17,5 litra paliwa. Przy cenie 6,50 zł za litr koszt wyniesie około 113,75 zł.' },
      { question: 'Czy kalkulator uwzględnia autostrady i parkingi?', answer: 'Nie. Wynik obejmuje wyłącznie paliwo. Opłaty drogowe, parkingi i inne koszty podróży należy doliczyć osobno.' },
    ],
  },
  'zasieg-na-paliwie': {
    intro: 'Szacowany zasięg pozwala ocenić, ile kilometrów można przejechać na paliwie dostępnym w zbiorniku. To pomoc przy planowaniu tankowania, zwłaszcza przed dłuższą trasą.',
    how: 'Dostępną liczbę litrów podziel przez średnie spalanie w l/100 km, a następnie pomnóż przez 100. Przy 40 litrach i spalaniu 8 l/100 km wynik to około 500 km.',
    faqs: [
      { question: 'Jak obliczyć zasięg samochodu?', answer: 'Podziel ilość paliwa w litrach przez średnie spalanie w l/100 km i pomnóż przez 100. Otrzymasz orientacyjny dystans w kilometrach.' },
      { question: 'Czy mogę przejechać dokładnie tyle kilometrów, ile pokazuje wynik?', answer: 'Nie należy tego zakładać. Ruch, pogoda, obciążenie i styl jazdy zmieniają spalanie. Zaplanuj tankowanie z bezpieczną rezerwą.' },
    ],
  },
  'predkosc-srednia': {
    intro: 'Średnia prędkość opisuje relację przejechanego dystansu do czasu. Pomaga porównać różne trasy i zrozumieć, ile czasu faktycznie zajmuje podróż, nawet jeśli chwilowa prędkość bywa znacznie wyższa.',
    how: 'Dystans w kilometrach dzielimy przez czas podany w godzinach. Minuty przeliczamy na część godziny, dzieląc je przez 60. Dla 150 km przejechanych w 2 godziny i 30 minut średnia wynosi 60 km/h.',
    faqs: [
      { question: 'Jak obliczyć średnią prędkość w km/h?', answer: 'Podziel dystans w kilometrach przez czas w godzinach. Na przykład 150 km ÷ 2,5 godziny = 60 km/h.' },
      { question: 'Czy do czasu jazdy wliczać postoje?', answer: 'To zależy od celu. Z postojami otrzymasz średnią dla całej podróży, a bez nich średnią z samego czasu jazdy. Wpisz taki czas, jaki chcesz porównać.' },
    ],
  },
  'czas-podrozy': {
    intro: 'Kalkulator czasu podróży pozwala szybko oszacować czas przejazdu na podstawie długości trasy i przewidywanej średniej prędkości. Jest przydatny przy planowaniu wyjazdu i porównywaniu wariantów trasy.',
    how: 'Podziel dystans w kilometrach przez średnią prędkość w km/h. Wynik w godzinach przeliczamy na godziny i minuty. Dla 180 km przy średniej 60 km/h czas wynosi 3 godziny.',
    faqs: [
      { question: 'Jak obliczyć czas przejazdu?', answer: 'Podziel dystans przez średnią prędkość. Na przykład 120 km przy średniej 80 km/h zajmie około 1 godziny i 30 minut.' },
      { question: 'Czy wynik uwzględnia korki i postoje?', answer: 'Nie automatycznie. Wpisana średnia prędkość powinna odzwierciedlać warunki trasy. Dodatkowy czas na postoje dolicz osobno.' },
    ],
  },
}
