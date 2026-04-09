import { GroceryWeek, Receipt, MonthlyBudget } from '../context/GroceryContext';
import { detectCategory } from './useSmartFeatures';

// ============ CSV EXPORT ============

/**
 * Export all grocery data to CSV format
 */
export const exportToCSV = (
  weeks: GroceryWeek[],
  budgets: MonthlyBudget[],
  filename: string = 'grocery-data'
): void => {
  // Items CSV
  const itemsHeader = 'Week,Week Number,Year,Start Date,End Date,Item Name,Category,Quantity,Price,Total,Bought,Created At\n';
  const itemsRows = weeks.flatMap(week =>
    week.items.map(item => {
      const category = item.category || detectCategory(item.name);
      const total = item.price ? (item.price * item.quantity).toFixed(2) : '';
      const createdAt = new Date(item.createdAt).toISOString().split('T')[0];
      return `"${week.weekId}",${week.weekNumber},${week.year},"${week.startDate}","${week.endDate}","${escapeCSV(item.name)}","${category}",${item.quantity},${item.price || ''},${total},${item.bought},${createdAt}`;
    })
  ).join('\n');

  // Receipts CSV
  const receiptsHeader = '\n\nReceipts\nWeek,Receipt ID,Store,Total,Added At,Has Image\n';
  const receiptsRows = weeks.flatMap(week =>
    (week.receipts || []).map(receipt => {
      const addedAt = new Date(receipt.addedAt).toISOString().split('T')[0];
      const hasImage = receipt.imageData ? 'Yes' : 'No';
      return `"${week.weekId}","${receipt.id}","${escapeCSV(receipt.store || '')}",${receipt.scannedTotal || ''},${addedAt},${hasImage}`;
    })
  ).join('\n');

  // Budgets CSV
  const budgetsHeader = '\n\nMonthly Budgets\nMonth,Total Budget,Spent\n';
  const budgetsRows = budgets.map(b => 
    `"${b.monthId}",${b.totalBudget},${b.spent}`
  ).join('\n');

  // Weekly Summary CSV
  const summaryHeader = '\n\nWeekly Summary\nWeek,Week Number,Year,Items Count,Total Spent,Finalized\n';
  const summaryRows = weeks.map(week => {
    const itemsCount = week.items.length;
    const totalSpent = week.items
      .filter(i => i.bought && i.price)
      .reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
    return `"${week.weekId}",${week.weekNumber},${week.year},${itemsCount},${totalSpent.toFixed(2)},${week.finalized || false}`;
  }).join('\n');

  const csvContent = itemsHeader + itemsRows + receiptsHeader + receiptsRows + budgetsHeader + budgetsRows + summaryHeader + summaryRows;
  
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Export spending by category to CSV
 */
export const exportCategoryReport = (weeks: GroceryWeek[], filename: string = 'category-report'): void => {
  const categories: Record<string, { count: number; total: number; items: string[] }> = {};
  
  weeks.forEach(week => {
    week.items.forEach(item => {
      if (item.bought && item.price) {
        const category = item.category || detectCategory(item.name);
        if (!categories[category]) {
          categories[category] = { count: 0, total: 0, items: [] };
        }
        categories[category].count += item.quantity;
        categories[category].total += item.price * item.quantity;
        if (!categories[category].items.includes(item.name)) {
          categories[category].items.push(item.name);
        }
      }
    });
  });

  const header = 'Category,Items Count,Total Spent,Sample Items\n';
  const rows = Object.entries(categories)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, data]) => 
      `"${cat}",${data.count},${data.total.toFixed(2)},"${data.items.slice(0, 5).join(', ')}"`
    )
    .join('\n');

  downloadFile(header + rows, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Export price history to CSV
 */
export const exportPriceHistory = (weeks: GroceryWeek[], filename: string = 'price-history'): void => {
  const priceData: Array<{ name: string; price: number; date: string; week: string }> = [];
  
  weeks.forEach(week => {
    week.items.forEach(item => {
      if (item.price !== null) {
        priceData.push({
          name: item.name,
          price: item.price,
          date: new Date(item.createdAt).toISOString().split('T')[0],
          week: week.weekId,
        });
      }
    });
  });

  const header = 'Item Name,Price (kr),Date,Week\n';
  const rows = priceData
    .sort((a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date))
    .map(d => `"${escapeCSV(d.name)}",${d.price},${d.date},"${d.week}"`)
    .join('\n');

  downloadFile(header + rows, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

// ============ RECEIPT SEARCH ============

export interface SearchResult {
  receiptId: string;
  weekId: string;
  weekNumber: number;
  store?: string;
  total: number | null;
  matchedText: string;
  addedAt: number;
  imageData: string;
}

/**
 * Search through all receipt text
 */
export const searchReceipts = (
  weeks: GroceryWeek[], 
  query: string
): SearchResult[] => {
  if (!query || query.trim().length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];
  
  weeks.forEach(week => {
    (week.receipts || []).forEach(receipt => {
      // Search in raw text
      const rawTextLower = (receipt.rawText || '').toLowerCase();
      const storeLower = (receipt.store || '').toLowerCase();
      
      if (rawTextLower.includes(lowerQuery) || storeLower.includes(lowerQuery)) {
        // Get context around the match
        let matchedText = '';
        const matchIndex = rawTextLower.indexOf(lowerQuery);
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 30);
          const end = Math.min(receipt.rawText.length, matchIndex + lowerQuery.length + 30);
          matchedText = '...' + receipt.rawText.slice(start, end).trim() + '...';
        } else if (storeLower.includes(lowerQuery)) {
          matchedText = `Store: ${receipt.store}`;
        }
        
        results.push({
          receiptId: receipt.id,
          weekId: week.weekId,
          weekNumber: week.weekNumber,
          store: receipt.store,
          total: receipt.scannedTotal,
          matchedText,
          addedAt: receipt.addedAt,
          imageData: receipt.imageData,
        });
      }
    });
  });
  
  // Sort by date (newest first)
  return results.sort((a, b) => b.addedAt - a.addedAt);
};

// ============ SHARE FUNCTIONALITY ============

/**
 * Share receipt image using Web Share API
 */
export const shareReceipt = async (
  receipt: Receipt,
  weekNumber: number
): Promise<boolean> => {
  const shareData: ShareData = {
    title: `Receipt - Week ${weekNumber}`,
    text: `Receipt${receipt.store ? ` from ${receipt.store}` : ''}: ${receipt.scannedTotal?.toFixed(2) || 'Unknown'} kr`,
  };

  // Check if Web Share API is available
  if (!navigator.share) {
    // Fallback: copy to clipboard
    try {
      const text = `${shareData.title}\n${shareData.text}`;
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // If we have image data, try to share as file
  if (receipt.imageData && receipt.imageData.startsWith('data:image')) {
    try {
      const response = await fetch(receipt.imageData);
      const blob = await response.blob();
      const file = new File([blob], `receipt-week${weekNumber}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          ...shareData,
          files: [file],
        });
        return true;
      }
    } catch (e) {
      console.warn('[Share] Could not share image as file:', e);
    }
  }

  // Fallback: share just text
  try {
    await navigator.share(shareData);
    return true;
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      console.error('[Share] Failed:', e);
    }
    return false;
  }
};

/**
 * Share spending summary
 */
export const shareSpendingSummary = async (
  weeks: GroceryWeek[],
  budgets: MonthlyBudget[]
): Promise<boolean> => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budget = budgets.find(b => b.monthId === currentMonth);
  
  const totalSpent = weeks
    .flatMap(w => w.items)
    .filter(i => i.bought && i.price)
    .reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
  
  const weekCount = weeks.length;
  const avgPerWeek = weekCount > 0 ? totalSpent / weekCount : 0;
  
  const summary = [
    '📊 Grocery Summary',
    '',
    `💰 Total Spent: ${totalSpent.toFixed(0)} kr`,
    `📅 Weeks Tracked: ${weekCount}`,
    `📈 Avg/Week: ${avgPerWeek.toFixed(0)} kr`,
    budget ? `\n💵 Monthly Budget: ${budget.totalBudget} kr` : '',
    budget ? `📉 Remaining: ${(budget.totalBudget - budget.spent).toFixed(0)} kr` : '',
  ].filter(Boolean).join('\n');

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Grocery Summary',
        text: summary,
      });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('[Share] Failed:', e);
      }
    }
  }
  
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(summary);
    return true;
  } catch {
    return false;
  }
};

// ============ HELPERS ============

const escapeCSV = (str: string): string => {
  if (!str) return '';
  return str.replace(/"/g, '""');
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
