import { useSyncExternalStore } from 'react'
import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs'
import { LETTERS } from '../data/letters'

// Zwei Karten pro Buchstabe:
//  rec  = Buchstabe sehen → Laut nennen (Erkennen)
//  prod = Laut hören/lesen → Buchstabe finden (Abrufen)
export type Direction = 'rec' | 'prod'
export const cardKey = (letterId: string, dir: Direction) => `${letterId}|${dir}`
export const parseKey = (key: string) => {
  const [letterId, dir] = key.split('|') as [string, Direction]
  return { letterId, dir }
}

export type LetterStats = { seen: number; correct: number; rtAvg: number }

export type AppState = {
  version: 1
  learnedGroups: number[]
  cards: Record<string, Card>
  stats: Record<string, LetterStats>
  confusions: Record<string, number> // "ziel>gewählt" (Glyphen)
  mnemonics: Record<string, string> // eigene Eselsbrücken
  speedBest: number
  streak: { last: string; days: number }
}

const KEY = 'kartuli-state-v1'

const initial = (): AppState => ({
  version: 1,
  learnedGroups: [],
  cards: {},
  stats: {},
  confusions: {},
  mnemonics: {},
  speedBest: 0,
  streak: { last: '', days: 0 },
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial()
    const parsed = JSON.parse(raw) as AppState
    for (const c of Object.values(parsed.cards)) {
      c.due = new Date(c.due)
      if (c.last_review) c.last_review = new Date(c.last_review)
    }
    return { ...initial(), ...parsed }
  } catch {
    return initial()
  }
}

let state = load()
const listeners = new Set<() => void>()

function setState(next: AppState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Speicher voll oder gesperrt – App läuft trotzdem weiter
  }
  listeners.forEach(l => l())
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export const getState = () => state

// --- Spaced Repetition ---------------------------------------------------

const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: true })

/** Note aus Richtigkeit und Reaktionszeit ableiten – niemand muss sich selbst bewerten. */
export function gradeFrom(correct: boolean, rtMs: number, typed: boolean): Grade {
  if (!correct) return Rating.Again
  if (rtMs > 5000) return Rating.Hard
  if (typed && rtMs < 2500) return Rating.Easy
  return Rating.Good
}

const today = () => new Date().toISOString().slice(0, 10)

function bumpStreak(s: AppState['streak']): AppState['streak'] {
  const t = today()
  if (s.last === t) return s
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  return { last: t, days: s.last === yesterday ? s.days + 1 : 1 }
}

export type Answer = {
  letterId: string
  dir: Direction
  correct: boolean
  rtMs: number
  typed: boolean
  targetGlyph: string
  chosenGlyph?: string // bei Verwechslung
  schedule: boolean // false = nur Statistik (z. B. Schnellrunde)
}

export function recordAnswer(a: Answer) {
  const s = getState()
  const key = cardKey(a.letterId, a.dir)
  const cards = { ...s.cards }
  if (a.schedule) {
    const card = cards[key] ?? createEmptyCard(new Date())
    cards[key] = scheduler.next(card, new Date(), gradeFrom(a.correct, a.rtMs, a.typed)).card
  }
  const prev = s.stats[a.letterId] ?? { seen: 0, correct: 0, rtAvg: 0 }
  const stats = {
    ...s.stats,
    [a.letterId]: {
      seen: prev.seen + 1,
      correct: prev.correct + (a.correct ? 1 : 0),
      // gleitender Mittelwert, nur richtige Antworten zählen für die Geläufigkeit
      rtAvg: a.correct ? (prev.rtAvg ? prev.rtAvg * 0.7 + a.rtMs * 0.3 : a.rtMs) : prev.rtAvg,
    },
  }
  const confusions = { ...s.confusions }
  if (!a.correct && a.chosenGlyph && a.chosenGlyph !== a.targetGlyph) {
    const k = `${a.targetGlyph}>${a.chosenGlyph}`
    confusions[k] = (confusions[k] ?? 0) + 1
  }
  setState({ ...s, cards, stats, confusions, streak: bumpStreak(s.streak) })
}

export function markGroupLearned(group: number) {
  const s = getState()
  if (s.learnedGroups.includes(group)) return
  setState({ ...s, learnedGroups: [...s.learnedGroups, group].sort((a, b) => a - b) })
}

export function setMnemonic(letterId: string, text: string) {
  const s = getState()
  const mnemonics = { ...s.mnemonics }
  if (text.trim()) mnemonics[letterId] = text
  else delete mnemonics[letterId]
  setState({ ...s, mnemonics })
}

export function setSpeedBest(score: number) {
  const s = getState()
  if (score > s.speedBest) setState({ ...s, speedBest: score })
}

export function resetAll() {
  setState(initial())
}

// --- Abgeleitete Werte -----------------------------------------------------

export function learnedLetters(s: AppState) {
  return LETTERS.filter(l => s.learnedGroups.includes(l.group))
}

export function dueKeys(s: AppState, now = new Date()) {
  return Object.entries(s.cards)
    .filter(([, c]) => c.due <= now)
    .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
    .map(([k]) => k)
}

export type Mastery = 'neu' | 'lernend' | 'gefestigt' | 'sicher'

/** Wie gut sitzt ein Buchstabe? Maßgeblich ist die schwächere der beiden Karten. */
export function mastery(s: AppState, letterId: string): Mastery {
  const cs = (['rec', 'prod'] as const).map(d => s.cards[cardKey(letterId, d)])
  if (cs.some(c => !c)) return 'neu'
  const minStab = Math.min(...cs.map(c => c!.stability))
  if (cs.some(c => c!.state !== State.Review)) return 'lernend'
  return minStab >= 14 ? 'sicher' : 'gefestigt'
}

export function nextGroup(s: AppState): number | undefined {
  const groups = [...new Set(LETTERS.map(l => l.group))]
  return groups.find(g => !s.learnedGroups.includes(g))
}
