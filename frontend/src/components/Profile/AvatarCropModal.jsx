import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import './AvatarCropModal.css';

const AvatarCropModal = ({ imageUrl, onSave, onClose }) => {
  const [zoom, setZoom] = useState(0.3); // Start smaller
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate initial zoom to fit image in the circle
      const canvas = canvasRef.current;
      if (canvas) {
        const circleRadius = 150;
        const circleDiameter = circleRadius * 2;
        
        // Get the larger dimension to ensure image covers the circle
        const maxDimension = Math.max(img.width, img.height);
        
        // Calculate zoom to fit the circle (with a bit of padding)
        const initialZoom = (circleDiameter / maxDimension) * 1.2; // 20% padding for better view
        
        console.log('Image dimensions:', img.width, 'x', img.height);
        console.log('Max dimension:', maxDimension);
        console.log('Initial zoom:', initialZoom);
        
        setZoom(initialZoom);
        
        // Reset position and rotation
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        setIsImageLoaded(true);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (isImageLoaded) {
      drawCanvas();
    }
  }, [zoom, rotation, position, isImageLoaded]);

  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and position
    const scaledWidth = img.width * zoom;
    const scaledHeight = img.height * zoom;

    ctx.drawImage(
      img,
      -scaledWidth / 2 + position.x,
      -scaledHeight / 2 + position.y,
      scaledWidth,
      scaledHeight
    );

    // Restore context state
    ctx.restore();

    // Draw circular mask overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out circle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, 2 * Math.PI);
    ctx.fill();

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw circle border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedSize = 300; // Final avatar size
    croppedCanvas.width = croppedSize;
    croppedCanvas.height = croppedSize;
    const croppedCtx = croppedCanvas.getContext('2d');

    // Draw circular clipped image
    croppedCtx.save();
    croppedCtx.beginPath();
    croppedCtx.arc(croppedSize / 2, croppedSize / 2, croppedSize / 2, 0, 2 * Math.PI);
    croppedCtx.closePath();
    croppedCtx.clip();

    // Scale and draw
    const img = imageRef.current;
    croppedCtx.translate(croppedSize / 2, croppedSize / 2);
    croppedCtx.rotate((rotation * Math.PI) / 180);
    
    const scaledWidth = img.width * zoom;
    const scaledHeight = img.height * zoom;
    const scale = croppedSize / 300; // Scale factor from canvas to final size
    
    croppedCtx.drawImage(
      img,
      (-scaledWidth / 2 + position.x) * scale,
      (-scaledHeight / 2 + position.y) * scale,
      scaledWidth * scale,
      scaledHeight * scale
    );

    croppedCtx.restore();

    // Convert to blob
    croppedCanvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="avatar-crop-modal-overlay" onClick={onClose}>
      <div className="avatar-crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>Chỉnh sửa ảnh đại diện</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div 
          className="crop-canvas-container" 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />
          <div className="crop-instructions">
            Kéo để di chuyển ảnh
          </div>
        </div>

        <div className="crop-controls">
          <div className="zoom-controls">
            <button onClick={handleZoomOut} title="Thu nhỏ">
              <ZoomOut size={20} />
            </button>
            <div className="zoom-slider">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <button onClick={handleZoomIn} title="Phóng to">
              <ZoomIn size={20} />
            </button>
          </div>

          <button className="rotate-btn" onClick={handleRotate} title="Xoay 90°">
            <RotateCw size={20} />
            Xoay
          </button>
        </div>

        <div className="crop-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSave}>
            <Check size={20} />
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropModal;

