import React, { useState, useMemo } from 'react';
import { FaReceipt, FaTimes, FaCalendarWeek, FaTrash, FaChevronLeft, FaChevronRight, FaCloud, FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrocery, Receipt,GroceryWeek } from '../../context/GroceryContext';

interface ReceiptWithWeek extends Receipt {
  weekId: string;
  weekNumber: number;
  weekDates: string;
}

interface AllReceiptsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllReceiptsViewer: React.FC<AllReceiptsViewerProps> = ({ isOpen, onClose }) => {
  const { weeks, removeReceipt } = useGrocery();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithWeek | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterWeek, setFilterWeek] = useState<string>('all');

  // Collect all receipts from all weeks
  const allReceipts = useMemo(() => {
    const receipts: ReceiptWithWeek[] = [];
    weeks.forEach(week => {
      (week.receipts || []).forEach(receipt => {
        receipts.push({
          ...receipt,
          weekId: week.weekId,
          weekNumber: week.weekNumber,
          weekDates: `${week.startDate} - ${week.endDate}`,
        });
      });
    });
    // Sort by date (newest first)
    return receipts.sort((a, b) => b.addedAt - a.addedAt);
  }, [weeks]);

  // Filter by week if selected
  const filteredReceipts = useMemo(() => {
    if (filterWeek === 'all') return allReceipts;
    return allReceipts.filter(r => r.weekId === filterWeek);
  }, [allReceipts, filterWeek]);

  // Get unique weeks for filter dropdown
  const weeksWithReceipts = useMemo(() => {
    const weekMap = new Map<string, GroceryWeek>();
    weeks.forEach(week => {
      if (week.receipts && week.receipts.length > 0) {
        weekMap.set(week.weekId, week);
      }
    });
    return Array.from(weekMap.values()).sort((a, b) => b.weekId.localeCompare(a.weekId));
  }, [weeks]);

  const totalFromReceipts = allReceipts
    .filter(r => r.scannedTotal !== null)
    .reduce((sum, r) => sum + (r.scannedTotal || 0), 0);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredReceipts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < filteredReceipts.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = (receipt: ReceiptWithWeek) => {
    if (window.confirm('Delete this receipt?')) {
      removeReceipt(receipt.weekId, receipt.id);
      if (selectedReceipt?.id === receipt.id) {
        setSelectedReceipt(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="all-receipts-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="all-receipts-viewer"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="viewer-header">
          <div className="header-title">
            <FaReceipt />
            <h2>All Receipts</h2>
            <span className="receipt-count">{allReceipts.length} receipts</span>
          </div>
          <div className="header-actions">
            <div className="cloud-status">
              <FaCloud /> Synced
            </div>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="viewer-stats">
          <div className="stat">
            <span className="stat-label">Total from receipts</span>
            <span className="stat-value">{totalFromReceipts.toFixed(2)} kr</span>
          </div>
          <div className="stat">
            <span className="stat-label">Weeks with receipts</span>
            <span className="stat-value">{weeksWithReceipts.length}</span>
          </div>
        </div>

        {weeksWithReceipts.length > 1 && (
          <div className="filter-section">
            <FaSearch className="filter-icon" />
            <select 
              value={filterWeek} 
              onChange={(e) => {
                setFilterWeek(e.target.value);
                setCurrentIndex(0);
              }}
              className="week-filter"
            >
              <option value="all">All weeks</option>
              {weeksWithReceipts.map(week => (
                <option key={week.weekId} value={week.weekId}>
                  Week {week.weekNumber} ({week.startDate} - {week.endDate})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="viewer-content">
          {filteredReceipts.length === 0 ? (
            <div className="no-receipts">
              <FaReceipt className="empty-icon" />
              <p>No receipts saved yet</p>
              <span>Scan receipts from your weekly grocery lists</span>
            </div>
          ) : (
            <div className="receipts-grid">
              {filteredReceipts.map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  className="receipt-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedReceipt(receipt);
                    setCurrentIndex(index);
                  }}
                >
                  <div className="receipt-image">
                    <img src={receipt.imageData} alt={`Receipt from week ${receipt.weekNumber}`} />
                  </div>
                  <div className="receipt-info">
                    <div className="receipt-week">
                      <FaCalendarWeek />
                      <span>Week {receipt.weekNumber}</span>
                    </div>
                    <div className="receipt-date">
                      {new Date(receipt.addedAt).toLocaleDateString('sv-SE')}
                    </div>
                    {receipt.scannedTotal !== null && (
                      <div className="receipt-total">{receipt.scannedTotal.toFixed(2)} kr</div>
                    )}
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(receipt);
                    }}
                  >
                    <FaTrash />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Full-screen receipt view */}
        <AnimatePresence>
          {selectedReceipt && (
            <motion.div
              className="receipt-fullscreen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
            >
              <motion.div
                className="fullscreen-content"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="fullscreen-header">
                  <div className="receipt-meta">
                    <span className="week-badge">
                      <FaCalendarWeek /> Week {filteredReceipts[currentIndex]?.weekNumber}
                    </span>
                    <span className="date">
                      {new Date(filteredReceipts[currentIndex]?.addedAt).toLocaleDateString('sv-SE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <button className="close-btn" onClick={() => setSelectedReceipt(null)}>
                    <FaTimes />
                  </button>
                </div>

                <div className="fullscreen-image">
                  {filteredReceipts.length > 1 && (
                    <button className="nav-btn prev" onClick={handlePrev}>
                      <FaChevronLeft />
                    </button>
                  )}
                  
                  <img 
                    src={filteredReceipts[currentIndex]?.imageData} 
                    alt="Receipt" 
                  />

                  {filteredReceipts.length > 1 && (
                    <button className="nav-btn next" onClick={handleNext}>
                      <FaChevronRight />
                    </button>
                  )}
                </div>

                <div className="fullscreen-footer">
                  {filteredReceipts[currentIndex]?.scannedTotal !== null && (
                    <span className="total">
                      Total: {filteredReceipts[currentIndex]?.scannedTotal?.toFixed(2)} kr
                    </span>
                  )}
                  <span className="indicator">
                    {currentIndex + 1} / {filteredReceipts.length}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
