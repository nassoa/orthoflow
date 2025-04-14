'use client';

import { jsPDF } from 'jspdf';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface PDFExportProps {
  content: string;
  errors: any[];
  readability: number;
}

export function PDFExport({ content, errors, readability }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let y = 20;

      // Titre
      doc.setFontSize(20);
      doc.text('OrthoFlow - Rapport de correction', 20, y);
      y += 20;

      // Contenu
      doc.setFontSize(14);
      doc.text('Texte corrigé :', 20, y);
      y += 10;

      // Diviser le contenu en lignes pour éviter les débordements
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(content, 170);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });

      // Statistiques
      doc.addPage();
      y = 20;
      doc.setFontSize(16);
      doc.text('Statistiques', 20, y);
      y += 15;

      doc.setFontSize(12);
      doc.text(`Nombre d'erreurs : ${errors.length}`, 20, y);
      y += 10;
      doc.text(`Niveau de lecture : ${readability}`, 20, y);
      y += 20;

      // Erreurs détaillées
      doc.setFontSize(14);
      doc.text('Erreurs détaillées :', 20, y);
      y += 10;

      doc.setFontSize(12);
      errors.forEach((error, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const errorText = `${index + 1}. ${error.word} → ${error.suggestion}`;
        doc.setTextColor(error.type === 'spelling' ? 255 : 255, error.type === 'spelling' ? 0 : 128, 0);
        doc.text(errorText, 20, y);
        y += 7;
      });

      // Réinitialiser la couleur du texte
      doc.setTextColor(0, 0, 0);

      // Sauvegarder le PDF
      doc.save('orthoflow-rapport.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
    </motion.button>
  );
} 