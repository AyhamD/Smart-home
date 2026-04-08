import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { gistStorage } from "../services/gist-storage";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  price: number | null; // Price per item (null if not set)
  bought: boolean;
  createdAt: number;
}

export interface Receipt {
  id: string;
  imageData: string; // Base64 encoded image
  scannedTotal: number | null;
  rawText: string; // OCR extracted text
  store?: string; // Detected store name
  addedAt: number;
}

export interface GroceryWeek {
  weekId: string; // Format: "2026-W13"
  weekNumber: number;
  year: number;
  startDate: string; // Monday
  endDate: string; // Saturday
  items: GroceryItem[];
  receipts?: Receipt[]; // Scanned receipts for this week
  finalized?: boolean; // True when week is closed and deducted from budget
  finalTotal?: number; // Locked total when finalized
}

export interface MonthlyBudget {
  monthId: string; // Format: "2026-04"
  totalBudget: number;
  spent: number; // Sum of finalized weeks' totals
}

export interface GroceryData {
  weeks: GroceryWeek[];
  budgets: MonthlyBudget[];
}

interface GroceryContextType {
  weeks: GroceryWeek[];
  currentWeek: GroceryWeek | null;
  addItem: (name: string, quantity?: number, price?: number | null) => void;
  addScannedItems: (weekId: string, items: { name: string; price: number; quantity: number }[]) => void;
  removeItem: (weekId: string, itemId: string) => void;
  toggleBought: (weekId: string, itemId: string) => void;
  updateItemPrice: (weekId: string, itemId: string, price: number) => void;
  clearBought: (weekId: string) => void;
  getWeekTotal: (weekId: string) => number;
  // Receipt functions
  addReceipt: (weekId: string, imageData: string, scannedTotal: number | null, rawText: string, store?: string) => Promise<void>;
  removeReceipt: (weekId: string, receiptId: string) => void;
  // Budget functions
  currentBudget: MonthlyBudget | null;
  setBudget: (amount: number) => void;
  finalizeWeek: (weekId: string) => void;
  getRemainingBudget: () => number;
  canAddToWeek: (weekId: string) => boolean;
  isAtHome: boolean;
  checkingNetwork: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

const STORAGE_KEY = "hue_control_grocery_weeks";
const SYNC_DEBOUNCE_MS = 5000; // Increased from 2s to 5s to reduce refresh frequency
const MAX_IMAGE_WIDTH = 800; // Max width for compressed receipt images
const IMAGE_QUALITY = 0.6; // JPEG compression quality (0-1)

// Helper: Compress image to reduce localStorage size (iOS Safari has ~5MB limit)
const compressImage = (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    // If not a valid base64 image, return as-is
    if (!base64Image || !base64Image.startsWith('data:image')) {
      resolve(base64Image);
      return;
    }

    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if too large (also helps with iOS memory limits)
          const maxDimension = Math.min(MAX_IMAGE_WIDTH, 600); // Smaller for iOS
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Convert to JPEG with compression
            const compressed = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
            resolve(compressed);
          } else {
            console.warn('[Compress] No canvas context');
            resolve(base64Image);
          }
        } catch (e) {
          console.warn('[Compress] Canvas error:', e);
          resolve(base64Image);
        }
      };
      img.onerror = () => {
        console.warn('[Compress] Failed to load image');
        resolve(base64Image);
      };
      img.src = base64Image;
    } catch (e) {
      console.warn('[Compress] Error:', e);
      resolve(base64Image);
    }
  });
};

// Helper: Safely save to localStorage with quota handling
const safeLocalStorageSave = (key: string, data: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.name === 'QuotaExceededError' || 
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn('[Storage] Quota exceeded, clearing old receipt images...');
      // Try to free up space by clearing receipt images from localStorage
      // (Gist sync will still have the full data)
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as { weeks?: Array<{ receipts?: Array<{ imageData: string }> }> };
          if (parsed.weeks) {
            parsed.weeks.forEach(week => {
              if (week.receipts) {
                week.receipts.forEach(receipt => {
                  receipt.imageData = ''; // Clear image data
                });
              }
            });
            localStorage.setItem(key, JSON.stringify(parsed));
            // Now try to save the new data
            localStorage.setItem(key, JSON.stringify(data));
            return true;
          }
        }
      } catch {
        // If all else fails, clear storage entirely
        localStorage.removeItem(key);
        console.warn('[Storage] Cleared localStorage due to quota issues');
      }
    }
    console.error('[Storage] Failed to save:', e);
    return false;
  }
};

// Helper: Get week number (ISO week, Monday-based)
const getWeekNumber = (date: Date): { weekNumber: number; year: number } => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { weekNumber, year: d.getUTCFullYear() };
};

// Helper: Get Monday of current week
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Helper: Get Saturday of current week
const getSaturday = (date: Date): Date => {
  const monday = getMonday(date);
  return new Date(monday.setDate(monday.getDate() + 5));
};

// Helper: Format date as "Mar 25"
const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Helper: Create week object for a date
const createWeekForDate = (date: Date): GroceryWeek => {
  const { weekNumber, year } = getWeekNumber(date);
  const monday = getMonday(date);
  const saturday = getSaturday(date);

  return {
    weekId: `${year}-W${weekNumber.toString().padStart(2, "0")}`,
    weekNumber,
    year,
    startDate: formatShortDate(monday),
    endDate: formatShortDate(saturday),
    items: [],
  };
};

// Helper: Get current week
const getCurrentWeekData = (): GroceryWeek => {
  return createWeekForDate(new Date());
};

// Helper: Get current month ID (e.g., "2026-04")
const getCurrentMonthId = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Helper: Get month ID for a week
const getMonthIdForWeek = (weekId: string): string => {
  // weekId format: "2026-W14" - need to figure out the month from year/week
  const [year, weekPart] = weekId.split('-');
  const weekNum = parseInt(weekPart.replace('W', ''));
  // Approximate: week 1-4 = Jan, 5-8 = Feb, etc.
  // More accurate: use ISO week to date conversion
  const jan4 = new Date(parseInt(year), 0, 4);
  const daysToAdd = (weekNum - 1) * 7;
  const weekDate = new Date(jan4.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}`;
};

export const GroceryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [weeks, setWeeks] = useState<GroceryWeek[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [isAtHome, setIsAtHome] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get or create current week
  const currentWeek =
    weeks.find((w) => w.weekId === getCurrentWeekData().weekId) || null;

  // Get current month's budget
  const currentBudget = budgets.find(b => b.monthId === getCurrentMonthId()) || null;

  // Ensure current week exists
  useEffect(() => {
    if (!initialized) return;

    const currentWeekData = getCurrentWeekData();
    const exists = weeks.some((w) => w.weekId === currentWeekData.weekId);

    if (!exists) {
      setWeeks((prev) => [currentWeekData, ...prev]);
    }
  }, [initialized, weeks]);

  // Load from Gist on mount
  useEffect(() => {
    const loadData = async () => {
      // Load from localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data: GroceryData = JSON.parse(stored);
          if (data.weeks) {
            setWeeks(data.weeks);
          }
          if (data.budgets) {
            setBudgets(data.budgets);
          }
        } catch (e) {
          console.error("Failed to parse grocery data:", e);
        }
      }

      // Then load from Gist
      if (gistStorage.isConfigured()) {
        setSyncing(true);
        const gistData = await gistStorage.load<GroceryData>();
        if (gistData?.weeks) {
          setWeeks(gistData.weeks);
          if (gistData.budgets) {
            setBudgets(gistData.budgets);
          }
          safeLocalStorageSave(STORAGE_KEY, gistData);
          setLastSynced(new Date());
        }
        setSyncing(false);
      }

      setInitialized(true);
    };

    loadData();
  }, []);

  // Sync to Gist with debounce
  const syncToGist = useCallback(async (dataToSync: GroceryData) => {
    if (!gistStorage.isConfigured()) return;

    setSyncing(true);
    const success = await gistStorage.save<GroceryData>(dataToSync);
    if (success) {
      setLastSynced(new Date());
    }
    setSyncing(false);
  }, []);

  // Save and sync on changes
  useEffect(() => {
    if (!initialized) return;

    const data: GroceryData = { weeks, budgets };
    safeLocalStorageSave(STORAGE_KEY, data);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToGist(data);
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [weeks, budgets, initialized, syncToGist]);

  // Network check - uses public IP detection with bridge ping fallback
  const checkNetwork = useCallback(async () => {
    setCheckingNetwork(true);
    const homeIP = import.meta.env.VITE_MY_IP_ADDRESS;

    // Method 1: Check public IP via ipify
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://api.ipify.org?format=json", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const currentIP = data.ip;
        console.log(`[Network] Public IP: ${currentIP}, Home IP: ${homeIP}`);

        if (currentIP === homeIP) {
          setIsAtHome(true);
          setCheckingNetwork(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[Network] ipify check failed, trying bridge fallback:", err);
    }

    // Method 2: Fallback - try to ping local Hue Bridge
    try {
      const bridgeIP = import.meta.env.VITE_HUE_BRIDGE_IP;
      if (bridgeIP) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://${bridgeIP}/api/config`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsAtHome(response.ok);
        setCheckingNetwork(false);
        return;
      }
    } catch (err) {
      console.warn("[Network] Bridge ping failed:", err);
    }

    // Both methods failed - default to away mode (grocery only)
    setIsAtHome(false);
    setCheckingNetwork(false);
  }, []);

  // Initial network check on mount only
  useEffect(() => {
    checkNetwork();
  }, [checkNetwork]);

  // Manual sync - refreshes data from cloud and checks network
  const syncNow = useCallback(async () => {
    // Check network status
    await checkNetwork();

    if (!gistStorage.isConfigured()) return;

    setSyncing(true);
    const gistData = await gistStorage.load<GroceryData>();
    if (gistData?.weeks) {
      setWeeks(gistData.weeks);
      if (gistData.budgets) {
        setBudgets(gistData.budgets);
      }
      safeLocalStorageSave(STORAGE_KEY, gistData);
      setLastSynced(new Date());
    }
    setSyncing(false);
  }, [checkNetwork]);

  // Add item to current week
  const addItem = (
    name: string,
    quantity: number = 1,
    price: number | null = null,
  ) => {
    if (!name.trim()) return;

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: name.trim(),
      quantity,
      price,
      bought: false,
      createdAt: Date.now(),
    };

    const currentWeekData = getCurrentWeekData();

    setWeeks((prev) => {
      const weekIndex = prev.findIndex(
        (w) => w.weekId === currentWeekData.weekId,
      );

      if (weekIndex >= 0) {
        const updated = [...prev];
        updated[weekIndex] = {
          ...updated[weekIndex],
          items: [newItem, ...updated[weekIndex].items],
        };
        return updated;
      } else {
        return [
          {
            ...currentWeekData,
            items: [newItem],
          },
          ...prev,
        ];
      }
    });
  };

  // Add scanned items from receipt as bought items
  const addScannedItems = (
    weekId: string,
    items: { name: string; price: number; quantity: number }[]
  ) => {
    // Filter out invalid items
    const validItems = items.filter(item => 
      item.name && 
      typeof item.price === 'number' && 
      !isNaN(item.price) && 
      item.price >= 0
    );

    if (validItems.length === 0) return;

    const newItems: GroceryItem[] = validItems.map((item, index) => ({
      id: Date.now().toString() + index,
      name: item.name.trim(),
      quantity: item.quantity || 1,
      price: item.price,
      bought: true, // Scanned items are already bought
      createdAt: Date.now(),
    }));

    setWeeks((prev) => {
      const weekIndex = prev.findIndex((w) => w.weekId === weekId);

      if (weekIndex >= 0) {
        const updated = [...prev];
        updated[weekIndex] = {
          ...updated[weekIndex],
          items: [...newItems, ...updated[weekIndex].items],
        };
        return updated;
      } else {
        // If week doesn't exist, create it
        const currentWeekData = getCurrentWeekData();
        if (currentWeekData.weekId === weekId) {
          return [
            {
              ...currentWeekData,
              items: newItems,
            },
            ...prev,
          ];
        }
        return prev;
      }
    });
  };

  const removeItem = (weekId: string, itemId: string) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.weekId === weekId
          ? { ...week, items: week.items.filter((item) => item.id !== itemId) }
          : week,
      ),
    );
  };

  const toggleBought = (weekId: string, itemId: string) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.weekId === weekId
          ? {
              ...week,
              items: week.items.map((item) =>
                item.id === itemId ? { ...item, bought: !item.bought } : item,
              ),
            }
          : week,
      ),
    );
  };

  const clearBought = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.weekId === weekId
          ? { ...week, items: week.items.filter((item) => !item.bought) }
          : week,
      ),
    );
  };

  const updateItemPrice = (weekId: string, itemId: string, price: number) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.weekId === weekId
          ? {
              ...week,
              items: week.items.map((item) =>
                item.id === itemId ? { ...item, price } : item,
              ),
            }
          : week,
      ),
    );
  };

  const getWeekTotal = (weekId: string): number => {
    const week = weeks.find((w) => w.weekId === weekId);
    if (!week) return 0;
    // If finalized, return the locked total
    if (week.finalized && week.finalTotal !== undefined) {
      return week.finalTotal;
    }
    // Sum items total (receipts are added as items with name "Kvitto #X")
    return week.items
      .filter((item) => item.bought && item.price !== null)
      .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  };

  // Receipt functions
  const addReceipt = async (weekId: string, imageData: string, scannedTotal: number | null, rawText: string, store?: string) => {
    try {
      // Compress image to reduce storage size (iOS Safari has ~5MB localStorage limit)
      let finalImageData = '';
      try {
        const compressedImage = await compressImage(imageData);
        console.log(`[Receipt] Original size: ${Math.round(imageData.length/1024)}KB, Compressed: ${Math.round(compressedImage.length/1024)}KB`);
        finalImageData = compressedImage;
      } catch (e) {
        console.warn('[Receipt] Compression failed, skipping image:', e);
        // Skip image if compression fails
        finalImageData = '';
      }

      const newReceipt: Receipt = {
        id: Date.now().toString(),
        imageData: finalImageData,
        scannedTotal,
        rawText,
        store,
        addedAt: Date.now(),
      };

      setWeeks(prev =>
        prev.map(week =>
          week.weekId === weekId
            ? { ...week, receipts: [...(week.receipts || []), newReceipt] }
            : week
        )
      );
    } catch (e) {
      console.error('[Receipt] Failed to add receipt:', e);
    }
  };

  const removeReceipt = (weekId: string, receiptId: string) => {
    setWeeks(prev =>
      prev.map(week =>
        week.weekId === weekId
          ? { ...week, receipts: (week.receipts || []).filter(r => r.id !== receiptId) }
          : week
      )
    );
  };

  // Budget functions
  const setBudgetAmount = (amount: number) => {
    const monthId = getCurrentMonthId();
    setBudgets(prev => {
      const existing = prev.find(b => b.monthId === monthId);
      if (existing) {
        return prev.map(b => 
          b.monthId === monthId ? { ...b, totalBudget: amount } : b
        );
      } else {
        return [...prev, { monthId, totalBudget: amount, spent: 0 }];
      }
    });
  };

  const finalizeWeek = (weekId: string) => {
    const week = weeks.find(w => w.weekId === weekId);
    if (!week || week.finalized) return;

    const total = getWeekTotal(weekId);
    const monthId = getMonthIdForWeek(weekId);

    // Lock the week with its final total
    setWeeks(prev => 
      prev.map(w => 
        w.weekId === weekId 
          ? { ...w, finalized: true, finalTotal: total }
          : w
      )
    );

    // Add to spent in the month's budget
    setBudgets(prev => {
      const existing = prev.find(b => b.monthId === monthId);
      if (existing) {
        return prev.map(b => 
          b.monthId === monthId ? { ...b, spent: b.spent + total } : b
        );
      } else {
        // Create budget for this month if it doesn't exist
        return [...prev, { monthId, totalBudget: 0, spent: total }];
      }
    });
  };

  const getRemainingBudget = (): number => {
    const monthId = getCurrentMonthId();
    const budget = budgets.find(b => b.monthId === monthId);
    if (!budget) return 0;
    
    // Also consider non-finalized weeks in current month
    const currentMonthWeeks = weeks.filter(w => getMonthIdForWeek(w.weekId) === monthId && !w.finalized);
    const pendingSpend = currentMonthWeeks.reduce((sum, w) => sum + getWeekTotal(w.weekId), 0);
    
    return budget.totalBudget - budget.spent - pendingSpend;
  };

  const canAddToWeek = (weekId: string): boolean => {
    const week = weeks.find(w => w.weekId === weekId);
    if (!week) return true;
    if (week.finalized) return false;
    
    // Check if there's budget remaining
    const remaining = getRemainingBudget();
    return remaining > 0 || !currentBudget || currentBudget.totalBudget === 0;
  };

  return (
    <GroceryContext.Provider
      value={{
        weeks,
        currentWeek,
        addItem,
        addScannedItems,
        removeItem,
        toggleBought,
        updateItemPrice,
        clearBought,
        getWeekTotal,
        addReceipt,
        removeReceipt,
        currentBudget,
        setBudget: setBudgetAmount,
        finalizeWeek,
        getRemainingBudget,
        canAddToWeek,
        isAtHome,
        checkingNetwork,
        syncing,
        lastSynced,
        syncNow,
      }}
    >
      {children}
    </GroceryContext.Provider>
  );
};

export const useGrocery = () => {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error("useGrocery must be used within a GroceryProvider");
  }
  return context;
};
