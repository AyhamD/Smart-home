import React, { useState } from 'react';
import { FaReceipt, FaTimes, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt } from '../../context/GroceryContext';

interface ReceiptGalleryProps {
  receipts: Receipt[];
  onRemove: (receiptId: string) => void;
  isFinalized: boolean;
}

export const ReceiptGallery: React.FC<ReceiptGalleryProps> = ({
  receipts,
  onRemove,
  isFinalized,
}) => {
  const [expandedReceipt, setExpandedReceipt] = useState<Receipt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (receipts.length === 0) return null;

  const totalFromReceipts = receipts
    .filter(r => r.scannedTotal !== null)
    .reduce((sum, r) => sum + (r.scannedTotal || 0), 0);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : receipts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < receipts.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="receipt-gallery">
        <div className="gallery-header">
          <FaReceipt className="receipt-icon" />
          <span className="receipt-count">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</span>
          {totalFromReceipts > 0 && (
            <span className="receipts-total">{totalFromReceipts.toFixed(2)} kr</span>
          )}
        </div>
        
        <div className="receipt-thumbnails">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              className="receipt-thumbnail"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setExpandedReceipt(receipt);
                setCurrentIndex(index);
              }}
            >
              <img src={receipt.imageData} alt={`Receipt ${index + 1}`} />
              {receipt.scannedTotal !== null && (
                <span className="thumbnail-amount">{receipt.scannedTotal.toFixed(0)} kr</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded view modal */}
      <AnimatePresence>
        {expandedReceipt && (
          <motion.div
            className="receipt-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedReceipt(null)}
          >
            <motion.div
              className="receipt-modal"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <span className="receipt-date">
                  {new Date(receipts[currentIndex].addedAt).toLocaleDateString('sv-SE')}
                </span>
                <div className="modal-actions">
                  {!isFinalized && (
                    <button
                      className="delete-btn"
                      onClick={() => {
                        onRemove(receipts[currentIndex].id);
                        if (receipts.length <= 1) {
                          setExpandedReceipt(null);
                        } else {
                          setCurrentIndex(prev => Math.min(prev, receipts.length - 2));
                        }
                      }}
                    >
                      <FaTrash />
                    </button>
                  )}
                  <button className="close-btn" onClick={() => setExpandedReceipt(null)}>
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="modal-content">
                {receipts.length > 1 && (
                  <button className="nav-btn prev" onClick={handlePrev}>
                    <FaChevronLeft />
                  </button>
                )}
                
                <div className="receipt-image-container">
                  <img 
                    src={receipts[currentIndex].imageData} 
                    alt="Receipt" 
                  />
                </div>

                {receipts.length > 1 && (
                  <button className="nav-btn next" onClick={handleNext}>
                    <FaChevronRight />
                  </button>
                )}
              </div>

              <div className="modal-footer">
                {receipts[currentIndex].scannedTotal !== null && (
                  <span className="receipt-total">
                    Total: {receipts[currentIndex].scannedTotal?.toFixed(2)} kr
                  </span>
                )}
                <span className="receipt-indicator">
                  {currentIndex + 1} / {receipts.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
