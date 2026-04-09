import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoughtItem } from "./BoughtItem";
import { GroceryItem } from "../../context/GroceryContext";

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

const createMockItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: "item-1",
  name: "Milk",
  quantity: 1,
  price: null,
  bought: true,
  createdAt: Date.now(),
  ...overrides,
});

describe("BoughtItem", () => {
  const mockOnToggleBought = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnUpdatePrice = jest.fn();

  const defaultProps = {
    item: createMockItem(),
    isFinalized: false,
    onToggleBought: mockOnToggleBought,
    onRemove: mockOnRemove,
    onUpdatePrice: mockOnUpdatePrice,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders item name", () => {
      render(<BoughtItem {...defaultProps} />);
      expect(screen.getByText("Milk")).toBeInTheDocument();
    });

    it("renders quantity when greater than 1", () => {
      const item = createMockItem({ quantity: 3 });
      render(<BoughtItem {...defaultProps} item={item} />);
      expect(screen.getByText("x3")).toBeInTheDocument();
    });

    it("does not render quantity when equal to 1", () => {
      render(<BoughtItem {...defaultProps} />);
      expect(screen.queryByText("x1")).not.toBeInTheDocument();
    });

    it("shows 'Add price' when price is null", () => {
      render(<BoughtItem {...defaultProps} />);
      expect(screen.getByText("Add price")).toBeInTheDocument();
    });

    it("shows formatted price when price is set", () => {
      const item = createMockItem({ price: 25.5 });
      render(<BoughtItem {...defaultProps} item={item} />);
      expect(screen.getByText("25.50 kr")).toBeInTheDocument();
    });

    it("renders mark as not bought button", () => {
      render(<BoughtItem {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Mark as not bought" })
      ).toBeInTheDocument();
    });

    it("renders delete button", () => {
      render(<BoughtItem {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Delete item" })
      ).toBeInTheDocument();
    });
  });

  describe("toggle bought", () => {
    it("calls onToggleBought when toggle button is clicked", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Mark as not bought" })
      );
      expect(mockOnToggleBought).toHaveBeenCalledTimes(1);
    });

    it("does not call onToggleBought when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Mark as not bought" })
      );
      expect(mockOnToggleBought).not.toHaveBeenCalled();
    });
  });

  describe("delete item", () => {
    it("calls onRemove when delete button is clicked", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it("does not call onRemove when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
      expect(mockOnRemove).not.toHaveBeenCalled();
    });
  });

  describe("price editing", () => {
    it("shows price input when clicking Add price", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    });

    it("shows price input when clicking existing price", () => {
      const item = createMockItem({ price: 10 });
      render(<BoughtItem {...defaultProps} item={item} />);
      fireEvent.click(screen.getByText("10.00 kr"));
      expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    });

    it("pre-fills input with existing price", () => {
      const item = createMockItem({ price: 15.99 });
      render(<BoughtItem {...defaultProps} item={item} />);
      fireEvent.click(screen.getByText("15.99 kr"));
      expect(screen.getByDisplayValue("15.99")).toBeInTheDocument();
    });

    it("calls onUpdatePrice when saving valid price", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      fireEvent.change(screen.getByPlaceholderText("0.00"), {
        target: { value: "29.99" },
      });
      // Click save button (the one within price-input-group)
      const saveButton = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("save-price-btn"));
      fireEvent.click(saveButton!);
      expect(mockOnUpdatePrice).toHaveBeenCalledWith(29.99);
    });

    it("saves price on Enter key", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      const input = screen.getByPlaceholderText("0.00");
      fireEvent.change(input, { target: { value: "19.50" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockOnUpdatePrice).toHaveBeenCalledWith(19.5);
    });

    it("cancels editing on Escape key", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      const input = screen.getByPlaceholderText("0.00");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.getByText("Add price")).toBeInTheDocument();
      expect(mockOnUpdatePrice).not.toHaveBeenCalled();
    });

    it("does not call onUpdatePrice for invalid input", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      fireEvent.change(screen.getByPlaceholderText("0.00"), {
        target: { value: "abc" },
      });
      fireEvent.keyDown(screen.getByPlaceholderText("0.00"), { key: "Enter" });
      expect(mockOnUpdatePrice).not.toHaveBeenCalled();
    });

    it("does not call onUpdatePrice for negative input", () => {
      render(<BoughtItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Add price"));
      fireEvent.change(screen.getByPlaceholderText("0.00"), {
        target: { value: "-5" },
      });
      fireEvent.keyDown(screen.getByPlaceholderText("0.00"), { key: "Enter" });
      expect(mockOnUpdatePrice).not.toHaveBeenCalled();
    });

    it("does not open price editing when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      fireEvent.click(screen.getByText("Add price"));
      expect(screen.queryByPlaceholderText("0.00")).not.toBeInTheDocument();
    });
  });

  describe("finalized state", () => {
    it("disables toggle button when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      expect(
        screen.getByRole("button", { name: "Mark as not bought" })
      ).toBeDisabled();
    });

    it("disables delete button when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      expect(
        screen.getByRole("button", { name: "Delete item" })
      ).toBeDisabled();
    });

    it("disables price edit button when finalized", () => {
      render(<BoughtItem {...defaultProps} isFinalized={true} />);
      const priceButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent === "Add price");
      expect(priceButton).toBeDisabled();
    });
  });
});