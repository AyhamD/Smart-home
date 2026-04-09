import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoughtSection } from "./BoughtSection";
import { GroceryItem } from "../../context/GroceryContext";

// Mock BoughtItem component
jest.mock("./BoughtItem", () => ({
  BoughtItem: ({
    item,
    onToggleBought,
    onRemove,
  }: {
    item: GroceryItem;
    onToggleBought: () => void;
    onRemove: () => void;
  }) => (
    <div data-testid={`bought-item-${item.id}`}>
      <span>{item.name}</span>
      <button onClick={onToggleBought}>Toggle</button>
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}));

const createMockItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: "item-1",
  name: "Milk",
  quantity: 1,
  price: 25,
  bought: true,
  createdAt: Date.now(),
  ...overrides,
});

describe("BoughtSection", () => {
  const mockOnToggleBought = jest.fn();
  const mockOnRemoveItem = jest.fn();
  const mockOnUpdatePrice = jest.fn();
  const mockOnClearBought = jest.fn();

  const defaultProps = {
    items: [createMockItem()],
    isFinalized: false,
    onToggleBought: mockOnToggleBought,
    onRemoveItem: mockOnRemoveItem,
    onUpdatePrice: mockOnUpdatePrice,
    onClearBought: mockOnClearBought,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("returns null when items array is empty", () => {
      const { container } = render(
        <BoughtSection {...defaultProps} items={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders bought section with items", () => {
      render(<BoughtSection {...defaultProps} />);
      expect(screen.getByText("Bought (1)")).toBeInTheDocument();
    });

    it("shows correct count for multiple items", () => {
      const items = [
        createMockItem({ id: "1", name: "Milk" }),
        createMockItem({ id: "2", name: "Bread" }),
        createMockItem({ id: "3", name: "Eggs" }),
      ];
      render(<BoughtSection {...defaultProps} items={items} />);
      expect(screen.getByText("Bought (3)")).toBeInTheDocument();
    });

    it("renders all bought items", () => {
      const items = [
        createMockItem({ id: "1", name: "Milk" }),
        createMockItem({ id: "2", name: "Bread" }),
      ];
      render(<BoughtSection {...defaultProps} items={items} />);
      expect(screen.getByTestId("bought-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("bought-item-2")).toBeInTheDocument();
    });

    it("shows Clear button when not finalized", () => {
      render(<BoughtSection {...defaultProps} />);
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("hides Clear button when finalized", () => {
      render(<BoughtSection {...defaultProps} isFinalized={true} />);
      expect(screen.queryByText("Clear")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onClearBought when Clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<BoughtSection {...defaultProps} />);
      await user.click(screen.getByText("Clear"));
      expect(mockOnClearBought).toHaveBeenCalledTimes(1);
    });

    it("calls onToggleBought with correct item id", async () => {
      const user = userEvent.setup();
      const items = [
        createMockItem({ id: "item-123", name: "Milk" }),
      ];
      render(<BoughtSection {...defaultProps} items={items} />);
      await user.click(screen.getByText("Toggle"));
      expect(mockOnToggleBought).toHaveBeenCalledWith("item-123");
    });

    it("calls onRemoveItem with correct item id", async () => {
      const user = userEvent.setup();
      const items = [
        createMockItem({ id: "item-456", name: "Bread" }),
      ];
      render(<BoughtSection {...defaultProps} items={items} />);
      await user.click(screen.getByText("Remove"));
      expect(mockOnRemoveItem).toHaveBeenCalledWith("item-456");
    });
  });
});
