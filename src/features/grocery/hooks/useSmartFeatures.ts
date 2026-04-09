import { useMemo, useCallback } from 'react';
import { GroceryWeek } from '../context/GroceryContext';

// ============ CATEGORIES ============
export type ItemCategory = 
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'bakery'
  | 'beverages'
  | 'frozen'
  | 'snacks'
  | 'household'
  | 'receipt'
  | 'other';

export interface CategoryInfo {
  id: ItemCategory;
  name: string;
  nameSwedish: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'dairy', name: 'Dairy', nameSwedish: 'Mejeri', icon: '🥛', color: '#4FC3F7' },
  { id: 'meat', name: 'Meat & Fish', nameSwedish: 'Kött & Fisk', icon: '🥩', color: '#EF5350' },
  { id: 'vegetables', name: 'Vegetables', nameSwedish: 'Grönsaker', icon: '🥬', color: '#66BB6A' },
  { id: 'fruits', name: 'Fruits', nameSwedish: 'Frukt', icon: '🍎', color: '#FFA726' },
  { id: 'bakery', name: 'Bakery', nameSwedish: 'Bageri', icon: '🍞', color: '#D4A574' },
  { id: 'beverages', name: 'Beverages', nameSwedish: 'Drycker', icon: '🥤', color: '#42A5F5' },
  { id: 'frozen', name: 'Frozen', nameSwedish: 'Fryst', icon: '🧊', color: '#90CAF9' },
  { id: 'snacks', name: 'Snacks', nameSwedish: 'Snacks', icon: '🍿', color: '#FFD54F' },
  { id: 'household', name: 'Household', nameSwedish: 'Hushåll', icon: '🧹', color: '#B0BEC5' },
  { id: 'receipt', name: 'Receipts', nameSwedish: 'Kvitton', icon: '🧾', color: '#9E9E9E' },
  { id: 'other', name: 'Other', nameSwedish: 'Övrigt', icon: '📦', color: '#78909C' },
];

// Category keywords (Swedish and English)
const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  dairy: [
    // Swedish
    'mjölk', 'ost', 'smör', 'yoghurt', 'grädde', 'fil', 'kvarg', 'keso', 'créme', 'laktosfri',
    'philadelphia', 'bregott', 'arla', 'valio', 'mellanmjölk', 'lättmjölk', 'havremjölk', 'oatly',
    // English
    'milk', 'cheese', 'butter', 'yogurt', 'cream', 'cottage', 'cheddar', 'mozzarella', 'parmesan'
  ],
  meat: [
    // Swedish
    'kött', 'köttfärs', 'fläsk', 'nöt', 'kyckling', 'korv', 'bacon', 'skinka', 'lax', 'fisk',
    'torsk', 'räkor', 'sill', 'makrill', 'falukorv', 'prinskorv', 'kalkon', 'lamm', 'biff',
    'hamburgare', 'köttbullar', 'entrecote', 'fläskfilé', 'kycklingfilé', 'färs',
    // English
    'meat', 'beef', 'pork', 'chicken', 'fish', 'salmon', 'sausage', 'ham', 'turkey', 'lamb', 'shrimp'
  ],
  vegetables: [
    // Swedish
    'tomat', 'gurka', 'sallad', 'lök', 'vitlök', 'morot', 'potatis', 'paprika', 'broccoli',
    'spenat', 'svamp', 'champinjon', 'squash', 'zucchini', 'aubergine', 'blomkål', 'vitkål',
    'rödkål', 'purjolök', 'selleri', 'rödbetor', 'majs', 'ärtor', 'bönor', 'avokado',
    // English
    'tomato', 'cucumber', 'lettuce', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'spinach',
    'mushroom', 'corn', 'peas', 'beans', 'cabbage', 'celery', 'asparagus'
  ],
  fruits: [
    // Swedish
    'äpple', 'banan', 'apelsin', 'citron', 'lime', 'vindruvor', 'päron', 'melon', 'vattenmelon',
    'jordgubbar', 'hallon', 'blåbär', 'körsbär', 'mango', 'ananas', 'kiwi', 'persika', 'plommon',
    'nektarin', 'grapefrukt', 'clementin', 'passionsfrukt',
    // English
    'apple', 'banana', 'orange', 'lemon', 'grapes', 'pear', 'melon', 'watermelon', 'strawberry',
    'raspberry', 'blueberry', 'cherry', 'mango', 'pineapple', 'kiwi', 'peach', 'plum'
  ],
  bakery: [
    // Swedish
    'bröd', 'limpa', 'fralla', 'bulle', 'croissant', 'bagel', 'knäckebröd', 'skorpor', 'kaka',
    'tårta', 'muffin', 'wienerbröd', 'kanelbulle', 'semla', 'levain', 'surdeg', 'tortilla',
    'pitabröd', 'hamburgerbröd', 'korvbröd', 'rågbröd', 'rostbröd', 'toast',
    // English
    'bread', 'roll', 'bun', 'cake', 'muffin', 'pastry', 'cookie', 'cracker', 'toast', 'bagel'
  ],
  beverages: [
    // Swedish
    'vatten', 'juice', 'saft', 'läsk', 'cola', 'fanta', 'sprite', 'kaffe', 'te', 'öl', 'vin',
    'cider', 'mineralvatten', 'kolsyra', 'sportdryck', 'energidryck', 'smoothie', 'nocco',
    'redbull', 'monster', 'pepsi', 'coca-cola', 'trocadero', 'julmust', 'påskmust',
    // English
    'water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine', 'energy drink', 'smoothie'
  ],
  frozen: [
    // Swedish
    'fryst', 'glass', 'frysta', 'fryst pizza', 'fryspizza', 'pommes', 'fish fingers',
    'fiskpinnar', 'frysgrönsaker', 'fryst bär', 'magnum', 'ben & jerry', 'piggelin',
    // English
    'frozen', 'ice cream', 'popsicle', 'frozen pizza', 'fries', 'frozen vegetables'
  ],
  snacks: [
    // Swedish
    'chips', 'godis', 'choklad', 'nötter', 'popcorn', 'dip', 'kex', 'müslibar', 'snacks',
    'jordnötter', 'mandlar', 'cashew', 'marabou', 'daim', 'twix', 'snickers', 'plopp',
    'kexchoklad', 'polly', 'lakrits', 'geléhallon', 'bilar', 'bubs', 'salta pinnar',
    // English
    'chips', 'candy', 'chocolate', 'nuts', 'popcorn', 'crackers', 'cookies', 'sweets'
  ],
  household: [
    // Swedish
    'tvättmedel', 'diskmedel', 'toalettpapper', 'hushållspapper', 'tvål', 'schampo', 'balsam',
    'tandkräm', 'deodorant', 'rengöring', 'städ', 'tvätt', 'sköljmedel', 'blöjor', 'bindor',
    'rakblad', 'batterier', 'lampa', 'ljus', 'servetter', 'plastpåsar', 'soppåsar', 'aluminiumfolie',
    'bakplåtspapper', 'gladpack', 'zip-påsar',
    // English
    'detergent', 'soap', 'shampoo', 'toothpaste', 'toilet paper', 'paper towels', 'cleaning',
    'laundry', 'batteries', 'candles', 'napkins', 'bags', 'foil', 'wrap'
  ],
  receipt: [
    'kvitto', 'receipt'
  ],
  other: []
};

/**
 * Detect category for an item based on its name
 */
export const detectCategory = (itemName: string): ItemCategory => {
  const lowerName = itemName.toLowerCase().trim();
  
  // Special case for receipts
  if (lowerName.includes('kvitto') || lowerName.includes('receipt')) {
    return 'receipt';
  }
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return category as ItemCategory;
      }
    }
  }
  
  return 'other';
};

export const getCategoryInfo = (category: ItemCategory): CategoryInfo => {
  return CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1];
};

// ============ FREQUENT ITEMS ============
export interface FrequentItem {
  name: string;
  count: number;
  lastPrice: number | null;
  avgPrice: number | null;
  category: ItemCategory;
  lastBought: number; // timestamp
}

/**
 * Analyze purchase history to find frequently bought items
 */
export const analyzeFrequentItems = (weeks: GroceryWeek[]): FrequentItem[] => {
  const itemStats: Map<string, {
    count: number;
    prices: number[];
    lastPrice: number | null;
    lastBought: number;
  }> = new Map();
  
  // Go through all weeks and items
  weeks.forEach(week => {
    week.items.forEach(item => {
      // Normalize name (lowercase, trim)
      const normalizedName = item.name.toLowerCase().trim();
      
      // Skip receipts
      if (normalizedName.includes('kvitto') || normalizedName.includes('receipt')) {
        return;
      }
      
      const existing = itemStats.get(normalizedName);
      
      if (existing) {
        existing.count += item.quantity;
        if (item.price !== null) {
          existing.prices.push(item.price);
          existing.lastPrice = item.price;
        }
        if (item.createdAt > existing.lastBought) {
          existing.lastBought = item.createdAt;
        }
      } else {
        itemStats.set(normalizedName, {
          count: item.quantity,
          prices: item.price !== null ? [item.price] : [],
          lastPrice: item.price,
          lastBought: item.createdAt,
        });
      }
    });
  });
  
  // Convert to FrequentItem array
  const frequentItems: FrequentItem[] = [];
  
  itemStats.forEach((stats, name) => {
    // Only include items bought at least twice
    if (stats.count >= 2) {
      const avgPrice = stats.prices.length > 0 
        ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length 
        : null;
      
      // Capitalize first letter of name
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      
      frequentItems.push({
        name: displayName,
        count: stats.count,
        lastPrice: stats.lastPrice,
        avgPrice: avgPrice ? Math.round(avgPrice * 100) / 100 : null,
        category: detectCategory(name),
        lastBought: stats.lastBought,
      });
    }
  });
  
  // Sort by count (most frequent first)
  return frequentItems.sort((a, b) => b.count - a.count);
};

// ============ PRICE HISTORY ============
export interface PricePoint {
  price: number;
  date: number;
  weekId: string;
}

export interface PriceHistory {
  itemName: string;
  prices: PricePoint[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number | null;
  lowestPrice: number;
  highestPrice: number;
  avgPrice: number;
}

/**
 * Get price history for a specific item
 */
export const getItemPriceHistory = (weeks: GroceryWeek[], itemName: string): PriceHistory | null => {
  const normalizedName = itemName.toLowerCase().trim();
  const pricePoints: PricePoint[] = [];
  
  weeks.forEach(week => {
    week.items.forEach(item => {
      if (item.name.toLowerCase().trim() === normalizedName && item.price !== null) {
        pricePoints.push({
          price: item.price,
          date: item.createdAt,
          weekId: week.weekId,
        });
      }
    });
  });
  
  if (pricePoints.length === 0) return null;
  
  // Sort by date
  pricePoints.sort((a, b) => a.date - b.date);
  
  const prices = pricePoints.map(p => p.price);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  
  // Calculate trend (compare last 2 prices if available)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let changePercent: number | null = null;
  
  if (pricePoints.length >= 2) {
    const lastPrice = pricePoints[pricePoints.length - 1].price;
    const prevPrice = pricePoints[pricePoints.length - 2].price;
    
    if (lastPrice > prevPrice) {
      trend = 'up';
      changePercent = ((lastPrice - prevPrice) / prevPrice) * 100;
    } else if (lastPrice < prevPrice) {
      trend = 'down';
      changePercent = ((prevPrice - lastPrice) / prevPrice) * -100;
    }
  }
  
  return {
    itemName,
    prices: pricePoints,
    trend,
    changePercent: changePercent ? Math.round(changePercent * 10) / 10 : null,
    lowestPrice,
    highestPrice,
    avgPrice: Math.round(avgPrice * 100) / 100,
  };
};

/**
 * Get all items with price changes
 */
export const getItemsWithPriceChanges = (weeks: GroceryWeek[]): PriceHistory[] => {
  const itemNames = new Set<string>();
  
  weeks.forEach(week => {
    week.items.forEach(item => {
      if (item.price !== null && !item.name.toLowerCase().includes('kvitto')) {
        itemNames.add(item.name.toLowerCase().trim());
      }
    });
  });
  
  const histories: PriceHistory[] = [];
  
  itemNames.forEach(name => {
    const history = getItemPriceHistory(weeks, name);
    if (history && history.prices.length >= 2) {
      histories.push(history);
    }
  });
  
  // Sort by absolute change percent (biggest changes first)
  return histories
    .filter(h => h.changePercent !== null && h.changePercent !== 0)
    .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));
};

// ============ HOOK ============
export const useSmartFeatures = (weeks: GroceryWeek[]) => {
  // Frequent items
  const frequentItems = useMemo(() => analyzeFrequentItems(weeks), [weeks]);
  
  // Top 10 frequent items for quick add
  const suggestedItems = useMemo(() => frequentItems.slice(0, 10), [frequentItems]);
  
  // Items with price changes
  const priceChanges = useMemo(() => getItemsWithPriceChanges(weeks), [weeks]);
  
  // Category summary
  const categorySummary = useMemo(() => {
    const summary: Record<ItemCategory, { count: number; total: number }> = {} as any;
    
    CATEGORIES.forEach(cat => {
      summary[cat.id] = { count: 0, total: 0 };
    });
    
    weeks.forEach(week => {
      week.items.forEach(item => {
        const category = detectCategory(item.name);
        summary[category].count += item.quantity;
        if (item.price !== null) {
          summary[category].total += item.price * item.quantity;
        }
      });
    });
    
    return summary;
  }, [weeks]);
  
  // Get category for item
  const getCategoryForItem = useCallback((itemName: string) => {
    return getCategoryInfo(detectCategory(itemName));
  }, []);
  
  // Get price history for item
  const getPriceHistory = useCallback((itemName: string) => {
    return getItemPriceHistory(weeks, itemName);
  }, [weeks]);
  
  return {
    // Frequent items
    frequentItems,
    suggestedItems,
    
    // Categories
    categories: CATEGORIES,
    categorySummary,
    getCategoryForItem,
    detectCategory,
    
    // Price history
    priceChanges,
    getPriceHistory,
  };
};
