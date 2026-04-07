import React, { useState } from 'react';
import { FaTrash, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { GroceryItem as GroceryItemType } from '../../context/GroceryContext';

interface BoughtItemProps {
  item: GroceryItemType;
  isFinalized: boolean;
  onToggleBought: () => void;
  onRemove: () => void;
  onUpdatePrice: (price: number) => void;
}

export const BoughtItem: React.FC<BoughtItemProps> = ({
  item,
  isFinalized,
  onToggleBought,
  onRemove,
  onUpdatePrice,
}) => {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  const handleSavePrice = () => {
    const amount = parseFloat(priceInput);
    if (!isNaN(amount) && amount >= 0) {
      onUpdatePrice(amount);
    }
    setEditingPrice(false);
    setPriceInput('');
  };

  const handleStartEdit = () => {
    if (!isFinalized) {
      setPriceInput(item.price?.toString() || '');
      setEditingPrice(true);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(false);
    setPriceInput('');
  };

  return (
    <motion.div
      className="grocery-item bought"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
    >
      <button
        className="item-check checked"
        onClick={() => !isFinalized && onToggleBought()}
        aria-label="Mark as not bought"
        disabled={isFinalized}
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
        {editingPrice && !isFinalized ? (
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
                if (e.key === 'Enter') handleSavePrice();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button className="save-price-btn" onClick={handleSavePrice}>
              <FaCheck />
            </button>
          </div>
        ) : (
          <button
            className="edit-price-btn"
            onClick={handleStartEdit}
            disabled={isFinalized}
          >
            {item.price !== null ? `${item.price?.toFixed(2)} kr` : 'Add price'}
          </button>
        )}
      </div>
      <button
        className="item-delete"
        onClick={() => !isFinalized && onRemove()}
        aria-label="Delete item"
        disabled={isFinalized}
      >
        <FaTrash />
      </button>
    </motion.div>
  );
};
