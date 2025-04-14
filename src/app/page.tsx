import Editor from '@/components/Editor';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OrthoFlow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Correcteur d'orthographe et de grammaire français en temps réel. Écrivez dans la colonne de gauche et voyez les corrections apparaître instantanément dans la colonne de droite.
          </p>
        </header>
        <Editor />
      </div>
    </main>
  );
}
