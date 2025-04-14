'use client';

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from 'lexical';
import { motion } from 'framer-motion';
import { checkText, calculateReadability, generateCorrectedText } from '@/utils/reverso-api';
import { saveToHistory, getHistory } from '@/utils/local-storage';
import { PDFExport } from './PDFExport';

const theme = {
  paragraph: 'mb-2',
  text: {
    base: 'text-gray-900',
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  root: 'text-gray-900',
};

const initialConfig = {
  namespace: 'OrthoFlow',
  theme,
  onError: (error: Error) => {
    console.error(error);
  },
};

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div className="error-boundary">{children}</div>;
}

function EditorContent() {
  const [editor] = useLexicalComposerContext();
  const [stats, setStats] = useState({ errors: 0, readability: 0 });
  const [errors, setErrors] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [content, setContent] = useState('');
  const [correctedContent, setCorrectedContent] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Fonction pour mettre à jour le contenu sans vérification
  useEffect(() => {
    const removeTransform = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        setContent(text);
      });
    });

    return () => {
      removeTransform();
    };
  }, [editor]);

  // Fonction pour corriger le texte
  const handleCorrect = async () => {
    if (!content.trim()) return;
    
    setIsChecking(true);
    try {
      const grammarErrors = await checkText(content);
      setErrors(grammarErrors);
      
      // Mettre à jour les statistiques
      const readability = await calculateReadability(content);
      setStats({
        errors: grammarErrors.length,
        readability,
      });

      // Générer le texte corrigé
      const corrected = generateCorrectedText(content, grammarErrors);
      setCorrectedContent(corrected);

      // Sauvegarder dans l'historique
      saveToHistory(content, grammarErrors, readability);
    } catch (error) {
      console.error('Erreur lors de la vérification du texte:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={handleCorrect}
            disabled={isChecking || !content.trim()}
            className={`px-4 py-2 rounded ${
              isChecking || !content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isChecking ? 'Vérification en cours...' : 'Corriger le texte'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded"
          >
            {showHistory ? 'Masquer l\'historique' : 'Afficher l\'historique'}
          </button>
        </div>
        <div className="flex space-x-4">
          <div className="text-sm text-gray-800">
            Erreurs: {stats.errors}
          </div>
          <div className="text-sm text-gray-800">
            Lisibilité: {stats.readability}%
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="border rounded p-4 relative bg-white">
          <button
            onClick={() => {
              editor.update(() => {
                const root = $getRoot();
                root.clear();
              });
              // Réinitialiser le texte corrigé et les erreurs
              setCorrectedContent('');
              setErrors([]);
              setStats({ errors: 0, readability: 0 });
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
            title="Effacer le texte"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <RichTextPlugin
            contentEditable={<ContentEditable className="outline-none min-h-[200px] text-gray-900" data-placeholder="Entrez votre texte ici..." />}
            ErrorBoundary={ErrorBoundary}
          />
          <HistoryPlugin />
        </div>
        <div className="flex flex-col">
          <div className="border rounded p-4 mb-4 bg-white">
            {correctedContent ? (
              <div className="whitespace-pre-wrap text-gray-900">{correctedContent}</div>
            ) : (
              <div className="text-gray-400">Le texte corrigé apparaîtra ici...</div>
            )}
          </div>
          
          {errors.length > 0 && (
            <div className="border rounded p-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Erreurs détectées</h3>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${
                      error.type === 'spelling' 
                        ? 'bg-red-100' 
                        : 'bg-orange-100'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{error.word}</span>
                      <span className="text-sm text-gray-500">
                        {error.type === 'spelling' ? 'Orthographe' : 'Grammaire'}
                      </span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="text-gray-600">Suggestion: </span>
                      <span className="font-medium text-gray-900">{error.suggestion}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {error.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="mt-4 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Historique</h3>
          <div className="space-y-2">
            {getHistory().map((item, index) => (
              <div key={index} className="border-b pb-2">
                <div className="text-sm text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
                <div className="text-sm text-gray-900">
                  Erreurs: {item.errors.length} | Lisibilité: {item.readability}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Editor() {
  return (
    <div>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorContent />
      </LexicalComposer>
    </div>
  );
} 