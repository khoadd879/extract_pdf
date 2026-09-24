import { describe, it, expect } from "vitest";
import { parseDocumentLineItems } from "../src/lib/line-parser";
import { classifyAndExtractMetadata } from "../src/lib/document-classifier";
import { validateExtraction } from "../src/lib/validators";
import { ExtractedPage } from "../src/lib/pdf-extractor";

describe("Core Evaluation Rule: Error Isolation (Criterion #2)", () => {
  it("Scenario 1: One corrupted row among valid rows must NOT take down valid items", () => {
    const page: ExtractedPage = {
      pageNumber: 1,
      charCount: 300,
      text: `Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
FX-101 Valid item one 10 ea $5.00 $50.00
FX-999 Corrupted unparseable gibberish token row
FX-102 Valid item two 20 ea $2.50 $50.00
FX-103 Valid item three 5 box $10.00 $50.00`,
    };

    const result = parseDocumentLineItems([page]);

    // The 3 valid rows MUST be extracted
    expect(result.items).toHaveLength(3);
    expect(result.items.map((i) => i.code)).toEqual(["FX-101", "FX-102", "FX-103"]);

    // The bad row produces an isolated refusal
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].sourceText).toContain("FX-999");
    expect(result.refusals[0].type).toBe("ambiguous");
  });

  it("Scenario 2: Contradictions in metadata notes must NOT take down line item takeoff", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        charCount: 250,
        text: `Summary: 9 cartons dispatched.
Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
FX-101 Valid item 10 ea $5.00 $50.00
Warehouse notes: 11 cartons picked.`,
      },
    ];

    const parseRes = parseDocumentLineItems(pages);
    const metadata = classifyAndExtractMetadata(pages[0].text);
    const valRes = validateExtraction(parseRes.items, metadata, parseRes.totals, pages);

    // Items are successfully extracted
    expect(parseRes.items).toHaveLength(1);
    expect(parseRes.items[0].code).toBe("FX-101");

    // The contradiction is captured as a distinct refusal
    const contradiction = valRes.refusals.find((r) => r.type === "contradictory");
    expect(contradiction).toBeDefined();
    expect(contradiction?.reason).toContain("9 cartons");
  });

  it("Scenario 3: An empty page in a multi-page docket must NOT invalidate other pages", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        charCount: 150,
        text: `Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
CX-100 Item on page one 5 ea $10.00 $50.00`,
      },
      {
        pageNumber: 2,
        charCount: 0,
        text: "", // Blank page
      },
      {
        pageNumber: 3,
        charCount: 150,
        text: `Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
CX-300 Item on page three 8 ea $12.00 $96.00`,
      },
    ];

    const result = parseDocumentLineItems(pages);

    // Items on Page 1 and Page 3 are preserved
    expect(result.items).toHaveLength(2);
    expect(result.items[0].code).toBe("CX-100");
    expect(result.items[0].evidence.pageNumber).toBe(1);
    expect(result.items[1].code).toBe("CX-300");
    expect(result.items[1].evidence.pageNumber).toBe(3);
  });

  it("Scenario 4: Malformed or unparseable metadata header must not prevent line item extraction", () => {
    const malformedHeaderText = `Invalid non-standard header without document number or dates
Code Description Qty Unit Unit Price Amount
----------------------------------------------------------------------------------------------------------------------
FX-101 Recovered item 1 ea $100.00 $100.00`;

    const metadata = classifyAndExtractMetadata(malformedHeaderText);
    expect(metadata.documentNumber).toBeNull();
    expect(metadata.date).toBeNull();

    const parseResult = parseDocumentLineItems([
      { pageNumber: 1, charCount: malformedHeaderText.length, text: malformedHeaderText },
    ]);

    expect(parseResult.items).toHaveLength(1);
    expect(parseResult.items[0].code).toBe("FX-101");
    expect(parseResult.items[0].totalPrice).toBe(100);
  });
});
