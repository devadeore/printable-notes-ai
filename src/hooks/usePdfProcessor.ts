import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';

// Initialize PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PDFPage {
  id: string;
  url: string;
  originalCanvas: HTMLCanvasElement | null; // null for blank slides
  isSelected: boolean;
  pageNumber: number;
  fileName: string;
  isBlank?: boolean;
}

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  pages: PDFPage[];
}

export const usePdfProcessor = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadFiles = async (newFiles: File[]) => {
    setIsProcessing(true);
    const processedFiles: PDFFile[] = [];
    const allNewPages: PDFPage[] = [];

    for (const file of newFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const filePages: PDFPage[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;

          const pageObj: PDFPage = {
            id: Math.random().toString(36).substring(2, 11),
            url: canvas.toDataURL(),
            originalCanvas: canvas,
            isSelected: true,
            pageNumber: i,
            fileName: file.name
          };
          filePages.push(pageObj);
          allNewPages.push(pageObj);
        }

        processedFiles.push({
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          size: file.size,
          pageCount: pdf.numPages,
          pages: filePages
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    setFiles((prev) => [...prev, ...processedFiles]);
    setPages((prev) => [...prev, ...allNewPages]);
    setIsProcessing(false);
  };

  const addBlankSlide = (index: number) => {
    const blankPage: PDFPage = {
      id: Math.random().toString(36).substring(2, 11),
      url: '', // Empty or placeholder for blank
      originalCanvas: null,
      isSelected: true,
      pageNumber: -1,
      fileName: 'Blank Slide',
      isBlank: true
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, blankPage);
    setPages(newPages);
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      const pageIdsToRemove = new Set(fileToRemove.pages.map(p => p.id));
      setPages(prev => prev.filter(p => !pageIdsToRemove.has(p.id)));
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const reorderPages = (startIndex: number, endIndex: number) => {
    const result = Array.from(pages);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setPages(result);
  };

  return { 
    files, 
    pages, 
    setPages, 
    loadFiles, 
    isProcessing, 
    addBlankSlide, 
    removeFile, 
    reorderPages 
  };
};
