import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { FaCamera, FaReceipt, FaSpinner, FaTimes, FaCheck, FaEdit, FaPlus, FaTrash, FaShoppingCart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export interface ParsedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface ReceiptScannerProps {
  onScanComplete: (imageData: string, total: number | null, rawText: string) => void;
  onAddItems?: (items: ParsedItem[]) => void;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onAddItems,
  onClose,
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [detectedTotal, setDetectedTotal] = useState<number | null>(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'total' | 'items'>('items');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse individual items from receipt text
  const parseItems = (text: string): ParsedItem[] => {
    const lines = text.split('\n');
    const items: ParsedItem[] = [];
    
    // Skip keywords that indicate totals/non-items
    const skipKeywords = [
      'TOTALT', 'TOTAL', 'SUMMA', 'SUM', 'ATT BETALA', 'MOMS', 'VAT', 
      'KONTANT', 'KORT', 'CARD', 'CASH', 'RABATT', 'DISCOUNT', 'CHANGE',
      'VÄXEL', 'KVITTO', 'RECEIPT', 'TACK', 'THANK', 'VÄLKOMMEN', 'WELCOME',
      'ORG', 'NR', 'TEL', 'DATUM', 'DATE', 'TID', 'TIME', 'KASSA', 'BUTIK'
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 3) continue;

      // Skip lines with keywords
      const upperLine = trimmedLine.toUpperCase();
      if (skipKeywords.some(kw => upperLine.includes(kw))) continue;

      let itemName = '';
      let price = 0;
      let quantity = 1;

      // Try to extract quantity prefix like "2 x " or "2x " or "2 st "
      const qtyPrefixMatch = trimmedLine.match(/^(\d+)\s*[xX×*]\s*(.+)/);
      const qtySuffixMatch = trimmedLine.match(/(.+?)\s+(\d+)\s*(st|pcs|pc)\s+/i);

      let lineToProcess = trimmedLine;

      if (qtyPrefixMatch) {
        quantity = parseInt(qtyPrefixMatch[1]);
        lineToProcess = qtyPrefixMatch[2];
      } else if (qtySuffixMatch) {
        quantity = parseInt(qtySuffixMatch[2]);
        lineToProcess = qtySuffixMatch[1] + ' ' + lineToProcess.slice(qtySuffixMatch[0].length);
      }

      // Extract price from end of line
      const priceMatch = lineToProcess.match(/(-?\d{1,5})[,.](\d{2})\s*(kr|sek)?\s*$/i);
      
      if (priceMatch) {
        const priceValue = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
        
        // Skip negative values (discounts) and unreasonable prices
        if (priceValue <= 0 || priceValue > 10000) continue;

        price = priceValue;
        itemName = lineToProcess.slice(0, priceMatch.index).trim();

        // Clean up item name
        itemName = itemName
          .replace(/[\.\-_]+$/, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Skip if name is too short or looks like a code
        if (itemName.length < 2) continue;
        if (/^\d+$/.test(itemName)) continue;
        if (/^[A-Z0-9]{10,}$/.test(itemName)) continue;

        items.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: itemName,
          price,
          quantity,
          selected: true,
        });
      }
    }

    return items;
  };

  // Parse total from receipt
  const parseTotal = (text: string): number | null => {
    const lines = text.toUpperCase().split('\n');
    const totalKeywords = ['TOTALT', 'ATT BETALA', 'SUMMA', 'TOTAL', 'SUM'];
    
    for (const line of lines) {
      const hasKeyword = totalKeywords.some(keyword => line.includes(keyword));
      if (hasKeyword) {
        const numberMatch = line.match(/(\d{1,}[\s,.]?\d{2})\s*(KR|SEK)?$/i) 
                        || line.match(/(\d+[\s,.]?\d{2})/);
        if (numberMatch) {
          const numStr = numberMatch[1].replace(/\s/g, '').replace(',', '.');
          const amount = parseFloat(numStr);
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }

    let maxAmount = 0;
    const pricePattern = /(\d{2,})[,.](\d{2})/g;
    let match;
    while ((match = pricePattern.exec(text)) !== null) {
      const amount = parseFloat(`${match[1]}.${match[2]}`);
      if (amount > maxAmount && amount < 50000) {
        maxAmount = amount;
      }
    }

    return maxAmount > 0 ? maxAmount : null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImageData(dataUrl);
      await performOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const performOCR = async (imageDataUrl: string) => {
    setScanning(true);
    setProgress(0);

    try {
      const worker = await createWorker('swe+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(imageDataUrl);
      await worker.terminate();

      setRawText(text);
      
      const total = parseTotal(text);
      setDetectedTotal(total);
      setManualTotal(total?.toFixed(2) || '');

      const items = parseItems(text);
      setParsedItems(items);
      
      if (items.length > 0) {
        setActiveTab('items');
      }
    } catch (error) {
      console.error('OCR failed:', error);
      setRawText('OCR failed - please enter items manually');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmTotal = () => {
    if (!imageData) return;
    const finalTotal = manualTotal ? parseFloat(manualTotal) : detectedTotal;
    onScanComplete(imageData, finalTotal, rawText);
  };

  const handleAddSelectedItems = () => {
    if (!onAddItems) return;
    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
    }
  };

  const toggleItemSelection = (id: string) => {
    setParsedItems(prev => 
      prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  const updateItem = (id: string, field: 'name' | 'price' | 'quantity', value: string | number) => {
    setParsedItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const removeItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const addManualItem = () => {
    setParsedItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      price: 0,
      quantity: 1,
      selected: true,
    }]);
  };

  const selectedItemsTotal = parsedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      className="receipt-scanner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="receipt-scanner"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="scanner-header">
          <h3><FaReceipt /> Scan Receipt</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="scanner-content">
          {!imageData ? (
            <div className="capture-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button className="capture-btn" onClick={triggerFileInput}>
                <FaCamera />
                <span>Take Photo or Upload</span>
              </button>
              <p className="hint">Scan a receipt to extract items with prices</p>
            </div>
          ) : (
            <div className="preview-section">
              <div className="image-preview small">
                <img src={imageData} alt="Receipt" />
              </div>

              {scanning ? (
                <div className="scanning-status">
                  <FaSpinner className="spinner" />
                  <span>Scanning... {progress}%</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="result-section">
                  {/* Tab switcher */}
                  <div className="scanner-tabs">
                    <button 
                      className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                      onClick={() => setActiveTab('items')}
                    >
                      <FaShoppingCart /> Items ({parsedItems.length})
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
                      {parsedItems.length === 0 ? (
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
                              {parsedItems.map((item) => (
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
                            <span>Selected: {parsedItems.filter(i => i.selected).length} items</span>
                            <span className="items-total">{selectedItemsTotal.toFixed(2)} kr</span>
                          </div>
                        </>
                      )}

                      <div className="action-buttons">
                        <button 
                          className="retry-btn" 
                          onClick={() => {
                            setImageData(null);
                            setRawText('');
                            setParsedItems([]);
                            setDetectedTotal(null);
                          }}
                        >
                          Retake
                        </button>
                        <button 
                          className="confirm-btn"
                          onClick={handleAddSelectedItems}
                          disabled={parsedItems.filter(i => i.selected).length === 0}
                        >
                          <FaPlus /> Add {parsedItems.filter(i => i.selected).length} Items
                        </button>
                      </div>
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
                              {detectedTotal !== null 
                                ? `${detectedTotal.toFixed(2)} kr` 
                                : 'Not detected'}
                            </span>
                            <FaEdit className="edit-icon" />
                          </div>
                        )}
                      </div>

                      {rawText && (
                        <details className="raw-text-section">
                          <summary>View extracted text</summary>
                          <pre>{rawText}</pre>
                        </details>
                      )}

                      <div className="action-buttons">
                        <button 
                          className="retry-btn" 
                          onClick={() => {
                            setImageData(null);
                            setRawText('');
                            setDetectedTotal(null);
                          }}
                        >
                          Retake
                        </button>
                        <button 
                          className="confirm-btn"
                          onClick={handleConfirmTotal}
                        >
                          <FaCheck /> Save Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
