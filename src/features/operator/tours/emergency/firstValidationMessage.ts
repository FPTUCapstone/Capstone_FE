/** The Backend's 400 title is a generic English sentence; the field errors hold the real message. */
export function firstValidationMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0];
  }
  return undefined;
}
