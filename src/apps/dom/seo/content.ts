import type { DomToolId } from '../manifest'

interface ToolContent {
  intro: string
  how: string
  faqs: Array<{ question: string; answer: string }>
}

/** Practical explanations stay next to Dom calculators and render into static page HTML. */
export const domSeoContent: Record<DomToolId, ToolContent> = {
  'powierzchnia-prostokata': {
    intro:
      'Powierzchnia prostokąta mówi, ile miejsca zajmuje podłoga lub ściana. Prosty tryb liczy długość razy szerokość. Jeśli pokój ma wnękę, kształt litery L lub miejsce zajęte przez komin, możesz dodać i odjąć kilka prostokątnych fragmentów, a łączny metraż przenieść do kalkulatora paneli albo płytek.',
    how: 'W prostym trybie pomnóż długość przez szerokość. W trybie wielu fragmentów zmierz każdą część osobno: dodaj powierzchnie zajmowane przez pokój i odejmij powierzchnie przeszkód. Na przykład 5 × 4 m oraz wnęka 1,5 × 1 m, po odjęciu komina 1 × 0,5 m, dają łącznie 21 m². Fragmenty nie powinny nakładać się na siebie. Sama suma pól nie wystarcza do obliczenia obwodu ani liczby listew przypodłogowych.',
    faqs: [
      {
        question: 'Jak obliczyć metry kwadratowe pokoju?',
        answer:
          'Pomnóż długość pokoju w metrach przez jego szerokość w metrach. Jeśli pokój nie jest prostokątny, podziel go na prostsze części i dodaj ich powierzchnie.',
      },
      {
        question: 'Czy mogę wpisać wymiar z przecinkiem?',
        answer: 'Tak. Możesz wpisać na przykład 3,5 m lub 3.5 m. Oba zapisy są akceptowane.',
      },
      {
        question: 'Jak policzyć powierzchnię pokoju w kształcie litery L?',
        answer:
          'Podziel podłogę na dwa nienakładające się prostokąty, wpisz długość i szerokość każdego jako dodawany fragment, a kalkulator zsumuje ich powierzchnie.',
      },
      {
        question: 'Jak odjąć komin lub zabudowę?',
        answer:
          'Dodaj powierzchnię całego prostokątnego obszaru, a potem dodaj fragment oznaczony jako odejmowany. Jego powierzchnia zostanie odjęta od sumy.',
      },
      {
        question: 'Czy z łącznej powierzchni obliczę liczbę listew?',
        answer:
          'Nie. Dwa pokoje o takiej samej powierzchni mogą mieć różny obwód. Aby policzyć listwy, zmierz rzeczywiste odcinki ścian.',
      },
    ],
  },
  'obwod-prostokata': {
    intro:
      'Obwód prostokąta to suma długości jego czterech boków. W domu przydaje się przy planowaniu listew przypodłogowych, obrzeży, taśm dekoracyjnych czy ogrodzenia prostokątnego fragmentu terenu. Dodatkowy plan zakupu pomaga oszacować liczbę listew i ich koszt.',
    how: 'Dodaj długość i szerokość, a następnie pomnóż wynik przez dwa. W planie listew odejmij łączną szerokość miejsc bez listew, dolicz wybrany zapas i podziel otrzymaną długość przez długość jednej listwy. Liczbę sztuk zaokrąglamy w górę. To szacunek łącznej długości, a nie plan cięcia odcinków na poszczególnych ścianach.',
    faqs: [
      {
        question: 'Jaki jest wzór na obwód prostokąta?',
        answer: 'Obwód = 2 × (długość + szerokość). Dla boków 5 m i 4 m obwód wynosi 18 m.',
      },
      {
        question: 'Czy obwód to powierzchnia?',
        answer:
          'Nie. Obwód określa długość granicy i podaje się go w metrach, a powierzchnię podaje się w metrach kwadratowych.',
      },
      {
        question: 'Jak oszacować liczbę listew przypodłogowych?',
        answer:
          'Od obwodu odejmij łączną szerokość drzwi i innych miejsc bez listew, dolicz zapas na docinki, a wynik podziel przez długość jednej listwy i zaokrąglij w górę do pełnej sztuki.',
      },
      {
        question: 'Czy kalkulator uwzględnia docinki na każdej ścianie?',
        answer:
          'Nie. Plan korzysta z sumy długości i wybranego zapasu. Przy narożnikach i krótkich odcinkach część resztek może być nieprzydatna, dlatego sprawdź rzeczywisty układ pokoju przed zakupem.',
      },
    ],
  },
  'objetosc-pomieszczenia': {
    intro:
      'Objętość, czyli kubatura pomieszczenia, informuje, ile przestrzeni mieści się w jego wnętrzu. Możesz policzyć jeden pokój albo dodać kilka pomieszczeń i zobaczyć kubaturę całego mieszkania. Wymiary pokoi zapisanych w Moim remoncie da się skopiować do planu bez ponownego mierzenia.',
    how: 'Dla każdego prostokątnego pomieszczenia mnożymy długość, szerokość i wysokość podane w metrach. W trybie jednego pokoju pokazujemy wynik w m³ i litrach. W trybie wielu pokoi wyświetlamy wynik każdego pomieszczenia oraz ich sumę. Pomiar ze skosami wymaga osobnego podziału na prostsze bryły; sama kubatura nie wystarcza do doboru wentylacji lub ogrzewania.',
    faqs: [
      {
        question: 'Jak obliczyć kubaturę pokoju?',
        answer:
          'Pomnóż długość pokoju przez szerokość i wysokość. Pokój 5 × 4 × 2,5 m ma kubaturę 50 m³.',
      },
      {
        question: 'Czy skosy i wnęki są uwzględniane?',
        answer:
          'Nie. Aby oszacować kubaturę pokoju ze skosami, podziel go na prostsze bryły i dodaj ich objętości.',
      },
      {
        question: 'Jak obliczyć kubaturę kilku pomieszczeń?',
        answer:
          'Wybierz „Kilka pomieszczeń”, dodaj pokoje i wpisz długość, szerokość oraz wysokość każdego z nich. Kalkulator pokaże osobne wyniki i ich sumę. Możesz też skopiować wymiary z pokoi zapisanych w Moim remoncie; udostępniony link zawiera ich nazwy i wymiary, ale nie wymaga dostępu do Twoich lokalnych danych.',
      },
    ],
  },
  'koszt-pradu': {
    intro:
      'Kalkulator kosztu prądu pozwala oszacować wydatek dla jednego okresu pracy urządzenia, regularnego używania albo porównać dwa urządzenia. Dla porównania wpisujesz moce A i B, wspólny czas używania oraz cenę kWh. Zobaczysz koszt dnia, średniego miesiąca, roku i różnicę bez zmiany podstawowego obliczenia.',
    how: 'Moc w watach dzielimy przez 1 000, aby otrzymać kilowaty. Podstawowy wynik mnoży tę wartość przez łączną liczbę godzin i cenę kWh. Prognoza i porównanie uwzględniają godziny w dniu używania oraz liczbę takich dni w tygodniu. Przyjmujemy 365 dni w roku, a średni miesiąc to 1/12 roku. Oba porównywane urządzenia mają ten sam harmonogram i stawkę; różnica kosztów nie mówi nic o ich wydajności ani o rzeczywistym poborze mocy przy termostacie.',
    faqs: [
      {
        question: 'Ile kosztuje godzina pracy urządzenia 1000 W?',
        answer:
          'Urządzenie 1000 W zużywa 1 kWh w ciągu godziny przy stałym poborze mocy. Koszt to cena 1 kWh wpisana do kalkulatora.',
      },
      {
        question: 'Czy wynik jest taki sam jak kwota na rachunku?',
        answer:
          'Nie zawsze. Wynik zależy od podanej ceny kWh i nie dolicza automatycznie opłat stałych ani zmian poboru mocy urządzenia.',
      },
      {
        question: 'Jak policzyć roczny koszt regularnie używanego urządzenia?',
        answer:
          'Podaj moc urządzenia, cenę kWh, godziny pracy w dniu używania i liczbę dni tygodniowo. Prognoza zakłada 365 dni w roku i stały pobór mocy, więc dla urządzeń z termostatem może różnić się od rzeczywistego zużycia.',
      },
      {
        question: 'Jak porównać koszt używania dwóch urządzeń?',
        answer:
          'Otwórz panel porównania, wpisz moc urządzenia A i B oraz wspólną cenę energii i czas pracy. Wynik pokaże oba koszty oraz różnicę dla dnia używania, średniego miesiąca i roku. To porównanie rachunku za energię przy przyjętych danych, a nie ocena skuteczności urządzeń.',
      },
    ],
  },
  'koszt-wody': {
    intro:
      'Kalkulator kosztu wody pomaga oszacować cenę zużycia w metrach sześciennych. Możesz podać jedną łączną stawkę za m³ albo osobne ceny wody i odprowadzania ścieków. Jeśli masz dwa odczyty wodomierza, pomocnik obliczy różnicę i wstawi ją do wybranego wariantu kalkulatora.',
    how: 'Zużycie to aktualny odczyt minus poprzedni; jeden metr sześcienny to 1 000 litrów. Przy jednej stawce mnożymy zużycie przez wpisaną cenę za m³. W trybie „Woda + ścieki” mnożymy to samo zużycie przez każdą z dwóch stawek, zaokrąglamy obie pozycje do groszy i sumujemy. Kalkulator nie dolicza opłat stałych ani nie uwzględnia sytuacji, w których ilość ścieków jest rozliczana inaczej niż pobór wody.',
    faqs: [
      {
        question: 'Ile litrów ma 1 m³ wody?',
        answer: 'Jeden metr sześcienny to dokładnie 1 000 litrów.',
      },
      {
        question: 'Czy kalkulator uwzględnia opłatę za ścieki?',
        answer:
          'Tak, jeśli wybierzesz tryb „Woda + ścieki” i wpiszesz obie stawki albo uwzględnisz ścieki we wspólnej cenie za m³. W obu wariantach opłaty stałe nie są doliczane automatycznie.',
      },
      {
        question: 'Jak policzyć osobno koszt wody i ścieków?',
        answer:
          'Wybierz „Woda + ścieki”, podaj zużycie w m³ i wpisz ceny obu pozycji z rachunku. Kalkulator pokaże koszt wody, koszt ścieków i sumę. Zakłada przy tym, że dla obu pozycji rozliczono tę samą liczbę metrów sześciennych.',
      },
      {
        question: 'Jak obliczyć zużycie wody z odczytów wodomierza?',
        answer:
          'Od aktualnego odczytu odejmij poprzedni. Możesz wpisać oba wskazania do pomocnika pod kalkulatorem i przenieść wynik do pola zużycia jednym kliknięciem. Jeżeli licznik został wymieniony lub wyzerowany, sprawdź rozliczenie na rachunku.',
      },
    ],
  },
  'ilosc-farby': {
    intro:
      'Możesz zacząć od znanej powierzchni albo od wymiarów prostokątnego pokoju. W drugim trybie kalkulator oblicza ściany, odejmuje wpisane drzwi i okna oraz opcjonalnie dodaje sufit. Jeśli jedną ścianę malujesz inaczej, rozdzieli powierzchnię, litry i plan zakupu na dwa kolory.',
    how: 'Dla pokoju mnożymy obwód podłogi przez wysokość i odejmujemy łączną powierzchnię drzwi i okien. W wariancie dwóch kolorów wybierasz jedną ścianę oraz wskazujesz, jaka część już podanych otworów znajduje się właśnie na niej. Jej powierzchnię netto odejmujemy od całej powierzchni do malowania; reszta, wraz z ewentualnym sufitem, przypada na kolor główny. Dla każdego koloru osobno uwzględniamy liczbę warstw, wydajność farby i 10% zapasu. Plan zakupu zaokrągla puszki każdego produktu osobno. Tryb „Znam powierzchnię” i podstawowe obliczenie pokoju działają jak dotąd.',
    faqs: [
      {
        question: 'Ile farby potrzeba na 40 m² przy dwóch warstwach?',
        answer:
          'Przy wydajności 10 m²/l potrzeba około 8 litrów farby. Z 10% zapasem byłoby to 8,8 litra.',
      },
      {
        question: 'Jak policzyć powierzchnię ścian pokoju do malowania?',
        answer:
          'Dodaj długość i szerokość pokoju, pomnóż przez dwa, a następnie przez wysokość. Od wyniku odejmij łączną powierzchnię drzwi i okien. Sufit dodaj osobno, jeżeli zamierzasz malować go tą samą farbą i liczbą warstw.',
      },
      {
        question: 'Czy kalkulator farby uwzględnia okna, drzwi i sufit?',
        answer:
          'W trybie „Mam wymiary pokoju” możesz wpisać sumę powierzchni drzwi i okien oraz zaznaczyć malowanie sufitu. Kalkulator nie zakłada domyślnych wymiarów otworów, więc podaj własne pomiary.',
      },
      {
        question: 'Jak policzyć farbę na ścianę akcentową w innym kolorze?',
        answer:
          'W trybie „Mam wymiary pokoju” włącz jedną ścianę w innym kolorze i wybierz ścianę o długości lub szerokości pokoju. Jeżeli są na niej okna lub drzwi, podaj ich powierzchnię jako część sumy wpisanej dla całego pokoju. Ustaw warstwy i wydajność drugiej farby — zobaczysz osobne litry i puszki dla obu kolorów.',
      },
      {
        question: 'Czy wydajność farby zawsze jest taka sama?',
        answer:
          'Nie. Zależy od produktu, chłonności podłoża, koloru i sposobu malowania. Wpisz wartość z etykiety wybranej farby.',
      },
      {
        question: 'Jak obliczyć, ile puszek farby kupić?',
        answer:
          'Podziel potrzebne litry wraz z 10% zapasem przez pojemność jednej puszki i zaokrąglij wynik w górę do pełnego opakowania. Przykładowo 7,6 l przy puszkach 5 l oznacza zakup 2 puszek, czyli 10 l farby i około 2,4 l nadwyżki.',
      },
    ],
  },
  'liczba-plytek': {
    intro:
      'Kalkulator płytek szacuje liczbę pojedynczych sztuk potrzebnych na podłogę lub ścianę. Wpisz powierzchnię do ułożenia, wymiary jednej płytki i zapas na docinki. Dla prostokątnej podłogi możesz włączyć orientacyjny podgląd układu od narożnika i zobaczyć docinki przy ścianach. Jeśli produkt jest sprzedawany w pełnych kartonach, opcjonalny plan zakupu przeliczy wynik na opakowania.',
    how: 'Powierzchnię płytki w cm² przeliczamy na m². Następnie powierzchnię do ułożenia powiększamy o zadany zapas, dzielimy przez powierzchnię jednej płytki i zaokrąglamy w górę do pełnej sztuki. W trybie kartonów dzielimy tę liczbę sztuk przez liczbę płytek w opakowaniu i ponownie zaokrąglamy w górę. Koszt to liczba kartonów pomnożona przez cenę jednego kartonu, jeśli ją podasz.',
    faqs: [
      {
        question: 'Ile płytek 60 × 60 cm na 12 m²?',
        answer:
          'Bez zapasu potrzeba co najmniej 34 płytek. Przy 10% zapasie kalkulator wskaże 37 sztuk.',
      },
      {
        question: 'Jaki zapas płytek przyjąć?',
        answer:
          'Zapas zależy od układu, liczby docinek i kształtu pomieszczenia. W kalkulatorze możesz wpisać własny procent; domyślnie to 10%.',
      },
      {
        question: 'Czy podgląd układu wylicza dokładnie liczbę płytek do kupienia?',
        answer:
          'Nie. Rysunek pokazuje prostą siatkę od narożnika i miejsca docinek na prostokątnej podłodze. Nie uwzględnia fug, skosów ani wykorzystania odciętych fragmentów. Zakup obliczaj z wyniku kalkulatora i wybranego zapasu.',
      },
      {
        question: 'Ile kartonów kupić, jeśli potrzeba 37 płytek?',
        answer:
          'Jeśli karton zawiera 4 płytki, potrzeba 10 pełnych kartonów. Kupisz wtedy 40 sztuk, czyli 3 ponad obliczoną liczbę uwzględniającą zapas.',
      },
      {
        question: 'Czy muszę kupować pełne kartony płytek?',
        answer:
          'To zależy od produktu i sklepu. Niektóre płytki są sprzedawane na sztuki, inne tylko w opakowaniach. Sprawdź warunki sprzedaży wybranego modelu; tryb kartonów włącz tylko wtedy, gdy go potrzebujesz.',
      },
      {
        question: 'Jak kalkulator liczy koszt płytek?',
        answer:
          'Wpisz cenę jednego kartonu. Kalkulator pomnoży ją przez liczbę pełnych kartonów. Nie dolicza kleju, fug, dostawy ani montażu.',
      },
    ],
  },
  'liczba-paczek-paneli': {
    intro:
      'Panele sprzedawane są w paczkach, a każda paczka pokrywa określoną powierzchnię. Kalkulator pomaga oszacować liczbę pełnych opakowań potrzebnych do wykończenia podłogi. Opcjonalny plan zakupu pokaże też nadwyżkę materiału, cenę paneli i liczbę opakowań osobnego podkładu.',
    how: 'Powierzchnię podłogi powiększamy o wybrany zapas na docinki, dzielimy przez wydajność jednej paczki i zaokrąglamy w górę. Nadwyżka to zakupiony metraż minus metraż już powiększony o zapas. Podkład liczymy oddzielnie z rzeczywistej powierzchni podłogi i wydajności jego opakowania. Koszt jest wyświetlany tylko dla podanych cen; suma pojawia się dopiero po wpisaniu wszystkich potrzebnych cen.',
    faqs: [
      {
        question: 'Ile paczek paneli na 25 m²?',
        answer:
          'Jeśli jedna paczka pokrywa 2,2 m², a zapas wynosi 10%, potrzeba 13 pełnych paczek.',
      },
      {
        question: 'Gdzie znaleźć wydajność paczki paneli?',
        answer:
          'Powierzchnia w m² na paczkę jest zwykle podana na opakowaniu lub karcie produktu. Wpisz ją w kalkulatorze.',
      },
      {
        question: 'Jak oszacować koszt paneli?',
        answer:
          'Podaj cenę jednej paczki. Kalkulator pomnoży ją przez liczbę pełnych paczek potrzebnych po uwzględnieniu zapasu na docinki. Cena montażu i transportu nie jest doliczana.',
      },
      {
        question: 'Czy zawsze trzeba kupować osobny podkład?',
        answer:
          'Nie. Niektóre panele mają podkład zintegrowany. Sprawdź opis wybranego produktu i zalecenia producenta; osobny podkład zaznacz w kalkulatorze tylko wtedy, gdy jest potrzebny.',
      },
    ],
  },
  'liczba-rolek-tapety': {
    intro:
      'Kalkulator rolek tapety pozwala zaplanować zakup na cały prostokątny pokój albo na jedną wybraną ścianę, na przykład akcentową. Uwzględnia szerokość i długość rolki, wysokość ściany, zapas na przycięcie każdego pasa, prosty raport wzoru oraz dodatkowy zapas. Zapisany pokój z Mojego remontu może uzupełnić wymiary pokoju lub wysokość pojedynczej ściany.',
    how: 'W trybie całego pokoju liczymy pełne pionowe pasy osobno na każdej z czterech ścian. W trybie jednej ściany bierzemy tylko jej szerokość i wysokość. Do wysokości pasa dodajemy centymetry na przycięcie; przy prostym dopasowaniu wzoru zaokrąglamy długość cięcia w górę do pełnego raportu. Z długości rolki wyznaczamy liczbę pełnych pasów, a liczbę potrzebnych pasów — po doliczeniu wybranego zapasu — dzielimy przez tę wydajność i zaokrąglamy do pełnych rolek. Nie odejmujemy automatycznie okien i drzwi: krótsze kawałki nie zawsze nadają się do wykorzystania gdzie indziej.',
    faqs: [
      {
        question: 'Jak obliczyć liczbę rolek tapety do pokoju?',
        answer:
          'Policz pionowe pasy potrzebne na każdej ścianie, dodaj zapas, a następnie sprawdź, ile pełnych pasów da się wyciąć z jednej rolki. Wynik dzielenia zaokrąglij w górę do całej rolki. Samo podzielenie powierzchni ścian przez powierzchnię rolki może zaniżyć wynik.',
      },
      {
        question: 'Jak policzyć tapetę tylko na jedną ścianę?',
        answer:
          'Wybierz tryb „Jedna ściana” i podaj szerokość oraz wysokość ściany, którą chcesz okleić. Kalkulator policzy pasy tylko dla tej powierzchni, a następnie uwzględni przycięcie, raport wzoru i wybrany zapas. Wymiary pozostałych ścian nie wpływają na wynik.',
      },
      {
        question: 'Co oznacza raport wzoru na tapecie?',
        answer:
          'Raport to odległość, po której wzór się powtarza. Przy prostym dopasowaniu długość ciętego pasa trzeba zaokrąglić do kolejnego pełnego raportu. Wpisz 0 cm dla tapety bez wzoru wymagającego dopasowania.',
      },
      {
        question: 'Czy kalkulator obsługuje wzór z przesunięciem?',
        answer:
          'Nie. Obliczenie zakłada proste dopasowanie wzoru. Tapeta z przesunięciem, np. pół raportu, może wymagać dodatkowych rolek. Sprawdź symbol dopasowania na etykiecie i plan układania pasów.',
      },
      {
        question: 'Dlaczego nie odejmujecie powierzchni okien i drzwi?',
        answer:
          'Pasy przy otworach często trzeba ciąć zgodnie z przebiegiem wzoru, a pozostały fragment nie zawsze da się wykorzystać w innym miejscu. Pomijanie całej powierzchni otworów może dać zbyt małą liczbę rolek; wynik traktuj jako ostrożny szacunek.',
      },
      {
        question: 'Czy cena obejmuje klej i montaż?',
        answer:
          'Nie. Szacowany koszt to liczba pełnych rolek pomnożona przez cenę jednej rolki. Klej, grunt, narzędzia, dostawa i praca fachowca nie są doliczane.',
      },
    ],
  },
}
