import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceiptGallery } from "./ReceiptGallery";
import { Receipt } from "../../context/GroceryContext";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      onClick,
      ...props
    }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const createMockReceipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: "receipt-1",
  imageData: "data:image/png;base64,test123",
  scannedTotal: 150.5,
  rawText: "Test receipt text",
  store: "Test Store",
  addedAt: Date.now(),
  ...overrides,
});

describe("ReceiptGallery", () => {
  const mockOnRemove = jest.fn();

  const defaultProps = {
    receipts: [createMockReceipt()],
    onRemove: mockOnRemove,
    isFinalized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("returns null when receipts array is empty", () => {
      const { container } = render(
        <ReceiptGallery {...defaultProps} receipts={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders receipt count for single receipt", () => {
      render(<ReceiptGallery {...defaultProps} />);
      expect(screen.getByText("1 receipt")).toBeInTheDocument();
    });

    it("renders receipt count for multiple receipts", () => {
      const receipts = [
        createMockReceipt({ id: "1" }),
        createMockReceipt({ id: "2" }),
        createMockReceipt({ id: "3" }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      expect(screen.getByText("3 receipts")).toBeInTheDocument();
    });

    it("renders total from receipts", () => {
      const receipts = [
        createMockReceipt({ id: "1", scannedTotal: 100 }),
        createMockReceipt({ id: "2", scannedTotal: 50.5 }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      expect(screen.getByText("150.50 kr")).toBeInTheDocument();
    });

    it("does not show total when all receipts have null total", () => {
      const receipts = [
        createMockReceipt({ id: "1", scannedTotal: null }),
        createMockReceipt({ id: "2", scannedTotal: null }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      expect(screen.queryByText(/kr$/)).not.toBeInTheDocument();
    });

    it("renders receipt thumbnails", () => {
      render(<ReceiptGallery {...defaultProps} />);
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });

    it("shows thumbnail amount for receipts with total", () => {
      const receipt = createMockReceipt({ scannedTotal: 299 });
      render(<ReceiptGallery {...defaultProps} receipts={[receipt]} />);
      expect(screen.getByText("299 kr")).toBeInTheDocument();
    });
  });

  describe("modal interactions", () => {
    it("opens modal when thumbnail is clicked", () => {
      render(<ReceiptGallery {...defaultProps} />);
      const thumbnail = screen.getByAltText("Receipt 1");
      fireEvent.click(thumbnail.parentElement!);
      // Modal should show close button
      const closeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("close-btn"));
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it("shows receipt date in modal", () => {
      const receipt = createMockReceipt({ addedAt: new Date("2026-04-09").getTime() });
      render(<ReceiptGallery {...defaultProps} receipts={[receipt]} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      expect(screen.getByText("2026-04-09")).toBeInTheDocument();
    });

    it("shows delete button in modal when not finalized", () => {
      render(<ReceiptGallery {...defaultProps} isFinalized={false} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("delete-btn"));
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it("hides delete button in modal when finalized", () => {
      render(<ReceiptGallery {...defaultProps} isFinalized={true} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("delete-btn"));
      expect(deleteButtons.length).toBe(0);
    });

    it("shows navigation buttons when multiple receipts", () => {
      const receipts = [
        createMockReceipt({ id: "1" }),
        createMockReceipt({ id: "2" }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      const prevButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("prev"));
      const nextButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("next"));
      expect(prevButtons.length).toBe(1);
      expect(nextButtons.length).toBe(1);
    });

    it("does not show navigation buttons for single receipt", () => {
      render(<ReceiptGallery {...defaultProps} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      const navButtons = screen
        .getAllByRole("button")
        .filter(
          (btn) =>
            btn.classList.contains("prev") || btn.classList.contains("next")
        );
      expect(navButtons.length).toBe(0);
    });

    it("shows receipt indicator in modal", () => {
      const receipts = [
        createMockReceipt({ id: "1" }),
        createMockReceipt({ id: "2" }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("shows receipt total in modal footer", () => {
      const receipt = createMockReceipt({ scannedTotal: 199.99 });
      render(<ReceiptGallery {...defaultProps} receipts={[receipt]} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      expect(screen.getByText("Total: 199.99 kr")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("navigates to next receipt", () => {
      const receipts = [
        createMockReceipt({ id: "1", scannedTotal: 100 }),
        createMockReceipt({ id: "2", scannedTotal: 200 }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
      
      const nextBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("next"));
      fireEvent.click(nextBtn!);
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    it("navigates to previous receipt", () => {
      const receipts = [
        createMockReceipt({ id: "1", scannedTotal: 100 }),
        createMockReceipt({ id: "2", scannedTotal: 200 }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      // Click second thumbnail
      fireEvent.click(screen.getByAltText("Receipt 2").parentElement!);
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
      
      const prevBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("prev"));
      fireEvent.click(prevBtn!);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("wraps around when navigating past last receipt", () => {
      const receipts = [
        createMockReceipt({ id: "1" }),
        createMockReceipt({ id: "2" }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      fireEvent.click(screen.getByAltText("Receipt 2").parentElement!);
      
      const nextBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("next"));
      fireEvent.click(nextBtn!);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("wraps around when navigating before first receipt", () => {
      const receipts = [
        createMockReceipt({ id: "1" }),
        createMockReceipt({ id: "2" }),
      ];
      render(<ReceiptGallery {...defaultProps} receipts={receipts} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      
      const prevBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("prev"));
      fireEvent.click(prevBtn!);
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("calls onRemove when delete button is clicked", () => {
      const receipt = createMockReceipt({ id: "receipt-123" });
      render(<ReceiptGallery {...defaultProps} receipts={[receipt]} />);
      fireEvent.click(screen.getByAltText("Receipt 1").parentElement!);
      
      const deleteBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("delete-btn"));
      fireEvent.click(deleteBtn!);
      expect(mockOnRemove).toHaveBeenCalledWith("receipt-123");
    });
  });
});
