import SpellChecker from "@/components/spell-checker"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-white">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Correcteur d'Orthographe</h1>
        <p className="text-gray-600 mb-6">
          Écrivez votre texte à gauche pour une correction en temps réel à droite
          <span className="text-xs ml-2 text-gray-500">(Propulsé par LanguageTool - open source)</span>
        </p>
        <SpellChecker />
      </div>
    </main>
  )
}
