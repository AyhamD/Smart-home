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

export interface GroceryWeek {
  weekId: string; // Format: "2026-W13"
  weekNumber: number;
  year: number;
  startDate: string; // Monday
  endDate: string; // Saturday
  items: GroceryItem[];
}

export interface GroceryData {
  weeks: GroceryWeek[];
}

interface GroceryContextType {
  weeks: GroceryWeek[];
  currentWeek: GroceryWeek | null;
  addItem: (name: string, quantity?: number, price?: number | null) => void;
  removeItem: (weekId: string, itemId: string) => void;
  toggleBought: (weekId: string, itemId: string) => void;
  updateItemPrice: (weekId: string, itemId: string, price: number) => void;
  clearBought: (weekId: string) => void;
  getWeekTotal: (weekId: string) => number;
  isAtHome: boolean;
  checkingNetwork: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

const STORAGE_KEY = "hue_control_grocery_weeks";
const SYNC_DEBOUNCE_MS = 2000;

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

export const GroceryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [weeks, setWeeks] = useState<GroceryWeek[]>([]);
  const [isAtHome, setIsAtHome] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get or create current week
  const currentWeek =
    weeks.find((w) => w.weekId === getCurrentWeekData().weekId) || null;

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
          localStorage.setItem(STORAGE_KEY, JSON.stringify(gistData));
          setLastSynced(new Date());
        }
        setSyncing(false);
      }

      setInitialized(true);
    };

    loadData();
  }, []);

  // Sync to Gist with debounce
  const syncToGist = useCallback(async (weeksToSync: GroceryWeek[]) => {
    if (!gistStorage.isConfigured()) return;

    setSyncing(true);
    const success = await gistStorage.save<GroceryData>({ weeks: weeksToSync });
    if (success) {
      setLastSynced(new Date());
    }
    setSyncing(false);
  }, []);

  // Save and sync on changes
  useEffect(() => {
    if (!initialized) return;

    const data: GroceryData = { weeks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToGist(weeks);
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [weeks, initialized, syncToGist]);

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!gistStorage.isConfigured()) return;

    setSyncing(true);
    const gistData = await gistStorage.load<GroceryData>();
    if (gistData?.weeks) {
      setWeeks(gistData.weeks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gistData));
      setLastSynced(new Date());
    }
    setSyncing(false);
  }, []);

  // Network check
  useEffect(() => {
    const checkNetwork = async () => {
      setCheckingNetwork(true);
      try {
        const bridgeIP = import.meta.env.VITE_HUE_BRIDGE_IP;
        if (!bridgeIP) {
          setIsAtHome(false);
          setCheckingNetwork(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://${bridgeIP}/api/config`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsAtHome(response.ok);
      } catch {
        setIsAtHome(false);
      }
      setCheckingNetwork(false);
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

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
    return week.items
      .filter((item) => item.bought && item.price !== null)
      .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  };

  return (
    <GroceryContext.Provider
      value={{
        weeks,
        currentWeek,
        addItem,
        removeItem,
        toggleBought,
        updateItemPrice,
        clearBought,
        getWeekTotal,
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
