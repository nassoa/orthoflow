"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { toast } from "@/components/ui/use-toast";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Copy,
  Share,
  RefreshCw,
  Info,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types pour les erreurs et suggestions
interface Correction {
  offset: number;
  length: number;
  message: string;
  replacements: string[];
  rule?: {
    description: string;
    id: string;
  };
  type: "grammar" | "spelling" | "style";
}

interface CorrectionResult {
  text: string;
  corrections: Correction[];
  score: number;
}

// Statistiques des erreurs
interface ErrorStats {
  total: number;
  spelling: number;
  grammar: number;
  style: number;
}

export default function SpellChecker() {
  const [text, setText] = useState<string>(
    "Je suis aller au parc hier. C'est un endroit ou on peut se détendre. L'un des plus grand mystère de la vie."
  );
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [score, setScore] = useState<number>(0);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [selectedError, setSelectedError] = useState<Correction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    total: 0,
    spelling: 0,
    grammar: 0,
    style: 0,
  });
  const [isSecondPass, setIsSecondPass] = useState<boolean>(false);
  const [correctionHistory, setCorrectionHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajouter un nouvel état pour le texte corrigé
  const [correctedText, setCorrectedText] = useState<string>("");

  // Ajouter un système de suivi des corrections déjà appliquées
  // Ajouter cette variable d'état au début du composant SpellChecker
  const [appliedCorrections, setAppliedCorrections] = useState<Set<string>>(
    new Set()
  );

  // Fonction pour analyser le texte avec l'API de correction
  const analyzeText = async (
    textToAnalyze: string,
    isSecondPassAnalysis = false
  ) => {
    if (textToAnalyze.trim().length <= 5) return;

    setIsLoading(true);

    try {
      // Notification de traitement
      if (!isSecondPassAnalysis) {
        toast({
          title: "Analyse en cours",
          description: "Votre texte est en cours d'analyse...",
          duration: 1000,
        });
      }

      const response = await fetch("/api/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Filtrer les corrections pour exclure celles déjà appliquées
      const newCorrections = (result.corrections || []).filter(
        (correction: Correction) => {
          // Créer une clé unique pour cette correction
          const correctionKey = `${correction.message}-${
            correction.offset
          }-${textToAnalyze.substring(
            correction.offset,
            correction.offset + correction.length
          )}`;

          // Vérifier si cette correction a déjà été appliquée
          return !appliedCorrections.has(correctionKey);
        }
      );

      setCorrections(newCorrections);
      setScore(result.score || 0);

      // Calculer les statistiques d'erreurs
      const stats = {
        total: newCorrections.length,
        spelling: newCorrections.filter(
          (c: Correction) => c.type === "spelling"
        ).length,
        grammar: newCorrections.filter((c: Correction) => c.type === "grammar")
          .length,
        style: newCorrections.filter((c: Correction) => c.type === "style")
          .length,
      };
      setErrorStats(stats);

      if (!isSecondPassAnalysis) {
        toast({
          title: "Analyse terminée",
          description: `${newCorrections.length} corrections suggérées`,
          duration: 2000,
        });
      }

      // Initialiser le texte corrigé avec le texte original si nécessaire
      if (!correctedText) {
        setCorrectedText(textToAnalyze);
      }

      return newCorrections;
    } catch (error: any) {
      console.error("Error analyzing text:", error);
      if (!isSecondPassAnalysis) {
        toast({
          title: "Erreur",
          description:
            error.message || "Une erreur est survenue lors de la correction",
          variant: "destructive",
        });
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Analyser le texte lorsqu'il change
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText(text);
    }, 800); // Délai pour éviter trop d'appels API

    return () => clearTimeout(timer);
  }, [text]);

  // Fonction pour mettre en évidence les erreurs dans le texte
  const highlightText = () => {
    if (!text || corrections.length === 0) return text;

    const result = [];
    let lastIndex = 0;

    // Trier les corrections par position
    const sortedCorrections = [...corrections].sort(
      (a, b) => a.offset - b.offset
    );

    for (const correction of sortedCorrections) {
      // Texte avant l'erreur
      if (correction.offset > lastIndex) {
        result.push(text.substring(lastIndex, correction.offset));
      }

      // Texte de l'erreur
      const errorText = text.substring(
        correction.offset,
        correction.offset + correction.length
      );
      const errorClass = `inline-block relative cursor-pointer ${
        correction.type === "grammar"
          ? "border-b-2 border-orange-400"
          : correction.type === "spelling"
          ? "border-b-2 border-red-400"
          : "border-b-2 border-blue-400"
      } ${highContrast ? "bg-yellow-200" : ""}`;

      // Créer un composant ErrorHighlight pour chaque erreur
      result.push(
        <ErrorHighlight
          key={`error-${correction.offset}`}
          correction={correction}
          errorText={errorText}
          errorClass={errorClass}
          onSelect={() => setSelectedError(correction)}
          onApplyCorrection={applyCorrection}
        />
      );

      lastIndex = correction.offset + correction.length;
    }

    // Ajouter le reste du texte
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result;
  };

  // Composant pour afficher une erreur surlignée avec son popover
  function ErrorHighlight({
    correction,
    errorText,
    errorClass,
    onSelect,
    onApplyCorrection,
  }: {
    correction: Correction;
    errorText: string;
    errorClass: string;
    onSelect: () => void;
    onApplyCorrection: (replacement: string) => void;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span
            className={errorClass}
            onClick={() => {
              onSelect();
              setOpen(true);
            }}
          >
            {errorText}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-2">
            <div className="font-medium">{correction.message}</div>

            {correction.rule && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-gray-500 flex items-center cursor-help">
                      <Info className="h-3 w-3 mr-1" />
                      Règle: {correction.rule.id}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{correction.rule.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <div className="pt-2">
              <div className="text-sm font-medium mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-1">
                {correction.replacements.slice(0, 5).map((replacement, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      onApplyCorrection(replacement);
                      setOpen(false);
                    }}
                  >
                    {replacement}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Modifier la fonction applyCorrection pour réanalyser le texte après chaque correction
  const applyCorrection = async (replacement: string) => {
    if (selectedError) {
      // Sauvegarder l'état actuel dans l'historique
      setCorrectionHistory([...correctionHistory, text]);

      // Marquer cette correction comme appliquée
      const correctionKey = `${selectedError.message}-${
        selectedError.offset
      }-${text.substring(
        selectedError.offset,
        selectedError.offset + selectedError.length
      )}`;

      const newAppliedCorrections = new Set(appliedCorrections);
      newAppliedCorrections.add(correctionKey);
      setAppliedCorrections(newAppliedCorrections);

      const newText =
        text.substring(0, selectedError.offset) +
        replacement +
        text.substring(selectedError.offset + selectedError.length);

      setText(newText);
      setCorrectedText(newText);
      setSelectedError(null);

      // Animation de correction
      toast({
        title: "Correction appliquée",
        description: `"${text.substring(
          selectedError.offset,
          selectedError.offset + selectedError.length
        )}" → "${replacement}"`,
      });

      // Réanalyser immédiatement le texte pour mettre à jour les erreurs
      // Utiliser un délai court pour permettre à React de mettre à jour l'état
      setTimeout(() => {
        analyzeText(newText, true);
      }, 100);
    }
  };

  // Fonction pour annuler la dernière correction
  const undoLastCorrection = () => {
    if (correctionHistory.length > 0) {
      const previousText = correctionHistory[correctionHistory.length - 1];
      setText(previousText);
      setCorrectedText(previousText);
      setCorrectionHistory(correctionHistory.slice(0, -1));

      // Réinitialiser les corrections appliquées lors d'une annulation
      // car nous ne pouvons pas facilement savoir quelle correction spécifique annuler
      setAppliedCorrections(new Set());

      toast({
        title: "Correction annulée",
        description: "La dernière correction a été annulée",
      });

      // Réanalyser le texte après annulation
      setTimeout(() => {
        analyzeText(previousText, true);
      }, 100);
    }
  };

  // Ajouter une fonction pour appliquer toutes les corrections
  const applyAllCorrections = async () => {
    if (corrections.length === 0) return;

    // Sauvegarder l'état actuel dans l'historique
    setCorrectionHistory([...correctionHistory, text]);

    let newText = text;
    const correctionsSummary = [];

    // Trier les corrections par position (de la fin vers le début pour ne pas décaler les indices)
    const sortedCorrections = [...corrections].sort(
      (a, b) => b.offset - a.offset
    );

    for (const correction of sortedCorrections) {
      if (correction.replacements && correction.replacements.length > 0) {
        const originalText = newText.substring(
          correction.offset,
          correction.offset + correction.length
        );
        const replacement = correction.replacements[0];

        newText =
          newText.substring(0, correction.offset) +
          replacement +
          newText.substring(correction.offset + correction.length);

        // Ajouter au résumé des corrections
        correctionsSummary.push({
          original: originalText,
          replacement: replacement,
          type: correction.type,
        });
      }
    }

    setText(newText);
    setCorrectedText(newText);

    // Effectuer une seconde passe d'analyse pour vérifier s'il reste des erreurs
    setIsSecondPass(true);
    const remainingCorrections = await analyzeText(newText, true);

    if (remainingCorrections && remainingCorrections.length > 0) {
      // S'il reste des erreurs, afficher une notification
      toast({
        title: "Attention",
        description: `${remainingCorrections.length} erreurs restantes après correction`,
        variant: "warning",
      });
    } else {
      // Réinitialiser les corrections et les statistiques
      setCorrections([]);
      setErrorStats({ total: 0, spelling: 0, grammar: 0, style: 0 });
      setScore(100);

      // Afficher un résumé des corrections
      toast({
        title: "Corrections appliquées",
        description: `${correctionsSummary.length} corrections appliquées avec succès`,
        duration: 3000,
      });
    }

    setIsSecondPass(false);
  };

  // Exporter en HTML
  const exportHTML = () => {
    let htmlContent = text;

    // Remplacer les erreurs par des spans stylisés
    corrections
      .sort((a, b) => b.offset - a.offset)
      .forEach((correction) => {
        const errorText = text.substring(
          correction.offset,
          correction.offset + correction.length
        );
        const highlightedText = `<span style="border-bottom: 2px solid ${
          correction.type === "grammar"
            ? "orange"
            : correction.type === "spelling"
            ? "red"
            : "blue"
        };">${errorText}</span>`;

        htmlContent =
          htmlContent.substring(0, correction.offset) +
          highlightedText +
          htmlContent.substring(correction.offset + correction.length);
      });

    // Créer un blob et télécharger
    const blob = new Blob(
      [
        `<div style="font-family: system-ui, sans-serif; line-height: 1.5;">${htmlContent}</div>`,
      ],
      {
        type: "text/html",
      }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "texte-corrige.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Le fichier HTML a été téléchargé",
    });
  };

  // Composant pour afficher les statistiques d'erreurs
  const ErrorStatsCard = ({ stats }: { stats: ErrorStats }) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Détails des erreurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-red-500">
                {stats.spelling}
              </div>
              <div className="text-xs text-gray-500">Orthographe</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-orange-500">
                {stats.grammar}
              </div>
              <div className="text-xs text-gray-500">Grammaire</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.style}
              </div>
              <div className="text-xs text-gray-500">Style</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Remplacer le return du composant par la nouvelle structure en deux colonnes
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Badge
              variant={
                score > 90 ? "default" : score > 70 ? "outline" : "destructive"
              }
              className="text-sm py-1 px-3"
            >
              {score}% de précision
            </Badge>
          </motion.div>
        </AnimatePresence>

        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHighContrast(!highContrast)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Contraste
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mode contraste élevé (WCAG AA)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(correctedText || text)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copier
          </Button>

          <Button variant="outline" size="sm" onClick={exportHTML}>
            <Share className="h-4 w-4 mr-1" />
            Exporter
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setText("");
              setCorrectedText("");
              setCorrections([]);
              setScore(0);
              setErrorStats({ total: 0, spelling: 0, grammar: 0, style: 0 });
              setCorrectionHistory([]);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Afficher les statistiques d'erreurs si des erreurs sont détectées */}
      {errorStats.total > 0 && <ErrorStatsCard stats={errorStats} />}

      {/* Structure en deux colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colonne de gauche : texte à corriger */}
        <div className="relative">
          <h2 className="text-lg font-medium mb-2">Texte à corriger</h2>
          {/* Textarea visible pour l'édition */}
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`min-h-[300px] font-sans text-base leading-relaxed ${
              highContrast ? "bg-white text-black" : "bg-gray-50"
            }`}
            style={{ fontFamily: "SF Pro Display, system-ui, sans-serif" }}
            placeholder="Saisissez votre texte ici..."
            rows={10}
            aria-label="Texte à corriger"
          />

          {isLoading && (
            <div className="absolute top-10 right-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1,
                  ease: "linear",
                }}
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Colonne de droite : texte corrigé avec erreurs surlignées */}
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Texte corrigé</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undoLastCorrection}
                disabled={correctionHistory.length === 0}
                className="text-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applyAllCorrections}
                disabled={corrections.length === 0 || isLoading || isSecondPass}
                className={`${
                  isSecondPass
                    ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                }`}
              >
                {isSecondPass ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-1" />
                    Corriger tout ({errorStats.total})
                  </>
                )}
              </Button>
            </div>
          </div>
          <div
            className={`border rounded-md p-3 min-h-[300px] font-sans text-base leading-relaxed ${
              highContrast ? "bg-white text-black" : "bg-gray-50"
            }`}
            style={{ fontFamily: "SF Pro Display, system-ui, sans-serif" }}
          >
            {highlightText()}
          </div>

          {/* Légende des erreurs */}
          {errorStats.total > 0 && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              {errorStats.spelling > 0 && (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-red-400 mr-1 rounded-sm"></span>
                  Orthographe
                </div>
              )}
              {errorStats.grammar > 0 && (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-orange-400 mr-1 rounded-sm"></span>
                  Grammaire
                </div>
              )}
              {errorStats.style > 0 && (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-blue-400 mr-1 rounded-sm"></span>
                  Style
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  );
}
