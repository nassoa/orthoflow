'use client';

import { Editor } from '@/components/Editor';

export default function CorrectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Correction de texte</h1>
      <p className="text-gray-600 mb-8">
        Vérifiez l'orthographe et la grammaire de votre texte en temps réel.
      </p>
      <Editor />
    </div>
  );
} 