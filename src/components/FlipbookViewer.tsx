/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  X
} from 'lucide-react';

// Set worker using Vite's local static asset import
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// External Sound Instance
// using import.meta.env.BASE_URL ensures it works on GH Pages correctly.
const soundPath = import.meta.env.BASE_URL + 'page-flip.mp3';
const flipSound = new Audio(soundPath);
flipSound.volume = 0.5;
flipSound.preload = 'auto'; // ensure fast responses

const playFlipSound = () => {
  try {
    const soundClone = flipSound.cloneNode() as HTMLAudioElement;
    soundClone.volume = 0.5;
    soundClone.play().catch((err) => {
      console.warn("Audio play blocked or failed:", err, "Path:", soundPath);
    });
  } catch(e) {
    console.error("Audio error catch:", e);
  }
};

// Global cache to persist images across navigation but free memory when needed
const globalImageCache = new Map<string, string>();

interface FlipbookViewerProps {
  document: { title: string; url: string };
  onClose: () => void;
}

const PDFPage = forwardRef<HTMLDivElement, { pageNumber: number, pdfDocument: any, isNearby: boolean, docUrl: string }>((props, ref) => {
  const { pageNumber, pdfDocument, isNearby, docUrl } = props;
  const cacheKey = `${docUrl}_${pageNumber}`;
  const [imgSrc, setImgSrc] = useState<string | null>(globalImageCache.get(cacheKey) || null);

  useEffect(() => {
    if (!isNearby || imgSrc || !pdfDocument) return;

    let active = true;
    pdfDocument.getPage(pageNumber).then((page: any) => {
      // 1.5 scale is high-quality enough for most zoom, while keeping memory extremely low
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTask.promise.then(() => {
        if (active) {
          const url = canvas.toDataURL('image/jpeg', 0.85);
          globalImageCache.set(cacheKey, url);
          setImgSrc(url);
        }
      }).catch(() => {});
    }).catch(() => {});

    return () => { active = false; };
  }, [pageNumber, docUrl, isNearby, pdfDocument, imgSrc]);

  // StPageFlip tracks element dimensions precisely, we must keep the skeleton stable
  return (
    <div ref={ref} className="bg-white w-full h-full overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] relative" data-density="soft">
      {/* Binding shadow */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none" />
      {imgSrc ? (
        <img src={imgSrc} draggable={false} className="w-full h-full object-cover pointer-events-none" alt={`Page ${pageNumber}`} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white text-neutral-400 gap-3">
          <div className="w-6 h-6 border-2 border-neutral-100 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});
PDFPage.displayName = 'PDFPage';

export function FlipbookViewer({ document: doc, onClose }: FlipbookViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Performance Pan Tracking
  const [isPanDragging, setIsPanDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const posRef = useRef({ startX: 0, startY: 0, scrollL: 0, scrollT: 0 });
  const rafRef = useRef<number | null>(null);

  // Perfect Zoom Scaling
  const [bookSize, setBookSize] = useState({ width: 0, height: 0 });
  const bookContainerRef = useRef<HTMLDivElement>(null);
  
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clear memory on heavy doc swap limits crash loops
  useEffect(() => {
    return () => {
      globalImageCache.clear();
    };
  }, [doc.url]);

  // Load PDF Document asynchronously exactly once
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    
    const loadingTask = pdfjs.getDocument(doc.url);
    loadingTask.promise.then((pdf) => {
      if (active) {
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      }
    }).catch(err => {
      if (active) {
        console.error(err);
        setError(true);
        setLoading(false);
      }
    });

    return () => { 
      active = false; 
      loadingTask.destroy(); 
    };
  }, [doc.url]);

  useEffect(() => {
    if (!bookContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setBookSize({ 
          width: entries[0].contentRect.width, 
          height: entries[0].contentRect.height 
        });
      }
    });
    observer.observe(bookContainerRef.current);
    return () => observer.disconnect();
  }, [numPages]);

  const onPageFlip = (e: { data: number }) => {
    setCurrentPage(e.data + 1);
    playFlipSound();
  };

  const nextButtonClick = useCallback(() => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipNext();
  }, []);

  const prevButtonClick = useCallback(() => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipPrev();
  }, []);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 1));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextButtonClick();
      if (e.key === 'ArrowLeft') prevButtonClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextButtonClick, prevButtonClick]);

  // High Performance Fluid Pan Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault(); 
    isDraggingRef.current = true;
    setIsPanDragging(true);
    posRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollL: scrollContainerRef.current?.scrollLeft || 0,
      scrollT: scrollContainerRef.current?.scrollTop || 0,
    };
  }, [scale]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      const dx = e.clientX - posRef.current.startX;
      const dy = e.clientY - posRef.current.startY;
      scrollContainerRef.current!.scrollLeft = posRef.current.scrollL - dx;
      scrollContainerRef.current!.scrollTop = posRef.current.scrollT - dy;
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsPanDragging(false);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex flex-col w-full h-full overflow-hidden bg-neutral-100 font-sans text-neutral-900 z-50"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.1)_100%)] pointer-events-none z-0"></div>

      {/* Top Bar Navigation */}
      <header className="absolute top-0 inset-x-0 h-14 bg-white/90 backdrop-blur-md border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 z-50 shadow-sm">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={onClose}
            title="Back to Home"
            className="w-8 h-8 rounded-full overflow-hidden border border-neutral-300 flex-shrink-0 bg-neutral-100 transition-all hover:scale-110 hover:ring-2 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
          >
            <img 
              src="./Ramayana-Mama.webp" 
              alt="RM" 
              referrerPolicy="strict-origin"
              className="w-full h-full object-cover"
            />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900 truncate max-w-[150px] sm:max-w-xs">{doc.title}</h1>
            <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-widest hidden sm:block">Ramayana Mama Edition</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={onClose}
            className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 text-xs font-medium transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Viewer Area with Custom Zoom/Pan */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        className={`absolute inset-0 z-10 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${scale > 1 ? 'overflow-auto ' + (isPanDragging ? 'cursor-grabbing' : 'cursor-grab') : 'overflow-hidden flex items-center justify-center'}`}
      >
        <div className={`inline-flex min-w-full min-h-full items-center justify-center ${scale > 1 ? 'p-2 sm:p-8 pt-20 pb-48' : 'p-2 sm:p-4 pb-20 sm:pb-4'}`}>
          {loading && (
            <div className="flex flex-col items-center justify-center text-neutral-500 gap-4 mt-20">
              <div className="w-10 h-10 border-4 border-neutral-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="tracking-wide text-sm font-medium">Parsing Document...</p>
            </div>
          )}
          {error && (
            <div className="p-6 bg-red-50 text-red-600 rounded-lg max-w-md text-center border border-red-200 shadow-sm mt-20">
              <h3 className="text-lg font-bold mb-2">Error Loading PDF</h3>
              <p className="text-sm">Please ensure the document URL is valid and accessible.</p>
            </div>
          )}
          {!loading && !error && numPages && (
            <div 
              className="relative flex-shrink-0"
              style={{
                width: bookSize.width && scale > 1 ? bookSize.width * scale : (bookSize.width || 'auto'),
                height: bookSize.height && scale > 1 ? bookSize.height * scale : (bookSize.height || 'auto'),
                transition: isPanDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              <div 
                className={`absolute top-0 left-0 ${scale > 1 ? 'pointer-events-none' : ''}`}
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top left',
                  transition: isPanDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
              >
                <div 
                  ref={bookContainerRef}
                  className="mx-auto relative shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] flipbook-strict"
                  style={{
                    height: isFullscreen ? 'min(calc(100vh - 64px), calc((100vw - 32px) * (11 / 8.5)))' : 'min(calc(100vh - 160px), calc(95vw * (11 / 8.5)))',
                    width: isFullscreen ? 'min(calc(100vw - 32px), calc((100vh - 64px) * (8.5 / 11)))' : 'min(95vw, calc((100vh - 160px) * (8.5 / 11)))'
                  }}
                >
                  <style>{`
                    .flipbook-strict .stf__parent {
                      min-width: 10% !important;
                      min-height: 10% !important;
                    }
                  `}</style>
                  <HTMLFlipBook
                    width={800}
                    height={1035}
                    size="stretch"
                    minWidth={3000}
                    maxWidth={3000}
                    minHeight={412}
                    maxHeight={2500}
                    showCover={false}
                    usePortrait={true}
                    mobileScrollSupport={true}
                    className="mx-auto w-full h-full"
                    ref={flipBookRef}
                    onFlip={onPageFlip}
                  >
                    {Array.from(new Array(numPages), (el, index) => {
                      const pageNum = index + 1;
                      const isNearby = Math.abs(pageNum - currentPage) <= 3;
                      return (
                        <PDFPage 
                          key={`page_${pageNum}`} 
                          pageNumber={pageNum} 
                          pdfDocument={pdfDoc}
                          isNearby={isNearby}
                          docUrl={doc.url}
                        />
                      );
                    })}
                  </HTMLFlipBook>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <AnimatePresence>
        {!loading && numPages && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-4 sm:bottom-8 inset-x-0 flex flex-col items-center pointer-events-none z-50 px-2 sm:px-4"
          >
            <style>{`
              input[type=range]::-webkit-slider-thumb {
                appearance: none; width: 14px; height: 14px; border-radius: 50%;
                background: #fff; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5);
                border: 2px solid #4f46e5; transition: transform 0.1s;
              }
              input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
              input[type=range]::-moz-range-thumb {
                width: 14px; height: 14px; border-radius: 50%;
                background: #fff; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5);
                border: 2px solid #4f46e5; transition: transform 0.1s;
              }
              input[type=range]::-moz-range-thumb:hover { transform: scale(1.2); }
            `}</style>
            
            <div className="bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] p-3 sm:p-4 flex flex-col items-center space-y-3 pointer-events-auto w-[calc(100vw-16px)] sm:w-auto sm:min-w-[420px] max-w-lg">
              <div className="flex items-center space-x-4 w-full px-2">
                 <span className="text-[10px] font-mono text-neutral-500">01</span>
                 <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={1}
                      max={numPages}
                      value={currentPage}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value);
                        if (flipBookRef.current) {
                          flipBookRef.current.pageFlip().flip(newPage - 1);
                        }
                      }}
                      className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer focus:outline-none transition-all"
                      style={{
                        background: `linear-gradient(to right, #4f46e5 ${numPages > 1 ? ((currentPage - 1) / (numPages - 1)) * 100 : 0}%, #e5e5e5 ${numPages > 1 ? ((currentPage - 1) / (numPages - 1)) * 100 : 0}%)`
                      }}
                    />
                 </div>
                 <span className="text-[10px] font-mono text-neutral-500">{numPages < 10 ? `0${numPages}` : numPages}</span>
              </div>
            
              <div className="flex items-center justify-center space-x-3 sm:space-x-8 w-full">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button 
                    onClick={handleZoomOut}
                    disabled={scale <= 1}
                    className="p-1.5 sm:p-1 text-neutral-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => setScale(1)}
                    className="text-xs font-bold text-neutral-800 w-8 sm:w-10 text-center hover:text-indigo-600 transition-colors"
                    title="Reset Zoom to 100%"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                  <button 
                    onClick={handleZoomIn}
                    className="p-1.5 sm:p-1 text-neutral-500 hover:text-indigo-600 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-neutral-200"></div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button 
                    onClick={prevButtonClick}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-1 text-neutral-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] sm:text-xs font-medium">
                    <div className="w-7 h-6 sm:w-8 sm:h-6 bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-indigo-600 font-mono shadow-inner text-xs">
                      {currentPage}
                    </div>
                    <span className="text-neutral-500 font-mono whitespace-nowrap">OF {numPages}</span>
                  </div>

                  <button 
                    onClick={nextButtonClick}
                    disabled={currentPage === numPages}
                    className="p-1.5 sm:p-1 text-neutral-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-neutral-200 hidden sm:block"></div>

                <button 
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-1 text-neutral-500 hover:text-indigo-600 transition-colors hidden sm:block"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
