// -----------------------------------------------------------------------------
// File: DiagramDisplay.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Component to display diagrams grouped by page number
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { ImageIcon, ZoomIn } from 'lucide-react';
import type { Diagram } from '../api/client';
import DiagramZoomModal from './DiagramZoomModal';

interface DiagramDisplayProps {
  diagrams: Diagram[];
}

const DiagramDisplay = ({ diagrams }: DiagramDisplayProps) => {
  const [selectedDiagramIndex, setSelectedDiagramIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  // Group diagrams by page number
  const diagramsByPage: Record<number, Diagram[]> = {};
  diagrams.forEach((diagram) => {
    const page = diagram.page;
    if (!diagramsByPage[page]) {
      diagramsByPage[page] = [];
    }
    diagramsByPage[page].push(diagram);
  });

  // Sort pages
  const sortedPages = Object.keys(diagramsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  // Flatten diagrams for modal (maintain order)
  const allDiagrams: Diagram[] = [];
  sortedPages.forEach((page) => {
    allDiagrams.push(...diagramsByPage[page]);
  });

  const handleDiagramClick = (diagram: Diagram) => {
    const index = allDiagrams.findIndex(
      (d) => d.pdf_uuid === diagram.pdf_uuid && d.page === diagram.page && d.url === diagram.url
    );
    if (index !== -1) {
      setSelectedDiagramIndex(index);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiagramIndex(null);
  };

  return (
    <>
      <div className="mt-4 space-y-4">
        {sortedPages.map((page) => (
          <div key={page} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ImageIcon className="w-4 h-4" />
              <span>Page {page}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diagramsByPage[page].map((diagram, index) => (
                <div
                  key={`${diagram.pdf_uuid}-${page}-${index}`}
                  className="relative border border-gray-200 rounded-lg overflow-hidden bg-white group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                  onClick={() => handleDiagramClick(diagram)}
                >
                  <img
                    src={diagram.url}
                    alt={`Diagram from page ${page}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="p-4 text-center text-gray-500 text-sm">
                            Failed to load diagram
                          </div>
                        `;
                      }
                    }}
                  />
                  {/* Overlay with zoom icon */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 rounded-full p-2 shadow-lg">
                      <ZoomIn className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Modal */}
      {selectedDiagramIndex !== null && (
        <DiagramZoomModal
          diagrams={allDiagrams}
          initialIndex={selectedDiagramIndex}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default DiagramDisplay;

