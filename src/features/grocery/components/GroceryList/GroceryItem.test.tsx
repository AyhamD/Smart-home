import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroceryItem } from "./GroceryItem";
import { GroceryItem as GroceryItemType } from "../../context/GroceryContext";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const createMockItem = (
  overrides: Partial<GroceryItemType> = {}
): GroceryItemType => ({
  id: "item-1",
  name: "Milk",
  quantity: 1,
  price: null,
  bought: false,
  createdAt: Date.now(),
  ...overrides,
});

describe("GroceryItem", () => {
  const mockOnToggleBought = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    item: createMockItem(),
    onToggleBought: mockOnToggleBought,
    onRemove: mockOnRemove,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders item name", () => {
      render(<GroceryItem {...defaultProps} />);
      expect(screen.getByText("Milk")).toBeInTheDocument();
    });

    it("renders quantity when greater than 1", () => {
      const item = createMockItem({ quantity: 3 });
      render(<GroceryItem {...defaultProps} item={item} />);
      expect(screen.getByText("x3")).toBeInTheDocument();
    });

    it("does not render quantity when equal to 1", () => {
      render(<GroceryItem {...defaultProps} />);
      expect(screen.queryByText("x1")).not.toBeInTheDocument();
    });

    it("renders mark as bought button", () => {
      render(<GroceryItem {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Mark as bought" })
      ).toBeInTheDocument();
    });

    it("renders delete button", () => {
      render(<GroceryItem {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Delete item" })
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onToggleBought when check button is clicked", () => {
      render(<GroceryItem {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "Mark as bought" }));
      expect(mockOnToggleBought).toHaveBeenCalledTimes(1);
    });

    it("calls onRemove when delete button is clicked", () => {
      render(<GroceryItem {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("different items", () => {
    it("renders correctly with different item names", () => {
      const item = createMockItem({ name: "Organic Bananas" });
      render(<GroceryItem {...defaultProps} item={item} />);
      expect(screen.getByText("Organic Bananas")).toBeInTheDocument();
    });

    it("renders correctly with high quantity", () => {
      const item = createMockItem({ quantity: 99 });
      render(<GroceryItem {...defaultProps} item={item} />);
      expect(screen.getByText("x99")).toBeInTheDocument();
    });
  });
});
