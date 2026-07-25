export function isSafeValidationPattern(pattern: string): boolean {
  if (!pattern || pattern.length > 160) return false;
  if (/\\[1-9]/.test(pattern)) return false;
  if (/\(\?(?:[=!]|<[=!])/.test(pattern)) return false;
  if (/\((?:[^()\\]|\\.)*[*+{](?:[^()\\]|\\.)*\)\s*[*+{]/.test(pattern)) {
    return false;
  }
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}
