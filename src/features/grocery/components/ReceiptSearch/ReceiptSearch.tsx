import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrocery } from '../../context/GroceryContext';
import { searchReceipts, SearchResult } from '../../hooks/useDataExport';
import { FaSearch, FaTimes, FaReceipt } from 'react-icons/fa';
import './ReceiptSearch.scss';

interface ReceiptSearchProps {
  onClose: () => void;
  onSelectReceipt?: (weekId: string, receiptId: string) => void;
}

const ReceiptSearch = ({ onClose, onSelectReceipt }: ReceiptSearchProps) => {
  const { weeks } = useGrocery();
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const results = useMemo(() => {
    return searchReceipts(weeks, query);
  }, [weeks, query]);

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const handleViewInWeek = (result: SearchResult) => {
    if (onSelectReceipt) {
      onSelectReceipt(result.weekId, result.receiptId);
    }
    onClose();
  };

  return (
    <motion.div
      className="receipt-search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="receipt-search-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-search-header">
          <h2><FaSearch /> Search Receipts</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search receipts (store, items, text...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="search-results">
          {query.length < 2 ? (
            <p className="search-hint">Type at least 2 characters to search...</p>
          ) : results.length === 0 ? (
            <p className="no-results">No receipts found for "{query}"</p>
          ) : (
            <>
              <p className="results-count">{results.length} receipt{results.length !== 1 ? 's' : ''} found</p>
              <div className="results-list">
                {results.map((result) => (
                  <motion.div
                    key={`${result.weekId}-${result.receiptId}`}
                    className={`result-item ${selectedResult?.receiptId === result.receiptId ? 'selected' : ''}`}
                    onClick={() => handleResultClick(result)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="result-icon">
                      <FaReceipt />
                    </div>
                    <div className="result-info">
                      <div className="result-header">
                        <span className="store">{result.store || 'Unknown Store'}</span>
                        <span className="week">Week {result.weekNumber}</span>
                      </div>
                      {result.total && (
                        <span className="total">{result.total.toFixed(2)} kr</span>
                      )}
                      <p className="matched-text">{result.matchedText}</p>
                      <span className="date">
                        {new Date(result.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {selectedResult && (
            <motion.div
              className="receipt-preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="preview-header">
                <h3>Receipt Preview</h3>
                <button onClick={() => setSelectedResult(null)}>
                  <FaTimes />
                </button>
              </div>
              {selectedResult.imageData && (
                <div className="preview-image">
                  <img 
                    src={selectedResult.imageData} 
                    alt="Receipt"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="preview-actions">
                <button 
                  className="view-btn"
                  onClick={() => handleViewInWeek(selectedResult)}
                >
                  View in Week {selectedResult.weekNumber}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ReceiptSearch;
