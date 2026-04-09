import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGrocery } from '../../context/GroceryContext';
import { FaShoppingCart } from 'react-icons/fa';
import { WeekCard } from './WeekCard';
import { GroceryHeader } from './GroceryHeader';
import { BudgetSection } from './BudgetSection';
import { AddItemForm } from './AddItemForm';
import { AllReceiptsViewer } from './AllReceiptsViewer';
import { SpendingCharts } from '../SpendingCharts/SpendingCharts';
import { SmartSuggestions } from '../SmartSuggestions';

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

  const [showReceiptsViewer, setShowReceiptsViewer] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showSmart, setShowSmart] = useState(false);

  const remainingBudget = getRemainingBudget();
  const isOverBudget = !!(currentBudget && currentBudget.totalBudget > 0 && remainingBudget <= 0);

  // Count total receipts across all weeks
  const totalReceiptCount = useMemo(() => {
    return weeks.reduce((count, week) => count + (week.receipts?.length || 0), 0);
  }, [weeks]);

  // Sort weeks by date (newest first)
  const sortedWeeks = [...weeks].sort((a, b) => b.weekId.localeCompare(a.weekId));

  return (
    <div className="grocery-list">
      <GroceryHeader 
        isAtHome={isAtHome}
        syncing={syncing}
        onSync={syncNow}
        receiptCount={totalReceiptCount}
        onOpenReceipts={() => setShowReceiptsViewer(true)}
        onOpenCharts={() => setShowCharts(true)}
        onOpenSmart={() => setShowSmart(!showSmart)}
        smartActive={showSmart}
      />

      <BudgetSection
        currentBudget={currentBudget}
        remainingBudget={remainingBudget}
        isOverBudget={isOverBudget}
        onSaveBudget={setBudget}
      />

      {/* Smart Suggestions Panel */}
      <AnimatePresence>
        {showSmart && (
          <SmartSuggestions onClose={() => setShowSmart(false)} />
        )}
      </AnimatePresence>

      <AddItemForm
        isOverBudget={isOverBudget}
        onAddItem={addItem}
      />

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

      {/* All Receipts Viewer */}
      <AllReceiptsViewer
        isOpen={showReceiptsViewer}
        onClose={() => setShowReceiptsViewer(false)}
      />

      {/* Spending Charts */}
      <SpendingCharts
        isOpen={showCharts}
        onClose={() => setShowCharts(false)}
      />
    </div>
  );
};

export default GroceryList;
