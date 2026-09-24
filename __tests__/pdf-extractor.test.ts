import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { extractPdfPages, PdfExtractionError } from "../src/lib/pdf-extractor";
import { classifyAndExtractMetadata } from "../src/lib/document-classifier";

const SAMPLES_DIR = path.resolve(__dirname, "../sample-pdfs");

describe("PDF Extractor Core Engine", () => {
  it("should extract pages and text from a standard PDF invoice", async () => {
    const filePath = path.join(SAMPLES_DIR, "IB-55871.pdf");
    const buffer = new Uint8Array(fs.readFileSync(filePath));

    const result = await extractPdfPages(buffer);
    expect(result.totalPages).toBe(1);
    expect(result.hasSelectableText).toBe(true);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].text).toContain("Tax Invoice");
    expect(result.pages[0].text).toContain("IB-55871");
  });

  it("should detect scanned PDF without selectable text (IB-55902)", async () => {
    const filePath = path.join(SAMPLES_DIR, "IB-55902.pdf");
    const buffer = new Uint8Array(fs.readFileSync(filePath));

    const result = await extractPdfPages(buffer);
    expect(result.totalPages).toBe(1);
    expect(result.hasSelectableText).toBe(false);
    expect(result.totalTextLength).toBe(0);
  });

  it("should handle multi-page documents and identify blank pages (IB-STMT47)", async () => {
    const filePath = path.join(SAMPLES_DIR, "IB-STMT47.pdf");
    const buffer = new Uint8Array(fs.readFileSync(filePath));

    const result = await extractPdfPages(buffer);
    expect(result.totalPages).toBe(8);
    expect(result.hasSelectableText).toBe(true);
    // Page 4 should be detected as blank
    expect(result.pages[3].pageNumber).toBe(4);
    expect(result.pages[3].charCount).toBe(0);
  });

  it("should throw EMPTY error when buffer has 0 bytes", async () => {
    const emptyBuffer = new Uint8Array(0);
    await expect(extractPdfPages(emptyBuffer)).rejects.toThrowError(PdfExtractionError);
  });

  it("should throw CORRUPTED error when file is not a real PDF", async () => {
    const fakeBuffer = new TextEncoder().encode("NOT A PDF FILE CONTENT");
    await expect(extractPdfPages(fakeBuffer)).rejects.toThrowError(/PDF header/);
  });
});

describe("Document Classifier & Metadata Extraction", () => {
  it("should classify standard Tax Invoice and extract metadata", () => {
    const text = `Ironbark Trade Merchants Ltd
Tax Invoice
Document No: IB-55871
Date: 5 August 2026
Bill to: Coastal Build Co
Job ref: CB-2216`;

    const metadata = classifyAndExtractMetadata(text);
    expect(metadata.documentType).toBe("tax_invoice");
    expect(metadata.documentNumber).toBe("IB-55871");
    expect(metadata.date).toBe("5 August 2026");
    expect(metadata.billTo).toBe("Coastal Build Co");
    expect(metadata.jobRef).toBe("CB-2216");
  });

  it("should classify Consolidated Statement correctly", () => {
    const text = `Ironbark Trade Merchants Ltd
Consolidated Statement Run 47 - Invoice 1 of 4 - Materials
Document No: IB-STMT47
Date: 28 August 2026`;

    const metadata = classifyAndExtractMetadata(text);
    expect(metadata.documentType).toBe("consolidated_statement");
    expect(metadata.documentNumber).toBe("IB-STMT47");
    expect(metadata.date).toBe("28 August 2026");
  });

  it("should extract summary and warehouse notes when present", () => {
    const text = `Ironbark Trade Merchants Ltd
Tax Invoice
Document No: IB-56088
Date: 10 September 2026
Bill to: Northline Plumbing & Electrical
Job ref: NL-0904

Summary: 9 cartons dispatched from Ironbark warehouse this run.

Warehouse notes: 11 cartons picked and loaded onto the truck.`;

    const metadata = classifyAndExtractMetadata(text);
    expect(metadata.summaryNote).toBe("9 cartons dispatched from Ironbark warehouse this run.");
    expect(metadata.warehouseNote).toBe("11 cartons picked and loaded onto the truck.");
  });

  it("should isolate errors and return null fields gracefully for empty text", () => {
    const metadata = classifyAndExtractMetadata("");
    expect(metadata.documentType).toBe("unknown");
    expect(metadata.documentNumber).toBeNull();
    expect(metadata.date).toBeNull();
    expect(metadata.billTo).toBeNull();
  });
});
