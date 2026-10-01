import type { JednostkiToolId } from '../manifest'

interface ToolContent {
  intro: string
  how: string
  faqs: Array<{ question: string; answer: string }>
}

/** Visible explanations are also rendered into each route's static HTML. */
export const jednostkiSeoContent: Record<JednostkiToolId, ToolContent> = {
  'centymetry-cale': {
    intro: 'Centymetry i cale opisują tę samą długość, ale należą do różnych systemów miar. Przelicznik przydaje się przy odczytywaniu wymiarów ekranów, mebli, ubrań i części technicznych.',
    how: 'Jeden cal ma dokładnie 2,54 centymetra. Aby otrzymać centymetry, pomnóż liczbę cali przez 2,54. W odwrotną stronę podziel liczbę centymetrów przez 2,54.',
    faqs: [
      { question: 'Ile centymetrów ma jeden cal?', answer: 'Jeden cal to dokładnie 2,54 cm. Jest to stały współczynnik, dlatego przeliczenie działa równie dobrze w obie strony.' },
      { question: 'Jak przeliczyć centymetry na cale?', answer: 'Podziel liczbę centymetrów przez 2,54. Na przykład 10 cm to około 3,94 cala.' },
    ],
  },
  'kilometry-mile': {
    intro: 'Mile są używane do określania odległości między innymi w Stanach Zjednoczonych i Wielkiej Brytanii. Ten kalkulator pomaga odczytać dystans na mapie, oznakowaniu dróg i w planie podróży.',
    how: 'Jedna mila międzynarodowa ma dokładnie 1,609344 kilometra. Pomnóż mile przez ten współczynnik, aby uzyskać kilometry; kilometry podziel przez niego, aby otrzymać mile.',
    faqs: [
      { question: 'Ile kilometrów ma mila?', answer: 'Jedna mila międzynarodowa to 1,609344 km, czyli w przybliżeniu 1,61 km.' },
      { question: 'Czy przelicznik dotyczy mil morskich?', answer: 'Nie. Narzędzie używa mili międzynarodowej. Mila morska ma 1,852 km i jest inną jednostką.' },
    ],
  },
  'kilogramy-funty': {
    intro: 'Kilogramy i funty służą do opisywania masy. Przeliczenie jest przydatne przy zakupach zagranicznych, odczytywaniu etykiet, sprzętu sportowego i limitów bagażu.',
    how: 'Jeden funt międzynarodowy to dokładnie 0,45359237 kg. Aby przeliczyć funty na kilogramy, pomnóż przez ten współczynnik; w odwrotną stronę podziel przez niego.',
    faqs: [
      { question: 'Ile funtów ma jeden kilogram?', answer: 'Jeden kilogram to około 2,20462 funta. Wynik jest zaokrąglany jedynie na potrzeby czytelnego wyświetlenia.' },
      { question: 'Czy lb oznacza funt?', answer: 'Tak. Skrót lb oznacza funt (pound) jako jednostkę masy.' },
    ],
  },
  'litry-galony': {
    intro: 'Galony występują w kilku odmianach. Ten przelicznik korzysta z galona płynnego USA, spotykanego między innymi przy podawaniu pojemności i zużycia paliwa w Stanach Zjednoczonych.',
    how: 'Jeden galon płynny USA ma dokładnie 3,785411784 litra. Pomnóż liczbę galonów US przez tę wartość lub podziel litry przez nią.',
    faqs: [
      { question: 'Ile litrów ma galon amerykański?', answer: 'Jeden galon płynny USA to dokładnie 3,785411784 litra.' },
      { question: 'Czy galon brytyjski jest taki sam?', answer: 'Nie. Galon imperialny ma około 4,54609 litra. Ten kalkulator przelicza wyłącznie galony płynne USA.' },
    ],
  },
  'celsjusz-fahrenheit': {
    intro: 'Skale Celsjusza i Fahrenheita podają temperaturę w innych punktach odniesienia. Przelicznik pomaga odczytać prognozę pogody, temperaturę piekarnika lub dane techniczne urządzenia.',
    how: 'Aby przeliczyć °C na °F, pomnóż przez 9/5 i dodaj 32. Aby otrzymać °C ze stopni Fahrenheita, odejmij 32 i pomnóż przez 5/9. Kalkulator obsługuje także temperatury ujemne.',
    faqs: [
      { question: 'Ile stopni Fahrenheita to 0°C?', answer: 'Zero stopni Celsjusza to 32°F. To temperatura zamarzania wody przy typowym ciśnieniu atmosferycznym.' },
      { question: 'Czy 100°C to 212°F?', answer: 'Tak. Ze wzoru (100 × 9/5) + 32 otrzymujemy 212°F.' },
    ],
  },
  'metry-kwadratowe-ary-hektary': {
    intro: 'Powierzchnię mieszkań zwykle podaje się w metrach kwadratowych, a większych działek w arach lub hektarach. Wszystkie trzy jednostki można tu przeliczać w dowolnym kierunku.',
    how: 'Jeden ar to 100 m², a jeden hektar to 10 000 m², czyli 100 arów. Kalkulator sprowadza wybraną wartość do metrów kwadratowych i zamienia ją na jednostkę docelową.',
    faqs: [
      { question: 'Ile metrów kwadratowych ma ar?', answer: 'Jeden ar ma 100 m². Działka o powierzchni 10 arów ma więc 1 000 m².' },
      { question: 'Ile arów ma hektar?', answer: 'Jeden hektar to 100 arów lub 10 000 m².' },
    ],
  },
  'metry-szescienne-litry': {
    intro: 'Metry sześcienne często pojawiają się na rachunkach za wodę, a litry przy mniejszych pojemnościach. Przelicznik ułatwia porównanie zużycia i pojemności zbiorników.',
    how: 'Jeden metr sześcienny to dokładnie 1 000 litrów. Pomnóż m³ przez 1 000, aby otrzymać litry, lub podziel litry przez 1 000, aby uzyskać m³.',
    faqs: [
      { question: 'Ile litrów ma metr sześcienny?', answer: 'Jeden m³ ma dokładnie 1 000 litrów.' },
      { question: 'Ile m³ to 500 litrów?', answer: '500 litrów to 0,5 m³, ponieważ 500 dzielimy przez 1 000.' },
    ],
  },
}
