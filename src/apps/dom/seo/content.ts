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
    intro: 'Kalkulator kosztu prądu pozwala oszacować wydatek dla jednego okresu pracy urządzenia albo regularnego używania. Zobacz koszt dnia, średniego miesiąca i roku bez zmiany podstawowego obliczenia.',
    how: 'Moc w watach dzielimy przez 1 000, aby otrzymać kilowaty. Podstawowy wynik mnoży tę wartość przez łączną liczbę godzin i cenę kWh. Prognoza regularnego używania uwzględnia dodatkowo godziny w dniu używania i liczbę takich dni w tygodniu. Średni miesiąc to 1/12 roku.',
    faqs: [
      { question: 'Ile kosztuje godzina pracy urządzenia 1000 W?', answer: 'Urządzenie 1000 W zużywa 1 kWh w ciągu godziny przy stałym poborze mocy. Koszt to cena 1 kWh wpisana do kalkulatora.' },
      { question: 'Czy wynik jest taki sam jak kwota na rachunku?', answer: 'Nie zawsze. Wynik zależy od podanej ceny kWh i nie dolicza automatycznie opłat stałych ani zmian poboru mocy urządzenia.' },
      { question: 'Jak policzyć roczny koszt regularnie używanego urządzenia?', answer: 'Podaj moc urządzenia, cenę kWh, godziny pracy w dniu używania i liczbę dni tygodniowo. Prognoza zakłada 365 dni w roku i stały pobór mocy, więc dla urządzeń z termostatem może różnić się od rzeczywistego zużycia.' },
    ],
  },
  'koszt-wody': {
    intro: 'Kalkulator kosztu wody pomaga oszacować cenę zużycia w metrach sześciennych. Jeśli masz dwa odczyty wodomierza, pomocnik obliczy różnicę i wstawi ją do podstawowego kalkulatora.',
    how: 'Zużycie to aktualny odczyt minus poprzedni. Otrzymaną liczbę metrów sześciennych pomnóż przez cenę za 1 m³; jeden metr sześcienny to 1 000 litrów. Jeśli chcesz uwzględnić ścieki, wpisz łączną cenę wody i odprowadzania ścieków z rachunku.',
    faqs: [
      { question: 'Ile litrów ma 1 m³ wody?', answer: 'Jeden metr sześcienny to dokładnie 1 000 litrów.' },
      { question: 'Czy kalkulator uwzględnia opłatę za ścieki?', answer: 'Tylko wtedy, gdy dodasz cenę ścieków do wpisanej ceny za 1 m³. Opłaty stałe nie są dodawane automatycznie.' },
      { question: 'Jak obliczyć zużycie wody z odczytów wodomierza?', answer: 'Od aktualnego odczytu odejmij poprzedni. Możesz wpisać oba wskazania do pomocnika pod kalkulatorem i przenieść wynik do pola zużycia jednym kliknięciem. Jeżeli licznik został wymieniony lub wyzerowany, sprawdź rozliczenie na rachunku.' },
    ],
  },
  'ilosc-farby': {
    intro: 'Możesz zacząć od znanej powierzchni albo od wymiarów prostokątnego pokoju. W drugim trybie kalkulator oblicza ściany, odejmuje wpisane drzwi i okna oraz opcjonalnie dodaje sufit. W obu trybach wynik zależy od liczby warstw i wydajności wybranej farby.',
    how: 'Dla pokoju mnożymy obwód podłogi przez wysokość. Od powierzchni ścian odejmujemy łączną powierzchnię drzwi i okien; sufit, jeśli go zaznaczysz, liczymy jako długość razy szerokość. Otrzymaną powierzchnię mnożymy przez liczbę warstw i dzielimy przez wydajność farby w m²/l. Pokazujemy też wariant z 10% zapasem. Tryb „Znam powierzchnię” zachowuje dotychczasowy sposób obliczenia.',
    faqs: [
      { question: 'Ile farby potrzeba na 40 m² przy dwóch warstwach?', answer: 'Przy wydajności 10 m²/l potrzeba około 8 litrów farby. Z 10% zapasem byłoby to 8,8 litra.' },
      { question: 'Jak policzyć powierzchnię ścian pokoju do malowania?', answer: 'Dodaj długość i szerokość pokoju, pomnóż przez dwa, a następnie przez wysokość. Od wyniku odejmij łączną powierzchnię drzwi i okien. Sufit dodaj osobno, jeżeli zamierzasz malować go tą samą farbą i liczbą warstw.' },
      { question: 'Czy kalkulator farby uwzględnia okna, drzwi i sufit?', answer: 'W trybie „Mam wymiary pokoju” możesz wpisać sumę powierzchni drzwi i okien oraz zaznaczyć malowanie sufitu. Kalkulator nie zakłada domyślnych wymiarów otworów, więc podaj własne pomiary.' },
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
    intro: 'Panele sprzedawane są w paczkach, a każda paczka pokrywa określoną powierzchnię. Kalkulator pomaga oszacować liczbę pełnych opakowań potrzebnych do wykończenia podłogi. Opcjonalny plan zakupu pokaże też nadwyżkę materiału, cenę paneli i liczbę opakowań osobnego podkładu.',
    how: 'Powierzchnię podłogi powiększamy o wybrany zapas na docinki, dzielimy przez wydajność jednej paczki i zaokrąglamy w górę. Nadwyżka to zakupiony metraż minus metraż już powiększony o zapas. Podkład liczymy oddzielnie z rzeczywistej powierzchni podłogi i wydajności jego opakowania. Koszt jest wyświetlany tylko dla podanych cen; suma pojawia się dopiero po wpisaniu wszystkich potrzebnych cen.',
    faqs: [
      { question: 'Ile paczek paneli na 25 m²?', answer: 'Jeśli jedna paczka pokrywa 2,2 m², a zapas wynosi 10%, potrzeba 13 pełnych paczek.' },
      { question: 'Gdzie znaleźć wydajność paczki paneli?', answer: 'Powierzchnia w m² na paczkę jest zwykle podana na opakowaniu lub karcie produktu. Wpisz ją w kalkulatorze.' },
      { question: 'Jak oszacować koszt paneli?', answer: 'Podaj cenę jednej paczki. Kalkulator pomnoży ją przez liczbę pełnych paczek potrzebnych po uwzględnieniu zapasu na docinki. Cena montażu i transportu nie jest doliczana.' },
      { question: 'Czy zawsze trzeba kupować osobny podkład?', answer: 'Nie. Niektóre panele mają podkład zintegrowany. Sprawdź opis wybranego produktu i zalecenia producenta; osobny podkład zaznacz w kalkulatorze tylko wtedy, gdy jest potrzebny.' },
    ],
  },
}
