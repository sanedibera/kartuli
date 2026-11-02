# Kartuli – Georgisches Alphabet lernen

Native iOS-App (Expo / React Native) mit iOS-26-Liquid-Glass. Alle Daten bleiben lokal auf dem Gerät.

## Starten

```bash
npm install
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # sonst bricht CocoaPods mit einem Encoding-Fehler ab
npx expo run:ios                             # baut die App und startet sie im Simulator
```

Danach reicht für Änderungen am JavaScript `npx expo start` – der Simulator lädt sie sofort neu.

**Wichtig:** Das Projekt nicht in einem iCloud-synchronisierten Ordner (z. B. Dokumente) ablegen.
iCloud versieht dort gebaute Frameworks mit Zusatzattributen, und Xcode bricht dann beim Signieren ab.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/app/_layout.tsx` | Systemeigene Tab-Leiste (auf iOS 26 automatisch Liquid Glass) |
| `src/app/(learn)/` | Tab „Lernen“: Startseite und Übungsbildschirme |
| `src/app/progress/` | Tab „Fortschritt“ mit Liquid-Glass-Kacheln (`@callstack/liquid-glass`) |
| `src/components/ui.tsx` | Gruppierte Listen im Stil der Einstellungen-App, Systemfarben |
| `src/lib/letters.ts`, `words.ts` | Die 33 Buchstaben mit Eselsbrücken, Lesewörter |
| `src/lib/store.ts` | Spaced Repetition (FSRS), Statistik, Speicherung in AsyncStorage |
| `src/lib/quiz.ts` | Fragen und Ablenker (persönliche Verwechslungen zuerst) |

## Stand

- Fertig: Tab-Leiste, Startseite, Fortschritt
- Nächste Stufe: Buchstaben lernen, Wiederholen, Wörter lesen, Schnellrunde, Nachzeichnen
