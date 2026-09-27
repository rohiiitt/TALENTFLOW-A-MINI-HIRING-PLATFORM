import { ExtractedRequirements } from './agent.types.js';

export class NLPExtractor {
  /**
   * Extracts structured purchasing requirements from natural language buyer prompt.
   * If OPENAI_API_KEY is configured, can query LLM with JSON Schema.
   * Otherwise uses the robust deterministic NLP parsing engine.
   */
  public static async extract(userPrompt: string): Promise<ExtractedRequirements> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const llmResult = await NLPExtractor.extractWithLLM(userPrompt, apiKey);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('LLM extraction encountered an error, falling back to deterministic extractor:', err);
      }
    }

    return NLPExtractor.extractDeterministic(userPrompt);
  }

  private static async extractWithLLM(
    prompt: string,
    apiKey: string
  ): Promise<ExtractedRequirements | null> {
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI Purchasing Agent Requirement Extractor. 
Extract structured purchasing criteria from the user's natural language request. 
Return ONLY valid JSON matching this schema:
{
  "category": "Laptops",
  "budgetMax": number | null (in INR),
  "budgetMin": number | null,
  "currency": "INR",
  "quantity": number (default 1),
  "ramMinGb": number | null (e.g. 16),
  "storageMinGb": number | null (e.g. 512),
  "storageTypePreferred": "SSD" | "HDD" | null,
  "useCase": string | null,
  "preferredBrands": string[],
  "maxDeliveryDays": number | null,
  "minRating": number | null,
  "batteryHoursMin": number | null,
  "hardConstraints": string[],
  "softPreferences": string[]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API responded with ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      currency: parsed.currency || 'INR',
      quantity: parsed.quantity || 1,
      rawText: prompt
    };
  }

  /**
   * Deterministic NLP Extractor using regex and intent matching
   */
  public static extractDeterministic(prompt: string): ExtractedRequirements {
    const text = prompt.toLowerCase();
    const hardConstraints: string[] = [];
    const softPreferences: string[] = [];

    // 1. Budget extraction
    // Match patterns: under ₹80,000, under 80000, < 80k, budget of 75k, <= 80,000
    let budgetMax: number | null = null;
    let budgetMin: number | null = null;

    const budgetKMatch = text.match(/(?:under|below|less than|max|budget(?: of)?|within|<=?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand|lakh|lac)?/i);
    if (budgetKMatch) {
      let val = parseFloat(budgetKMatch[1].replace(/,/g, ''));
      const rawMatch = budgetKMatch[0].toLowerCase();
      if (rawMatch.includes('k') || (val <= 200 && val > 10)) {
        val = val * 1000;
      } else if (rawMatch.includes('lakh') || rawMatch.includes('lac')) {
        val = val * 100000;
      }
      budgetMax = val;
    } else {
      // General number match with currency symbol
      const directCurrencyMatch = text.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*)/i);
      if (directCurrencyMatch) {
        budgetMax = parseFloat(directCurrencyMatch[1].replace(/,/g, ''));
      }
    }

    if (budgetMax) {
      hardConstraints.push(`Budget ceiling: Maximum ₹${budgetMax.toLocaleString('en-IN')}`);
    }

    // 2. RAM extraction
    let ramMinGb: number | null = null;
    const ramMatch = text.match(/(\d+)\s*(?:gb|gig|g)\s*(?:ram|memory|ddr\d?)?/i);
    if (ramMatch) {
      ramMinGb = parseInt(ramMatch[1], 10);
      hardConstraints.push(`Memory: Minimum ${ramMinGb}GB RAM`);
    } else if (text.includes('16gb') || text.includes('16 gb')) {
      ramMinGb = 16;
      hardConstraints.push('Memory: Minimum 16GB RAM');
    } else if (text.includes('32gb') || text.includes('32 gb')) {
      ramMinGb = 32;
      hardConstraints.push('Memory: Minimum 32GB RAM');
    }

    // 3. Storage extraction
    let storageMinGb: number | null = null;
    let storageTypePreferred: 'SSD' | 'HDD' | null = text.includes('hdd') ? 'HDD' : 'SSD';

    const tbMatch = text.match(/(\d+)\s*(?:tb|terabyte)\s*(?:ssd|hdd|storage|nvme)?/i);
    const ssdMatch = text.match(/(\d+)\s*(?:gb)\s*(?:ssd|storage|nvme|rom)/i);

    if (tbMatch) {
      storageMinGb = parseInt(tbMatch[1], 10) * 1024;
      hardConstraints.push(`Storage: Minimum ${tbMatch[1]}TB SSD`);
    } else if (ssdMatch) {
      storageMinGb = parseInt(ssdMatch[1], 10);
      hardConstraints.push(`Storage: Minimum ${storageMinGb}GB SSD`);
    } else if (text.includes('512gb') || text.includes('512 gb')) {
      storageMinGb = 512;
      hardConstraints.push('Storage: Minimum 512GB SSD');
    } else if (text.includes('1tb') || text.includes('1 tb')) {
      storageMinGb = 1024;
      hardConstraints.push('Storage: Minimum 1TB SSD');
    }

    // 4. Quantity extraction
    let quantity = 1;
    const qtyMatch = text.match(/(\d+)\s*(?:units?|pieces?|laptops?|pcs|nos)/i);
    if (qtyMatch && !ramMatch) {
      quantity = parseInt(qtyMatch[1], 10);
    }

    // 5. Delivery & Urgency
    let maxDeliveryDays: number | null = null;
    if (text.includes('urgent') || text.includes('next day') || text.includes('1 day') || text.includes('tomorrow') || text.includes('emergency')) {
      maxDeliveryDays = 1;
      hardConstraints.push('Delivery: Urgent / Next-day dispatch required (≤ 1 day)');
    } else if (text.includes('fast delivery') || text.includes('quick delivery') || text.includes('within 2 days') || text.includes('2 days')) {
      maxDeliveryDays = 2;
      softPreferences.push('Delivery: Fast delivery preferred (≤ 2 days)');
    } else if (text.includes('within 3 days') || text.includes('3 days')) {
      maxDeliveryDays = 3;
      softPreferences.push('Delivery: Within 3 days');
    }

    // 6. Use case extraction
    let useCase: string | null = null;
    if (text.includes('software development') || text.includes('developer') || text.includes('programming') || text.includes('coding') || text.includes('fullstack') || text.includes('backend') || text.includes('frontend')) {
      useCase = 'Software Development & Engineering';
      softPreferences.push('Workload: Multi-core CPU & fast compile speeds for Software Development');
    } else if (text.includes('machine learning') || text.includes('data science') || text.includes('deep learning') || text.includes('ai')) {
      useCase = 'Machine Learning & Data Science';
      softPreferences.push('Workload: High GPU compute & 32GB+ RAM for AI workflows');
    } else if (text.includes('gaming') || text.includes('game dev')) {
      useCase = 'Gaming & High Graphics';
      softPreferences.push('Workload: Dedicated GPU & high refresh display');
    } else if (text.includes('office') || text.includes('business') || text.includes('students')) {
      useCase = 'General Office & Business Productivity';
    }

    // 7. Preferred Brands
    const brandKeywords = ['lenovo', 'thinkpad', 'apple', 'macbook', 'asus', 'dell', 'hp', 'acer', 'samsung', 'lg'];
    const preferredBrands: string[] = [];
    brandKeywords.forEach((b) => {
      if (text.includes(b)) {
        if (b === 'thinkpad') preferredBrands.push('Lenovo');
        else if (b === 'macbook') preferredBrands.push('Apple');
        else preferredBrands.push(b.charAt(0).toUpperCase() + b.slice(1));
      }
    });

    if (preferredBrands.length > 0) {
      softPreferences.push(`Brand preference: ${preferredBrands.join(', ')}`);
    }

    // 8. Battery / Portability preferences
    let batteryHoursMin: number | null = null;
    if (text.includes('battery') || text.includes('all-day battery') || text.includes('good battery life')) {
      batteryHoursMin = 8;
      softPreferences.push('Power: Long battery life (≥ 8 hours)');
    }

    if (text.includes('lightweight') || text.includes('portable') || text.includes('thin')) {
      softPreferences.push('Form factor: Lightweight / Ultrabook portability');
    }

    // Category
    const category = text.includes('monitor') ? 'Monitors' : text.includes('keyboard') ? 'Accessories' : 'Laptops';

    return {
      category,
      budgetMax,
      budgetMin,
      currency: 'INR',
      quantity,
      ramMinGb,
      storageMinGb,
      storageTypePreferred,
      useCase,
      preferredBrands: [...new Set(preferredBrands)],
      maxDeliveryDays,
      minRating: 4.0,
      batteryHoursMin,
      hardConstraints,
      softPreferences,
      rawText: prompt
    };
  }
}
