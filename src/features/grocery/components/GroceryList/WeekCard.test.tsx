import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ============================================================
// STEP 1: Mock the context hook BEFORE importing the component
// ============================================================
// jest.mock() is "hoisted" - it runs before imports regardless of where you write it
// We mock useGrocery to control what values the component receives
jest.mock("../../context/GroceryContext", () => ({
  useGrocery: jest.fn(),
}));

// Now import the component and the mocked hook
import { useGrocery } from "../../context/GroceryContext";
import { WeekCard } from "./WeekCard";

// Cast to jest.Mock so TypeScript knows it has .mockReturnValue()
const mockUseGrocery = useGrocery as jest.Mock;

// ============================================================
// STEP 2: Create test data fixtures
// ============================================================
// Reusable mock data makes tests cleaner and easier to maintain
const createMockWeek = (overrides = {}) => ({
  weekId: "2026-W13",
  weekNumber: 13,
  year: 2026,
  startDate: "Mar 23",
  endDate: "Mar 29",
  items: [],
  ...overrides, // Allow tests to override specific fields
});

const createMockItem = (overrides = {}) => ({
  id: "item-1",
  name: "Milk",
  quantity: 1,
  bought: false,
  price: null,
  ...overrides,
});

// ============================================================
// STEP 3: Setup default mocks before each test
// ============================================================
// This ensures each test starts with a clean slate
beforeEach(() => {
  // Reset all mocks to avoid test pollution
  jest.clearAllMocks();
  
  // Provide default return values for useGrocery
  mockUseGrocery.mockReturnValue({
    toggleBought: jest.fn(),
    removeItem: jest.fn(),
    clearBought: jest.fn(),
    updateItemPrice: jest.fn(),
    getWeekTotal: jest.fn().mockReturnValue(0),
  });
});

// ============================================================
// STEP 4: Write tests organized by feature
// ============================================================
describe("WeekCard", () => {
  
  // ----- RENDERING TESTS -----
  // Test that the component renders expected content
  
  describe("rendering", () => {
    it("displays week number and date range", () => {
      const week = createMockWeek();
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      // Use getByText for content that MUST exist
      expect(screen.getByText("Week 13")).toBeInTheDocument();
      expect(screen.getByText("Mar 23 - Mar 29")).toBeInTheDocument();
    });

    it("shows 'Current' badge when isCurrentWeek is true", () => {
      const week = createMockWeek();
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      expect(screen.getByText("Current")).toBeInTheDocument();
    });

    it("does NOT show 'Current' badge when isCurrentWeek is false", () => {
      const week = createMockWeek();
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      // Use queryByText when element may NOT exist - returns null instead of throwing
      expect(screen.queryByText("Current")).not.toBeInTheDocument();
    });

    it("displays item count", () => {
      const week = createMockWeek({
        items: [createMockItem(), createMockItem({ id: "2", name: "Bread" })],
      });
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      expect(screen.getByText("2 items")).toBeInTheDocument();
    });

    it("displays week total when greater than 0", () => {
      // Override the mock for THIS test only
      mockUseGrocery.mockReturnValue({
        ...mockUseGrocery(), // spread defaults
        getWeekTotal: jest.fn().mockReturnValue(15.99),
      });
      
      const week = createMockWeek();
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      expect(screen.getByText("€15.99")).toBeInTheDocument();
    });
  });

  // ----- BEHAVIOR TESTS -----
  // Test user interactions
  
  describe("expand/collapse", () => {
    it("expands by default when isCurrentWeek is true", () => {
      const week = createMockWeek({
        items: [createMockItem()],
      });
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      // Content should be visible immediately
      expect(screen.getByText("Milk")).toBeInTheDocument();
    });

    it("is collapsed by default when isCurrentWeek is false", () => {
      const week = createMockWeek({
        items: [createMockItem()],
      });
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      // Item should NOT be visible (collapsed)
      expect(screen.queryByText("Milk")).not.toBeInTheDocument();
    });

    it("toggles expansion when header is clicked", async () => {
      const user = userEvent.setup();
      const week = createMockWeek({
        items: [createMockItem()],
      });
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      // Initially collapsed - item not visible
      expect(screen.queryByText("Milk")).not.toBeInTheDocument();
      
      // Click header to expand
      await user.click(screen.getByText("Week 13"));
      
      // Now item should be visible
      expect(screen.getByText("Milk")).toBeInTheDocument();
    });
  });

  // ----- ITEM INTERACTION TESTS -----
  
  describe("item actions", () => {
    it("calls toggleBought when check button is clicked", async () => {
      const mockToggleBought = jest.fn();
      mockUseGrocery.mockReturnValue({
        toggleBought: mockToggleBought,
        removeItem: jest.fn(),
        clearBought: jest.fn(),
        updateItemPrice: jest.fn(),
        getWeekTotal: jest.fn().mockReturnValue(0),
      });
      
      const week = createMockWeek({
        items: [createMockItem({ id: "abc123" })],
      });
      const user = userEvent.setup();
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      // Find by aria-label (accessibility)
      await user.click(screen.getByLabelText("Mark as bought"));
      
      // Verify the mock was called with correct arguments
      expect(mockToggleBought).toHaveBeenCalledTimes(1);
      expect(mockToggleBought).toHaveBeenCalledWith("2026-W13", "abc123");
    });

    it("calls removeItem when delete button is clicked", async () => {
      const mockRemoveItem = jest.fn();
      mockUseGrocery.mockReturnValue({
        toggleBought: jest.fn(),
        removeItem: mockRemoveItem,
        clearBought: jest.fn(),
        updateItemPrice: jest.fn(),
        getWeekTotal: jest.fn().mockReturnValue(0),
      });
      
      const week = createMockWeek({
        items: [createMockItem({ id: "item-xyz" })],
      });
      const user = userEvent.setup();
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      await user.click(screen.getByLabelText("Delete item"));
      
      expect(mockRemoveItem).toHaveBeenCalledWith("2026-W13", "item-xyz");
    });
  });

  // ----- BOUGHT ITEMS SECTION -----
  
  describe("bought items", () => {
    it("shows bought section with count when items are bought", () => {
      const week = createMockWeek({
        items: [
          createMockItem({ id: "1", bought: true }),
          createMockItem({ id: "2", name: "Eggs", bought: true }),
        ],
      });
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      expect(screen.getByText("Bought (2)")).toBeInTheDocument();
    });

    it("calls clearBought when Clear button is clicked", async () => {
      const mockClearBought = jest.fn();
      mockUseGrocery.mockReturnValue({
        toggleBought: jest.fn(),
        removeItem: jest.fn(),
        clearBought: mockClearBought,
        updateItemPrice: jest.fn(),
        getWeekTotal: jest.fn().mockReturnValue(0),
      });
      
      const week = createMockWeek({
        items: [createMockItem({ bought: true })],
      });
      const user = userEvent.setup();
      
      render(<WeekCard week={week} isCurrentWeek={true} />);
      
      await user.click(screen.getByText("Clear"));
      
      expect(mockClearBought).toHaveBeenCalledWith("2026-W13");
    });
  });

  // ----- EMPTY STATE -----
  
  describe("empty state", () => {
    it("shows empty message when no items exist", async () => {
      const user = userEvent.setup();
      const week = createMockWeek({ items: [] });
      
      render(<WeekCard week={week} isCurrentWeek={false} />);
      
      // Expand to see content
      await user.click(screen.getByText("Week 13"));
      
      expect(screen.getByText("No items this week")).toBeInTheDocument();
    });
  });
});