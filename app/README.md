# Kartuli – Georgisches Alphabet lernen

PWA (React + Vite + TypeScript) im iOS-Look. Alle Daten bleiben lokal im Browser (localStorage).

## Starten

```bash
npm install
npm run dev -- --host    # im WLAN auch vom iPhone aus erreichbar
npm run build            # Produktions-Build nach dist/
```

**Aufs iPhone als App:** Den Ordner `dist/` auf einen HTTPS-Host legen (z. B. Netlify, Vercel, GitHub Pages),
in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Offline-Betrieb (Service Worker) funktioniert nur über HTTPS.

## Lernprinzipien im Code

| Prinzip | Wo |
|---|---|
| Bild-/Form-Eselsbrücken + eigene Eselsbrücken | `src/data/letters.ts`, Einführung in `Learn.tsx` |
| Abfragen statt Lesen (Testing-Effekt) | `Quiz.tsx` – direkt nach jeder Einführung |
| Spaced Repetition (FSRS) | `src/lib/store.ts` – Note wird aus Richtigkeit + Reaktionszeit abgeleitet |
| Ähnliche Buchstaben kontrastieren | `distractors()` in `src/lib/quiz.ts` – persönliche Verwechslungen zuerst |
| Wünschenswerte Erschwernis | gefestigte Karten werden getippt statt angeklickt |
| Handschrift | `TraceCanvas.tsx` |
| Kleine Gruppen, früh echte Wörter | 7 Gruppen à 3–5 Buchstaben, `src/data/words.ts` |
| Geläufigkeit | Schnellrunde, Reaktionszeit pro Buchstabe in „Fortschritt“ |

## Aussprache-Aufnahmen hinzufügen

Für jeden Buchstaben bzw. jedes Wort eine Datei `public/audio/<georgischer Text>.mp3` ablegen,
z. B. `public/audio/ა.mp3` oder `public/audio/წყალი.mp3`. Fehlt eine Datei, nutzt die App eine
georgische Systemstimme, falls das Gerät eine hat (auf iOS meist nicht).
