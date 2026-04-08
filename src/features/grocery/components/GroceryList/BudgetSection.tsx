import React, { useState } from 'react';
import { FaWallet, FaEdit, FaCheck } from 'react-icons/fa';
import { MonthlyBudget } from '../../context/GroceryContext';

interface BudgetSectionProps {
  currentBudget: MonthlyBudget | null;
  remainingBudget: number;
  isOverBudget: boolean;
  onSaveBudget: (amount: number) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  currentBudget,
  remainingBudget,
  isOverBudget,
  onSaveBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      onSaveBudget(amount);
    }
    setEditingBudget(false);
    setBudgetInput('');
  };

  const handleStartEdit = () => {
    setBudgetInput(currentBudget?.totalBudget?.toString() || '');
    setEditingBudget(true);
  };

  const handleCancelEdit = () => {
    setEditingBudget(false);
    setBudgetInput('');
  };

  return (
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
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button className="save-budget-btn" onClick={handleSaveBudget}>
              <FaCheck />
            </button>
          </div>
        ) : (
          <div className="budget-display" onClick={handleStartEdit}>
            <span className="budget-label">Monthly Budget:</span>
            <span className="budget-amount">
              {currentBudget?.totalBudget ? `${currentBudget.totalBudget.toFixed(2)} kr` : 'Not set'}
            </span>
            <FaEdit className="edit-icon" />
          </div>
        )}
      </div>
      
      {/* Budget Progress Bar */}
      {currentBudget && currentBudget.totalBudget > 0 && (
        <div className="budget-progress">
          <div className="progress-header">
            <span className="progress-label">Budget Used</span>
            <span className="progress-percent">
              {Math.min(100, Math.round((currentBudget.spent / currentBudget.totalBudget) * 100))}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div 
              className={`progress-bar-fill ${isOverBudget ? 'over-budget' : currentBudget.spent / currentBudget.totalBudget > 0.8 ? 'warning' : ''}`}
              style={{ width: `${Math.min(100, (currentBudget.spent / currentBudget.totalBudget) * 100)}%` }}
            />
          </div>
          <div className="progress-labels">
            <span className="spent-label">{currentBudget.spent.toFixed(0)} kr spent</span>
            <span className="remaining-label">{remainingBudget.toFixed(0)} kr left</span>
          </div>
        </div>
      )}
      
      {isOverBudget && (
        <div className="budget-warning">
          ⚠️ Over budget by {Math.abs(remainingBudget).toFixed(2)} kr
        </div>
      )}
    </div>
  );
};
