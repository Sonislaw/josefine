import type { DomToolId } from '../manifest'

interface ToolContent {
  intro: string
  how: string
  faqs: Array<{ question: string; answer: string }>
}

/** Practical explanations stay next to Dom calculators and render into static page HTML. */
export const domSeoContent: Record<DomToolId, ToolContent> = {
  'powierzchnia-prostokata': {
    intro: 'Powierzchnia prostokąta mówi, ile miejsca zajmuje podłoga, ściana lub działka o prostokątnym kształcie. To podstawowy wynik potrzebny przed zakupem farby, paneli czy innych materiałów wykończeniowych.',
    how: 'Zmierz długość i szerokość w tych samych jednostkach, najlepiej w metrach. Pomnóż obie wartości. Dla pomieszczenia o wymiarach 5 × 4 m wynik to 20 m².',
    faqs: [
      { question: 'Jak obliczyć metry kwadratowe pokoju?', answer: 'Pomnóż długość pokoju w metrach przez jego szerokość w metrach. Jeśli pokój nie jest prostokątny, podziel go na prostsze części i dodaj ich powierzchnie.' },
      { question: 'Czy mogę wpisać wymiar z przecinkiem?', answer: 'Tak. Możesz wpisać na przykład 3,5 m lub 3.5 m. Oba zapisy są akceptowane.' },
    ],
  },
  'obwod-prostokata': {
    intro: 'Obwód prostokąta to suma długości jego czterech boków. W domu przydaje się przy planowaniu listew przypodłogowych, obrzeży, taśm dekoracyjnych czy ogrodzenia prostokątnego fragmentu terenu.',
    how: 'Dodaj długość i szerokość, a następnie pomnóż wynik przez dwa. Kalkulator zakłada, że przeciwległe boki prostokąta mają taką samą długość.',
    faqs: [
      { question: 'Jaki jest wzór na obwód prostokąta?', answer: 'Obwód = 2 × (długość + szerokość). Dla boków 5 m i 4 m obwód wynosi 18 m.' },
      { question: 'Czy obwód to powierzchnia?', answer: 'Nie. Obwód określa długość granicy i podaje się go w metrach, a powierzchnię podaje się w metrach kwadratowych.' },
    ],
  },
  'objetosc-pomieszczenia': {
    intro: 'Objętość, czyli kubatura pomieszczenia, informuje, ile przestrzeni mieści się w jego wnętrzu. Warto ją znać przy doborze wentylacji, ogrzewania lub osuszacza.',
    how: 'Pomnóż długość, szerokość i wysokość podane w metrach. Wynik w metrach sześciennych pokazujemy dodatkowo w litrach. Obliczenie dotyczy pomieszczenia o kształcie prostopadłościanu.',
    faqs: [
      { question: 'Jak obliczyć kubaturę pokoju?', answer: 'Pomnóż długość pokoju przez szerokość i wysokość. Pokój 5 × 4 × 2,5 m ma kubaturę 50 m³.' },
      { question: 'Czy skosy i wnęki są uwzględniane?', answer: 'Nie. Aby oszacować kubaturę pokoju ze skosami, podziel go na prostsze bryły i dodaj ich objętości.' },
    ],
  },
  'koszt-pradu': {
    intro: 'Kalkulator kosztu prądu pozwala oszacować, ile kosztuje używanie konkretnego urządzenia przez wybrany czas. Przydaje się przy porównywaniu sprzętów i planowaniu domowych wydatków.',
    how: 'Moc w watach dzielimy przez 1 000, aby otrzymać kilowaty. Następnie mnożymy przez liczbę godzin pracy i cenę za 1 kWh. Użyj łącznego czasu pracy, który chcesz policzyć.',
    faqs: [
      { question: 'Ile kosztuje godzina pracy urządzenia 1000 W?', answer: 'Urządzenie 1000 W zużywa 1 kWh w ciągu godziny przy stałym poborze mocy. Koszt to cena 1 kWh wpisana do kalkulatora.' },
      { question: 'Czy wynik jest taki sam jak kwota na rachunku?', answer: 'Nie zawsze. Wynik zależy od podanej ceny kWh i nie dolicza automatycznie opłat stałych ani zmian poboru mocy urządzenia.' },
    ],
  },
  'koszt-wody': {
    intro: 'Kalkulator kosztu wody pomaga szybko oszacować cenę zużycia widocznego na wodomierzu. Ilość wody podawana jest zwykle w metrach sześciennych, a jeden metr sześcienny to 1 000 litrów.',
    how: 'Pomnóż liczbę zużytych metrów sześciennych przez cenę za 1 m³. Jeśli chcesz uwzględnić również ścieki, wpisz sumę obu cen jednostkowych z rachunku.',
    faqs: [
      { question: 'Ile litrów ma 1 m³ wody?', answer: 'Jeden metr sześcienny to dokładnie 1 000 litrów.' },
      { question: 'Czy kalkulator uwzględnia opłatę za ścieki?', answer: 'Tylko wtedy, gdy dodasz cenę ścieków do wpisanej ceny za 1 m³. Opłaty stałe nie są dodawane automatycznie.' },
    ],
  },
  'ilosc-farby': {
    intro: 'Przed malowaniem warto policzyć, ile farby potrzeba na całą powierzchnię. Kalkulator uwzględnia liczbę warstw oraz wydajność podaną przez producenta w metrach kwadratowych na litr.',
    how: 'Pomnóż malowaną powierzchnię przez liczbę warstw, a następnie podziel przez wydajność farby. Obok podstawowego wyniku pokazujemy także wariant z 10% zapasem.',
    faqs: [
      { question: 'Ile farby potrzeba na 40 m² przy dwóch warstwach?', answer: 'Przy wydajności 10 m²/l potrzeba około 8 litrów farby. Z 10% zapasem byłoby to 8,8 litra.' },
      { question: 'Czy wydajność farby zawsze jest taka sama?', answer: 'Nie. Zależy od produktu, chłonności podłoża, koloru i sposobu malowania. Wpisz wartość z etykiety wybranej farby.' },
    ],
  },
  'liczba-plytek': {
    intro: 'Kalkulator płytek szacuje liczbę pojedynczych sztuk potrzebnych na podłogę lub ścianę. Wpisz powierzchnię do ułożenia, wymiary jednej płytki i zapas na docinki.',
    how: 'Powierzchnię płytki w cm² przeliczamy na m². Następnie powierzchnię do ułożenia powiększamy o zadany zapas, dzielimy przez powierzchnię jednej płytki i zaokrąglamy w górę do pełnej sztuki.',
    faqs: [
      { question: 'Ile płytek 60 × 60 cm na 12 m²?', answer: 'Bez zapasu potrzeba co najmniej 34 płytek. Przy 10% zapasie kalkulator wskaże 37 sztuk.' },
      { question: 'Jaki zapas płytek przyjąć?', answer: 'Zapas zależy od układu, liczby docinek i kształtu pomieszczenia. W kalkulatorze możesz wpisać własny procent; domyślnie to 10%.' },
    ],
  },
  'liczba-paczek-paneli': {
    intro: 'Panele sprzedawane są w paczkach, a każda paczka pokrywa określoną powierzchnię. Kalkulator pomaga oszacować liczbę pełnych opakowań potrzebnych do wykończenia podłogi.',
    how: 'Powierzchnię podłogi powiększamy o wybrany zapas na docinki, a następnie dzielimy przez wydajność jednej paczki. Wynik zaokrąglamy w górę do całej paczki.',
    faqs: [
      { question: 'Ile paczek paneli na 25 m²?', answer: 'Jeśli jedna paczka pokrywa 2,2 m², a zapas wynosi 10%, potrzeba 13 pełnych paczek.' },
      { question: 'Gdzie znaleźć wydajność paczki paneli?', answer: 'Powierzchnia w m² na paczkę jest zwykle podana na opakowaniu lub karcie produktu. Wpisz ją w kalkulatorze.' },
    ],
  },
}
