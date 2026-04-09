import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetSection } from "./BudgetSection";
import { MonthlyBudget } from "../../context/GroceryContext";

const createMockBudget = (
  overrides: Partial<MonthlyBudget> = {}
): MonthlyBudget => ({
  monthId: "2026-04",
  totalBudget: 5000,
  spent: 2000,
  ...overrides,
});

describe("BudgetSection", () => {
  const mockOnSaveBudget = jest.fn();

  const defaultProps = {
    currentBudget: createMockBudget(),
    remainingBudget: 3000,
    isOverBudget: false,
    onSaveBudget: mockOnSaveBudget,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders budget display when budget is set", () => {
      render(<BudgetSection {...defaultProps} />);
      expect(screen.getByText("Monthly Budget:")).toBeInTheDocument();
      expect(screen.getByText("5000.00 kr")).toBeInTheDocument();
    });

    it("shows 'Not set' when budget is null", () => {
      render(<BudgetSection {...defaultProps} currentBudget={null} />);
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it("shows progress bar when budget is set", () => {
      render(<BudgetSection {...defaultProps} />);
      expect(screen.getByText("Budget Used")).toBeInTheDocument();
      expect(screen.getByText("40%")).toBeInTheDocument();
    });

    it("shows spent and remaining amounts", () => {
      render(<BudgetSection {...defaultProps} />);
      expect(screen.getByText("2000 kr spent")).toBeInTheDocument();
      expect(screen.getByText("3000 kr left")).toBeInTheDocument();
    });

    it("shows over budget warning when over budget", () => {
      render(
        <BudgetSection
          {...defaultProps}
          isOverBudget={true}
          remainingBudget={-500}
        />
      );
      expect(screen.getByText(/Over budget by 500.00 kr/)).toBeInTheDocument();
    });

    it("does not show warning when not over budget", () => {
      render(<BudgetSection {...defaultProps} />);
      expect(screen.queryByText(/Over budget/)).not.toBeInTheDocument();
    });
  });

  describe("budget editing", () => {
    it("shows input when clicking budget display", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      expect(screen.getByPlaceholderText("Enter budget...")).toBeInTheDocument();
    });

    it("pre-fills input with current budget", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
    });

    it("calls onSaveBudget with valid amount", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      fireEvent.change(screen.getByPlaceholderText("Enter budget..."), {
        target: { value: "6000" },
      });
      // Click save button
      const saveBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("save-budget-btn"));
      fireEvent.click(saveBtn!);
      expect(mockOnSaveBudget).toHaveBeenCalledWith(6000);
    });

    it("saves budget on Enter key", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      const input = screen.getByPlaceholderText("Enter budget...");
      fireEvent.change(input, { target: { value: "7000" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockOnSaveBudget).toHaveBeenCalledWith(7000);
    });

    it("cancels editing on Escape key", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      const input = screen.getByPlaceholderText("Enter budget...");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.getByText("5000.00 kr")).toBeInTheDocument();
      expect(mockOnSaveBudget).not.toHaveBeenCalled();
    });

    it("does not call onSaveBudget for invalid input", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      fireEvent.change(screen.getByPlaceholderText("Enter budget..."), {
        target: { value: "abc" },
      });
      fireEvent.keyDown(screen.getByPlaceholderText("Enter budget..."), {
        key: "Enter",
      });
      expect(mockOnSaveBudget).not.toHaveBeenCalled();
    });

    it("does not call onSaveBudget for negative input", () => {
      render(<BudgetSection {...defaultProps} />);
      fireEvent.click(screen.getByText("5000.00 kr"));
      fireEvent.change(screen.getByPlaceholderText("Enter budget..."), {
        target: { value: "-100" },
      });
      fireEvent.keyDown(screen.getByPlaceholderText("Enter budget..."), {
        key: "Enter",
      });
      expect(mockOnSaveBudget).not.toHaveBeenCalled();
    });
  });

  describe("progress bar styling", () => {
    it("does not show progress bar when budget is 0", () => {
      const budget = createMockBudget({ totalBudget: 0 });
      render(<BudgetSection {...defaultProps} currentBudget={budget} />);
      expect(screen.queryByText("Budget Used")).not.toBeInTheDocument();
    });

    it("does not show progress bar when budget is null", () => {
      render(<BudgetSection {...defaultProps} currentBudget={null} />);
      expect(screen.queryByText("Budget Used")).not.toBeInTheDocument();
    });
  });
});
