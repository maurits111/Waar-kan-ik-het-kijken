# Waar kan ik het kijken? — projectnotities voor Claude

Website waarop bezoekers een film of serie opzoeken en zien op welke Nederlandse streamingdiensten die staat. Live op https://www.waarkanikhetkijken.com. Next.js 16 (App Router), TypeScript, Tailwind v4, gehost op Vercel.

## Over de gebruiker

- De gebruiker is beginner met programmeren en schrijft in het Nederlands. Antwoord altijd in het Nederlands, in eenvoudige taal.
- Leg kort uit wat je verandert en waarom. Doe één ding tegelijk.
- Werkt op Windows met PowerShell in VS Code.

## Regels (belangrijk)

- Push nooit naar GitHub tenzij de gebruiker het expliciet vraagt. Een push naar `main` zet de live site direct aan, want Vercel bouwt automatisch.
- Draai `npm run build` voordat je iets pusht en meld of het slaagt.
- Open `.env.local` niet en zet nooit API-keys in de code, in commits of in antwoorden.
- Wijzig geen bestanden buiten wat nodig is voor de opdracht. Vraag eerst bij grotere wijzigingen.
- Voeg geen code toe die extra Watchmode- of Streaming Availability-calls veroorzaakt zonder het eerst te vragen (zie quota hieronder).

## Gegevensbronnen en quota

- TMDb: zoeken, posters, details, aanbevelingen, populaire titels en logo's. Gratis.
- Watchmode (gratis plan: 2.500 calls per maand, quota reset op de 26e): hoofdbron voor streamingdiensten, met directe links. Een titel kost 2 calls (zoeken op TMDb-id en dan de diensten ophalen).
- Streaming Availability (Movie of the Night, gratis plan: 1.000 verzoeken per maand): tweede bron, alleen als Watchmode faalt. Bronvermelding met link naar https://www.movieofthenight.com/about/api is verplicht en staat op de titelpagina.
- TMDb watch-providers (data van JustWatch): laatste terugval en voor bots. JustWatch moet genoemd worden. Geen directe links naar de diensten.
- Volgorde in `getTitleData` (`lib/streaming.ts`): Watchmode, dan Streaming Availability, dan TMDb. Herkenbare bots (op user-agent) krijgen alleen TMDb, zodat zij geen quota verbruiken.
- Landfilter in `getTitleData`: alleen bezoekers uit NL en BE (header `x-vercel-ip-country`) gebruiken Watchmode en Streaming Availability. Andere landen krijgen, net als bots, alleen TMDb. Zonder header (bijv. lokaal) is het toegestaan.
- `app/robots.ts` weert SEO-crawlers (SemrushBot, AhrefsBot, MJ12bot, DotBot) helemaal, en houdt alle andere bots weg van `/api/` en `/watchlist`.
- De zoekroute `app/api/search/route.ts` gebruikt Streaming Availability, de bot-herkenning en het landfilter nog niet.
- Caching via `next: { revalidate }`: TMDb 24 uur, Watchmode en Streaming Availability 30 dagen. Houd dit zo.
- Als bronnen falen, toont de site "onbekend" met een melding, niet "niet gevonden".

## Structuur

- `app/page.tsx`: startpagina met zoekbalk, suggesties (vanaf 3 letters, 300 ms vertraging, via `/api/search?mode=suggest`, alleen TMDb), filters, populaire titels, recent gezocht en watchlist (localStorage).
- `app/titel/[slug]/page.tsx`: titelpagina (`/titel/movie-123` of `tv-123`, met TMDb-id), met SEO-metadata en structured data. De links naar vergelijkbare titels hebben bewust `rel="nofollow"` en `prefetch={false}`, tegen quotaverbruik door crawlers.
- `lib/streaming.ts`: `getTitleData` haalt alles voor een titelpagina op, met de bronvolgorde en bot-herkenning.
- `lib/platforms.ts`: `MAJOR_PLATFORMS` en `findPlatform` voor het koppelen van dienstnamen.
- `app/api/search/route.ts`: zoek-API.
- Ook aanwezig: `app/api/trending`, `app/watchlist`, `app/robots.ts` en `app/layout.tsx` (metadata, Google Search Console-verificatie, Vercel Analytics). Lees die bestanden zelf voordat je ze wijzigt.

## Instellingen

- `next.config.ts` heeft `images.unoptimized: true`. Dat is bewust: de Vercel-limiet voor beeldoptimalisatie was overschreden. Plaatjes laden rechtstreeks van image.tmdb.org. Zet dit niet terug.
- Omgevingsvariabelen (in Vercel en `.env.local`): `WATCHMODE_API_KEY`, `TMDB_API_KEY`, `STREAMING_AVAILABILITY_API_KEY`.

## Git en Vercel

- Het Git-project staat in de binnenste map `waar-kan-ik-het-kijken` (waar `package.json` staat), niet in de buitenste.
- Een push naar `main` start een nieuwe deployment. Controleer in Vercel dat die op Ready staat.
- Vercel-previews hebben de key van Streaming Availability niet (alleen Production).

## Commando's

- `npm run dev`, `npm run build`, `npm run lint`.
- De dev-server draait vaak al in een andere terminal op poort 3000. Start geen tweede.
