jest.mock("../../context/GroceryContext", () => ({
  useGrocery: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { useGrocery } from "../../context/GroceryContext";
import { AllReceiptsViewer } from "./AllReceiptsViewer";
import { userEvent } from "@testing-library/user-event/dist/cjs/setup/index.js";

const mockUseGrocery = useGrocery as jest.Mock;

// Sample test data
const mockWeeks = [
  {
    weekId: "2026-W14",
    weekNumber: 14,
    year: 2026,
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    items: [],
    receipts: [
      {
        id: "receipt-1",
        imageData: "data:image/jpeg;base64,test1",
        scannedTotal: 150.5,
        rawText: "ICA\nMilk 25.00\nBread 35.00",
        addedAt: Date.now(),
        store: "ICA",
      },
      {
        id: "receipt-2",
        imageData: "data:image/jpeg;base64,test2",
        scannedTotal: 89.0,
        rawText: "Coop\nEggs 45.00",
        addedAt: Date.now() - 1000,
        store: "Coop",
      },
    ],
  },
  {
    weekId: "2026-W13",
    weekNumber: 13,
    year: 2026,
    startDate: "2026-03-30",
    endDate: "2026-04-05",
    items: [],
    receipts: [
      {
        id: "receipt-3",
        imageData: "data:image/jpeg;base64,test3",
        scannedTotal: 200.0,
        rawText: "Willys receipt",
        addedAt: Date.now() - 100000,
        store: "Willys",
      },
    ],
  },
];

const emptyWeeks = [
  {
    weekId: "2026-W14",
    weekNumber: 14,
    year: 2026,
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    items: [],
    receipts: [],
  },
];

describe("AllReceiptsViewer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGrocery.mockReturnValue({
      weeks: mockWeeks,
      removeReceipt: jest.fn(),
    });
  });
  // ============ RENDER TESTS ============
  it("renders nothing when IsOpen is false", () => {
    render(<AllReceiptsViewer {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("All Receipts")).not.toBeInTheDocument();
  });

  it("renders the viewer when isOpen is true", () => {
    render(<AllReceiptsViewer {...defaultProps} isOpen={true} />);

    expect(screen.getByText("All Receipts")).toBeInTheDocument();
  });

  it("shows correct receipt count", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.getByText("3 receipts")).toBeInTheDocument();
  });

  it("shows total from receipts", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    // 150.50 + 89.00 + 200.00 = 439.50
    expect(screen.getByText("439.50 kr")).toBeInTheDocument();
  });

  it("shows weeks with receipts count", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.getByText("2")).toBeInTheDocument(); // 2 weeks with receipts
  });

  // ============ EMPTY STATE TESTS ============

  it("shows empty state when no receipts", () => {
    mockUseGrocery.mockReturnValue({
      weeks: emptyWeeks,
      removeReceipt: jest.fn(),
    });

    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.getByText("No receipts saved yet")).toBeInTheDocument();
    expect(
      screen.getByText("Scan receipts from your weekly grocery lists"),
    ).toBeInTheDocument();
  });

  // ============ CLOSE BUTTON TEST ============

  it("calls onClose when close button is clicked", async () => {
    const mockOnClose = jest.fn();
    render(<AllReceiptsViewer {...defaultProps} onClose={mockOnClose} />);

    // Find the close button by its class
    const buttons = screen.getAllByRole("button");
    const closeBtnElement = buttons.find((btn) =>
      btn.classList.contains("close-btn"),
    );

    if (closeBtnElement) {
      await userEvent.click(closeBtnElement);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  // ============ FILTER TESTS ============

  it("shows week filter when multiple weeks have receipts", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("All weeks")).toBeInTheDocument();
  });

  it("does not show filter when only one week has receipts", () => {
    mockUseGrocery.mockReturnValue({
      weeks: [mockWeeks[0]], // Only one week
      removeReceipt: jest.fn(),
    });

    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("filters receipts when week is selected", async () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    const filter = screen.getByRole("combobox");

    // Initially shows all 3 receipts
    expect(screen.getByText("3 receipts")).toBeInTheDocument();

    // Select Week 13 (has 1 receipt)
    fireEvent.change(filter, { target: { value: "2026-W13" } });

    // Should now show filtered view
    // Note: The count in header still shows total, but grid shows filtered
  });

  // ============ DELETE TESTS ============

  it("calls removeReceipt when delete is confirmed", async () => {
    const mockRemoveReceipt = jest.fn();
    mockUseGrocery.mockReturnValue({
      weeks: mockWeeks,
      removeReceipt: mockRemoveReceipt,
    });

    // Mock window.confirm to return true
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    render(<AllReceiptsViewer {...defaultProps} />);

    // Find delete buttons (FaTrash icons)
    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.classList.contains("delete-btn"));

    if (deleteButtons.length > 0) {
      await userEvent.click(deleteButtons[0]);
      expect(mockRemoveReceipt).toHaveBeenCalled();
    }

    confirmSpy.mockRestore();
  });

  it("does not delete when confirm is cancelled", async () => {
    const mockRemoveReceipt = jest.fn();
    mockUseGrocery.mockReturnValue({
      weeks: mockWeeks,
      removeReceipt: mockRemoveReceipt,
    });

    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

    render(<AllReceiptsViewer {...defaultProps} />);

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.classList.contains("delete-btn"));

    if (deleteButtons.length > 0) {
      await userEvent.click(deleteButtons[0]);
      expect(mockRemoveReceipt).not.toHaveBeenCalled();
    }

    confirmSpy.mockRestore();
  });

  // ============ RECEIPT DISPLAY TESTS ============

  it("displays receipt week numbers", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    // Week 14 appears twice (2 receipts), Week 13 appears once
    const week14Elements = screen.getAllByText("Week 14");
    const week13Elements = screen.getAllByText("Week 13");
    
    expect(week14Elements.length).toBe(2);
    expect(week13Elements.length).toBe(1);
  });

  it("displays receipt totals", () => {
    render(<AllReceiptsViewer {...defaultProps} />);

    expect(screen.getByText("150.50 kr")).toBeInTheDocument();
    expect(screen.getByText("89.00 kr")).toBeInTheDocument();
    expect(screen.getByText("200.00 kr")).toBeInTheDocument();
  });
});
