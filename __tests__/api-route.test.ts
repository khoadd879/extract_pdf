import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/extract/route";
import * as fs from "fs";
import * as path from "path";

const SAMPLES_DIR = path.resolve(__dirname, "../sample-pdfs");

describe("API Route: /api/extract", () => {
  it("should return 400 with descriptive error when no file is sent", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/extract", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing upload file");
    expect(body.detail).toContain("No file was attached");
  });

  it("should return 400 when uploaded file is not a PDF", async () => {
    const formData = new FormData();
    const textBlob = new Blob(["some plain text"], { type: "text/plain" });
    formData.append("file", textBlob, "notes.txt");

    const req = new NextRequest("http://localhost:3000/api/extract", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Unsupported file type");
    expect(body.detail).toContain("notes.txt");
  });

  it("should process standard PDF invoice and return document metadata", async () => {
    const filePath = path.join(SAMPLES_DIR, "IB-55871.pdf");
    const fileBytes = fs.readFileSync(filePath);
    const pdfBlob = new Blob([fileBytes], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", pdfBlob, "IB-55871.pdf");

    const req = new NextRequest("http://localhost:3000/api/extract", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fileName).toBe("IB-55871.pdf");
    expect(body.totalPages).toBe(1);
    expect(body.hasSelectableText).toBe(true);
    expect(body.metadata.documentType).toBe("tax_invoice");
    expect(body.metadata.documentNumber).toBe("IB-55871");
    expect(body.metadata.billTo).toBe("Coastal Build Co");
  });

  it("should return refusal when processing scanned PDF without selectable text", async () => {
    const filePath = path.join(SAMPLES_DIR, "IB-55902.pdf");
    const fileBytes = fs.readFileSync(filePath);
    const pdfBlob = new Blob([fileBytes], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", pdfBlob, "IB-55902.pdf");

    const req = new NextRequest("http://localhost:3000/api/extract", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasSelectableText).toBe(false);
    expect(body.refusals).toHaveLength(1);
    expect(body.refusals[0].type).toBe("illegible");
    expect(body.refusals[0].reason).toContain("scanned image or contains no selectable digital text");
  });
});
