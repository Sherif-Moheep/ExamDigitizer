import React, { useState } from 'react';
import { PdfPage } from '../../domain/models/PdfPage';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

type PdfThumbnailsProps = {
  pageImages: PdfPage[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const PdfThumbnails: React.FC<PdfThumbnailsProps> = ({
  pageImages,
  collapsed,
  onToggleCollapse,
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (collapsed) {
    return (
      <button
        className="thumbnails-expand-btn no-print flex items-center justify-center"
        onClick={onToggleCollapse}
        title="Show original pages"
      >
        <ChevronRightIcon />
      </button>
    );
  }

  return (
    <>
      <div className="pdf-thumbnails no-print">
        <div className="thumbnails-header">
          <span className="thumbnails-title">Original Pages</span>
          <button
            className="thumbnails-collapse-btn flex items-center justify-center"
            onClick={onToggleCollapse}
            title="Hide thumbnails"
          >
            <ChevronLeftIcon />
          </button>
        </div>
        <div className="thumbnails-list">
          {pageImages.map((page) => (
            <div
              key={page.pageNum}
              className="thumbnail-card"
              onClick={() => setLightboxImage(page.base64)}
            >
              <img src={page.base64} alt={`Page ${page.pageNum}`} />
              <span className="thumbnail-page-num">Page {page.pageNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxImage && (
        <div className="thumbnail-lightbox" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Full page view" />
        </div>
      )}
    </>
  );
};
