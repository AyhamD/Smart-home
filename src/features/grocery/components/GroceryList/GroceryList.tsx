import React, { useState } from 'react';
import { useGrocery } from '../../context/GroceryContext';
import { FaShoppingCart, FaPlus, FaHome, FaWifi, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { WeekCard } from './WeekCard';

const GroceryList: React.FC = () => {
  const { weeks, currentWeek, addItem, isAtHome, syncing, syncNow } = useGrocery();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
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
          />
        ))}
      </div>
    </div>
  );
};

export default GroceryList;
