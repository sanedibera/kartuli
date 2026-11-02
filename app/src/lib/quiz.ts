import { State } from 'ts-fsrs'
import { BY_GLYPH, BY_ID, type Letter } from '../data/letters'
import { cardKey, type AppState, type Direction } from './store'

export type Question = {
  letter: Letter
  dir: Direction
  mode: 'choice' | 'type'
  options: Letter[] // bei 'choice'
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Ablenker auswählen: zuerst Buchstaben, die der Lernende selbst schon verwechselt hat,
 * dann bekannte Doppelgänger, dann zufällige aus dem gelernten Pool.
 * Ähnliche Formen nebeneinander zu sehen schärft die Unterscheidung.
 */
export function distractors(s: AppState, target: Letter, pool: Letter[], n = 3): Letter[] {
  const inPool = new Set(pool.map(l => l.id))
  const picked: Letter[] = []
  const add = (l?: Letter) => {
    if (l && l.id !== target.id && inPool.has(l.id) && !picked.includes(l) && picked.length < n) picked.push(l)
  }
  const personal = Object.entries(s.confusions)
    .filter(([k]) => k.startsWith(target.glyph + '>') || k.endsWith('>' + target.glyph))
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k.split('>').find(g => g !== target.glyph))
  shuffle(personal.slice(0, 2)).forEach(g => add(BY_GLYPH.get(g!)))
  shuffle(target.lookalikes).forEach(g => Math.random() < 0.7 && add(BY_GLYPH.get(g)))
  shuffle(pool).forEach(add)
  return picked
}

/** Gefestigte Karten werden getippt statt angeklickt – Abrufen ist schwerer, aber nachhaltiger. */
export function makeQuestion(s: AppState, letterId: string, dir: Direction, pool: Letter[]): Question {
  const letter = BY_ID.get(letterId)!
  const card = s.cards[cardKey(letterId, dir)]
  const mode = dir === 'rec' && card?.state === State.Review && card.stability >= 3 ? 'type' : 'choice'
  return { letter, dir, mode, options: shuffle([letter, ...distractors(s, letter, pool)]) }
}

/** Eingabe vergleichen: Groß/klein egal, alle Apostroph-Varianten (iOS setzt ’) erlaubt. */
export function matchesTranslit(input: string, letter: Letter) {
  const norm = (x: string) => x.trim().toLowerCase().replace(/[’‘`´ʼ]/g, "'")
  return norm(input) === norm(letter.translit)
}
