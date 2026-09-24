import { describe, it, expect } from "vitest";
import { generateCsvContent, generateJsonContent } from "../src/lib/export-utils";
import { ExtractionResult } from "../src/lib/types";

describe("Export Utilities (JSON & CSV Content Generation)", () => {
  const sampleResult: ExtractionResult = {
    fileName: "IB-55871.pdf",
    totalPages: 1,
    metadata: {
      documentType: "tax_invoice",
      documentNumber: "IB-55871",
      date: "5 August 2026",
      billTo: "Coastal Build Co",
      jobRef: "CB-2216",
    },
    extractedItems: [
      {
        code: "FX-201",
        description: 'Framing nail "galv" coil, 90mm',
        quantity: 24,
        unit: "box",
        unitPrice: 52.0,
        totalPrice: 1248.0,
        evidence: {
          pageNumber: 1,
          sourceText: 'FX-201 Framing nail "galv" coil, 90mm 24 box $52.00 $1,248.00',
        },
      },
      {
        code: "FX-401",
        description: "Coach screws, bulk carton",
        quantity: 3,
        unit: "carton",
        rawWeight: "20kg",
        unitPrice: 74.0,
        totalPrice: null, // Refused
        evidence: {
          pageNumber: 1,
          sourceText: "FX-401 Coach screws, bulk carton 3 20kg $74.00 /carton",
        },
      },
    ],
    refusals: [
      {
        field: "Total price for item 'FX-401'",
        reason: "The table has a Weight column instead of an Amount column.",
        type: "missing",
        pageNumber: 1,
        sourceText: "FX-401 Coach screws, bulk carton 3 20kg $74.00 /carton",
      },
    ],
    totals: {
      subtotal: 1248.0,
      gst: 187.2,
      total: 1435.2,
    },
    hasSelectableText: true,
    processingTimeMs: 42,
    extractedAt: "2026-09-24T12:00:00.000Z",
  };

  it("should generate valid JSON content with all domain properties", () => {
    const jsonStr = generateJsonContent(sampleResult);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.fileName).toBe("IB-55871.pdf");
    expect(parsed.metadata.documentNumber).toBe("IB-55871");
    expect(parsed.extractedItems).toHaveLength(2);
    expect(parsed.refusals).toHaveLength(1);
    expect(parsed.refusals[0].type).toBe("missing");
  });

  it("should generate valid CSV with UTF-8 BOM, escaped quotes, and refusal records", () => {
    const csv = generateCsvContent(sampleResult);

    // 1. Starts with UTF-8 BOM
    expect(csv.startsWith("\uFEFF")).toBe(true);

    // 2. Contains metadata block
    expect(csv).toContain("DOCUMENT METADATA");
    expect(csv).toContain('"IB-55871"');

    // 3. Contains extracted line items table
    expect(csv).toContain("EXTRACTED LINE ITEMS");
    // Escaped double quotes inside description
    expect(csv).toContain('"Framing nail ""galv"" coil, 90mm"');
    // Refused total price explicitly says REFUSED
    expect(csv).toContain('"REFUSED"');

    // 4. Contains financial summary
    expect(csv).toContain('"1248.00"');
    expect(csv).toContain('"1435.20"');

    // 5. Contains refusals section with verbatim source
    expect(csv).toContain("DOCUMENT REFUSALS & DISCREPANCIES (NEVER GUESSED)");
    expect(csv).toContain('"Total price for item \'FX-401\'"');
    expect(csv).toContain('"missing"');
    expect(csv).toContain('"The table has a Weight column instead of an Amount column."');
  });
});
