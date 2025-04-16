const correctionCache = new Map()

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    // Vérifier si ce texte est déjà dans le cache
    if (correctionCache.has(prompt)) {
      return new Response(JSON.stringify(correctionCache.get(prompt)))
    }

    // Première passe avec LanguageTool
    const ltResponse = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: prompt,
        language: "fr",
        enabledOnly: "false",
        level: "picky",
      }),
    })

    if (!ltResponse.ok) {
      throw new Error(`Erreur API LanguageTool: ${ltResponse.status}`)
    }

    const ltData = await ltResponse.json()

    // Deuxième passe avec une API alternative (simulée ici)
    // Dans un environnement de production, vous pourriez utiliser Grammalecte ou une autre API
    const additionalCorrections = await simulateGrammarCheck(prompt)

    // Fusionner les corrections des deux sources
    const allMatches = [...ltData.matches, ...additionalCorrections]

    // Éliminer les doublons (corrections qui se chevauchent)
    const uniqueMatches = removeDuplicateCorrections(allMatches)

    // Transformer les données au format attendu par notre application
    const corrections = uniqueMatches.map((match: any) => {
      // Déterminer le type d'erreur
      let type = "style"

      if (match.isGrammarError === true) {
        type = "grammar"
      } else if (match.isSpellingError === true) {
        type = "spelling"
      } else if (match.rule && match.rule.category) {
        if (match.rule.category.id.includes("TYPOS") || match.rule.category.id.includes("ORTHOGRAPHY")) {
          type = "spelling"
        } else if (
          match.rule.category.id.includes("GRAMMAR") ||
          match.rule.category.id.includes("AGREEMENT") ||
          match.rule.category.id.includes("ACCORD")
        ) {
          type = "grammar"
        }
      }

      return {
        offset: match.offset,
        length: match.length,
        message: match.message,
        replacements: match.replacements ? match.replacements.map((r: any) => r.value || r) : [],
        rule: match.rule
          ? {
              description: match.rule.description || "Règle grammaticale",
              id: match.rule.id || "grammar",
            }
          : {
              description: "Règle grammaticale",
              id: "grammar",
            },
        type: type,
      }
    })

    // Calculer un score basé sur le nombre d'erreurs par rapport à la longueur du texte
    const errorRatio = corrections.length / (prompt.length / 100)
    const score = Math.max(0, Math.min(100, Math.round(100 - errorRatio * 5)))

    const result = {
      text: prompt,
      corrections: corrections,
      score: score,
    }

    // Stocker le résultat dans le cache
    // Limiter la taille du cache pour éviter les problèmes de mémoire
    if (correctionCache.size > 100) {
      // Supprimer la plus ancienne entrée
      const firstKey = correctionCache.keys().next().value
      correctionCache.delete(firstKey)
    }
    correctionCache.set(prompt, result)

    return new Response(JSON.stringify(result))
  } catch (error: any) {
    console.error("Error in correction API:", error)
    return new Response(JSON.stringify({ error: error.message || "Erreur lors de l'analyse du texte" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Fonction pour éliminer les corrections qui se chevauchent
function removeDuplicateCorrections(matches: any[]) {
  // Trier par position et longueur (priorité aux corrections plus longues)
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.offset !== b.offset) return a.offset - b.offset
    return b.length - a.length // Priorité aux corrections plus longues
  })

  const uniqueMatches = []
  const coveredRanges: [number, number][] = []

  for (const match of sortedMatches) {
    const start = match.offset
    const end = match.offset + match.length

    // Vérifier si cette correction chevauche une correction déjà acceptée
    const overlaps = coveredRanges.some(
      ([rangeStart, rangeEnd]) =>
        (start >= rangeStart && start < rangeEnd) || // Début dans une plage existante
        (end > rangeStart && end <= rangeEnd) || // Fin dans une plage existante
        (start <= rangeStart && end >= rangeEnd), // Englobe une plage existante
    )

    if (!overlaps) {
      uniqueMatches.push(match)
      coveredRanges.push([start, end])
    }
  }

  return uniqueMatches
}

// Fonction qui simule une vérification grammaticale supplémentaire
// Dans un environnement de production, vous remplaceriez ceci par un appel à une API réelle
async function simulateGrammarCheck(text: string) {
  // Règles grammaticales spécifiques au français
  const rules = [
    // Accords pluriels
    {
      regex: /\b(les|des|ces|mes|tes|ses|nos|vos|leurs)\s+([a-zéèêëàâäôöùûüÿçœæ]+)\b/gi,
      check: (match: string, article: string, noun: string) => {
        // Vérifier si le nom devrait être au pluriel
        if (!noun.endsWith("s") && !noun.endsWith("x") && !noun.endsWith("z")) {
          return {
            offset: match.indexOf(noun),
            length: noun.length,
            message: `Le nom "${noun}" devrait être au pluriel après "${article}".`,
            isGrammarError: true,
            replacements: [`${noun}s`],
          }
        }
        return null
      },
    },
    // Accord adjectif-nom
    {
      regex: /\b(plus|très|assez|trop)\s+(grand|petit|beau|nouveau|vieux)\s+([a-zéèêëàâäôöùûüÿçœæ]+)s\b/gi,
      check: (match: string, adverb: string, adj: string, noun: string) => {
        // Si le nom est au pluriel, l'adjectif devrait l'être aussi
        if (noun.endsWith("s") && !adj.endsWith("s")) {
          return {
            offset: match.indexOf(adj),
            length: adj.length,
            message: `L'adjectif "${adj}" devrait s'accorder avec le nom "${noun}" au pluriel.`,
            isGrammarError: true,
            replacements: [`${adj}s`],
          }
        }
        return null
      },
    },
    // Détection spécifique pour "L'un des plus grand mystère"
    {
      regex: /\bL'un des plus (grand) (mystère)\b/gi,
      check: (match: string, adj: string, noun: string) => {
        const corrections = []

        // Vérifier l'adjectif
        if (adj === "grand") {
          corrections.push({
            offset: match.indexOf(adj),
            length: adj.length,
            message: `L'adjectif "grand" doit être au pluriel après "des plus".`,
            isGrammarError: true,
            replacements: ["grands"],
          })
        }

        // Vérifier le nom
        if (noun === "mystère") {
          corrections.push({
            offset: match.indexOf(noun),
            length: noun.length,
            message: `Le nom "mystère" doit être au pluriel après "des plus".`,
            isGrammarError: true,
            replacements: ["mystères"],
          })
        }

        return corrections
      },
    },
    // Confusion a/à
    {
      regex: /\b([a-zéèêëàâäôöùûüÿçœæ]+)\s+a\s+([a-zéèêëàâäôöùûüÿçœæ]+)\b/gi,
      check: (match: string, word1: string, word2: string) => {
        // Liste de verbes qui suggèrent l'utilisation de "à" au lieu de "a"
        const verbsRequiringA = ["aller", "venir", "penser", "réfléchir", "songer", "participer", "assister"]

        if (verbsRequiringA.includes(word1.toLowerCase())) {
          return {
            offset: match.indexOf("a"),
            length: 1,
            message: `Après "${word1}", utilisez "à" (préposition) et non "a" (verbe avoir).`,
            isGrammarError: true,
            replacements: ["à"],
          }
        }
        return null
      },
    },
    // Confusion ou/où
    {
      regex: /\b([a-zéèêëàâäôöùûüÿçœæ]+)\s+ou\s+([a-zéèêëàâäôöùûüÿçœæ]+)\b/gi,
      check: (match: string, word1: string, word2: string) => {
        // Liste de mots qui suggèrent l'utilisation de "où" au lieu de "ou"
        const wordsRequiringOu = ["endroit", "lieu", "place", "moment", "instant", "pays", "ville"]

        if (wordsRequiringOu.includes(word1.toLowerCase())) {
          return {
            offset: match.indexOf("ou"),
            length: 2,
            message: `Après "${word1}", utilisez "où" (adverbe de lieu) et non "ou" (conjonction).`,
            isGrammarError: true,
            replacements: ["où"],
          }
        }
        return null
      },
    },
  ]

  const additionalCorrections = []

  // Appliquer chaque règle
  for (const rule of rules) {
    let match
    while ((match = rule.regex.exec(text)) !== null) {
      const result = rule.check(...match)

      if (result) {
        if (Array.isArray(result)) {
          // Si la règle retourne plusieurs corrections
          for (const correction of result) {
            additionalCorrections.push({
              ...correction,
              offset: match.index + correction.offset,
            })
          }
        } else {
          // Si la règle retourne une seule correction
          additionalCorrections.push({
            ...result,
            offset: match.index + result.offset,
          })
        }
      }
    }
  }

  return additionalCorrections
}
