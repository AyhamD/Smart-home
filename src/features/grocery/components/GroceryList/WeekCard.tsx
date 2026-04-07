import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaCalendarWeek, FaChevronUp, FaChevronDown, FaLock, FaCamera } from "react-icons/fa";
import { GroceryWeek, useGrocery } from "../../context/GroceryContext";
import { GroceryItem } from "./GroceryItem";
import { BoughtSection } from "./BoughtSection";
import { ReceiptScanner, ParsedItem } from "./ReceiptScanner";
import { ReceiptGallery } from "./ReceiptGallery";

interface WeekCardProps {
  week: GroceryWeek;
  isCurrentWeek: boolean;
}


export const WeekCard: React.FC<WeekCardProps> = ({ week, isCurrentWeek }) => {
  const { toggleBought, removeItem, clearBought, updateItemPrice, getWeekTotal, finalizeWeek, addReceipt, removeReceipt, addScannedItems } = useGrocery();
  const [expanded, setExpanded] = useState(isCurrentWeek);
  const [showScanner, setShowScanner] = useState(false);

  const unboughtItems = week.items.filter(item => !item.bought);
  const boughtItems = week.items.filter(item => item.bought);
  const weekTotal = getWeekTotal(week.weekId);
  const isFinalized = week.finalized;
  const receipts = week.receipts || [];

  const handleScanComplete = (imageData: string, total: number | null, rawText: string) => {
    addReceipt(week.weekId, imageData, total, rawText);
    setShowScanner(false);
  };

  const handleAddItems = (items: ParsedItem[]) => {
    addScannedItems(week.weekId, items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })));
    setShowScanner(false);
  };

  return (
    <>
      <motion.div 
        className={`week-card ${isCurrentWeek ? 'current' : ''} ${isFinalized ? 'finalized' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="week-header" onClick={() => setExpanded(!expanded)}>
          <div className="week-info">
            <FaCalendarWeek className="week-icon" />
            <div className="week-details">
              <h3>Week {week.weekNumber}</h3>
              <span className="week-dates">{week.startDate} - {week.endDate}</span>
            </div>
            {isCurrentWeek && <span className="current-badge">Current</span>}
            {isFinalized && <span className="finalized-badge"><FaLock /> Closed</span>}
          </div>
          <div className="week-summary">
            <div className="week-total">
              {weekTotal > 0 ? (
                <span className="total-amount">{weekTotal?.toFixed(2)} kr</span>
              ) : (
                <span className="total-pending">0.00 kr</span>
              )}
            </div>
            <span className="item-count">{week.items.length} items</span>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="week-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {/* Receipt Scanner Button */}
              {!isFinalized && (
                <button 
                  className="scan-receipt-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScanner(true);
                  }}
                >
                  <FaCamera /> Scan Receipt
                </button>
              )}

              {/* Receipt Gallery */}
              {receipts.length > 0 && (
                <ReceiptGallery
                  receipts={receipts}
                  onRemove={(receiptId) => removeReceipt(week.weekId, receiptId)}
                  isFinalized={isFinalized ?? false}
                />
              )}

              {/* Items list */}
              <div className="grocery-items">
                {unboughtItems.length === 0 && boughtItems.length === 0 && (
                  <div className="empty-week">
                    <p>No items this week</p>
                  </div>
                )}

                {unboughtItems.map((item) => (
                  <GroceryItem
                    key={item.id}
                    item={item}
                    onToggleBought={() => toggleBought(week.weekId, item.id)}
                    onRemove={() => removeItem(week.weekId, item.id)}
                  />
                ))}

                {boughtItems.length > 0 && (
                  <BoughtSection
                    items={boughtItems}
                    isFinalized={isFinalized ?? false}
                    onToggleBought={(itemId) => toggleBought(week.weekId, itemId)}
                    onRemoveItem={(itemId) => removeItem(week.weekId, itemId)}
                    onUpdatePrice={(itemId, price) => updateItemPrice(week.weekId, itemId, price)}
                    onClearBought={() => clearBought(week.weekId)}
                  />
                )}
              </div>

              {/* Finalize Week Button */}
              {!isFinalized && boughtItems.length > 0 && (
                <div className="finalize-section">
                  <button 
                    className="finalize-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Finalize week ${week.weekNumber}? This will lock the total (${weekTotal.toFixed(2)} kr) and deduct it from your monthly budget.`)) {
                        finalizeWeek(week.weekId);
                      }
                    }}
                  >
                    <FaLock /> Close Week & Deduct from Budget
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onAddItems={handleAddItems}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};