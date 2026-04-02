import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Sliders, Layout, Download, FileText, CheckCircle, 
  ChevronRight, Loader2, Trash2, Plus, ArrowUp, ArrowDown, 
  Grid, Monitor, Smartphone, Heart, Zap, Shield, Printer, 
  MousePointer2, Leaf, Edit2, ChevronLeft
} from 'lucide-react';
import { usePdfProcessor, PDFPage } from './hooks/usePdfProcessor';
import { applyFilters } from './utils/filters';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  { id: 1, name: 'Upload' },
  { id: 2, name: 'Merge' },
  { id: 3, name: 'Preview' },
  { id: 4, name: 'Enhance' },
  { id: 5, name: 'Process' },
  { id: 6, name: 'Download' }
];

export default function App() {
  const [step, setStep] = useState(0); // 0 is landing page
  const [processingProgress, setProcessingProgress] = useState(0);
  const { 
    files, pages, setPages, loadFiles, isProcessing, 
    addBlankSlide, removeFile, reorderPages 
  } = usePdfProcessor();
  
  // Filters State
  const [filters, setFilters] = useState({
    invert: false,
    grayscale: false,
    cleanBackground: true,
    blackAndWhite: false,
    brightness: 0,
    contrast: 0,
    removeLogo: false,
    quality: 'high'
  });

  // Layout State
  const [layout, setLayout] = useState({
    rows: 3,
    cols: 1,
    orientation: 'p', // p or l
    margin: 10,
    showLines: false,
    addPageNumbers: true
  });

  // Handle processing simulation
  useEffect(() => {
    if (step === 5) {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep(6);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFiles(Array.from(e.target.files));
      setStep(2);
    }
  };

  const togglePageSelection = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, isSelected: !p.isSelected } : p));
  };

  const generateFinalPdf = async () => {
    const doc = new jsPDF({
      orientation: layout.orientation as any,
      unit: 'mm',
      format: 'a4'
    });

    const selectedPages = pages.filter(p => p.isSelected);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const itemsPerPage = layout.rows * layout.cols;
    let currentIdx = 0;
    let pageNum = 1;

    while (currentIdx < selectedPages.length) {
      if (currentIdx > 0) doc.addPage();

      for (let i = 0; i < itemsPerPage && (currentIdx + i) < selectedPages.length; i++) {
        const pageData = selectedPages[currentIdx + i];
        
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        
        const cellW = (pageWidth - (layout.margin * 2)) / layout.cols;
        const cellH = (pageHeight - (layout.margin * 2)) / layout.rows;
        
        const x = layout.margin + (col * cellW);
        const y = layout.margin + (row * cellH);

        if (!pageData.isBlank && pageData.originalCanvas) {
          // Apply Filters to a temp canvas
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = pageData.originalCanvas.width;
          tempCanvas.height = pageData.originalCanvas.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(pageData.originalCanvas, 0, 0);
          applyFilters(tempCanvas, filters);

          doc.addImage(
            tempCanvas.toDataURL('image/jpeg', filters.quality === 'high' ? 0.95 : 0.7),
            'JPEG',
            x + 2, y + 2, cellW - 4, cellH - 4
          );
        }

        if (layout.showLines) {
          doc.setDrawColor(200);
          doc.rect(x, y, cellW, cellH);
        }
      }

      if (layout.addPageNumbers) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      currentIdx += itemsPerPage;
      pageNum++;
    }

    doc.save(`PrintableNotesAI_${new Date().getTime()}.pdf`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-sky-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-2xl fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(0)}>
            <div className="w-10 h-10 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Printer size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">PRINTABLE NOTES AI</span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Download size={20} className="text-slate-400" />
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-32">
        <AnimatePresence mode="wait">
          {/* Landing Page */}
          {step === 0 && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 text-center space-y-12"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium">
                  Free Forever <Heart size={14} fill="currentColor" />
                </div>
                
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    Make Printable notes easily
                  </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1]">
                  Perfect Notes <br />
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Every Time
                  </span>
                </h1>

                <div className="pt-8">
                  <label className="relative inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-bold text-white shadow-2xl hover:bg-white/20 transition-all cursor-pointer group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input type="file" multiple accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    <Upload size={20} className="relative z-10" />
                    <span className="relative z-10">Select PDF Files</span>
                    <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </label>
                </div>
              </div>

              <div className="relative rounded-[3rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl aspect-video flex items-center justify-center group shadow-[0_0_100px_rgba(56,189,248,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
                <img 
                  src="https://picsum.photos/seed/notes/1200/800" 
                  alt="Preview" 
                  className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute flex items-center gap-8">
                   <div className="w-24 h-32 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center">
                      <Monitor className="text-white/20" size={40} />
                   </div>
                   <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <Printer className="text-white" size={32} />
                   </div>
                   <div className="w-24 h-32 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 flex flex-col gap-2 p-2">
                      <div className="h-2 w-full bg-white/10 rounded" />
                      <div className="h-2 w-2/3 bg-white/10 rounded" />
                      <div className="mt-auto h-12 w-full bg-white/5 rounded" />
                   </div>
                </div>
              </div>

              <div className="space-y-12 py-20">
                <h2 className="text-4xl font-bold text-white tracking-tight">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: <Upload />, title: 'Upload PDF', desc: 'Secure local processing.' },
                    { icon: <MousePointer2 />, title: 'Preview & Edit', desc: 'Select your best pages.' },
                    { icon: <Printer />, title: 'Enhance', desc: 'AI-powered background cleaning.' },
                    { icon: <Grid />, title: 'Layout', desc: 'Custom grids for efficient printing.' },
                    { icon: <Zap />, title: 'Process', desc: 'Instant browser-side optimization.' },
                    { icon: <Download />, title: 'Download', desc: 'Get your print-ready PDF.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group">
                      <div className="w-14 h-14 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-lg">{item.title}</div>
                        <div className="text-sm text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-12 py-20">
                <h2 className="text-4xl font-bold text-white tracking-tight">Why PRINTABLE NOTES AI?</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    'Lightning Fast', 'Privacy First', 'Ink Saver', 
                    'No Install', 'Eco-Friendly', 'Always Free'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-5 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:border-sky-500/30 transition-colors">
                      <div className="w-6 h-6 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Workflow Steps */}
          {step > 0 && step < 7 && (
            <motion.div 
              key="workflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto px-4 space-y-8"
            >
              {/* Progress Stepper */}
              <div className="flex justify-between items-center max-w-md mx-auto relative px-4">
                <div className="absolute h-0.5 bg-white/5 w-full top-1/2 -translate-y-1/2 left-0 z-0" />
                {STEPS.map((s) => (
                  <div 
                    key={s.id} 
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 backdrop-blur-md border ${
                      step >= s.id ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/40' : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    {step > s.id ? <CheckCircle size={16} /> : s.id}
                    {step === s.id && (
                      <div className="absolute -inset-1.5 border-2 border-sky-500 rounded-full animate-ping opacity-20" />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="min-h-[60vh]">
                {/* Step 1: Upload Files */}
                {step === 1 && (
                  <div className="text-center space-y-8 py-12">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white">Upload Files</h2>
                      <p className="text-slate-400">Select PDF files from your device to begin processing.</p>
                    </div>
                    
                    <div className="max-w-xl mx-auto p-12 border border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-2xl hover:bg-white/10 transition-all relative group shadow-2xl">
                      <input type="file" multiple accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="space-y-6 relative z-0">
                        <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl group-hover:scale-110 transition-transform">
                          {isProcessing ? <Loader2 className="animate-spin" size={36} /> : <Upload size={36} />}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-white">
                            {isProcessing ? 'Reading Documents...' : 'Drop your PDFs here'}
                          </p>
                          <p className="text-sm text-slate-400">
                            {isProcessing ? 'Optimizing for liquid glass processing' : 'Select multiple files to merge and enhance'}
                          </p>
                        </div>
                        <button className="px-10 py-3 bg-white/10 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/20 transition-all">
                          {isProcessing ? 'Processing...' : 'Browse Files'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-slate-500 text-xs font-medium tracking-widest uppercase">
                      Upload • Process • Watch Ad • Download
                    </div>
                  </div>
                )}

                {/* Step 2: Reorder & Merge */}
                {step === 2 && (
                  <div className="space-y-8 py-12">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-white">Reorder & Merge</h2>
                      <p className="text-slate-400">Rearrange your documents in the desired order before merging.</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-3">
                      {files.map((file, i) => (
                        <div key={file.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400">
                            {i + 1}
                          </div>
                          <FileText className="text-sky-400" size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{file.name}</div>
                            <div className="text-xs text-slate-500">{formatSize(file.size)} • {file.pageCount} Pages</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><ArrowUp size={16} /></button>
                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><ArrowDown size={16} /></button>
                            <button onClick={() => removeFile(file.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}

                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/5 rounded-2xl text-sky-400 hover:bg-white/5 transition-colors cursor-pointer font-bold">
                        <input type="file" multiple accept=".pdf" onChange={handleFileUpload} className="hidden" />
                        <Plus size={20} /> Add More PDFs
                      </label>
                    </div>

                    <div className="flex justify-center pt-8">
                      <button onClick={() => setStep(3)} className="px-12 py-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl font-bold text-white shadow-xl hover:bg-white/20 transition-all flex items-center gap-2">
                        Continue <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Preview and Edit Pages */}
                {step === 3 && (
                  <div className="space-y-8 py-12">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-white">Preview and Edit Pages</h2>
                      <p className="text-slate-400">Tap a page to select or deselect. Deselected pages will be removed from final PDF.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-400 text-sm text-center mb-8">
                        We display low quality images for a smooth experience. Final output PDF will be in high quality.
                      </div>

                      <div className="flex justify-center gap-4 mb-8">
                        <button className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                          <Sliders size={16} /> Reorder Slide
                        </button>
                        <button onClick={() => addBlankSlide(pages.length - 1)} className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                          <Plus size={16} /> Add Blank Slide
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {pages.map((page, i) => (
                          <div 
                            key={page.id} 
                            onClick={() => togglePageSelection(page.id)}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                              page.isSelected ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-white/5 opacity-40'
                            }`}
                          >
                            {page.isBlank ? (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 font-bold">
                                BLANK
                              </div>
                            ) : (
                              <img src={page.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                            <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 size={14} />
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-md text-[10px] font-bold text-white">
                              {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col items-center gap-4 pt-12">
                        <div className="text-slate-500 font-medium">{pages.filter(p => p.isSelected).length} of {pages.length} pages selected</div>
                        <button onClick={() => setStep(4)} className="px-12 py-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl font-bold text-white shadow-xl hover:bg-white/20 transition-all flex items-center gap-2">
                          Continue <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Enhance Document */}
                {step === 4 && (
                  <div className="space-y-8 py-12">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-white">Enhance Document</h2>
                      <p className="text-slate-400">Apply filters to improve quality and customize layout.</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Controls */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">File Size</div>
                            <div className="font-bold text-white">{formatSize(files.reduce((acc, f) => acc + f.size, 0))}</div>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pages</div>
                            <div className="font-bold text-white">{pages.length}</div>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Removed</div>
                            <div className="font-bold text-white">{pages.filter(p => !p.isSelected).length}</div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Filters</h3>
                          <div className="space-y-4">
                            {[
                              { id: 'invert', label: 'Invert Colors', desc: 'Dark to light', checked: filters.invert },
                              { id: 'cleanBackground', label: 'Clear PDF Background', desc: 'Remove background noise', checked: filters.cleanBackground },
                              { id: 'grayscale', label: 'Grayscale', desc: 'Shades of gray', checked: filters.grayscale },
                              { id: 'blackAndWhite', label: 'Black & White', desc: 'Pure black & white', checked: filters.blackAndWhite }
                            ].map(f => (
                              <label key={f.id} className="flex items-center justify-between cursor-pointer group">
                                <div>
                                  <div className="font-bold text-white group-hover:text-sky-400 transition-colors">{f.label}</div>
                                  <div className="text-xs text-slate-500">{f.desc}</div>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${f.checked ? 'bg-sky-500' : 'bg-slate-700'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={f.checked} 
                                    onChange={(e) => setFilters({...filters, [f.id]: e.target.checked})}
                                  />
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${f.checked ? 'left-7' : 'left-1'}`} />
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Remove Logo</h3>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="text-sm font-medium text-slate-300">Enable Logo Removal</div>
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${filters.removeLogo ? 'bg-sky-500' : 'bg-slate-700'}`}>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={filters.removeLogo} 
                                onChange={(e) => setFilters({...filters, removeLogo: e.target.checked})}
                              />
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.removeLogo ? 'left-7' : 'left-1'}`} />
                            </div>
                          </label>
                          <p className="text-xs text-slate-500 italic">Select region to remove (Placeholder)</p>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Output Quality</h3>
                          <div className="flex gap-4">
                            {['low', 'medium', 'high'].map(q => (
                              <label key={q} className="flex-1 flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="quality" 
                                  className="hidden" 
                                  checked={filters.quality === q}
                                  onChange={() => setFilters({...filters, quality: q})}
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${filters.quality === q ? 'border-sky-500' : 'border-slate-700'}`}>
                                  {filters.quality === q && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-medium capitalize">{q}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Layout */}
                      <div className="space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Orientation</h3>
                          <div className="flex gap-4">
                            {[
                              { id: 'p', label: 'Portrait' },
                              { id: 'l', label: 'Landscape' }
                            ].map(o => (
                              <label key={o.id} className="flex-1 flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="orientation" 
                                  className="hidden" 
                                  checked={layout.orientation === o.id}
                                  onChange={() => setLayout({...layout, orientation: o.id})}
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${layout.orientation === o.id ? 'border-sky-500' : 'border-slate-700'}`}>
                                  {layout.orientation === o.id && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-medium">{o.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Slides per Page</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs text-slate-500 uppercase tracking-wider">Rows</label>
                              <select 
                                value={layout.rows} 
                                onChange={(e) => setLayout({...layout, rows: parseInt(e.target.value)})}
                                className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                              >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-slate-500 uppercase tracking-wider">Columns</label>
                              <select 
                                value={layout.cols} 
                                onChange={(e) => setLayout({...layout, cols: parseInt(e.target.value)})}
                                className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                              >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Add Separation Lines</h3>
                          <div className="flex gap-4">
                            {[
                              { id: false, label: 'No' },
                              { id: true, label: 'Yes' }
                            ].map(l => (
                              <label key={String(l.id)} className="flex-1 flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="lines" 
                                  className="hidden" 
                                  checked={layout.showLines === l.id}
                                  onChange={() => setLayout({...layout, showLines: l.id as boolean})}
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${layout.showLines === l.id ? 'border-sky-500' : 'border-slate-700'}`}>
                                  {layout.showLines === l.id && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-medium">{l.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                          <h3 className="font-bold text-white text-lg">Layout Preview</h3>
                          <div className="aspect-[3/4] max-w-[120px] mx-auto bg-white/10 rounded-lg p-2 grid gap-1" style={{
                            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`
                          }}>
                            {Array.from({ length: layout.rows * layout.cols }).map((_, i) => (
                              <div key={i} className="bg-sky-500/20 rounded-sm border border-sky-500/30" />
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                          <h3 className="font-bold text-white text-lg">Add Page Numbers</h3>
                          <div className="flex gap-4">
                            {[
                              { id: false, label: 'No' },
                              { id: true, label: 'Yes' }
                            ].map(n => (
                              <label key={String(n.id)} className="flex-1 flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="numbers" 
                                  className="hidden" 
                                  checked={layout.addPageNumbers === n.id}
                                  onChange={() => setLayout({...layout, addPageNumbers: n.id as boolean})}
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${layout.addPageNumbers === n.id ? 'border-sky-500' : 'border-slate-700'}`}>
                                  {layout.addPageNumbers === n.id && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-medium">{n.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button onClick={() => setStep(3)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                            <ChevronLeft size={20} /> Back
                          </button>
                          <button onClick={() => setStep(5)} className="flex-[2] py-4 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl font-bold text-white shadow-xl shadow-sky-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <Zap size={20} /> Process File
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Processing Document */}
                {step === 5 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90">
                        <circle 
                          cx="96" cy="96" r="88" 
                          fill="none" stroke="currentColor" strokeWidth="8" 
                          className="text-white/5"
                        />
                        <circle 
                          cx="96" cy="96" r="88" 
                          fill="none" stroke="currentColor" strokeWidth="8" 
                          strokeDasharray={552.92}
                          strokeDashoffset={552.92 - (552.92 * processingProgress) / 100}
                          className="text-sky-500 transition-all duration-300 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-sky-500/40">
                          <Printer size={40} className="text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-6 w-full max-w-md">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Processing Document</h2>
                        <p className="text-slate-400">Please wait while we enhance your PDF.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sky-400 font-bold text-xl animate-pulse">Optimizing...</div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 transition-all duration-300" 
                            style={{ width: `${processingProgress}%` }} 
                          />
                        </div>
                        <div className="text-xs text-slate-500">Transforming pages into enhanced notes...</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Success! */}
                {step === 6 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 py-12">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
                      <CheckCircle size={48} className="text-white" />
                    </div>

                    <div className="text-center space-y-4">
                      <h2 className="text-4xl font-extrabold text-white">Success!</h2>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Your document is ready! Download cleanly formatted notes.
                      </p>
                    </div>

                    <div className="w-full max-w-md space-y-4">
                      <button className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
                        <Smartphone size={20} className="text-sky-400" />
                        Support Us by Watching a Short Ad
                      </button>
                      
                      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-white">Enhanced PDF</div>
                            <div className="text-xs text-slate-500">Ready for download</div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={generateFinalPdf}
                          className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl font-bold text-white shadow-xl shadow-sky-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                        >
                          <Zap size={20} />
                          Watch Ad to Download
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setStep(0)} className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
                      Start New Project
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-black/50 backdrop-blur-xl border-t border-white/5 p-4 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] font-medium tracking-widest uppercase">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Leaf size={12} className="text-green-500" />
              Eco-Friendly Printing
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-sky-500" />
              Privacy Guaranteed
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <div className="px-2 py-1 bg-white/5 rounded border border-white/10">Ad Space Available</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
