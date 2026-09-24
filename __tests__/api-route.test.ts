import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/extract/route";
import * as fs from "fs";
import * as path from "path";

const SAMPLES_DIR = path.resolve(__dirname, "../sample-pdfs");

function createPdfRequest(fileName: string): NextRequest {
  const filePath = path.join(SAMPLES_DIR, fileName);
  const fileBytes = fs.readFileSync(filePath);
  const pdfBlob = new Blob([fileBytes], { type: "application/pdf" });

  const formData = new FormData();
  formData.append("file", pdfBlob, fileName);

  return new NextRequest("http://localhost:3000/api/extract", {
    method: "POST",
    body: formData,
  });
}

describe("API Route: End-to-End Extraction with 6 Sample Documents", () => {
  it("should extract clean Tax Invoice IB-55871 with exact evidence", async () => {
    const req = createPdfRequest("IB-55871.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.metadata.documentNumber).toBe("IB-55871");
    expect(body.extractedItems).toHaveLength(4);
    expect(body.refusals).toHaveLength(0);

    // Verify evidence on every extracted item
    for (const item of body.extractedItems) {
      expect(item.evidence.pageNumber).toBe(1);
      expect(item.evidence.sourceText).toBeTruthy();
    }

    expect(body.totals.subtotal).toBe(3259);
    expect(body.totals.gst).toBe(488.85);
    expect(body.totals.total).toBe(3747.85);
  });

  it("should extract clean Tax Invoice IB-56150", async () => {
    const req = createPdfRequest("IB-56150.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.metadata.documentNumber).toBe("IB-56150");
    expect(body.extractedItems).toHaveLength(4);
    expect(body.refusals).toHaveLength(0);
    expect(body.totals.subtotal).toBe(1270);
    expect(body.totals.total).toBe(1501.8);
  });

  it("should handle IB-56088 with contradiction refusal and extract items (fault containment)", async () => {
    const req = createPdfRequest("IB-56088.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    // 3 items should still be extracted! Problems do not take down the file.
    expect(body.extractedItems).toHaveLength(3);
    expect(body.totals.total).toBe(2050);

    // Contradiction between 9 cartons vs 11 cartons should be flagged
    const contradictionRefusal = body.refusals.find((r: any) => r.type === "contradictory");
    expect(contradictionRefusal).toBeDefined();
    expect(contradictionRefusal.reason).toContain("cartons");
  });

  it("should handle IB-56010 with weight columns and refuse guessing totalPrice", async () => {
    const req = createPdfRequest("IB-56010.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.extractedItems).toHaveLength(4);

    // Every item has totalPrice === null, never invented
    for (const item of body.extractedItems) {
      expect(item.totalPrice).toBeNull();
      expect(item.rawWeight).toBeTruthy();
    }

    // Refusals generated for missing amounts
    const missingAmountRefusals = body.refusals.filter((r: any) => r.type === "missing");
    expect(missingAmountRefusals.length).toBeGreaterThanOrEqual(4);
  });

  it("should handle multi-page Consolidated Statement IB-STMT47 with blank page refusal", async () => {
    const req = createPdfRequest("IB-STMT47.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalPages).toBe(8);
    // 21 items across pages 1, 2, 3, 5, 6, 7, 8
    expect(body.extractedItems).toHaveLength(21);

    // Blank page 4 must be flagged as refusal
    const page4Refusal = body.refusals.find((r: any) => r.field === "Page 4");
    expect(page4Refusal).toBeDefined();
    expect(page4Refusal.type).toBe("missing");
  });

  it("should refuse scanned PDF IB-55902 gracefully with plain language reason", async () => {
    const req = createPdfRequest("IB-55902.pdf");
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.hasSelectableText).toBe(false);
    expect(body.extractedItems).toHaveLength(0);
    expect(body.refusals).toHaveLength(1);
    expect(body.refusals[0].type).toBe("illegible");
    expect(body.refusals[0].reason).toContain("scanned image");
  });
});
