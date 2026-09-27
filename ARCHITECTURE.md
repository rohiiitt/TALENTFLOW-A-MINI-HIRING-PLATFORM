# System Architecture — Autonomous AI Purchasing Agent

## 1. High-Level Architectural Topology

```text
                                  +---------------------------------------+
                                  |         Buyer Natural Language        |
                                  |         Procurement Request           |
                                  +---------------------------------------+
                                                     |
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                                              Vite + React Frontend                                          |
|  - Live 8-Stage Agent Timeline Visualizer   - Extracted Requirements Panel  - Candidate Comparison Matrix   |
|  - Recommended Product Presentation Card    - Human-in-the-Loop Confirmation - Post-Purchase Audit Report   |
|  - Real-Time Tool Execution Log Drawer (Timestamp, Latency, Input/Output JSON Inspector)                   |
+-------------------------------------------------------------------------------------------------------------+
                                                     |
                                              REST API (JSON)
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                                            Express.js Backend API                                           |
|  - Session Controller (/api/agent/session)  - Order Controller (/api/orders) - Product Controller (/api/..) |
+-------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                                         Agent Orchestrator Service                                          |
|                                                                                                             |
|  [Step 1: NLP Extractor]                                                                                    |
|     ├─ Hybrid: LLM (OpenAI/Gemini JSON Schema) OR Deterministic Regex Intent Parsing                       |
|     └─ Hard Constraints (Budget Max, RAM, SSD) vs Soft Preferences (Battery, Brand, Use-Case)              |
|                                                                                                             |
|  [Step 2: Investigation & Discovery]                                                                        |
|     ├─ searchProducts() Tool -> Queries category catalog                                                   |
|     ├─ getProductDetails() Tool -> Extracts full CPU/GPU/Battery/OS hardware profiles                       |
|     ├─ checkAvailability() Tool -> Checks real-time stock levels                                            |
|     └─ estimateDelivery() Tool -> Calculates courier SLA & expedited routing                                |
|                                                                                                             |
|  [Step 3: Multi-Criteria Decision Engine]                                                                   |
|     ├─ Stage 1: Hard Constraint Elimination (Budget violation, RAM shortage, Out of Stock)                |
|     ├─ Stage 2: MCDA Weighted Scoring Matrix (Spec 30%, Price 25%, Rating 20%, Delivery 15%, Brand 10%)    |
|     └─ Stage 3: Explainable Decision Summary Generator & Trade-off Formulator                               |
|                                                                                                             |
|  [Step 4: Human-in-the-Loop Approval]                                                                       |
|     └─ Pauses pipeline in WAITING_APPROVAL state for explicit buyer confirmation                            |
|                                                                                                             |
|  [Step 5: Atomic Purchase Action]                                                                           |
|     ├─ placeOrder() Tool -> Atomic stock reservation, decrement, Order entity persistence                  |
|     └─ State Mutation: CONFIRMED, Payment: SUCCESS, Inventory: Updated                                      |
|                                                                                                             |
|  [Step 6: Independent Post-Purchase Validation]                                                             |
|     └─ validatePurchase() Tool -> 7-Point Cross-Verification Checklist                                      |
|          1. Order Exists in DB                                                                              |
|          2. Product ID matches recommendation                                                               |
|          3. Order quantity matches requested units                                                          |
|          4. Order unit price <= approved budget limit                                                       |
|          5. Order status = CONFIRMED & payment = SUCCESS                                                    |
|          6. Catalog specs satisfy requested RAM/Storage                                                     |
|          7. Delivery estimate assigned within SLA                                                           |
+-------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                                       ACID Repository & Data Engine                                         |
|  - Products Table (11+ Curated Laptops with nuanced trade-offs, prices, stock, and specs)                   |
|  - Orders Table (Id, SessionId, UserId, ProductId, Qty, Price, Status, PaymentStatus, DeliveryStatus)        |
|  - AgentSessions Table (Id, Status, ExtractedRequirements, SelectedProduct, DecisionSummary, Report)        |
|  - AgentActions Table (Id, SessionId, StepNo, ToolName, Input, Output, Status, LatencyMs, Explanation)      |
+-------------------------------------------------------------------------------------------------------------+
```

---

## 2. Agent State Machine

The purchasing workflow transitions strictly across the following state enum:

```text
REQUEST_RECEIVED
       │
       ▼
REQUIREMENTS_EXTRACTED
       │
       ▼
  RESEARCHING
       │
       ▼
 OPTIONS_FOUND
       │
       ▼
OPTIONS_COMPARED
       │
       ▼
 DECISION_MADE ──► WAITING_APPROVAL (User Confirmation Gate)
                          │
                          ▼
                  PURCHASE_INITIATED
                          │
                          ▼
                  PURCHASE_COMPLETED
                          │
                          ▼
                     VALIDATING
                          │
                          ▼
                      VALIDATED (or FAILED with recovery reporting)
```

---

## 3. Mathematical Decision Engine & MCDA Scoring Formula

Each catalog candidate $P$ is evaluated through a two-stage filter:

### Stage 1: Hard Constraint Boolean Filter ($H(P)$)
$$H(P) = \left( \text{Price}_P \le \text{Budget}_{\max} \right) \land \left( \text{RAM}_P \ge \text{RAM}_{\min} \right) \land \left( \text{Storage}_P \ge \text{Storage}_{\min} \right) \land \left( \text{Stock}_P \ge \text{Qty} \right) \land \left( \text{DeliveryDays}_P \le \text{Days}_{\max} \right)$$

If $H(P) = \text{False}$, the product is eliminated from winner eligibility and annotated with an explicit `eliminationReason`.

### Stage 2: Multi-Criteria Soft Scoring ($S(P)$)
For candidates where $H(P) = \text{True}$:

$$S(P) = 0.30 \cdot \text{SpecScore}(P) + 0.25 \cdot \text{PriceScore}(P) + 0.20 \cdot \text{RatingScore}(P) + 0.15 \cdot \text{DeliveryScore}(P) + 0.10 \cdot \text{BrandScore}(P)$$

Where:
- $\text{PriceScore}(P) \in [0, 10]$: Calibrated based on savings relative to the budget ceiling.
- $\text{SpecScore}(P) \in [0, 10]$: Calibrated based on CPU performance tiers (H-series/Ultra/M-series), DDR5 bandwidth, and battery longevity ($\ge 9$h).
- $\text{RatingScore}(P) = \frac{\text{Rating}}{5.0} \times 10$.
- $\text{DeliveryScore}(P) \in \{10 \text{ for 1-day}, 9 \text{ for 2-days}, 7.5 \text{ for 3-days}, 5.0 \text{ for 4+ days}\}$.
- $\text{BrandScore}(P) = 10$ if matching buyer preferred brands, else $6.0$.

---

## 4. Independent Validation Architecture

A key differentiator of this agent is that **action execution is not presumed valid**. The `validatePurchase()` tool acts as an independent auditor that runs against the database and buyer requirements:

```typescript
interface ValidationReport {
  orderId: string;
  validatedAt: string;
  overallStatus: 'PASSED' | 'FAILED' | 'WARNING';
  items: {
    criterion: string;
    passed: boolean;
    expected: string | number;
    actual: string | number;
    details: string;
  }[];
  summary: string;
}
```

---

## 5. Security & Production Considerations

1. **Deterministic Resilience**: The agent operates 100% reliably out of the box using built-in intent parsing and decision engines, with optional zero-code configuration for external LLMs via `OPENAI_API_KEY`.
2. **Auditability**: Every tool execution is recorded in the `actions` table with microsecond timestamps, latency measurements, input parameters, and output responses.
3. **Failure Isolation**: An explicit failure simulation mode demonstrates payment error handling without crashing the agent pipeline.
