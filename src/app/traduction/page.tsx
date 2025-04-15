'use client';

import Navigation from '@/components/Navigation';

export default function TraductionPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OrthoFlow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Votre assistant intelligent pour la correction de texte, la génération de lettres de motivation et la traduction.
          </p>
        </header>
        
        <Navigation />
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Traduction</h2>
          <p className="text-gray-600 mb-6">
            Cette fonctionnalité sera bientôt disponible. Vous pourrez traduire votre texte dans différentes langues.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-500 italic">Fonctionnalité en cours de développement...</p>
          </div>
        </div>
      </div>
    </main>
  );
} 