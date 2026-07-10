import { AIProvider, CompletionOptions, CompletionResult } from '../types';

function getDynamicReplacement(promptText: string, content: string): string {
  // Extract user's mission title or keywords from the messages
  const goalMatch = promptText.match(/mission goal:\s*([^\n\r\-]+)/i) || promptText.match(/target goal:\s*([^\n\r]+)/i);
  let title = '';
  if (goalMatch && goalMatch[1]) {
    title = goalMatch[1].trim();
  }

  if (!title) {
    // Look for other clues
    const clues = ['mobile', 'phone', 'shop', 'stationery', 'toy', 'store'];
    for (const clue of clues) {
      if (promptText.includes(clue)) {
        title = clue;
        break;
      }
    }
  }

  if (!title) return content;

  // Capitalize title
  const formattedTitle = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Detect if it is mobile/phone related
  const isMobile = title.toLowerCase().includes('mobile') || title.toLowerCase().includes('phone');

  if (isMobile) {
    return content
      .replace(/stationery & kids toys/gi, 'Mobile Phones & Smart Accessories')
      .replace(/stationery and toy/gi, 'mobile phone and tech accessory')
      .replace(/stationery items/gi, 'smartphones and chargers')
      .replace(/stationery/gi, 'mobile shop')
      .replace(/Zenith Wholesale Stationery/gi, 'Zenith Mobile Distributors')
      .replace(/Joybox Toy Distributors/gi, 'Apex Phone & Accessories Wholesalers')
      .replace(/Kids Crafting Kit/gi, 'Flagship Smartphone')
      .replace(/Aesthetic Planner/gi, 'Wireless Earbuds')
      .replace(/Notebooks, Pens, Pencil Cases, Drawing Sets/gi, 'Smartphones, Cases, Screen Protectors, Chargers')
      .replace(/Zenith Wholesale/gi, 'Zenith Mobile')
      .replace(/wooden blocks, STEM kits/gi, 'smartphones, earphone cases')
      .replace(/notebooks, markers/gi, 'chargers, phone cases')
      .replace(/Standard Notebook/gi, 'USB-C Fast Charger')
      .replace(/Specialized Art Pen Pack/gi, 'Noise Cancelling Earbuds')
      .replace(/Back to School \/ Grand Opening/gi, 'Grand Opening')
      .replace(/toy/gi, 'accessory')
      .replace(/toys/gi, 'accessories');
  }

  // Generic fallback replacement using the title
  return content
    .replace(/Acme Stationery & Kids Toys/gi, formattedTitle)
    .replace(/stationery/gi, title.toLowerCase());
}

export class MockAIProvider implements AIProvider {
  public readonly id = 'mock';

  async generateCompletion(options: CompletionOptions): Promise<CompletionResult> {
    const promptText = options.messages.map(m => m.content).join('\n').toLowerCase();
    let content = '';

    // Simulate slight processing delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    if (options.jsonMode) {
      if (promptText.includes('decompose') || promptText.includes('planner') || promptText.includes('tasks') || promptText.includes('milestones')) {
        // Mocking the Planner output
        content = JSON.stringify({
          tasks: [
            {
              id: 'task-1',
              title: 'Competitor & Product Selection Research',
              description: 'Research local stationery and toy stores to identify hot-selling items, pricing trends, and market gaps.',
              workerType: 'Research',
              input: { targetMarket: 'Local kids & stationery buyers', region: 'Acme Retail Area' },
              dependencies: []
            },
            {
              id: 'task-2',
              title: 'Inventory Budgeting & Price Sheet Setup',
              description: 'Calculate product profit margins, set pricing sheets, and allocate the initial $500 inventory and marketing budget.',
              workerType: 'Finance',
              input: { initialBudget: 500, researchFindingsRef: 'task-1' },
              dependencies: ['task-1']
            },
            {
              id: 'task-3',
              title: 'Ad Slogans & Launch Campaign Strategy',
              description: 'Draft Facebook ads, discount slogans, and email templates for the stationery store launch.',
              workerType: 'Marketing',
              input: { budgetLimit: 150, campaignTheme: 'Back to School / Grand Opening' },
              dependencies: ['task-2']
            },
            {
              id: 'task-4',
              title: 'Supplier Outreach & Delivery Pipeline Setup',
              description: 'Identify suppliers for toys and stationery, establish delivery options, and schedule opening orders.',
              workerType: 'Operations',
              input: { shippingZone: 'Local', budgetLimit: 350 },
              dependencies: ['task-2']
            }
          ]
        }, null, 2);
      } else {
        // Generic fallback JSON
        content = JSON.stringify({
          success: true,
          message: 'Mock JSON output generated successfully.',
          data: {
            items: ['Notebooks', 'Pens', 'Pencil Cases', 'Drawing Sets'],
            estimatedDemand: 'High'
          }
        }, null, 2);
      }
    } else {
      // Normal text mode (Markdown reports) - check specific agent headers to avoid clashing with parent contexts
      if (promptText.includes('finance & pricing agent')) {
        content = `### 📊 Consultant Financial Plan & Cost Sheet Setup (₹10,00,000 Budget)
**Project Location:** Ayothiyapattanam, Salem, Tamil Nadu

#### 1. Capital Allocation & Inventory Investment
| Category | Allocated (INR) | Sourcing / Detail |
| :--- | :--- | :--- |
| **Core Stationery Inventory** | ₹3,20,000 | Branded & non-branded student notebook stocks |
| **School Bags & Accessories** | ₹1,80,000 | Durable kids utility backpacks |
| **Aesthetic & Gift Items** | ₹90,000 | Premium planners, fancy pen gift sets |
| **Toys & Creative Games** | ₹1,40,000 | Educational STEM games and preschool toys |
| **Furniture & Interior Racks** | ₹75,000 | Display shelving, counter setups |
| **POS, CCTV & Billing Hardware**| ₹35,000 | Billing PC, barcode scanner, software |
| **Marketing (Local Launch)** | ₹60,000 | Flyers, local auto-announcements, geo-ads |
| **Emergency Contingency Reserve**| ₹1,00,000 | Working capital buffer |
| **Total Setup Cost** | **₹10,00,000** | **Fully Allocated** |

#### 2. Revenue & Break-even Model (Monthly Projection)
* **Average Daily Footfall:** 45 customers
* **Average Basket Value:** ₹300
* **Projected Monthly Gross Revenue:** ₹3,80,000
* **Product Gross Margins:** 35% on average (Stationery: 30%, Toys: 40%, Gifts: 45%)
* **Monthly Gross Profit:** ₹1,33,000
* **Operating Expenses (Opex):** Rent (₹18,000), Salaries (₹22,000), Electricity/Misc (₹8,000) ➔ Total Opex: ₹48,000
* **Net Monthly Cashflow:** ₹85,000
* **Payback / Break-even Period:** ~11 Months

---
**Confidence Score:** 95%
**Assumptions:**
* Average gross margin stays above 33%.
* Tenant lease agreement locked at ₹18,000/month.
`;
      } else if (promptText.includes('marketing copywriter')) {
        content = `### 🚀 Consultant Launch & 30-Day Marketing Plan (Ayothiyapattanam Campaign)
**Core Theme:** "Back to School, Back to Fun!"

#### 1. Launch Slogans
1. *"Ayothiyapattanam's Own Utility Hub: Quality Stationery, Joyful Toys!"*
2. *"Play, Learn, Create: Everything Your Child Needs, Right Next Door."*

#### 2. 30-Day Launch Campaign Timeline
* **Days 1–7 (Pre-Launch)**: Distribute 10,000 pamphlet inserts in local Salem newspapers. Set up standard auto-rickshaw loudspeaker announcements across nearby villages.
* **Day 8 (Grand Launch)**: Ribbon-cutting with free custom stationery goodie-bags for the first 100 students.
* **Days 9–15 (School Outreach)**: Partner with local primary schools for drawing competitions, sponsoring the prizes (branded fancy boxes).
* **Days 16–30 (Community Loyalty)**: Launch the "Star Kid Club" point-based rewards program for repeat buyers.

#### 3. Instagram Content & Social Campaign
* **Week 1 Focus**: "What's in my bag?" Reels showing kids utility sets.
* **Target Audience**: Salem local moms (Age 25–45) targeted via Facebook/Instagram geo-radius ads (5km radius).
* **Estimated ROI**: ₹1.8 Return on Ad Spend (ROAS) in month 1, growing to 2.5x by month 3.

---
**Confidence Score:** 88%
**Assumptions:**
* Local schools allow pamphlet distributions.
* High conversion rate on printed discount coupons (10% off).
`;
      } else if (promptText.includes('operations & logistics agent')) {
        content = `### 📦 Consultant Operations, Logistics & Supply Chain Blueprint
**Warehouse & Sourcing Strategy:** Ayothiyapattanam, Salem

#### 1. Vetted Wholesale Supplier Network
| Supplier Name | Category | Location | Lead Time | MOQ |
| :--- | :--- | :--- | :--- | :--- |
| **Kala Wholesale Books** | Notebooks & Branded Pens | Salem Bazar | 1 day | ₹15,000 |
| **ToyZone Importers** | Educational STEM Toys | Chennai Harbor | 4 days | ₹25,000 |
| **A-One Utility Bags** | Backpacks & Accessories | Tiruppur Market | 2 days | ₹10,000 |
| **Metro Display Racks** | Store Furniture & Shelving | Salem Junction | 1 day | None |

#### 2. Daily SOP & Staffing Blueprint
* **Store Operating Hours**: 9:00 AM to 9:30 PM (Peak hours: 4:00 PM to 8:30 PM).
* **Staffing Plan**: 1 Store Manager (Owner), 1 Billing Clerk/Sales Assistant.
* **Daily Checklist**:
  * 09:00 AM: Shutter lift, POS login, cash register count.
  * 01:00 PM: Inventory restocking from back shelves.
  * 09:00 PM: End-of-day sales report sync, cash deposit box lock.

#### 3. Inventory Reorder Strategy
* Trigger point set at 20% safety stock.
* Weekly stock audit every Monday night using barcode scanner logs.

---
**Confidence Score:** 94%
**Assumptions:**
* Salem wholesale merchants maintain regular stock.
* Local power supply holds (1 hour backup UPS active).
`;
      } else if (promptText.includes('research agent')) {
        content = `### 🧠 Consultant Market Research Report: Stationery & Kids Utility Store (Salem Region)
**Location Focus:** Ayothiyapattanam, Salem, Tamil Nadu
**Target Audience:** Parents, students of nearby schools (e.g., Ayothiyapattanam Government Higher Secondary School, local private matriculation schools), and teachers.

#### 1. Top 5 Competitors & SWOT Analysis
1. *Salem Book House (Salem City)*: Large range, but 12km away. Strength: Pricing. Weakness: Distance.
2. *Raja Stationery (Ayothiyapattanam Bazaar)*: Local. Strength: Proximity. Weakness: Poor product range, outdated inventory.
3. *Vasanth Stores (Ammapet)*: Niche gift shop. Strength: Aesthetic gifts. Weakness: No school utilities.
4. *Sri Ganesh Fancy & Toys (Local)*: Strength: Toys. Weakness: No corporate/student stationery.
5. *Online Portals (Amazon/FirstCry)*: Strength: Range. Weakness: Delivery lag, no immediate tactile purchase.

#### 2. Pricing Comparison & Gaps
* Standard Student Notebook: Market ₹30-40 | Our Target ₹28 (Bulk sourcing)
* Premium Calligraphy/Art Kit: Market ₹250+ | Our Target ₹190 (Direct manufacturer link)
* Market Gap: Lack of curated kids utility bundles (bags, lunchboxes, fancy pens) in the Ayothiyapattanam junction area.

#### 3. Customer Personas
* *Persona A (Ramesh, Parent)*: Prioritizes durabilty and value-for-money products for school-going children.
* *Persona B (Anjali, Teen Student)*: Desires aesthetic Korean-style journals, pastel highlighters, and fancy bags.

#### 4. Risk Assessment
* High rent at junction ➔ Mitigation: Secure long-term lease with fixed 5% escalation.
* Seasonality (Peak sales in June) ➔ Mitigation: Introduce seasonal toys and festival gift items during off-peak months.

---
**Confidence Score:** 92%
**Assumptions:**
* Retail location situated near Ayothiyapattanam bus stand/junction.
* Total setup budget fixed at ₹10,00,000.
**Potential Risks:**
* Direct entry of discount chain.
* Local distributor credit terms delays.
`;
      } else {
        content = `### 🤖 Mock General Response
This is a simulated assistant response. The request was parsed successfully.
* Model: mock-model-1.0
* Input Message Count: ${options.messages.length}
`;
      }
    }

    content = getDynamicReplacement(promptText, content);

    const promptTokens = options.messages.reduce((acc, m) => acc + m.content.split(' ').length, 0) + 10;
    const completionTokens = content.split(' ').length;

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      provider: this.id,
      model: options.model || 'mock-gpt-model',
    };
  }
}
