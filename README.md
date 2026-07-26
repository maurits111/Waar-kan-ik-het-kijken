# Waar kan ik het kijken?

Zoek een titel, kies je land, zie direct op welke streamingdiensten het beschikbaar is.

## Lokaal draaien

1. Zorg dat Node.js is geinstalleerd (nodejs.org, LTS-versie).
2. Installeer de dependencies:
   ```
   npm install
   ```
3. Vraag een gratis API key aan bij Watchmode (api.watchmode.com) - geen creditcard nodig.
4. Kopieer `.env.example` naar `.env.local` en vul je key in:
   ```
   cp .env.example .env.local
   ```
5. Start de site lokaal:
   ```
   npm run dev
   ```
6. Open `http://localhost:3000` in je browser.

## Online zetten (Vercel)

1. Zet dit project in een eigen GitHub-repository.
2. Ga naar vercel.com, log in met GitHub, en importeer de repository.
3. Vercel herkent automatisch dat het een Next.js-project is.
4. Voordat je op "Deploy" klikt: ga naar Settings -> Environment Variables
   en voeg `WATCHMODE_API_KEY` toe met je eigen key als waarde.
5. Klik op Deploy. Je krijgt een live `.vercel.app`-adres.

## Belangrijk: dekking van Nederlandse diensten

Watchmode dekt vooral grote internationale platforms (Netflix, Disney+,
Prime Video). Videoland is wisselend gedekt, NPO Start meestal niet.
Test dit zelf met een paar bekende Nederlandse titels voordat je de
site deelt, zodat je weet welke gaten er zijn en dit eventueel duidelijk
communiceert op de site zelf (bijv. "we tonen internationale diensten,
niet NPO Start").

## Volgende stappen die je zelf kunt uitbreiden

- Caching toevoegen zodat dezelfde zoekopdracht niet elke keer de API
  belast (bijv. met Vercel KV).
- Autocomplete tijdens het typen (via de TMDb-zoek-API).
- Een eigen domeinnaam koppelen in de Vercel-instellingen.
