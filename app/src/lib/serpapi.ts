// Optional SerpAPI integration for enriching assessments with real search data.
// Set SERPAPI_KEY in env to enable. Without it, assessments still work fine
// using just the survey responses + website audit.

export interface SerpSearchResult {
  organic_results: {
    position: number;
    title: string;
    link: string;
    snippet: string;
  }[];
  ai_overview?: string;
  knowledge_graph?: {
    title: string;
    description: string;
    type: string;
  };
  total_results: number;
}

export async function searchBusiness(
  companyName: string,
  industry: string
): Promise<SerpSearchResult | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  try {
    const query = encodeURIComponent(`${companyName} ${industry}`);
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${apiKey}&num=5`
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      organic_results: (data.organic_results || [])
        .slice(0, 5)
        .map(
          (r: { position: number; title: string; link: string; snippet: string }) => ({
            position: r.position,
            title: r.title,
            link: r.link,
            snippet: r.snippet,
          })
        ),
      ai_overview: data.ai_overview?.text || undefined,
      knowledge_graph: data.knowledge_graph
        ? {
            title: data.knowledge_graph.title,
            description: data.knowledge_graph.description,
            type: data.knowledge_graph.type,
          }
        : undefined,
      total_results: data.search_information?.total_results || 0,
    };
  } catch {
    return null;
  }
}

export async function searchIndustryAI(
  industry: string
): Promise<string | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  try {
    const query = encodeURIComponent(
      `AI adoption trends ${industry} 2025 2026`
    );
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${apiKey}&num=3`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const snippets = (data.organic_results || [])
      .slice(0, 3)
      .map((r: { snippet: string }) => r.snippet)
      .join(" | ");
    return snippets || null;
  } catch {
    return null;
  }
}
