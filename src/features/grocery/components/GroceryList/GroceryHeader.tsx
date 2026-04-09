import React from 'react';
import { FaShoppingCart, FaHome, FaWifi, FaSync, FaReceipt, FaChartPie, FaBrain } from 'react-icons/fa';

interface GroceryHeaderProps {
  isAtHome: boolean;
  syncing: boolean;
  onSync: () => void;
  receiptCount?: number;
  onOpenReceipts?: () => void;
  onOpenCharts?: () => void;
  onOpenSmart?: () => void;
  smartActive?: boolean;
}

export const GroceryHeader: React.FC<GroceryHeaderProps> = ({ 
  isAtHome, 
  syncing, 
  onSync,
  receiptCount = 0,
  onOpenReceipts,
  onOpenCharts,
  onOpenSmart,
  smartActive = false,
}) => {
  return (
    <div className="grocery-header">
      <div className="grocery-title">
        <FaShoppingCart className="grocery-icon" />
        <h2>Grocery List</h2>
      </div>
      <div className="header-actions">
        {onOpenSmart && (
          <button 
            className={`smart-btn ${smartActive ? 'active' : ''}`}
            onClick={onOpenSmart}
            title="Smart features"
          >
            <FaBrain />
          </button>
        )}
        {onOpenCharts && (
          <button 
            className="charts-btn"
            onClick={onOpenCharts}
            title="View spending analytics"
          >
            <FaChartPie />
          </button>
        )}
        {receiptCount > 0 && onOpenReceipts && (
          <button 
            className="receipts-btn"
            onClick={onOpenReceipts}
            title={`View all receipts (${receiptCount})`}
          >
            <FaReceipt />
            <span className="receipt-badge">{receiptCount}</span>
          </button>
        )}
        <button 
          className={`sync-btn ${syncing ? 'syncing' : ''}`} 
          onClick={onSync}
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
  );
};
