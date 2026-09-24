export interface Evidence {
  pageNumber: number;
  sourceText: string;
}

export type RefusalType = "ambiguous" | "contradictory" | "illegible" | "missing";

export interface Refusal {
  field: string;
  reason: string;
  type: RefusalType;
  pageNumber: number | null;
  sourceText: string | null;
}

export interface ExtractedLineItem {
  code: string | null;
  description: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  rawWeight?: string | null;
  section?: string | null;
  evidence: Evidence;
}

export interface DocumentMetadata {
  documentType: "tax_invoice" | "consolidated_statement" | "unknown";
  documentNumber: string | null;
  date: string | null;
  billTo: string | null;
  jobRef: string | null;
  summaryNote?: string | null;
  warehouseNote?: string | null;
}

export interface DocumentTotals {
  subtotal: number | null;
  gst: number | null;
  total: number | null;
}

export interface ExtractionResult {
  fileName: string;
  totalPages: number;
  metadata: DocumentMetadata;
  extractedItems: ExtractedLineItem[];
  refusals: Refusal[];
  totals: DocumentTotals | null;
  hasSelectableText: boolean;
  processingTimeMs: number;
  extractedAt: string;
}

export interface ExtractionApiError {
  error: string;
  detail?: string;
  status: number;
}
