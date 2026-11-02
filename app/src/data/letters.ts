// Die 33 Buchstaben des modernen Mchedruli.
// Reihenfolge der Gruppen: nach Häufigkeit und danach, wie früh sich echte Wörter bilden lassen
// (nicht nach der traditionellen ა-ბ-გ-Reihenfolge).
// Die Eselsbrücken sind Vorschläge – in der App kann man jederzeit eine eigene eintragen.

export type Letter = {
  id: string // Transliteration, eindeutig
  glyph: string
  translit: string
  ipa: string
  sound: string // Aussprachehilfe auf Deutsch
  mnemonic: string // Form-Eselsbrücke (Vorschlag)
  group: number
  lookalikes: string[] // Glyphen, die leicht verwechselt werden
}

export const LETTERS: Letter[] = [
  // Gruppe 1 – erste Wörter: მამა, სამი, ასი
  { id: 'a', glyph: 'ა', translit: 'a', ipa: 'ɑ', group: 1, sound: 'a wie in „Vater“', mnemonic: 'Klein und flach wie eine liegende Welle – entspannt „Aaah“ sagen.', lookalikes: ['ს', 'ე'] },
  { id: 'm', glyph: 'მ', translit: 'm', ipa: 'm', group: 1, sound: 'm wie in „Mama“', mnemonic: 'Eine runde Maus, deren Schwanz senkrecht nach oben steht.', lookalikes: ['შ', 'ძ', 'მ'] },
  { id: 's', glyph: 'ს', translit: 's', ipa: 's', group: 1, sound: 'stimmloses s wie in „Haus“', mnemonic: 'Eine Schlange, die sich links aufrichtet und rechts im Bogen liegt.', lookalikes: ['ხ', 'ა'] },
  { id: 'i', glyph: 'ი', translit: 'i', ipa: 'i', group: 1, sound: 'i wie in „Igel“', mnemonic: 'Ein rundes Iglu mit offenem Eingang unten links.', lookalikes: ['ო', 'ი', 'ტ'] },
  { id: 'e', glyph: 'ე', translit: 'e', ipa: 'ɛ', group: 1, sound: 'offenes e wie in „Bett“', mnemonic: 'Sieht aus wie ein Ohr – und im Ohr hallt ein „Echo“.', lookalikes: ['ჟ', 'უ'] },

  // Gruppe 2 – დედა, ორი, ლომი, დილა, არა
  { id: 'd', glyph: 'დ', translit: 'd', ipa: 'd', group: 2, sound: 'd wie in „Dach“', mnemonic: 'Ein Delfin, der einen großen Bogen springt und den Schwanz einrollt.', lookalikes: ['ღ', 'ლ', 'ო'] },
  { id: 'l', glyph: 'ლ', translit: 'l', ipa: 'l', group: 2, sound: 'l wie in „Lampe“', mnemonic: 'Drei Bögen und eine lange Linie nach unten – wie die erhobenen Arme im Emoticon ლ(ಠ益ಠლ): „Lass los!“', lookalikes: ['ღ', 'დ'] },
  { id: 'o', glyph: 'ო', translit: 'o', ipa: 'ɔ', group: 2, sound: 'offenes o wie in „Sonne“', mnemonic: 'Ein geschwungenes kleines „m“ – „Oh, ein m!“ (ist aber o).', lookalikes: ['ი', 'დ', 'თ'] },
  { id: 'n', glyph: 'ნ', translit: 'n', ipa: 'n', group: 2, sound: 'n wie in „Nase“', mnemonic: 'Sieht aus wie eine 6 – „Nummer sechs“.', lookalikes: ['ხ', 'ჩ'] },
  { id: 'r', glyph: 'რ', translit: 'r', ipa: 'r', group: 2, sound: 'gerolltes Zungenspitzen-r', mnemonic: 'Ein Regenschirmgriff: oben ein Bogen, rechts ein Haken.', lookalikes: ['ო', 'ჩ'] },

  // Gruppe 3 – ბაბუა, ათი, ერთი, მზე, რვა, მთა, მადლობა
  { id: 'b', glyph: 'ბ', translit: 'b', ipa: 'b', group: 3, sound: 'b wie in „Ball“', mnemonic: 'Ein Ballon: unten rund, oben eine geschwungene Schnur.', lookalikes: ['გ', 'ზ', 'ხ'] },
  { id: 'v', glyph: 'ვ', translit: 'v', ipa: 'v', group: 3, sound: 'w wie in „Wasser“', mnemonic: 'Sieht aus wie eine 3 – „Vorsicht, keine Drei!“', lookalikes: ['კ', 'პ', 'ჰ', 'ფ'] },
  { id: 'z', glyph: 'ზ', translit: 'z', ipa: 'z', group: 3, sound: 'stimmhaftes s wie in „Sonne“', mnemonic: 'Wie ბ, aber oben mit einer zusätzlichen Zacke – Z wie Zacke.', lookalikes: ['ბ', 'გ'] },
  { id: 't', glyph: 'თ', translit: 't', ipa: 'tʰ', group: 3, sound: 'behauchtes t wie in „Tag“', mnemonic: 'Zwei runde Hügel nebeneinander – zwei Tassen von oben.', lookalikes: ['ო', 'ლ'] },
  { id: 'u', glyph: 'უ', translit: 'u', ipa: 'u', group: 3, sound: 'u wie in „Uhr“', mnemonic: 'Ein U-Boot: Hügel oben, Schnörkel taucht nach unten ab.', lookalikes: ['ე', 'ჟ', 'ყ'] },

  // Gruppe 4 – კი, გული, კატა, ტბა, ქუდი, ტაქსი, ბანკი, პური
  { id: 'g', glyph: 'გ', translit: 'g', ipa: 'ɡ', group: 4, sound: 'g wie in „gut“', mnemonic: 'Wie ბ, aber es hängt unter die Linie – ein Gewicht zieht es nach unten.', lookalikes: ['ბ', 'ზ'] },
  { id: "k'", glyph: 'კ', translit: "k'", ipa: 'kʼ', group: 4, sound: 'gepresstes k ohne Hauch (ejektiv)', mnemonic: 'Wie ვ (die 3), aber unten mit langem Kick nach links – k mit Kick.', lookalikes: ['ვ', 'პ', 'ჰ'] },
  { id: "t'", glyph: 'ტ', translit: "t'", ipa: 'tʼ', group: 4, sound: 'gepresstes t ohne Hauch (ejektiv)', mnemonic: 'Ein runder Topf mit verschnörkeltem Deckelgriff.', lookalikes: ['ი', 'ჭ'] },
  { id: "p'", glyph: 'პ', translit: "p'", ipa: 'pʼ', group: 4, sound: 'gepresstes p ohne Hauch (ejektiv)', mnemonic: 'Eine 3 mit kleinem Pony oben links.', lookalikes: ['ვ', 'კ', 'ჰ'] },
  { id: 'k', glyph: 'ქ', translit: 'k', ipa: 'kʰ', group: 4, sound: 'behauchtes k wie in „Kuh“', mnemonic: 'Eine Kerze: senkrechter Strich mit kleiner Flamme-Schlinge links.', lookalikes: ['ჭ', 'ჟ'] },

  // Gruppe 5 – სახლი, ხუთი, შვიდი, ჩაი, ფული, ღვინო, ზღვა, კაფე
  { id: 'kh', glyph: 'ხ', translit: 'kh', ipa: 'x', group: 5, sound: 'ch wie in „Bach“', mnemonic: 'Sieht aus wie ein „b“ – sprich es wie in „B-ach“.', lookalikes: ['ს', 'ბ', 'ნ'] },
  { id: 'sh', glyph: 'შ', translit: 'sh', ipa: 'ʃ', group: 5, sound: 'sch wie in „Schule“', mnemonic: 'Wie მ, aber mit Schal: oben ein extra Haken.', lookalikes: ['მ', 'ძ'] },
  { id: 'ch', glyph: 'ჩ', translit: 'ch', ipa: 'tʃʰ', group: 5, sound: 'behauchtes tsch wie in „tschüss“', mnemonic: 'Sieht aus wie ein „h“ – oder ein Stuhl: engl. „chair“.', lookalikes: ['ნ', 'რ'] },
  { id: 'p', glyph: 'ფ', translit: 'p', ipa: 'pʰ', group: 5, sound: 'behauchtes p wie in „Post“', mnemonic: 'Stammt vom griechischen φ (Phi): eine 3 mit Brillen-Schlingen – p mit Hauch.', lookalikes: ['ვ', 'პ'] },
  { id: 'gh', glyph: 'ღ', translit: 'gh', ipa: 'ɣ', group: 5, sound: 'weiches Reibe-g, ähnlich dem Rachen-r in „Rabe“', mnemonic: 'Wird in Emojis als Herz benutzt: ღ – dem Herz entfährt ein sanftes „gh“.', lookalikes: ['ლ', 'დ'] },

  // Gruppe 6 – ყავა, ცა, წიგნი, წყალი, ძმა, ჭიქა, ხაჭაპური
  { id: "q'", glyph: 'ყ', translit: "q'", ipa: 'qʼ', group: 6, sound: 'gepresstes k ganz hinten im Rachen (ejektiv)', mnemonic: 'Sieht aus wie ein „y“ – aber klingt wie ein Klick tief im Hals.', lookalikes: ['უ', 'ჟ'] },
  { id: 'ts', glyph: 'ც', translit: 'ts', ipa: 'tsʰ', group: 6, sound: 'behauchtes z wie in „Zeit“', mnemonic: 'Ein C mit Zipfelmütze – Z wie Zipfel.', lookalikes: ['ც', 'წ'] },
  { id: 'dz', glyph: 'ძ', translit: 'dz', ipa: 'dz', group: 6, sound: 'stimmhaftes ds', mnemonic: 'Wie ein schreibschriftliches ∂ – d plus z.', lookalikes: ['მ', 'შ'] },
  { id: "ts'", glyph: 'წ', translit: "ts'", ipa: 'tsʼ', group: 6, sound: 'gepresstes z ohne Hauch (ejektiv)', mnemonic: 'Eine Eiswaffel mit Haken oben – „Zitroneneis!“ zischend gesagt.', lookalikes: ['ც', 'ნ'] },
  { id: "ch'", glyph: 'ჭ', translit: "ch'", ipa: 'tʃʼ', group: 6, sound: 'gepresstes tsch ohne Hauch (ejektiv)', mnemonic: 'Ein Haken mit Querstrich – ein kleiner Anker.', lookalikes: ['ქ', 'ჯ'] },

  // Gruppe 7 – ჯიბე, გამარჯობა, ჟურნალი, ჰაერი
  { id: 'j', glyph: 'ჯ', translit: 'j', ipa: 'dʒ', group: 7, sound: 'dsch wie in „Dschungel“', mnemonic: 'Ein schwungvolles X – zwei Lianen kreuzen sich im Dschungel.', lookalikes: ['ჭ', 'ჟ'] },
  { id: 'zh', glyph: 'ჟ', translit: 'zh', ipa: 'ʒ', group: 7, sound: 'weiches sch wie das j in „Journal“', mnemonic: 'Wie ein J mit Schnörkel oben – J wie Journal.', lookalikes: ['ქ', 'ყ', 'ე'] },
  { id: 'h', glyph: 'ჰ', translit: 'h', ipa: 'h', group: 7, sound: 'h wie in „Haus“', mnemonic: 'Eine 3 mit flachem Hut oben – H wie Hut.', lookalikes: ['ვ', 'კ', 'პ'] },
]

export const GROUPS = [...new Set(LETTERS.map(l => l.group))]

export const BY_GLYPH = new Map(LETTERS.map(l => [l.glyph, l]))
export const BY_ID = new Map(LETTERS.map(l => [l.id, l]))

/** Transliteration eines georgischen Wortes, z. B. წყალი → ts'q'ali */
export function transliterate(word: string): string {
  return [...word].map(c => BY_GLYPH.get(c)?.translit ?? c).join('')
}
