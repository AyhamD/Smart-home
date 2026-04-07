import React, { useState } from 'react';
import { useGrocery } from '../../context/GroceryContext';
import { FaShoppingCart, FaPlus, FaHome, FaWifi, FaSync, FaWallet, FaEdit, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { WeekCard } from './WeekCard';

const GroceryList: React.FC = () => {
  const { 
    weeks, 
    currentWeek, 
    addItem, 
    isAtHome, 
    syncing, 
    syncNow,
    currentBudget,
    setBudget,
    getRemainingBudget 
  } = useGrocery();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const remainingBudget = getRemainingBudget();
  const isOverBudget = !!(currentBudget && currentBudget.totalBudget > 0 && remainingBudget <= 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && !isOverBudget) {
      addItem(newItemName, newItemQty);
      setNewItemName('');
      setNewItemQty(1);
    }
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      setBudget(amount);
    }
    setEditingBudget(false);
    setBudgetInput('');
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

      {/* Budget Section */}
      <div className="budget-section">
        <div className="budget-info">
          <FaWallet className="budget-icon" />
          {editingBudget ? (
            <div className="budget-edit">
              <input
                type="number"
                step="1"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Enter budget..."
                className="budget-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveBudget();
                  if (e.key === 'Escape') { setEditingBudget(false); setBudgetInput(''); }
                }}
              />
              <button className="save-budget-btn" onClick={handleSaveBudget}>
                <FaCheck />
              </button>
            </div>
          ) : (
            <div className="budget-display" onClick={() => {
              setBudgetInput(currentBudget?.totalBudget?.toString() || '');
              setEditingBudget(true);
            }}>
              <span className="budget-label">Monthly Budget:</span>
              <span className="budget-amount">
                {currentBudget?.totalBudget ? `${currentBudget.totalBudget.toFixed(2)} kr` : 'Not set'}
              </span>
              <FaEdit className="edit-icon" />
            </div>
          )}
        </div>
        {currentBudget && currentBudget.totalBudget > 0 && (
          <div className={`budget-remaining ${isOverBudget ? 'over-budget' : ''}`}>
            <span>Remaining: </span>
            <span className="remaining-amount">{remainingBudget.toFixed(2)} kr</span>
            {currentBudget.spent > 0 && (
              <span className="spent-amount">(Spent: {currentBudget.spent.toFixed(2)} kr)</span>
            )}
          </div>
        )}
      </div>

      <motion.form
        className="add-item-form"
        onSubmit={handleAddItem}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input
          type="text"
          placeholder={isOverBudget ? "Budget exceeded!" : "Add grocery item..."}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="item-name-input"
          disabled={isOverBudget}
        />
        <input
          type="number"
          min="1"
          value={newItemQty}
          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="item-qty-input"
          disabled={isOverBudget}
        />
        <button type="submit" className="add-btn" disabled={!newItemName.trim() || isOverBudget}>
          <FaPlus />
        </button>
      </motion.form>

      {isOverBudget && (
        <div className="budget-warning">
          ⚠️ Budget exceeded! Finalize a week or increase your budget to add more items.
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
          />
        ))}
      </div>
    </div>
  );
};

export default GroceryList;
