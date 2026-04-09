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
import ReceiptSearch from '../ReceiptSearch/ReceiptSearch';
import { exportToCSV, shareSpendingSummary } from '../../hooks/useDataExport';
import { useToast } from '../../../../shared/context/ToastContext';

const GroceryList: React.FC = () => {
  const { 
    weeks, 
    budgets,
    currentWeek, 
    addItem, 
    isAtHome, 
    syncing, 
    syncNow,
    currentBudget,
    setBudget,
    getRemainingBudget,
  } = useGrocery();
  
  const { showSuccess, showError, showInfo } = useToast();

  const [showReceiptsViewer, setShowReceiptsViewer] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showSmart, setShowSmart] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const remainingBudget = getRemainingBudget();
  const isOverBudget = !!(currentBudget && currentBudget.totalBudget > 0 && remainingBudget <= 0);

  // Count total receipts across all weeks
  const totalReceiptCount = useMemo(() => {
    return weeks.reduce((count, week) => count + (week.receipts?.length || 0), 0);
  }, [weeks]);

  // Sort weeks by date (newest first)
  const sortedWeeks = [...weeks].sort((a, b) => b.weekId.localeCompare(a.weekId));

  // Sync handler with toast feedback
  const handleSync = async () => {
    try {
      await syncNow();
      showSuccess('Synced successfully!');
    } catch {
      showError('Sync failed. Please try again.');
    }
  };

  // Export handler
  const handleExport = () => {
    try {
      const filename = `grocery-data-${new Date().toISOString().slice(0, 10)}`;
      exportToCSV(weeks, budgets, filename);
      showSuccess('Data exported to CSV');
    } catch {
      showError('Export failed');
    }
  };

  // Share handler
  const handleShare = async () => {
    try {
      const success = await shareSpendingSummary(weeks, budgets);
      if (success) {
        showSuccess('Summary shared!');
      } else {
        showInfo('Summary copied to clipboard');
      }
    } catch {
      showError('Could not share summary');
    }
  };

  return (
    <div className="grocery-list">
      <GroceryHeader 
        isAtHome={isAtHome}
        syncing={syncing}
        onSync={handleSync}
        receiptCount={totalReceiptCount}
        onOpenReceipts={() => setShowReceiptsViewer(true)}
        onOpenCharts={() => setShowCharts(true)}
        onOpenSmart={() => setShowSmart(!showSmart)}
        smartActive={showSmart}
        onOpenSearch={() => setShowSearch(true)}
        onExport={handleExport}
        onShare={handleShare}
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

      {/* Receipt Search */}
      <AnimatePresence>
        {showSearch && (
          <ReceiptSearch
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroceryList;
