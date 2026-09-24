import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/extract/route";
import { ExtractionResult } from "../src/lib/types";

const SAMPLES_DIR = path.resolve(__dirname, "../sample-pdfs");

function createRequest(fileName: string): NextRequest {
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

describe("Core Evaluation Rule: Refusal Rules (Never Guess a Number)", () => {
  it("Rule 1: Must refuse scanned/image-only PDFs where text cannot be verified (IB-55902)", async () => {
    const res = await POST(createRequest("IB-55902.pdf"));
    expect(res.status).toBe(200);

    const data: ExtractionResult = await res.json();
    // Cannot extract text from an image without guessing -> Must refuse
    expect(data.hasSelectableText).toBe(false);
    expect(data.extractedItems).toHaveLength(0);

    const scanRefusal = data.refusals.find((r) => r.type === "illegible");
    expect(scanRefusal).toBeDefined();
    expect(scanRefusal?.field).toContain("Document content");
    expect(scanRefusal?.reason).toMatch(/scanned image|no selectable digital text/i);
  });

  it("Rule 2: Must refuse conflicting values rather than quietly picking one (IB-56088)", async () => {
    const res = await POST(createRequest("IB-56088.pdf"));
    expect(res.status).toBe(200);

    const data: ExtractionResult = await res.json();
    const contradictionRefusal = data.refusals.find((r) => r.type === "contradictory");

    expect(contradictionRefusal).toBeDefined();
    expect(contradictionRefusal?.type).toBe("contradictory");
    expect(contradictionRefusal?.reason).toContain("9 cartons");
    expect(contradictionRefusal?.reason).toContain("11 cartons");
  });

  it("Rule 3: Must refuse line item total price when Amount column is omitted (IB-56010)", async () => {
    const res = await POST(createRequest("IB-56010.pdf"));
    expect(res.status).toBe(200);

    const data: ExtractionResult = await res.json();
    expect(data.extractedItems).toHaveLength(4);

    // Hard rule: Never calculate or invent a total price if there is no Amount column
    for (const item of data.extractedItems) {
      expect(item.totalPrice).toBeNull();
    }

    const missingAmountRefusals = data.refusals.filter((r) => r.type === "missing");
    expect(missingAmountRefusals.length).toBeGreaterThanOrEqual(4);
    expect(missingAmountRefusals[0].reason).toContain("Weight");
  });

  it("Rule 4: Every extracted number must be traceable to pageNumber and verbatim sourceText", async () => {
    const testFiles = ["IB-55871.pdf", "IB-56150.pdf", "IB-56088.pdf", "IB-STMT47.pdf"];

    for (const file of testFiles) {
      const res = await POST(createRequest(file));
      const data: ExtractionResult = await res.json();

      for (const item of data.extractedItems) {
        expect(item.evidence).toBeDefined();
        expect(item.evidence.pageNumber).toBeGreaterThan(0);
        expect(typeof item.evidence.sourceText).toBe("string");
        expect(item.evidence.sourceText.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Rule 5: Refusals must be explained in plain, human-readable language (not generic errors)", async () => {
    const res = await POST(createRequest("IB-56088.pdf"));
    const data: ExtractionResult = await res.json();

    expect(data.refusals.length).toBeGreaterThan(0);
    for (const refusal of data.refusals) {
      // Must not be a lazy error message
      expect(refusal.reason.toLowerCase()).not.toContain("something went wrong");
      expect(refusal.reason.toLowerCase()).not.toContain("an error occurred");
      expect(refusal.reason.length).toBeGreaterThan(20);
    }
  });
});
