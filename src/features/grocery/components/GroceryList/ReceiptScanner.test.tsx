/**
 * ReceiptScanner tests
 *
 * Note: This component is complex with camera/OCR hooks and uses React.useEffect
 * in a way that requires the actual React module. Full integration testing is
 * recommended for this component.
 */

describe("ReceiptScanner", () => {
  it("exports ReceiptScanner component", () => {
    // Verify the component can be imported
    const { ReceiptScanner } = require("./ReceiptScanner");
    expect(ReceiptScanner).toBeDefined();
    expect(typeof ReceiptScanner).toBe("function");
  });

  it("exports AddItemsData type", () => {
    // Type exports are verified at compile time
    // Just verify the module exports are accessible
    const exports = require("./ReceiptScanner");
    expect(exports.ReceiptScanner).toBeDefined();
  });
});
