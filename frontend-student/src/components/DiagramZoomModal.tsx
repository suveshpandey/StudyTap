// -----------------------------------------------------------------------------
// File: DiagramZoomModal.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Modal component for zooming diagrams
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Diagram } from '../api/client';

interface DiagramZoomModalProps {
  diagrams: Diagram[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const DiagramZoomModal = ({ diagrams, initialIndex, isOpen, onClose }: DiagramZoomModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : diagrams.length - 1));
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < diagrams.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, diagrams.length, onClose]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : diagrams.length - 1));
    setZoomLevel(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < diagrams.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  if (!isOpen || diagrams.length === 0) return null;

  const currentDiagram = diagrams[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-white">
                    <div className="text-sm font-medium">
                      Page {currentDiagram.page}
                    </div>
                    <div className="text-xs text-gray-300">
                      {currentIndex + 1} of {diagrams.length}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1">
                    <button
                      onClick={handleZoomOut}
                      className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-white text-xs px-2 min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                <div className="relative max-w-full max-h-full">
                  <motion.img
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={currentDiagram.url}
                    alt={`Diagram from page ${currentDiagram.page}`}
                    className="max-w-full max-h-[90vh] object-contain"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease-out',
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Navigation Arrows */}
              {diagrams.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                    title="Previous (←)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                    title="Next (→)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Footer with thumbnails */}
              {diagrams.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full">
                    {diagrams.map((diagram, index) => (
                      <button
                        key={`${diagram.pdf_uuid}-${diagram.page}-${index}`}
                        onClick={() => {
                          setCurrentIndex(index);
                          setZoomLevel(1);
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                          index === currentIndex
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                            : 'border-transparent hover:border-white/50'
                        }`}
                      >
                        <img
                          src={diagram.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DiagramZoomModal;

