import React from 'react';
import { GroceryItem as GroceryItemType } from '../../context/GroceryContext';
import { BoughtItem } from './BoughtItem';

interface BoughtSectionProps {
  items: GroceryItemType[];
  isFinalized: boolean;
  onToggleBought: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdatePrice: (itemId: string, price: number) => void;
  onClearBought: () => void;
}

export const BoughtSection: React.FC<BoughtSectionProps> = ({
  items,
  isFinalized,
  onToggleBought,
  onRemoveItem,
  onUpdatePrice,
  onClearBought,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="bought-section">
      <div className="bought-header">
        <h4>Bought ({items.length})</h4>
        {!isFinalized && (
          <button 
            className="clear-bought-btn" 
            onClick={onClearBought}
          >
            Clear
          </button>
        )}
      </div>
      {items.map((item) => (
        <BoughtItem
          key={item.id}
          item={item}
          isFinalized={isFinalized}
          onToggleBought={() => onToggleBought(item.id)}
          onRemove={() => onRemoveItem(item.id)}
          onUpdatePrice={(price) => onUpdatePrice(item.id, price)}
        />
      ))}
    </div>
  );
};
