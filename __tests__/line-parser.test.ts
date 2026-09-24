import { describe, it, expect } from "vitest";
import { parseDocumentLineItems } from "../src/lib/line-parser";
import { ExtractedPage } from "../src/lib/pdf-extractor";

describe("Line Parser & Error Isolation", () => {
  it("should parse standard line items with exact evidence", () => {
    const page: ExtractedPage = {
      pageNumber: 1,
      charCount: 200,
      text: `Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
FX-201 Framing nail gun coil, 90mm galv 24 box $52.00 $1,248.00
FX-118 Timber connector bolts M12x150 60 ea $3.40 $204.00
Subtotal: $1,452.00
GST (15%): $217.80
Total (incl GST): $1,669.80`,
    };

    const result = parseDocumentLineItems([page]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      code: "FX-201",
      description: "Framing nail gun coil, 90mm galv",
      quantity: 24,
      unit: "box",
      unitPrice: 52,
      totalPrice: 1248,
      section: null,
      evidence: {
        pageNumber: 1,
        sourceText: "FX-201 Framing nail gun coil, 90mm galv 24 box $52.00 $1,248.00",
      },
    });
    expect(result.totals?.subtotal).toBe(1452);
    expect(result.totals?.gst).toBe(217.8);
    expect(result.totals?.total).toBe(1669.8);
    expect(result.refusals).toHaveLength(0);
  });

  it("should isolate malformed row without taking down valid rows", () => {
    const page: ExtractedPage = {
      pageNumber: 1,
      charCount: 250,
      text: `Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
FX-201 Good item 10 ea $5.00 $50.00
FX-999 Malformed row with bad tokens
FX-202 Another good item 20 ea $2.00 $40.00
Subtotal: $90.00`,
    };

    const result = parseDocumentLineItems([page]);
    // 2 valid items should survive!
    expect(result.items).toHaveLength(2);
    expect(result.items[0].code).toBe("FX-201");
    expect(result.items[1].code).toBe("FX-202");

    // Malformed row produces an isolated refusal
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].type).toBe("ambiguous");
    expect(result.refusals[0].sourceText).toContain("FX-999");
  });

  it("should parse weight-based table and refuse totalPrice when Amount column is missing", () => {
    const page: ExtractedPage = {
      pageNumber: 1,
      charCount: 200,
      text: `Code Description Qty Weight Unit Price
----------------------------------------------------------------------------------------------------------------------
FX-401 Coach screws, bulk carton 3 20kg $74.00 /carton
FX-402 Washers, assorted, loose 2000 640g total $0.02 /ea`,
    };

    const result = parseDocumentLineItems([page]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].code).toBe("FX-401");
    expect(result.items[0].quantity).toBe(3);
    expect(result.items[0].rawWeight).toBe("20kg");
    expect(result.items[0].unitPrice).toBe(74);
    expect(result.items[0].unit).toBe("carton");
    // CRITICAL: totalPrice must be null - never guess!
    expect(result.items[0].totalPrice).toBeNull();

    // Refusals must be generated for the missing totalPrice
    expect(result.refusals).toHaveLength(2);
    expect(result.refusals[0].type).toBe("missing");
    expect(result.refusals[0].reason).toContain("Weight");
  });
});
