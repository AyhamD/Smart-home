import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroceryHeader } from "./GroceryHeader";

describe("GroceryHeader", () => {
  const mockOnSync = jest.fn();
  const mockOnOpenReceipts = jest.fn();
  const mockOnOpenCharts = jest.fn();
  const mockOnOpenSmart = jest.fn();
  const mockOnOpenSearch = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnShare = jest.fn();

  const defaultProps = {
    isAtHome: true,
    syncing: false,
    onSync: mockOnSync,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders grocery list title", () => {
      render(<GroceryHeader {...defaultProps} />);
      expect(screen.getByText("Grocery List")).toBeInTheDocument();
    });

    it("shows 'At Home' when isAtHome is true", () => {
      render(<GroceryHeader {...defaultProps} isAtHome={true} />);
      expect(screen.getByText("At Home")).toBeInTheDocument();
    });

    it("shows 'Away' when isAtHome is false", () => {
      render(<GroceryHeader {...defaultProps} isAtHome={false} />);
      expect(screen.getByText("Away")).toBeInTheDocument();
    });

    it("renders sync button", () => {
      render(<GroceryHeader {...defaultProps} />);
      expect(screen.getByTitle("Sync with cloud")).toBeInTheDocument();
    });
  });

  describe("optional buttons", () => {
    it("renders search button when onOpenSearch is provided", () => {
      render(<GroceryHeader {...defaultProps} onOpenSearch={mockOnOpenSearch} />);
      expect(screen.getByTitle("Search receipts")).toBeInTheDocument();
    });

    it("does not render search button when onOpenSearch is not provided", () => {
      render(<GroceryHeader {...defaultProps} />);
      expect(screen.queryByTitle("Search receipts")).not.toBeInTheDocument();
    });

    it("renders export button when onExport is provided", () => {
      render(<GroceryHeader {...defaultProps} onExport={mockOnExport} />);
      expect(screen.getByTitle("Export data")).toBeInTheDocument();
    });

    it("renders share button when onShare is provided", () => {
      render(<GroceryHeader {...defaultProps} onShare={mockOnShare} />);
      expect(screen.getByTitle("Share summary")).toBeInTheDocument();
    });

    it("renders smart button when onOpenSmart is provided", () => {
      render(<GroceryHeader {...defaultProps} onOpenSmart={mockOnOpenSmart} />);
      expect(screen.getByTitle("Smart features")).toBeInTheDocument();
    });

    it("renders charts button when onOpenCharts is provided", () => {
      render(<GroceryHeader {...defaultProps} onOpenCharts={mockOnOpenCharts} />);
      expect(screen.getByTitle("View spending analytics")).toBeInTheDocument();
    });

    it("renders receipts button when receiptCount > 0 and onOpenReceipts is provided", () => {
      render(
        <GroceryHeader
          {...defaultProps}
          receiptCount={5}
          onOpenReceipts={mockOnOpenReceipts}
        />
      );
      expect(screen.getByTitle("View all receipts (5)")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("does not render receipts button when receiptCount is 0", () => {
      render(
        <GroceryHeader
          {...defaultProps}
          receiptCount={0}
          onOpenReceipts={mockOnOpenReceipts}
        />
      );
      expect(screen.queryByTitle(/View all receipts/)).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSync when sync button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} />);
      await user.click(screen.getByTitle("Sync with cloud"));
      expect(mockOnSync).toHaveBeenCalledTimes(1);
    });

    it("disables sync button when syncing", () => {
      render(<GroceryHeader {...defaultProps} syncing={true} />);
      expect(screen.getByTitle("Sync with cloud")).toBeDisabled();
    });

    it("calls onOpenSearch when search button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} onOpenSearch={mockOnOpenSearch} />);
      await user.click(screen.getByTitle("Search receipts"));
      expect(mockOnOpenSearch).toHaveBeenCalledTimes(1);
    });

    it("calls onExport when export button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} onExport={mockOnExport} />);
      await user.click(screen.getByTitle("Export data"));
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });

    it("calls onShare when share button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} onShare={mockOnShare} />);
      await user.click(screen.getByTitle("Share summary"));
      expect(mockOnShare).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenSmart when smart button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} onOpenSmart={mockOnOpenSmart} />);
      await user.click(screen.getByTitle("Smart features"));
      expect(mockOnOpenSmart).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenCharts when charts button is clicked", async () => {
      const user = userEvent.setup();
      render(<GroceryHeader {...defaultProps} onOpenCharts={mockOnOpenCharts} />);
      await user.click(screen.getByTitle("View spending analytics"));
      expect(mockOnOpenCharts).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenReceipts when receipts button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <GroceryHeader
          {...defaultProps}
          receiptCount={3}
          onOpenReceipts={mockOnOpenReceipts}
        />
      );
      await user.click(screen.getByTitle("View all receipts (3)"));
      expect(mockOnOpenReceipts).toHaveBeenCalledTimes(1);
    });
  });

  describe("smart button active state", () => {
    it("applies active class when smartActive is true", () => {
      render(
        <GroceryHeader
          {...defaultProps}
          onOpenSmart={mockOnOpenSmart}
          smartActive={true}
        />
      );
      const smartBtn = screen.getByTitle("Smart features");
      expect(smartBtn).toHaveClass("active");
    });

    it("does not apply active class when smartActive is false", () => {
      render(
        <GroceryHeader
          {...defaultProps}
          onOpenSmart={mockOnOpenSmart}
          smartActive={false}
        />
      );
      const smartBtn = screen.getByTitle("Smart features");
      expect(smartBtn).not.toHaveClass("active");
    });
  });
});
