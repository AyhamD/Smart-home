import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartFeatures, FrequentItem, ItemCategory } from '../../hooks/useSmartFeatures';
import { useGrocery } from '../../context/GroceryContext';
import './SmartSuggestions.scss';

interface SmartSuggestionsProps {
  onClose?: () => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ onClose }) => {
  const { weeks, addItem } = useGrocery();
  const { suggestedItems, frequentItems, priceChanges, categories, categorySummary } = useSmartFeatures(weeks);
  
  const [activeTab, setActiveTab] = useState<'frequent' | 'categories' | 'prices'>('frequent');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleAddItem = (item: FrequentItem) => {
    addItem(item.name, 1, item.lastPrice);
    setAddedItems(prev => new Set(prev).add(item.name));
    
    // Remove from added after animation
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(item.name);
        return next;
      });
    }, 2000);
  };

  const handleAddAllUsual = () => {
    suggestedItems.slice(0, 5).forEach(item => {
      if (!addedItems.has(item.name)) {
        addItem(item.name, 1, item.lastPrice);
      }
    });
    setAddedItems(new Set(suggestedItems.slice(0, 5).map(i => i.name)));
  };

  const filteredItems = selectedCategory 
    ? frequentItems.filter(item => item.category === selectedCategory)
    : frequentItems;

  const getCategoryStats = (catId: ItemCategory) => {
    const stats = categorySummary[catId];
    return stats;
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <span className="trend-icon up">↗</span>;
    if (trend === 'down') return <span className="trend-icon down">↘</span>;
    return <span className="trend-icon stable">→</span>;
  };

  return (
    <motion.div 
      className="smart-suggestions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="smart-header">
        <h3>🧠 Smart Features</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* Tabs */}
      <div className="smart-tabs">
        <button 
          className={`tab ${activeTab === 'frequent' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequent')}
        >
          🔄 Frequent
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
        <button 
          className={`tab ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          💰 Prices
        </button>
      </div>

      {/* Frequent Items Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'frequent' && (
          <motion.div 
            className="tab-content"
            key="frequent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {suggestedItems.length > 0 ? (
              <>
                <button className="add-usual-btn" onClick={handleAddAllUsual}>
                  ✨ Add usual items (top 5)
                </button>
                
                <div className="frequent-list">
                  {suggestedItems.map((item, index) => {
                    const catInfo = categories.find(c => c.id === item.category)!;
                    const isAdded = addedItems.has(item.name);
                    
                    return (
                      <motion.div 
                        key={item.name}
                        className={`frequent-item ${isAdded ? 'added' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="item-icon">{catInfo.icon}</span>
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-stats">
                            Bought {item.count}x
                            {item.avgPrice && ` • ~${item.avgPrice.toFixed(0)} kr`}
                          </span>
                        </div>
                        <button 
                          className={`add-btn ${isAdded ? 'added' : ''}`}
                          onClick={() => handleAddItem(item)}
                          disabled={isAdded}
                        >
                          {isAdded ? '✓' : '+'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>📊 Not enough shopping history yet.</p>
                <p className="hint">Add more items to see suggestions!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div 
            className="tab-content"
            key="categories"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="category-filters">
              <button 
                className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.filter(c => c.id !== 'receipt' && c.id !== 'other').map(cat => {
                const stats = getCategoryStats(cat.id);
                if (stats.count === 0) return null;
                
                return (
                  <button 
                    key={cat.id}
                    className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    style={{ '--cat-color': cat.color } as React.CSSProperties}
                  >
                    {cat.icon} {cat.name}
                    <span className="chip-count">{stats.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="category-summary">
              {categories.filter(c => c.id !== 'receipt').map(cat => {
                const stats = getCategoryStats(cat.id);
                if (stats.count === 0) return null;
                
                return (
                  <div 
                    key={cat.id} 
                    className="category-row"
                    style={{ '--cat-color': cat.color } as React.CSSProperties}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-count">{stats.count} items</span>
                    <span className="cat-total">{stats.total.toFixed(0)} kr</span>
                  </div>
                );
              })}
            </div>

            {selectedCategory && (
              <div className="filtered-items">
                <h4>{categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name} items</h4>
                {filteredItems.slice(0, 10).map(item => (
                  <div key={item.name} className="filtered-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-count">{item.count}x</span>
                    <button 
                      className="add-btn"
                      onClick={() => handleAddItem(item)}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Price History Tab */}
        {activeTab === 'prices' && (
          <motion.div 
            className="tab-content"
            key="prices"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {priceChanges.length > 0 ? (
              <div className="price-changes">
                <p className="price-intro">Items with recent price changes:</p>
                
                {priceChanges.slice(0, 10).map((item, index) => (
                  <motion.div 
                    key={item.itemName}
                    className={`price-item ${item.trend}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="price-main">
                      {renderTrendIcon(item.trend)}
                      <span className="item-name">
                        {item.itemName.charAt(0).toUpperCase() + item.itemName.slice(1)}
                      </span>
                      <span className={`change-percent ${item.trend}`}>
                        {item.changePercent! > 0 ? '+' : ''}{item.changePercent}%
                      </span>
                    </div>
                    <div className="price-details">
                      <span>
                        {item.prices[item.prices.length - 2]?.price.toFixed(0)} kr
                        → {item.prices[item.prices.length - 1]?.price.toFixed(0)} kr
                      </span>
                      <span className="price-range">
                        (Range: {item.lowestPrice.toFixed(0)}-{item.highestPrice.toFixed(0)} kr)
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>📈 No price changes detected yet.</p>
                <p className="hint">Keep shopping to track price trends!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
