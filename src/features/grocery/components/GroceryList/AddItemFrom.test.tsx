import userEvent from "@testing-library/user-event";
import { AddItemForm } from "./AddItemForm";
import { render, screen, fireEvent } from "@testing-library/react";

describe("AddItemForm", () => {
    const defaultProps = {
      isOverBudget: false,
      onAddItem: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============ RENDER TESTS ============

    it("renders input fields correctly", () => {
        render(<AddItemForm {...defaultProps} />);

        expect(screen.getByPlaceholderText("Add grocery item...")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1")).toBeInTheDocument();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });
    
    // ============ OVER BUDGET TESTS ============
    it("shows 'Budget exceeded!' message when over budget", () => {
        render(<AddItemForm {...defaultProps} isOverBudget={true} />);

        expect(screen.getByPlaceholderText("Budget exceeded!")).toBeInTheDocument();
    });

    it("disables inputs and button when over budget", () => {
        render(<AddItemForm {...defaultProps} isOverBudget={true} />);

        expect(screen.getByPlaceholderText("Budget exceeded!")).toBeDisabled();
        expect(screen.getByDisplayValue("1")).toBeDisabled();
        expect(screen.getByRole("button")).toBeDisabled();
    });

    // ============ FORM SUBMISSION TESTS ============
    it("calls onAddItem with name and quantity when form is submitted", async () => {
        const mockOnAddItem = jest.fn();
        render(<AddItemForm {...defaultProps} onAddItem={mockOnAddItem} />);

        const user = userEvent.setup();
        const nameInput = screen.getByPlaceholderText("Add grocery item...");
        const qtyInput = screen.getByDisplayValue("1");

        await user.type(nameInput, "Milk");
        fireEvent.change(qtyInput, { target: { value: "2" } });
        await user.click(screen.getByRole("button"));

        expect(mockOnAddItem).toHaveBeenCalledWith("Milk", 2);
    });

    it("clears input after successful submit", async () => {
        render(<AddItemForm {...defaultProps} />);

        const user = userEvent.setup();
        const nameInput = screen.getByPlaceholderText("Add grocery item...");
        
        await user.type(nameInput, "Bread");
        await user.click(screen.getByRole("button"));

        expect(nameInput).toHaveValue("");
        expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });


    it("does not call onAddItem if name is empty", async () => {
        const mockOnAddItem = jest.fn();
        render(<AddItemForm {...defaultProps} onAddItem={mockOnAddItem} />);

        await userEvent.click(screen.getByRole("button"));

        expect(mockOnAddItem).not.toHaveBeenCalled();
    });

    it("does not submit with whitespace-only name", async () => {
        const mockOnAddItem = jest.fn();
        render(<AddItemForm {...defaultProps} onAddItem={mockOnAddItem} />);

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText("Add grocery item..."), "   ");
        await user.click(screen.getByRole("button"));

        expect(mockOnAddItem).not.toHaveBeenCalled();
    });

    // ============ BUTTON STATE TESTS ============
    it("disables add button when name is empty", () => {
        render(<AddItemForm {...defaultProps} />);

        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("enables add button when name is not empty", async () => {
        render(<AddItemForm {...defaultProps} />);

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText("Add grocery item..."), "Eggs");
        expect(screen.getByRole("button")).toBeEnabled();
    });

   // ============ QUANTITY VALIDATION TESTS ============
    it("does not allow quantity less than 1", async () => {  
        render(<AddItemForm {...defaultProps} />);
        
        const qtyInput = screen.getByDisplayValue("1");

        // Try to set value to 0
        fireEvent.change(qtyInput, { target: { value: "0" } });

        // Component enforces min=1, so value becomes 1
        expect(qtyInput).toHaveValue(1);
    });
});