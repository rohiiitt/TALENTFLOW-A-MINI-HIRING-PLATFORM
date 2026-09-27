# Autonomous AI Purchasing Agent & Enterprise Hardware Procurement Platform

> **Production-grade, end-to-end AI Purchasing Agent** featuring a **Scalable Real Product Catalog System**, **Data Quality Health Dashboard**, **Bulk Ingestion CLI & Web Importer**, **MCDA Decision Engine**, **Independent 7-Point Post-Purchase Validator**, and **Role-Based Enterprise Admin Portal**.

---

## 🌟 Key Architecture & Capabilities

### 1. Scalable Real Product Catalog & Source Tracking
- **Verified Hardware Models**: Commercial laptops, monitors, mechanical keyboards, precision mice, NVMe SSDs, DDR5 memory kits, and dedicated GPUs with authentic specifications.
- **Traceable Source Metadata**: Every product record tracks its origin:
  - `MANUFACTURER` (Direct OEM specifications and MSRP)
  - `RETAILER_API` (Retailer pricing, inventory, and logistics SLA)
  - `IMPORTED_CATALOG` (Standard batch imported dataset)
  - `MOCK` (Development and resilience testing items)
- **Data Freshness Indicators**: Clear UI and API indicators distinguish live verified prices/stock from imported estimates.
- **Extensible Categories**: Pre-configured for Laptops, Desktop PCs, Monitors, Keyboards, Mice, SSDs, RAM, GPUs, and Accessories.

### 2. Bulk Catalog Ingestion Engine
- **Multi-Format Ingestion**: Ingest catalog datasets from **CSV** and **JSON** files.
- **Data Normalization**: Cleans and normalizes disparate fields (e.g., `"16 GB"`, `"16GB DDR5"`, `"16"` $\to$ `16`; `"1 TB SSD"`, `"1TB"` $\to$ `1024`; `"15.6\""` $\to$ `15.6`).
- **Data Validation**: Enforces integrity constraints (`price >= 0`, `stock >= 0`, `rating ∈ [0, 5]`, positive RAM/Storage).
- **Deduplication & Idempotency**: Automatically detects duplicate records via composite identity `(source, sourceProductId)`, `sku`, and `(brand, model)`. Re-running the import updates existing products without creating duplicate entries.
- **CLI Ingestion Command**:
  ```bash
  npm run import:products -- ./data/products.csv
  ```
- **Live Ingestion Report**: Returns summary metrics (`totalRows`, `created`, `updated`, `duplicates`, `invalid`, `durationMs`, and detailed error logs).

### 3. AI Purchasing Agent with Database Integration
- **Database-Backed Agent Tools**:
  - `searchProducts(criteria)`: Multi-criteria searching with filters for category, brand, source, price range, RAM, storage, rating, and keyword search across names, descriptions, and CPUs.
  - `getProductDetails(productId)`: Returns complete verified specifications, live stock, pricing type, and source URLs.
  - `checkAvailability(productId, quantity)`: Real-time inventory check returning live status and stock level.
  - `estimateDelivery(productId, priority)`: Calculates delivery SLA based on logistics type.
  - `compareProducts(productIds, requirements)`: Runs MCDA decision matrix across candidate items.
- **Dynamic Decision Engine (MCDA)**:
  - **Hard Constraints Elimination**: Budget ceiling, minimum RAM, minimum storage, stock availability, and delivery SLA.
  - **Weighted Soft Preferences**: Price value ratio, processor/spec score, customer rating, delivery speed, and brand affinity.
  - **Dynamic Winner Calculation**: Winners are determined on-the-fly based on buyer requirements without hardcoded assumptions.
- **Pre-Purchase Price Change Protection**:
  - Immediately re-checks current live catalog price against the user's recommended snapshot price.
  - If a price mutation occurs, the agent halts execution and requests explicit buyer re-approval.

### 4. Independent 7-Point Purchase Validation
- Independent verification step auditing order database records:
  1. Order Record Exists in Database
  2. Product Identification Match (SKU / Product ID)
  3. Purchased Quantity Verification
  4. Unit Price & Total Cost Integrity
  5. Budget Limit Adherence
  6. Order & Payment State Machine Confirmation
  7. Hardware Spec Minimums (RAM, Storage, CPU)

### 5. Enterprise Admin Portal & Quality Dashboard
- **Catalog Health Summary**: Live KPIs tracking missing prices, missing images, missing specifications, stale price/stock alerts, duplicate candidates, and source distribution.
- **Bulk Ingestion Web UI**: Upload or paste CSV/JSON payloads directly from the admin dashboard with live ingestion reports.
- **Inventory CRUD**: Manage products, update stock levels, edit specifications, and delete discontinued models.
- **Order Fulfillment & Audit**: Track order status (`SCHEDULED` $\to$ `SHIPPED` $\to$ `DELIVERED`) and inspect agent tool timeline traces.

---

## 🔑 Demo Accounts & Authentication

| Role | Email | Password | Access Level |
|---|---|---|---|
| 👑 **Admin** | `admin@talentflow.ai` | `Admin@123` | Admin Portal, Catalog Ingestion, Inventory CRUD, Order Fulfillment |
| 💻 **Buyer** | `dev.buyer@talentflow.ai` | `Buyer@123` | AI Purchasing Agent & Procurement History |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Import Real Product Catalog
```bash
# Ingest catalog from CSV
npm run import:products -- backend/data/products.csv

# Or ingest from JSON
npm run import:products -- backend/data/products.json
```

### 3. Run Development Servers
In Terminal 1 (Backend API on `http://localhost:4000`):
```bash
cd backend
npm run dev
```

In Terminal 2 (Frontend App on `http://localhost:3000`):
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:3000`.

### 4. Run Automated Tests
```bash
cd backend
npm test
```

All 24 unit and integration tests validate CSV/JSON ingestion, deduplication, search filters, MCDA decision scoring, pre-purchase price change safety, and end-to-end procurement workflows.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=super-secret-procurement-jwt-token-key-2026

# Optional: Real LLM Integration (Fallback to deterministic NLP if unset)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```
