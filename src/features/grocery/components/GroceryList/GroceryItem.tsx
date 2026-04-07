import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { GroceryItem as GroceryItemType } from '../../context/GroceryContext';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggleBought: () => void;
  onRemove: () => void;
}

export const GroceryItem: React.FC<GroceryItemProps> = ({
  item,
  onToggleBought,
  onRemove,
}) => {
  return (
    <motion.div
      className="grocery-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      layout
    >
      <button
        className="item-check"
        onClick={onToggleBought}
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
      <button
        className="item-delete"
        onClick={onRemove}
        aria-label="Delete item"
      >
        <FaTrash />
      </button>
    </motion.div>
  );
};
