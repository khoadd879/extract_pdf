import { describe, it, expect } from "vitest";
import { validateExtraction } from "../src/lib/validators";
import { ExtractedLineItem, DocumentMetadata, DocumentTotals } from "../src/lib/types";
import { ExtractedPage } from "../src/lib/pdf-extractor";

describe("Document Validators & Contradiction Detection", () => {
  const samplePages: ExtractedPage[] = [
    {
      pageNumber: 1,
      charCount: 200,
      text: "Ironbark Trade Merchants Ltd\nFX-201 Timber Bolt 10 ea $5.00 $50.00",
    },
  ];

  const sampleItem: ExtractedLineItem = {
    code: "FX-201",
    description: "Timber Bolt",
    quantity: 10,
    unit: "ea",
    unitPrice: 5.0,
    totalPrice: 50.0,
    evidence: {
      pageNumber: 1,
      sourceText: "FX-201 Timber Bolt 10 ea $5.00 $50.00",
    },
  };

  it("should detect conflicting carton counts in summary vs warehouse notes", () => {
    const metadata: DocumentMetadata = {
      documentType: "tax_invoice",
      documentNumber: "IB-56088",
      date: "10 September 2026",
      billTo: "Northline",
      jobRef: "NL-0904",
      summaryNote: "9 cartons dispatched from Ironbark warehouse this run.",
      warehouseNote: "11 cartons picked and loaded onto the truck.",
    };

    const result = validateExtraction([sampleItem], metadata, null, samplePages);
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].type).toBe("contradictory");
    expect(result.refusals[0].field).toContain("carton count");
    expect(result.refusals[0].reason).toContain("9 cartons");
    expect(result.refusals[0].reason).toContain("11 cartons");
  });

  it("should flag Tax Invoice with missing GST and Subtotal breakdown", () => {
    const metadata: DocumentMetadata = {
      documentType: "tax_invoice",
      documentNumber: "IB-56088",
      date: "10 September 2026",
      billTo: null,
      jobRef: null,
    };
    const totals: DocumentTotals = {
      subtotal: null,
      gst: null,
      total: 2050,
    };

    const result = validateExtraction([sampleItem], metadata, totals, samplePages);
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].type).toBe("missing");
    expect(result.refusals[0].field).toContain("GST");
  });

  it("should flag mathematical discrepancy between line item sum and stated subtotal", () => {
    const metadata: DocumentMetadata = {
      documentType: "tax_invoice",
      documentNumber: "IB-TEST",
      date: null,
      billTo: null,
      jobRef: null,
    };
    const totals: DocumentTotals = {
      subtotal: 999.0, // Contradicts sampleItem totalPrice (50.0)
      gst: 149.85,
      total: 1148.85,
    };

    const result = validateExtraction([sampleItem], metadata, totals, samplePages);
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].type).toBe("contradictory");
    expect(result.refusals[0].field).toContain("reconciliation");
    expect(result.refusals[0].reason).toContain("contradicts the stated Subtotal");
  });

  it("should flag item if sourceText cannot be found in page content", () => {
    const metadata: DocumentMetadata = {
      documentType: "tax_invoice",
      documentNumber: "IB-TEST",
      date: null,
      billTo: null,
      jobRef: null,
    };

    const hallucinatedItem: ExtractedLineItem = {
      ...sampleItem,
      evidence: {
        pageNumber: 1,
        sourceText: "INVENTED TEXT NOT ON PAGE",
      },
    };

    const result = validateExtraction([hallucinatedItem], metadata, null, samplePages);
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].type).toBe("ambiguous");
    expect(result.refusals[0].field).toContain("Grounding evidence");
  });
});
