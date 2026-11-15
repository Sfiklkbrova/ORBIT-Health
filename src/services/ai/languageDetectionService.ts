// Intelligent Language Detection Service for ORBIT AI (az, tr, en)

import { AppLanguage } from '../../i18n';

/**
 * Detects whether an astronaut query is in Azerbaijani, Turkish, or English.
 * Prioritizes distinct morphological and orthographic markers.
 */
export function detectQueryLanguage(query: string, currentAppLanguage: AppLanguage = 'en'): AppLanguage {
  const q = query.toLowerCase().trim();

  // 1. Explicit language directive checks
  if (
    q.includes('azərbaycan dilində') ||
    q.includes('azerbaycanca') ||
    q.includes('azərbaycanca') ||
    q.includes('in azerbaijani') ||
    q.includes('azerice')
  ) {
    return 'az';
  }

  if (
    q.includes('türkcə') ||
    q.includes('türkçe') ||
    q.includes('in turkish') ||
    q.includes('türkce')
  ) {
    return 'tr';
  }

  if (
    q.includes('in english') ||
    q.includes('ingiliscə') ||
    q.includes('ingilizce') ||
    q.includes('english please')
  ) {
    return 'en';
  }

  // 2. Distinctive Azerbaijani character and vocabulary detection
  // 'ə' is uniquely Azerbaijani in this triplet
  if (q.includes('ə')) {
    return 'az';
  }

  const azKeywords = [
    'mənim', 'necə', 'haqqında', 'yuxum', 'ürək', 'dərəcəsi', 'kəsiri', 'bərpa',
    'dəyişib', 'hansı', 'hesabla', 'müqayisə', 'vəziyyətim', 'təzyiq', 'sağlamlığım',
    'sual', 'izləməliyəm', 'nəticə', 'tövsiyə', 'tədqiqat', 'əməliyyat', 'təhlil'
  ];

  let azMatches = 0;
  for (const kw of azKeywords) {
    if (q.includes(kw)) azMatches += 1;
  }

  // 3. Distinctive Turkish vocabulary detection
  const trKeywords = [
    'benim', 'nasıl', 'hakkında', 'uykum', 'kalp', 'atış', 'borcu', 'toparlanma',
    'değişti', 'hangi', 'hesapla', 'karşılaştır', 'durumum', 'tansiyon', 'sağlığım',
    'izlemeliyim', 'öneri', 'araştırma', 'açıkla', 'nabız', 'eğilim', 'özetle'
  ];

  let trMatches = 0;
  for (const kw of trKeywords) {
    if (q.includes(kw)) trMatches += 1;
  }

  if (azMatches > trMatches && azMatches >= 1) {
    return 'az';
  }

  if (trMatches > azMatches && trMatches >= 1) {
    return 'tr';
  }

  // If query is very short or ambiguous, prefer active UI language if az or tr
  if (currentAppLanguage === 'az' && (azMatches > 0 || q.includes('x') || q.includes('q'))) {
    return 'az';
  }

  if (currentAppLanguage === 'tr' && trMatches > 0) {
    return 'tr';
  }

  // 4. Default to English or current active app language if not distinctly AZ/TR
  const enKeywords = [
    'calculate', 'average', 'change', 'sleep', 'heart', 'rate', 'radiation',
    'what', 'how', 'compare', 'baseline', 'dose', 'difference', 'trend', 'fatigue'
  ];

  for (const kw of enKeywords) {
    if (q.includes(kw)) return 'en';
  }

  return currentAppLanguage;
}
