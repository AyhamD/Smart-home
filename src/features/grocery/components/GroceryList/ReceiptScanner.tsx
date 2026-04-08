import React, { useState, useRef } from 'react';
import { FaCamera, FaReceipt, FaSpinner, FaTimes, FaCheck, FaEdit, FaPlus, FaTrash, FaShoppingCart, FaImage, FaSyncAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '../../hooks/useCamera';
import { useReceiptOCR, ParsedItem } from '../../hooks/useReceiptOCR';

// Re-export ParsedItem for backwards compatibility
export type { ParsedItem } from '../../hooks/useReceiptOCR';

export interface AddItemsData {
  items: ParsedItem[];
  imageData: string;
  rawText: string;
  store: string | null;
}

interface ReceiptScannerProps {
  onScanComplete: (imageData: string, total: number | null, rawText: string, store: string | null) => void;
  onAddItems?: (data: AddItemsData) => void;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onAddItems,
  onClose,
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState('');
  const [activeTab, setActiveTab] = useState<'total' | 'items'>('items');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use custom hooks
  const camera = useCamera();
  const ocr = useReceiptOCR();

  // Handle photo capture
  const handleCapturePhoto = () => {
    const photoData = camera.capturePhoto();
    if (photoData) {
      camera.stopCamera();
      setImageData(photoData);
      ocr.performOCR(photoData);
    }
  };

  // Update manual total when detected total changes
  React.useEffect(() => {
    if (ocr.detectedTotal !== null) {
      setManualTotal(ocr.detectedTotal.toFixed(2));
    }
  }, [ocr.detectedTotal]);

  // Set active tab to items when items are parsed
  React.useEffect(() => {
    if (ocr.parsedItems.length > 0) {
      setActiveTab('items');
    }
  }, [ocr.parsedItems.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImageData(dataUrl);
      await ocr.performOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmTotal = () => {
    if (!imageData) return;
    let finalTotal: number | null = null;
    
    if (manualTotal && manualTotal.trim() !== '') {
      const parsed = parseFloat(manualTotal);
      if (!isNaN(parsed)) {
        finalTotal = parsed;
      }
    } else if (ocr.detectedTotal !== null) {
      finalTotal = ocr.detectedTotal;
    }
    
    onScanComplete(imageData, finalTotal, ocr.rawText, ocr.detectedStore);
  };

  const handleAddSelectedItems = () => {
    if (!onAddItems || !imageData) return;
    const selectedItems = ocr.parsedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      // Pass all data to parent - parent will save receipt and items
      onAddItems({
        items: selectedItems,
        imageData,
        rawText: ocr.rawText,
        store: ocr.detectedStore,
      });
    }
  };

  const toggleItemSelection = (id: string) => {
    ocr.setParsedItems(prev => 
      prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  const updateItem = (id: string, field: 'name' | 'price' | 'quantity', value: string | number) => {
    ocr.setParsedItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const removeItem = (id: string) => {
    ocr.setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const addManualItem = () => {
    ocr.setParsedItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      price: 0,
      quantity: 1,
      selected: true,
    }]);
  };

  const handleRetry = () => {
    setImageData(null);
    ocr.resetOCR();
  };

  const handleClose = () => {
    camera.stopCamera();
    onClose();
  };

  const selectedItemsTotal = ocr.parsedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <motion.div 
      className="receipt-scanner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div 
        className="receipt-scanner"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scanner-header">
          <h3><FaReceipt /> Scan Receipt</h3>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="scanner-content">
          {/* Hidden canvas for photo capture */}
          <canvas ref={camera.canvasRef} style={{ display: 'none' }} />
          
          {camera.cameraMode && !imageData ? (
            // Live camera view
            <div className="camera-view">
              {/* Close button in camera view */}
              <button className="camera-close-btn" onClick={handleClose}>
                <FaTimes />
              </button>
              <video 
                ref={camera.videoRef} 
                playsInline 
                autoPlay 
                muted
                className="camera-feed"
              />
              <div className="camera-overlay">
                <div className="scan-guide">
                  <span>Position receipt within frame</span>
                </div>
              </div>
              <div className="camera-controls">
                <button className="switch-camera-btn" onClick={camera.switchCamera}>
                  <FaSyncAlt />
                </button>
                <button className="capture-photo-btn" onClick={handleCapturePhoto}>
                  <FaCamera />
                </button>
                <button className="cancel-camera-btn" onClick={camera.stopCamera}>
                  <FaTimes />
                </button>
              </div>
            </div>
          ) : !imageData ? (
            <div className="capture-section">
              {camera.cameraError && (
                <div className="camera-error">
                  <p>{camera.cameraError}</p>
                </div>
              )}
              
              <div className="capture-options">
                {/* Use label for better mobile file input support */}
                <label className="capture-btn gallery">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <FaImage />
                  <span>Choose Photo</span>
                </label>
              </div>
              <p className="hint">Scan a receipt to extract items with prices</p>
            </div>
          ) : (
            <div className="preview-section">
              <div className="image-preview small">
                <img src={imageData} alt="Receipt" />
              </div>

              {ocr.scanning ? (
                <div className="scanning-status">
                  <FaSpinner className="spinner" />
                  <span>Scanning... {ocr.progress}%</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${ocr.progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="result-section">
                  {/* Store detection badge */}
                  {ocr.detectedStore && (
                    <div className="store-badge">
                      <span className="store-label">Store:</span>
                      <span className="store-name">{ocr.detectedStore}</span>
                    </div>
                  )}

                  {/* Tab switcher */}
                  <div className="scanner-tabs">
                    <button 
                      className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                      onClick={() => setActiveTab('items')}
                    >
                      <FaShoppingCart /> Items ({ocr.parsedItems.length})
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'total' ? 'active' : ''}`}
                      onClick={() => setActiveTab('total')}
                    >
                      Total Only
                    </button>
                  </div>

                  {activeTab === 'items' ? (
                    <div className="items-tab">
                      {ocr.parsedItems.length === 0 ? (
                        <div className="no-items">
                          <p>No items detected. Add manually:</p>
                          <button className="add-item-btn" onClick={addManualItem}>
                            <FaPlus /> Add Item
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="parsed-items-list">
                            <AnimatePresence>
                              {ocr.parsedItems.map((item) => (
                                <motion.div
                                  key={item.id}
                                  className={`parsed-item ${item.selected ? 'selected' : ''}`}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  layout
                                >
                                  <button 
                                    className={`item-checkbox ${item.selected ? 'checked' : ''}`}
                                    onClick={() => toggleItemSelection(item.id)}
                                  >
                                    {item.selected && <FaCheck />}
                                  </button>
                                  
                                  {editingItemId === item.id ? (
                                    <div className="item-edit-form">
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                        placeholder="Item name"
                                        className="edit-name"
                                        autoFocus
                                      />
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                        min="1"
                                        className="edit-qty"
                                      />
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="edit-price"
                                      />
                                      <button 
                                        className="done-edit-btn"
                                        onClick={() => setEditingItemId(null)}
                                      >
                                        <FaCheck />
                                      </button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="item-display"
                                      onClick={() => setEditingItemId(item.id)}
                                    >
                                      <span className="item-name">
                                        {item.name || 'Unnamed item'}
                                        {item.quantity > 1 && <span className="item-qty"> ×{item.quantity}</span>}
                                      </span>
                                      <span className="item-price">{item.price.toFixed(2)} kr</span>
                                    </div>
                                  )}
                                  
                                  <button 
                                    className="remove-item-btn"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <FaTrash />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                          
                          <button className="add-item-btn small" onClick={addManualItem}>
                            <FaPlus /> Add Item
                          </button>
                          
                          <div className="items-summary">
                            <span>Selected: {ocr.parsedItems.filter(i => i.selected).length} items</span>
                            <span className="items-total">{selectedItemsTotal.toFixed(2)} kr</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="total-tab">
                      <div className="detected-total">
                        <label>Detected Total:</label>
                        {editingTotal ? (
                          <div className="edit-total">
                            <input
                              type="number"
                              step="0.01"
                              value={manualTotal}
                              onChange={(e) => setManualTotal(e.target.value)}
                              placeholder="0.00"
                              autoFocus
                            />
                            <span className="currency">kr</span>
                            <button onClick={() => setEditingTotal(false)}>
                              <FaCheck />
                            </button>
                          </div>
                        ) : (
                          <div className="total-display" onClick={() => setEditingTotal(true)}>
                            <span className="amount">
                              {ocr.detectedTotal !== null 
                                ? `${ocr.detectedTotal.toFixed(2)} kr` 
                                : 'Not detected'}
                            </span>
                            <FaEdit className="edit-icon" />
                          </div>
                        )}
                      </div>

                      {ocr.rawText && (
                        <details className="raw-text-section">
                          <summary>View extracted text</summary>
                          <pre>{ocr.rawText}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed footer with action buttons - always visible */}
        {imageData && !ocr.scanning && (
          <div className="scanner-footer">
            <button className="retry-btn" onClick={handleRetry}>
              Retake
            </button>
            {activeTab === 'items' ? (
              <button 
                className="confirm-btn"
                onClick={handleAddSelectedItems}
                disabled={ocr.parsedItems.filter(i => i.selected).length === 0}
              >
                <FaPlus /> Add {ocr.parsedItems.filter(i => i.selected).length} Items
              </button>
            ) : (
              <button className="confirm-btn" onClick={handleConfirmTotal}>
                <FaCheck /> Save Receipt
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
