import type { ReversoError } from 'reverso-api';

// Fonction pour vérifier le texte avec LanguageTool
export async function checkText(text: string): Promise<ReversoError[]> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language: 'fr',
        disabledRules: 'WHITESPACE_RULE',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Convertir les erreurs de LanguageTool au format ReversoError
    return data.matches.map((match: any) => ({
      type: match.rule.id.includes('SPELL') ? 'spelling' : 'grammar',
      word: text.substring(match.offset, match.offset + match.length),
      suggestion: match.replacements[0]?.value || text.substring(match.offset, match.offset + match.length),
      start: match.offset,
      end: match.offset + match.length,
      message: match.message
    }));
  } catch (error) {
    console.error('Error checking text with LanguageTool:', error);
    return [];
  }
}

// Fonction pour générer une version corrigée du texte
export function generateCorrectedText(text: string, errors: ReversoError[]): string {
  if (!errors || errors.length === 0) {
    return text;
  }

  // Trier les erreurs par position de début (du début à la fin du texte)
  const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
  
  // Créer une copie du texte pour appliquer les corrections
  let correctedText = text;
  
  // Appliquer les corrections en commençant par la fin pour ne pas affecter les positions
  for (let i = sortedErrors.length - 1; i >= 0; i--) {
    const error = sortedErrors[i];
    
    // Vérifier que les positions sont valides
    if (error.start >= 0 && error.end <= correctedText.length && error.start < error.end) {
      const before = correctedText.substring(0, error.start);
      const after = correctedText.substring(error.end);
      correctedText = before + error.suggestion + after;
    }
  }
  
  return correctedText;
}

export async function calculateReadability(text: string): Promise<number> {
  // Simple Flesch-Kincaid readability score calculation
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = countSyllables(text);

  if (sentences === 0) return 0;

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

function countSyllables(text: string): number {
  // Simple syllable counting algorithm
  const words = text.toLowerCase().split(/\s+/);
  return words.reduce((count, word) => {
    return count + word.replace(/[^aeiouy]+/g, '').length;
  }, 0);
} 