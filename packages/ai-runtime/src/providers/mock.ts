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
        content = `### 📊 Mock Finance Report: Budget Allocation & Inventory Pricing
**Total Allocation:** $500.00

#### 1. Budget Breakdown
| Category | Allocated Amount | Target ROI / Purpose |
| :--- | :--- | :--- |
| Core Inventory | $350.00 | 140 units of stationery items |
| Social Media Ads | $100.00 | Local Facebook & Instagram geo-ads |
| Launch Event / Print | $50.00 | Window banner & flyer prints |

#### 2. Suggested Pricing Worksheet
* **Item A (Kids Crafting Kit):** Cost $5.00 | Retail $14.99 | Margin 66%
* **Item B (Aesthetic Planner):** Cost $2.20 | Retail $8.99 | Margin 75%
`;
      } else if (promptText.includes('marketing copywriter')) {
        content = `### 🚀 Mock Marketing Copy: Grand Opening Campaign
**Theme:** "Spark Creative Minds: Acme Stationery & Kids Toys"

#### 1. Social Media Ad Copy (Facebook / Instagram)
* **Hook:** Unbox creativity in your neighborhood! 🎨✏️
* **Body:** Discover beautiful stationery, creative journaling kits, and educational toys your kids will love. To celebrate our Grand Opening, enjoy **15% OFF** your first purchase this week!
* **CTA:** Visit us at Acme Retail, Main Street! Use code: **WELCOME15** at check-out.

#### 2. Grand Opening Slogans
1. *"Acme Stationery: Where Small Ideas Make Big Impressions."*
2. *"Play, Write, Create: Fun for Kids, Inspiration for You."*
`;
      } else if (promptText.includes('operations & logistics agent')) {
        content = `### 📦 Mock Operations Plan: Supply Chain & Vendor Logistics
**Goal:** Establish local stock procurement & distribution.

#### 1. Shortlisted Niche Suppliers
* **Zenith Wholesale Stationery:** Lead time 3 days. Minimum Order Quantity (MOQ) $100. Good for notebooks, markers.
* **Joybox Toy Distributors:** Lead time 5 days. MOQ $150. Good for wooden blocks, STEM kits.

#### 2. Distribution & Store Setup
* **Fulfillment:** Standard retail shelves with dedicated "Bestsellers" and "Kids Creative Zone" sections.
* **Delivery Strategy:** Leverage local delivery courier service for orders placed within a 5-mile radius.
`;
      } else if (promptText.includes('research agent')) {
        content = `### 🧠 Mock Research Report: Stationery & Toy Market Analysis
**Scope:** Local neighborhood study for Acme Retail Store.

#### 1. Key Findings & Market Gaps
* **High Demand Products:** Bullet journals, dual-tip brush pens, and creative DIY kits for kids show strong upward search volume.
* **Competitor Strengths:** Big-box retailers offer low prices but lacks curation, personalization, and niche aesthetic items.
* **Opportunities:** Specialized "kids crafting bundles" and custom calligraphy starter packs.

#### 2. Pricing & Cost Benchmarks
* Standard Notebook Cost: $1.20 | Target Retail Price: $4.99 (Margin: 76%)
* Specialized Art Pen Pack Cost: $3.50 | Target Retail Price: $12.99 (Margin: 73%)
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
