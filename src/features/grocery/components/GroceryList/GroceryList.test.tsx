// GroceryList.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../context/GroceryContext", () => ({
  useGrocery: jest.fn(),
  GroceryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import GroceryList from "./GroceryList";
import { useGrocery, GroceryProvider } from "../../context/GroceryContext";

// Cast the mocked function for TypeScript
const mockUseGrocery = useGrocery as jest.Mock;

// Set default mock return value before each test
beforeEach(() => {
  mockUseGrocery.mockReturnValue({
    weeks: [],
    currentWeek: { weekId: "2026-W13", items: [] },
    addItem: jest.fn(),
    removeItem: jest.fn(),
    toggleBought: jest.fn(),
    isAtHome: true,
    syncing: false,
    syncNow: jest.fn(),
  });
});

// Wrap component with required providers
const renderWithProviders = () => {
  return render(
    <GroceryProvider>
      <GroceryList />
    </GroceryProvider>,
  );
};

describe("GroceryList", () => {
  it("renders the grocery list header", () => {
    renderWithProviders();
    expect(screen.getByText("Grocery List")).toBeInTheDocument();
  });
});

it("shows add item form", () => {
  renderWithProviders();
  expect(
    screen.getByPlaceholderText("Add grocery item..."),
  ).toBeInTheDocument();
});

it("adds item when form is submitted", async () => {
  const mockAddItem = jest.fn();
  mockUseGrocery.mockReturnValue({
    weeks: [],
    currentWeek: { weekId: "2026-W13", items: [] },
    addItem: mockAddItem,
    removeItem: jest.fn(),
    toggleBought: jest.fn(),
    isAtHome: true,
    syncing: false,
    syncNow: jest.fn(),
  });

  const user = userEvent.setup();
  renderWithProviders();

  const input = screen.getByPlaceholderText("Add grocery item...");
  await user.type(input, "Milk");
  
  // Submit form (button is icon-only with no accessible name)
  const form = input.closest("form")!;
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(mockAddItem).toHaveBeenCalledWith("Milk", 1);
});

it("toggles item as bought when clicked", async () => {
  const mockToggleBought = jest.fn();
  const weekWithItem = {
    weekId: "2026-W13",
    weekNumber: 13,
    startDate: "2026-03-23",
    endDate: "2026-03-29",
    items: [{ id: "1", name: "Milk", quantity: 1, bought: false }],
  };
  
  mockUseGrocery.mockReturnValue({
    weeks: [weekWithItem],
    currentWeek: weekWithItem,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    toggleBought: mockToggleBought,
    clearBought: jest.fn(),
    updateItemPrice: jest.fn(),
    getWeekTotal: jest.fn().mockReturnValue(0),
    isAtHome: true,
    syncing: false,
    syncNow: jest.fn(),
  });

  const user = userEvent.setup();
  renderWithProviders();

  await user.click(screen.getByLabelText("Mark as bought"));

  expect(mockToggleBought).toHaveBeenCalledWith("2026-W13", "1");
});

it("syncs when sync button is clicked", async () => {
  const mockSyncNow = jest.fn();
  mockUseGrocery.mockReturnValue({
    weeks: [],
    currentWeek: { weekId: "2026-W13", items: [] },
    addItem: jest.fn(),
    removeItem: jest.fn(),
    toggleBought: jest.fn(),
    isAtHome: true,
    syncing: false,
    syncNow: mockSyncNow,
  });

  const user = userEvent.setup();
  renderWithProviders();

  await user.click(screen.getByRole("button", { name: /sync/i }));

  expect(mockSyncNow).toHaveBeenCalled();
});
