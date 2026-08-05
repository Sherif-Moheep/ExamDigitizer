import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScissorIcon } from './Icons';

type FigureCropperProps = {
  pageImage: string;
  figureKey: string;
  onApply: (figureKey: string, croppedBase64: string | null) => void;
  onCancel: () => void;
  existingCrop: boolean;
}

type SelectionArea = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const FigureCropper: React.FC<FigureCropperProps> = ({
  pageImage,
  figureKey,
  onApply,
  onCancel,
  existingCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selection, setSelection] = useState<SelectionArea | null>(null);

  const drawCanvas = useCallback((img: HTMLImageElement, sel: SelectionArea | null) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    // Scale the image to fit the canvas while maintaining aspect ratio
    const maxW = Math.min(img.width, window.innerWidth * 0.75);
    const maxH = Math.min(img.height, window.innerHeight * 0.65);
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw selection rectangle if exists
    if (sel) {
      const x = Math.min(sel.startX, sel.endX);
      const y = Math.min(sel.startY, sel.endY);
      const w = Math.abs(sel.endX - sel.startX);
      const h = Math.abs(sel.endY - sel.startY);

      // Darken outside selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, y);
      ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h);
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, canvas.width - x - w, h);

      // Draw selection border
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x, y, w, h);
    }
  }, []);

  // Load and draw the page image on the canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCanvas(img, null);
    };
    img.src = pageImage;
  }, [pageImage, drawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setSelection({ startX: x, startY: y, endX: x, endY: y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !imgRef.current) return;
    const { x, y } = getCanvasCoords(e);
    setSelection((prev) => {
      if (!prev) return null;
      const newSel = { ...prev, endX: x, endY: y };
      if (imgRef.current) {
        drawCanvas(imgRef.current, newSel);
      }
      return newSel;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleApply = () => {
    if (!selection || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;

    // Calculate crop region in original image coordinates
    const x = Math.min(selection.startX, selection.endX) * scaleX;
    const y = Math.min(selection.startY, selection.endY) * scaleY;
    const w = Math.abs(selection.endX - selection.startX) * scaleX;
    const h = Math.abs(selection.endY - selection.startY) * scaleY;

    // Create cropped image
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const croppedBase64 = cropCanvas.toDataURL('image/png');
      onApply(figureKey, croppedBase64);
    }
  };

  const handleReset = () => {
    setSelection(null);
    if (imgRef.current) drawCanvas(imgRef.current, null);
    onApply(figureKey, null);
  };

  return (
    <div
      className="cropper-overlay no-print"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="cropper-modal">
        <div className="cropper-header">
          <span className="cropper-title flex items-center gap-2">
            <ScissorIcon className="text-primary flex items-center" />
            Crop Figure
          </span>
          <span className="cropper-instructions">
            Click and drag to select the figure region
          </span>
        </div>

        <div className="cropper-canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="cropper-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="cropper-footer">
          <button className="cropper-btn cropper-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          {existingCrop && (
            <button className="cropper-btn cropper-btn-reset" onClick={handleReset}>
              Reset to Full Page
            </button>
          )}
          <button
            className="cropper-btn cropper-btn-apply"
            onClick={handleApply}
            disabled={!selection}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};
