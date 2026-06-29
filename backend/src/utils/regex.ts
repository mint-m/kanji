// Escapes special regex characters to prevent ReDoS attacks
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
