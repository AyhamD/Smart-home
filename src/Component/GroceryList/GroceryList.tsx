import React, { useState } from 'react';
import { useGrocery, GroceryWeek } from '../../context/GroceryContext';
import { FaShoppingCart, FaPlus, FaCheck, FaTrash, FaHome, FaWifi, FaSync, FaCalendarWeek, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface WeekCardProps {
  week: GroceryWeek;
  isCurrentWeek: boolean;
  isAtHome: boolean;
}

const WeekCard: React.FC<WeekCardProps> = ({ week, isCurrentWeek, isAtHome }) => {
  const { toggleBought, removeItem, clearBought, updateItemPrice, getWeekTotal } = useGrocery();
  const [expanded, setExpanded] = useState(isCurrentWeek);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const unboughtItems = week.items.filter(item => !item.bought);
  const boughtItems = week.items.filter(item => item.bought);
  const weekTotal = getWeekTotal(week.weekId);

  const handleSavePrice = (itemId: string) => {
    const amount = parseFloat(priceInput);
    if (!isNaN(amount) && amount >= 0) {
      updateItemPrice(week.weekId, itemId, amount);
    }
    setEditingPriceId(null);
    setPriceInput('');
  };

  return (
    <motion.div 
      className={`week-card ${isCurrentWeek ? 'current' : ''}`}
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
        </div>
        <div className="week-summary">
          <div className="week-total">
            {weekTotal > 0 ? (
              <span className="total-amount">€{weekTotal?.toFixed(2)}</span>
            ) : (
              <span className="total-pending">€0.00</span>
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
            {/* Items list */}
            <div className="grocery-items">
              {unboughtItems.length === 0 && boughtItems.length === 0 && (
                <div className="empty-week">
                  <p>No items this week</p>
                </div>
              )}

              {unboughtItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="grocery-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <button
                    className="item-check"
                    onClick={() => toggleBought(week.weekId, item.id)}
                    aria-label="Mark as bought"
                  >
                    <div className="check-circle" />
                  </button>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="item-qty">x{item.quantity}</span>
                    )}
                  </div>
                  {isAtHome && (
                    <button
                      className="item-delete"
                      onClick={() => removeItem(week.weekId, item.id)}
                      aria-label="Delete item"
                    >
                      <FaTrash />
                    </button>
                  )}
                </motion.div>
              ))}

              {boughtItems.length > 0 && (
                <div className="bought-section">
                  <div className="bought-header">
                    <h4>Bought ({boughtItems.length})</h4>
                    {isAtHome && (
                      <button 
                        className="clear-bought-btn" 
                        onClick={() => clearBought(week.weekId)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {boughtItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className="grocery-item bought"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      <button
                        className="item-check checked"
                        onClick={() => toggleBought(week.weekId, item.id)}
                        aria-label="Mark as not bought"
                      >
                        <div className="check-circle">
                          <FaCheck />
                        </div>
                      </button>
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="item-qty">x{item.quantity}</span>
                        )}
                      </div>
                      <div className="item-price">
                        {editingPriceId === item.id ? (
                          <div className="price-input-group">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              placeholder="0.00"
                              className="price-input"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrice(item.id);
                                if (e.key === 'Escape') { setEditingPriceId(null); setPriceInput(''); }
                              }}
                            />
                            <button className="save-price-btn" onClick={() => handleSavePrice(item.id)}>
                              <FaCheck />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="edit-price-btn"
                            onClick={() => {
                              setPriceInput(item.price?.toString() || '');
                              setEditingPriceId(item.id);
                            }}
                          >
                            {item.price !== null ? `€${item.price?.toFixed(2)}` : 'Add price'}
                          </button>
                        )}
                      </div>
                      {isAtHome && (
                        <button
                          className="item-delete"
                          onClick={() => removeItem(week.weekId, item.id)}
                          aria-label="Delete item"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GroceryList: React.FC = () => {
  const { weeks, currentWeek, addItem, isAtHome, syncing, syncNow } = useGrocery();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && isAtHome) {
      addItem(newItemName, newItemQty);
      setNewItemName('');
      setNewItemQty(1);
    }
  };

  // Sort weeks by date (newest first)
  const sortedWeeks = [...weeks].sort((a, b) => b.weekId.localeCompare(a.weekId));

  return (
    <div className="grocery-list">
      <div className="grocery-header">
        <div className="grocery-title">
          <FaShoppingCart className="grocery-icon" />
          <h2>Grocery List</h2>
        </div>
        <div className="header-actions">
          <button 
            className={`sync-btn ${syncing ? 'syncing' : ''}`} 
            onClick={syncNow}
            disabled={syncing}
            title="Sync with cloud"
          >
            <FaSync />
          </button>
          <div className={`network-status ${isAtHome ? 'home' : 'away'}`}>
            {isAtHome ? (
              <>
                <FaHome /> At Home
              </>
            ) : (
              <>
                <FaWifi /> Away
              </>
            )}
          </div>
        </div>
      </div>

      {isAtHome && (
        <motion.form
          className="add-item-form"
          onSubmit={handleAddItem}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            placeholder="Add grocery item..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="item-name-input"
          />
          <input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="item-qty-input"
          />
          <button type="submit" className="add-btn" disabled={!newItemName.trim()}>
            <FaPlus />
          </button>
        </motion.form>
      )}

      {!isAtHome && (
        <div className="away-notice">
          You can only add items when at home. Tap items to mark as bought.
        </div>
      )}

      <div className="weeks-container">
        {sortedWeeks.length === 0 && (
          <div className="empty-list">
            <FaShoppingCart className="empty-icon" />
            <p>No grocery weeks yet</p>
          </div>
        )}

        {sortedWeeks.map((week) => (
          <WeekCard
            key={week.weekId}
            week={week}
            isCurrentWeek={currentWeek?.weekId === week.weekId}
            isAtHome={isAtHome}
          />
        ))}
      </div>
    </div>
  );
};

export default GroceryList;
