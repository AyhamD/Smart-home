import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { FaChartPie, FaChartBar, FaChartLine, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrocery } from '../../context/GroceryContext';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

type ChartType = 'pie' | 'bar' | 'line';

interface SpendingChartsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple category detection from item names
const detectCategory = (itemName: string): string => {
  const name = itemName.toLowerCase();
  
  // Swedish + English keywords
  if (/mjölk|milk|ost|cheese|yoghurt|yogurt|smör|butter|grädde|cream|ägg|egg/.test(name)) return 'Dairy';
  if (/kött|meat|fläsk|pork|nöt|beef|kyckling|chicken|fisk|fish|korv|sausage|bacon|skinka|ham/.test(name)) return 'Meat & Fish';
  if (/bröd|bread|bulle|bun|kaka|cake|kakor|cookies|chips|godis|candy|choklad|chocolate/.test(name)) return 'Bakery & Snacks';
  if (/frukt|fruit|äpple|apple|banan|banana|apelsin|orange|grönsak|vegetable|sallad|salad|tomat|tomato|potatis|potato|lök|onion|morot|carrot/.test(name)) return 'Fruits & Vegetables';
  if (/läsk|soda|juice|vatten|water|kaffe|coffee|te[^s]|tea|öl|beer|vin|wine/.test(name)) return 'Beverages';
  if (/kvitto|receipt/.test(name)) return 'Receipts';
  if (/pasta|ris|rice|nudlar|noodles|müsli|cereal|mjöl|flour|socker|sugar|salt|krydda|spice/.test(name)) return 'Pantry';
  if (/schampo|shampoo|tvål|soap|tandkräm|toothpaste|toapapper|toilet|diskmedel|detergent/.test(name)) return 'Household';
  
  return 'Other';
};

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ isOpen, onClose }) => {
  const { weeks, getWeekTotal } = useGrocery();
  const [activeChart, setActiveChart] = useState<ChartType>('pie');

  // Get spending by category
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    
    weeks.forEach(week => {
      week.items.forEach(item => {
        if (item.bought && item.price) {
          const category = detectCategory(item.name);
          categories[category] = (categories[category] || 0) + (item.price * item.quantity);
        }
      });
    });
    
    return categories;
  }, [weeks]);

  // Get weekly spending trends
  const weeklyData = useMemo(() => {
    const sortedWeeks = [...weeks]
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .slice(-8); // Last 8 weeks
    
    return {
      labels: sortedWeeks.map(w => `Week ${w.weekNumber}`),
      amounts: sortedWeeks.map(w => getWeekTotal(w.weekId)),
    };
  }, [weeks, getWeekTotal]);

  // Pie chart data
  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',  // Indigo
        'rgba(16, 185, 129, 0.8)',  // Green
        'rgba(245, 158, 11, 0.8)', // Amber
        'rgba(239, 68, 68, 0.8)',   // Red
        'rgba(139, 92, 246, 0.8)', // Purple
        'rgba(6, 182, 212, 0.8)',  // Cyan
        'rgba(236, 72, 153, 0.8)', // Pink
        'rgba(107, 114, 128, 0.8)', // Gray
      ],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
    }],
  };

  // Bar chart data
  const barChartData = {
    labels: weeklyData.labels,
    datasets: [{
      label: 'Spending (kr)',
      data: weeklyData.amounts,
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  // Line chart data
  const lineChartData = {
    labels: weeklyData.labels,
    datasets: [{
      label: 'Spending Trend',
      data: weeklyData.amounts,
      fill: true,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 15,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw.toFixed(2)} kr`,
        },
      },
    },
    scales: activeChart !== 'pie' ? {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: string | number) => `${value} kr`,
        },
      },
    } : undefined,
  };

  // Calculate stats
  const totalSpent = Object.values(categoryData).reduce((a, b) => a + b, 0);
  const avgWeekly = weeklyData.amounts.length > 0 
    ? weeklyData.amounts.reduce((a, b) => a + b, 0) / weeklyData.amounts.length 
    : 0;
  const topCategory = Object.entries(categoryData).sort((a, b) => b[1] - a[1])[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="charts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="charts-modal"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="charts-header">
              <h2><FaChartPie /> Spending Analytics</h2>
              <button className="close-btn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-value">{totalSpent.toFixed(0)} kr</span>
                <span className="stat-label">Total Spent</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{avgWeekly.toFixed(0)} kr</span>
                <span className="stat-label">Avg/Week</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{topCategory?.[0] || '-'}</span>
                <span className="stat-label">Top Category</span>
              </div>
            </div>

            {/* Chart Type Tabs */}
            <div className="chart-tabs">
              <button 
                className={`tab-btn ${activeChart === 'pie' ? 'active' : ''}`}
                onClick={() => setActiveChart('pie')}
              >
                <FaChartPie /> Categories
              </button>
              <button 
                className={`tab-btn ${activeChart === 'bar' ? 'active' : ''}`}
                onClick={() => setActiveChart('bar')}
              >
                <FaChartBar /> Weekly
              </button>
              <button 
                className={`tab-btn ${activeChart === 'line' ? 'active' : ''}`}
                onClick={() => setActiveChart('line')}
              >
                <FaChartLine /> Trend
              </button>
            </div>

            {/* Chart Container */}
            <div className="chart-container">
              {Object.keys(categoryData).length === 0 ? (
                <div className="no-data">
                  <FaCalendarAlt />
                  <p>No spending data yet</p>
                  <span>Add items and mark them as bought to see analytics</span>
                </div>
              ) : (
                <>
                  {activeChart === 'pie' && <Pie data={pieChartData} options={chartOptions} />}
                  {activeChart === 'bar' && <Bar data={barChartData} options={chartOptions} />}
                  {activeChart === 'line' && <Line data={lineChartData} options={chartOptions} />}
                </>
              )}
            </div>

            {/* Category Breakdown */}
            {activeChart === 'pie' && Object.keys(categoryData).length > 0 && (
              <div className="category-breakdown">
                <h4>Category Breakdown</h4>
                <div className="category-list">
                  {Object.entries(categoryData)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div key={category} className="category-item">
                        <span className="category-name">{category}</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ width: `${(amount / totalSpent) * 100}%` }}
                          />
                        </div>
                        <span className="category-amount">{amount.toFixed(0)} kr</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
