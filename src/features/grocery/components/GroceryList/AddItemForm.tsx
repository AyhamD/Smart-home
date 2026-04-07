import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AddItemFormProps {
  isOverBudget: boolean;
  onAddItem: (name: string, quantity: number) => void;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  isOverBudget,
  onAddItem,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && !isOverBudget) {
      onAddItem(newItemName, newItemQty);
      setNewItemName('');
      setNewItemQty(1);
    }
  };

  return (
    <motion.form
      className="add-item-form"
      onSubmit={handleSubmit}
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
  );
};
