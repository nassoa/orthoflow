declare module 'reverso-api' {
  export interface ReversoError {
    type: 'spelling' | 'grammar';
    word: string;
    suggestion: string;
    start: number;
    end: number;
    message: string;
  }

  export interface ReversoResponse {
    errors: ReversoError[];
  }

  export function checkText(text: string): Promise<ReversoError[]>;
  export function getSynonyms(word: string): Promise<string[]>;
  export function getExamples(word: string): Promise<string[]>;
} 