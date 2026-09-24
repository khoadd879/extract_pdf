# Insta Quote AI — Document Line Item Extractor

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> A deterministic PDF extraction engine and web interface built for construction and trade documents. Built with **TypeScript**, **Next.js (App Router)**, and **Tailwind CSS**.

🔗 **Live Demo:** [Deploying to Vercel...] *(Will be updated once connected to Vercel)*

---

## 🎯 The Core Philosophy: "Never Guess"

In construction and trade takeoff, **a confidently wrong number is worse than an explicit refusal**. Every extracted quantity must carry strict, auditable evidence of where it originated in the source document.

This solution is designed around four foundational principles:

1. **Strict Evidence Tracing**: Every extracted number carries its 1-based page number and exact verbatim source text.
2. **Error Isolation**: Issues in one part of a file (e.g. an ambiguous line, a missing column, or an empty page) do **not** take down the entire document. Valid items are extracted, while problematic portions produce isolated refusals.
3. **Transparent Refusals**: When data is missing, ambiguous, contradictory, or illegible (e.g. scanned images without selectable text), the system refuses to guess and reports the exact reason in plain, non-technical language.
4. **No Collapsed Errors**: Refusals and warnings are first-class domain concepts, never collapsed into generic "an error occurred" messages.

---

## 🏗️ Architecture

```
extract-pdf/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Web UI (Upload, results table, refusals)
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Styling
│   │   └── api/
│   │       └── extract/
│   │           └── route.ts            # POST /api/extract (Core Extraction Service)
│   ├── lib/
│   │   ├── types.ts                    # Shared TypeScript domain contracts
│   │   ├── pdf-extractor.ts            # Page-granular text extraction & scan detection
│   │   ├── line-parser.ts              # Robust tabular parsing with error isolation
│   │   ├── document-classifier.ts      # Metadata & document structure analysis
│   │   └── validators.ts               # Total reconciliations & contradiction detection
│   └── components/
│       ├── FileUpload.tsx              # Drag-and-drop upload with validation
│       ├── ExtractionResults.tsx       # Results container
│       ├── LineItemsTable.tsx          # Line items with evidence popovers
│       ├── RefusalList.tsx             # Categorized, human-readable refusals
│       ├── DocumentInfo.tsx            # Header metadata card
│       └── LoadingState.tsx            # Granular progress state
└── __tests__/
    ├── refusal-rules.test.ts           # Core refusal requirement tests
    ├── error-isolation.test.ts         # Partial failure isolation tests
    ├── line-parser.test.ts             # Line parsing verification
    └── validators.test.ts              # Mathematical and cross-check tests
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18 (developed on Node.js 20+)
- npm or yarn

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/<your-username>/extract-pdf.git
cd extract-pdf

# Install dependencies
npm install

# Run the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Running Tests

```bash
npm test
```

---

## 📦 Data Contract (API Schema)

```typescript
interface ExtractedLineItem {
  code: string | null;
  description: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  rawWeight?: string | null;
  section?: string | null;
  evidence: {
    pageNumber: number;
    sourceText: string;
  };
}

interface Refusal {
  field: string;
  reason: string;
  type: "ambiguous" | "contradictory" | "illegible" | "missing";
  pageNumber: number | null;
  sourceText: string | null;
}
```

---

## 📝 Roadmap & Phase Plan

- [x] **Phase 1**: Project initialization, type system, CI/build verification, setup tests
- [ ] **Phase 2**: Core PDF text extraction service (`/api/extract`) with scanned document detection
- [ ] **Phase 3**: Line item parsing engine, contradiction detection, and refusal logic with error isolation
- [ ] **Phase 4**: User interface with evidence tracing popovers and legible refusal reporting
- [ ] **Phase 5**: Automated test suite focusing on refusal rules and fault containment
- [ ] **Phase 6**: Production polish, live Vercel deployment check, and documentation
