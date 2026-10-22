const unsafePatterns = [/ignore (all )?(previous|prior) instructions/i, /reveal (the )?(system prompt|secret|api key)/i, /bypass (the )?(guardrail|safety)/i, /act as (an? )?(unrestricted|uncensored)/i]
/** Local demo screen only. Production should use a dedicated provider such as Lakera Guard. */
export function screenPrompt(question: string) {
  const blocked = unsafePatterns.some(pattern => pattern.test(question))
  return { passed: !blocked, labels: blocked ? ['prompt_injection'] : [] as string[] }
}
