self.addEventListener('message', (event) => {
  const text = event.data || ''
  // Esempio placeholder del "motore" di traduzione: qui sostituirai con l'engine reale.
  // Per demo, la "traduzione" sarà la stringa invertita.
  const translated = text.split('').reverse().join('')
  self.postMessage(translated)
})
