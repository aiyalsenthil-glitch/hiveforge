# 🏪 HiveForge Retail Store Operating System & AI Workforce

## 📌 Executive Overview

HiveForge Retail Store Operating System is an end-to-end management platform designed to help retail store owners, managers, and staff run daily store operations—from store launch planning and inventory cataloging to POS billing checkout and real-time sales telemetry—all supported by a collaborative **AI Digital Workforce**.

```
+-----------------------------------------------------------------------------------+
| 🏪 HIVEFORGE RETAIL COMMAND CENTER                                               |
+-----------------------------------------------------------------------------------+
| [💳 POS Billing Counter]  [📦 Inventory Catalog]  [📊 Sales & Analytics]  [🚀 AI Missions] |
+-----------------------------------------------------------------------------------+
|  POS Terminal            Stock Levels & Alerts   Revenue Telemetry       Store Launch      |
|  • Instant Item Search   • In Stock / Low Stock   • Daily Sales Total     • Market Study    |
|  • Cart & Quantity       • Cost & Selling Prices  • Profit Margins %      • Capital Model   |
|  • Discount & GST Tax    • Margin % Analysis      • Transactions History  • 30-Day Campaign |
|  • Cash/UPI/Card Pay     • Quick Adjustment (+/-) • AI Sales Advisor     • Daily Store SOPs|
|  • Printable Receipt     • Add Product Form       • Receipt Reprint       • Worker Graphs   |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Key Modules & Capabilities

### 1. 💳 POS Billing Terminal Counter (`POS_BILLING`)
- **Product Search & Barcode Scanner**: Instant product query by name, category (`Stationery`, `Toys`, `Bags`, `Utilities`), SKU, or barcode.
- **Interactive Cart**: Real-time line item quantity controls (`+` / `-`), line total calculation, and item removal.
- **Discount & GST Tax Calculation**: Configurable discount percentages (`0%`, `5%`, `10%`, `15%`, `20%`) and 5% GST tax calculation.
- **Multi-Payment Modes**: Supports `Cash`, `UPI / QR Code`, and `Card / POS`.
- **Printable Tax Invoice Receipt (`INV-2026-XXXX`)**: Generates a professional tax invoice modal with store header, GSTIN, customer details, itemized breakdown, net total, and direct print command (`window.print()`).

### 2. 📦 Product Inventory Catalog (`INVENTORY`)
- **Stock Tracking Matrix**: SKU, Product Name, Category, Unit Cost Price, Selling Price, Gross Margin %, and current stock count.
- **Automated Stock Threshold Badges**: Visual status indicators (`In Stock`, `Low Stock`, `Out of Stock`) and low-stock header alerts when inventory falls below minimum threshold (`minStockLevel`).
- **Quick Stock Adjustments**: Instant `+10` / `-5` stock level increment/decrement controls.
- **Add Product Modal**: Form to register new inventory products with price, stock, category, and optional barcode.

### 3. 📊 Sales & Business Analytics (`SALES_ANALYTICS`)
- **Revenue Overview Cards**: Tracked total gross revenue, transaction counts, average profit margin (34.5%), and active catalog SKUs.
- **Recent Sales History Table**: Log of past invoices with customer names, payment methods, item counts, total amounts, and receipt re-printing.
- **AI Sales & Inventory Advisor**: Real-time AI recommendations predicting top-selling categories and inventory reorder points.

### 4. 🤖 Store Launch & AI Digital Workforce (`STORE_LAUNCH` & `WORKFORCE`)
- **Mission Composer**: Decomposes high-level store goals into Directed Acyclic Task Graphs (DAGs).
- **Specialized AI Agents**:
  - `Research Agent`: Conducts demographic studies and competitor pricing research.
  - `Finance & Pricing Agent`: Builds inventory capital models, profit margin sheets, and break-even projections.
  - `Marketing Copywriter`: Formulates launch slogans, flyers, and 30-day social media campaign roadmaps.
  - `Operations Agent`: Establishes supplier networks and daily opening SOP checklists.
  - `Sales POS Advisor`: Predicts inventory reorder triggers and sales trends.

---

## 🔄 End-to-End Workflow Cycle

1. **Store Planning Phase**: User launches an AI mission (e.g., *"Launch Ayothiyapattanam Kids & Stationery Hub"*). AI Workers decompose the goal into market research, budget allocation, marketing copy, and supplier SOPs.
2. **Cataloging Phase**: Manager registers inventory items in the **Inventory Catalog** with SKU, cost price, selling price, and stock alert thresholds.
3. **Billing Phase**: Staff scan/pick items in the **POS Billing Counter**, apply discounts, select payment method, complete checkout, and print invoice receipt (`INV-2026-XXXX`).
4. **Stock Auto-Deduction**: Completed sales automatically decrement product stock levels in real time.
5. **Analytics & Reorder Phase**: Store owner checks **Sales Analytics** and runs **AI Sales Advisor** to identify low-stock items and reorder high-demand products before peak footfall.
