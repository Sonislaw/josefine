# Metodologia kalkulatorów Praca

Obsługiwany rok: **2026**. Kalkulator UoP liczy dwanaście kolejnych wypłat przy stałej pensji brutto; suma netto jest sumą tych wypłat, **nie kwotą z rocznego zeznania PIT**. Kalkulator B2B i porównanie B2B vs UoP pozostają szacunkiem pojedynczego miesiąca. Miesiąc dla B2B wybiera użytkownik. Kwota faktury B2B oznacza kwotę **bez VAT**. W tych dwóch widokach wynik „12 podobnych miesięcy” jest tylko mnożeniem scenariusza.

## Reguły i źródła

- Skala PIT 2026: próg 120 000 zł, stawki 12% i 32%, kwota zmniejszająca 3 600 zł: https://www.podatki.gov.pl/podatki-osobiste/pit/stawki-i-limity
- Limit ulgi dla młodych 85 528 zł w 2026 r.: https://www.podatki.gov.pl/ulgi-i-odliczenia/ulga-dla-mlodych-pit-dla-osob-do-26-lat
- Roczny limit podstawy składek emerytalno-rentowych 282 600 zł w 2026 r.: https://bip.zus.pl/pl/web/guest/baza-wiedzy/skladki-wskazniki-odsetki/wskazniki/roczna-podstawa-wymiaru-skladek-na-ubezpieczenia-emerytalne-i-rentowe-od-1999-r
- Wpłaty do PPK nie kończą się po przekroczeniu limitu podstawy składek: https://www.mojeppk.pl/aktualnosci/limit-30-krotnosci-nie-dotyczy-wplat-ppk-1123.html
- Miesięczne pomniejszenie zaliczki o 300 zł zakłada złożenie PIT-2 u jednego płatnika: https://www.podatki.gov.pl/poradniki-i-informatory/pit-2-pit-2a-pit-3-zasady-skladania-oswiadczen-o-stosowaniu-pomniejszenia-zaliczki-o-kwote-zmniejszajaca-podatek-112-124-lub-136
- Składki przedsiębiorcy 2026, wariant pełny i preferencyjny: https://bip.zus.pl/pl/web/guest/baza-wiedzy/skladki-wskazniki-odsetki/skladki/wysokosc-skladek-na-ubezpieczenia-spoleczne
- Minimalna zdrowotna na skali/liniowym: w styczniu 314,96 zł, od lutego 432,54 zł: https://www.zus.pl/pl/firmy/przedsiebiorco-przeczytaj-wazne/kalkulator-skladki-zdrowotnej
- Zdrowotna na ryczałcie 2026: https://www.zus.pl/en/-/informacja-w-sprawie-podstawy-wymiaru-skladki-oraz-kwoty-skladki-na-ubezpieczenie-zdrowotne-w-2026-r.
- Finansowanie składek pracownika i pracodawcy: https://www.zus.pl/pl/firmy/rozliczenia-z-zus/skladki-na-ubezpieczenia/spoleczne
- Podstawowe wpłaty PPK: https://www.mojeppk.pl/faq/pracownik/wplaty-do-ppk_czy-wysokosc-wplaty-podstawowej-pracodawcy-zalezy-od-wysokosci-wplaty-pracownika.html
- Opodatkowanie wpłaty pracodawcy do PPK: https://www.mojeppk.pl/faq/pracodawca/podatki-i-skladki-zus_czy-wplaty-finansowane-przez-pracodawce-stanowia-przychod-pracownika.html

## Zakres i znane uproszczenia

- Roczny UoP zakłada jeden etat u jednego pracodawcy przez 12 pełnych miesięcy, stałe brutto, standardową stopę wypadkową 1,67%, PIT-2 z pomniejszeniem zaliczki o 300 zł miesięcznie i brak innych przychodów. Śledzi narastająco podstawę opodatkowania dla progu 120 000 zł, wykorzystanie limitu ulgi dla młodych 85 528 zł i podstawę składek emerytalno-rentowych do 282 600 zł. Po tym limicie nadal liczy składkę chorobową i wpłaty PPK. Miesięczne zaliczki PIT są szacunkiem wypłat, a nie podatkiem należnym w zeznaniu rocznym.
- Zaznaczenie ulgi dla młodych oznacza, że pracownik ma do niej prawo **przez cały 2026 rok**. Nie obsługujemy daty 26. urodzin w trakcie roku ani wykorzystania wspólnego limitu u innych płatników. Składki społeczne przypisane do przychodu zwolnionego nie są odejmowane od opodatkowanej części. Wpłatę pracodawcy do PPK traktujemy jako przychód w tym samym miesiącu; rzeczywisty termin przekazania wpłaty może być inny. Nie rozliczamy premii, chorobowego, 50% KUP ani szczególnych zwolnień z funduszy.
- W porównaniu B2B vs UoP UoP nadal stanowi **modelowy pojedynczy miesiąc**. Jego opcja wieku zakłada niewyczerpany limit ulgi; wynik „12 podobnych miesięcy” nie korzysta jeszcze z rocznej symulacji UoP.
- B2B zakłada jeden pełny miesiąc działalności i podane przez użytkownika koszty. Dla zdrowotnej na ryczałcie przychód roczny **szacuje jako 12 × miesięczna faktura**, zamiast śledzić przychód narastająco. Na skali/liniowym nie przenosi dochodu z poprzedniego miesiąca do podstawy zdrowotnej. Nie uwzględnia odliczenia składki zdrowotnej od podatku/dochodu, rozliczenia rocznego zdrowotnej, ulg ani innych źródeł przychodu. Formularz oferuje tylko stawki ryczałtu 8,5%, 12%, 15% i 17%; wybrana stawka musi być właściwa dla działalności użytkownika.
- W B2B i porównaniu dla skali podatkowej wyliczamy orientacyjną miesięczną część rocznych progów i kwoty zmniejszającej. Nie jest to faktyczna zaliczka liczona narastająco. Przy kosztach większych od przychodu wynik środków po opłatach może być ujemny; nie ukrywamy straty jako zera.
- Składki zależne od kwoty zaokrąglamy do groszy, a szacowany PIT do pełnych złotych. Dane wejściowe muszą być skończonymi kwotami nieujemnymi, maksymalnie z dwoma miejscami po przecinku. Kalkulator nie zastępuje księgowej ani doradcy podatkowego.

Następny etap rozwoju może objąć analogiczny model roczny B2B oraz porównanie dwóch rocznych scenariuszy. Nie należy w tym celu mnożyć wyniku pojedynczego miesiąca przez dwanaście.
