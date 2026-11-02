// Aussprache: zuerst eine eigene Aufnahme unter /audio/<datei>.mp3 (siehe README),
// sonst eine georgische Systemstimme, falls das Gerät eine hat.

let kaVoice: SpeechSynthesisVoice | undefined

function findVoice() {
  if (!('speechSynthesis' in window)) return
  kaVoice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ka'))
}
if ('speechSynthesis' in window) {
  findVoice()
  speechSynthesis.addEventListener?.('voiceschanged', findVoice)
}

const audioFile = (text: string) => `${import.meta.env.BASE_URL}audio/${encodeURIComponent(text)}.mp3`

export function speak(text: string) {
  const audio = new Audio(audioFile(text))
  audio.play().catch(() => {
    if (!kaVoice) return
    const u = new SpeechSynthesisUtterance(text)
    u.voice = kaVoice
    u.lang = kaVoice.lang
    u.rate = 0.8
    speechSynthesis.speak(u)
  })
}
