const stopWords = new Set(['a','an','and','are','about','did','do','does','for','how','i','in','is','it','me','my','of','on','the','to','was','what','with','would','you','your'])

/** Lightweight demo NLP: normalize, tokenize, remove stop words, and add a few domain aliases. */
export function normalizeQuery(input: string): { normalized: string; terms: string[]; intent: string } {
  const normalized = input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim()
  const aliases: Record<string,string> = { return: 'performance', returns: 'performance', gain: 'performance', gained: 'performance', outperform: 'performance', underperform: 'performance', concentration: 'risk', exposure: 'risk', risky: 'risk', qtr: 'quarter', q4: 'quarter' }
  const tokens = normalized.split(' ').filter(Boolean).map((term) => aliases[term] ?? term)
  const terms = [...new Set(tokens.filter((term) => !stopWords.has(term) && term.length > 1))]
  const intent = terms.some(t => ['risk','concentration','exposure'].includes(t)) ? 'risk'
    : terms.some(t => ['performance','quarter','contribution','benchmark'].includes(t)) ? 'performance' : 'general'
  return { normalized, terms, intent }
}
