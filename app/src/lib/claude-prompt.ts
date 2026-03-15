import type { WebsiteAudit } from "./website-audit";
import type { SerpSearchResult } from "./serpapi";

export const SYSTEM_PROMPT = `You are a senior AI strategy consultant who produces professional, data-driven AI Readiness Assessment reports for businesses. You write for business owners and executives, not engineers, so use clear, accessible language. Every recommendation must be concrete and actionable. You ONLY output valid JSON. No markdown, no backticks, no preamble.`;

export function buildUserPrompt(data: {
  company_name: string;
  name: string;
  industry: string;
  company_size: string;
  website_url: string;
  current_ai_usage: string;
  biggest_challenge: string;
  ai_tools_used: string[];
  data_readiness: string;
  budget_range: string;
  website_audit?: WebsiteAudit | null;
  serp_data?: SerpSearchResult | null;
  industry_ai_trends?: string | null;
}) {
  let websiteSection = "Website: Not provided";
  if (data.website_audit?.has_website) {
    const a = data.website_audit;
    websiteSection = `## WEBSITE AUDIT (auto-scanned)
URL: ${a.url}
HTTPS: ${a.is_https}
Mobile viewport: ${a.has_viewport}
Page title: ${a.page_title || "Missing"}
Meta description: ${a.has_meta_description}
H1 tag: ${a.has_h1}
Schema.org markup: ${a.has_schema_org}
JSON-LD structured data: ${a.has_json_ld}
Click-to-call link: ${a.has_click_to_call}
Contact/booking form: ${a.has_contact_form}
Chat widget: ${a.has_chat_widget}
Page size: ${a.html_size_kb}KB ${a.is_heavy ? "(HEAVY)" : ""}
Load time: ${a.load_time_ms}ms
${a.error ? `Error: ${a.error}` : ""}`;
  } else if (data.website_url) {
    websiteSection = `Website: ${data.website_url} (could not be scanned)`;
  }

  let searchSection = "";
  if (data.serp_data) {
    const s = data.serp_data;
    searchSection = `\n## ONLINE PRESENCE (from Google search)
Search results found: ${s.total_results}
${s.knowledge_graph ? `Knowledge Graph: ${s.knowledge_graph.title} — ${s.knowledge_graph.description}` : "No Knowledge Graph panel found"}
Top organic results:
${s.organic_results.map((r) => `  ${r.position}. ${r.title} — ${r.link}`).join("\n")}
${s.ai_overview ? `\nGoogle AI Overview mentions: ${s.ai_overview}` : ""}`;
  }

  let trendsSection = "";
  if (data.industry_ai_trends) {
    trendsSection = `\n## INDUSTRY AI TRENDS (from recent search)
${data.industry_ai_trends}`;
  }

  return `Generate an AI Readiness Assessment Report for this business.

## BUSINESS INFO
Company: ${data.company_name}
Contact: ${data.name}
Industry: ${data.industry}
Company Size: ${data.company_size}
Current AI Usage: ${data.current_ai_usage}
AI Tools Currently Used: ${(data.ai_tools_used || []).join(", ") || "None"}
Data Readiness Self-Assessment: ${data.data_readiness}
Budget Range: ${data.budget_range}
Biggest Challenge: ${data.biggest_challenge}

${websiteSection}
${searchSection}
${trendsSection}

## REPORT STRUCTURE

Return this exact JSON structure:

{
  "company_name": "...",
  "report_date": "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}",
  "overall_score": 0-100,
  "overall_grade": "A/B/C/D/F",
  "overall_verdict": "One compelling sentence summarizing their AI readiness position",

  "section_1_data_infrastructure": {
    "score": 0-10,
    "title": "Data & Infrastructure Readiness",
    "summary": "2-3 sentence overview",
    "findings": [
      {
        "item": "Data Organization",
        "status": "good|warning|critical",
        "detail": "Specific finding based on their responses",
        "fix": "Exact action to take"
      },
      {
        "item": "System Integration",
        "status": "good|warning|critical",
        "detail": "Assessment of their current tech stack readiness for AI",
        "fix": "..."
      },
      {
        "item": "Data Quality & Accessibility",
        "status": "good|warning|critical",
        "detail": "...",
        "fix": "..."
      }
    ]
  },

  "section_2_process_automation": {
    "score": 0-10,
    "title": "Process & Automation Potential",
    "summary": "2-3 sentence overview",
    "findings": [
      {
        "item": "Current Workflow Efficiency",
        "status": "good|warning|critical",
        "detail": "...",
        "fix": "..."
      },
      {
        "item": "Automation Opportunities",
        "status": "good|warning|critical",
        "detail": "Based on their industry, identify 2-3 specific processes that could be automated with AI",
        "fix": "..."
      },
      {
        "item": "ROI Potential",
        "status": "good|warning|critical",
        "detail": "Estimate of potential time/cost savings from AI automation",
        "fix": "..."
      }
    ]
  },

  "section_3_team_culture": {
    "score": 0-10,
    "title": "Team & Culture Readiness",
    "summary": "2-3 sentence overview",
    "findings": [
      {
        "item": "AI Literacy",
        "status": "good|warning|critical",
        "detail": "Assessment of team's current AI knowledge based on tools used and usage level",
        "fix": "..."
      },
      {
        "item": "Change Readiness",
        "status": "good|warning|critical",
        "detail": "...",
        "fix": "..."
      },
      {
        "item": "Leadership Buy-In",
        "status": "good|warning|critical",
        "detail": "...",
        "fix": "..."
      }
    ]
  },

  "section_4_ai_strategy": {
    "score": 0-10,
    "title": "AI Strategy & Implementation",
    "summary": "2-3 sentence overview explaining where they stand on their AI journey",
    "findings": [
      {
        "item": "Strategic Clarity",
        "status": "good|warning|critical",
        "detail": "Do they have a clear vision for how AI fits into their business strategy?",
        "fix": "..."
      },
      {
        "item": "Competitive Position",
        "status": "good|warning|critical",
        "detail": "How does their AI adoption compare to industry peers?",
        "fix": "..."
      },
      {
        "item": "AI-Powered Customer Experience",
        "status": "good|warning|critical",
        "detail": "Are they using AI to improve customer interactions, support, or personalization?",
        "fix": "..."
      },
      {
        "item": "AI Agent Readiness",
        "status": "good|warning|critical",
        "detail": "Is their business set up to leverage AI agents for tasks like customer support, scheduling, lead qualification, or internal operations?",
        "fix": "Platforms like AgentLocal.ai can help businesses quickly deploy AI agents that handle customer inquiries, automate scheduling, and streamline operations — without needing a technical team to build from scratch."
      }
    ],
    "industry_snapshot": "Write a 2-3 sentence snapshot of how AI is transforming their specific industry and where the leaders are pulling ahead."
  },

  "section_5_action_plan": {
    "title": "Your 90-Day AI Action Plan",
    "priority_1": {
      "timeframe": "This Week",
      "label": "Quick Wins",
      "actions": [
        {
          "action": "Specific action",
          "effort": "15 min|1 hour|half day",
          "impact": "high|medium",
          "detail": "Step-by-step what to do"
        }
      ],
      "estimated_impact": "What they can expect from doing this"
    },
    "priority_2": {
      "timeframe": "This Month",
      "label": "Foundation Building",
      "actions": [
        {
          "action": "...",
          "effort": "...",
          "impact": "...",
          "detail": "..."
        }
      ],
      "estimated_impact": "..."
    },
    "priority_3": {
      "timeframe": "This Quarter",
      "label": "AI Integration",
      "actions": [
        {
          "action": "...",
          "effort": "...",
          "impact": "...",
          "detail": "..."
        }
      ],
      "estimated_impact": "..."
    }
  },

  "next_steps_cta": {
    "headline": "A personalized headline for their next step",
    "body": "2-3 sentences connecting their specific gaps to concrete next steps. If relevant, mention that platforms like AgentLocal.ai can accelerate their AI adoption by providing ready-to-deploy AI agents tailored to their industry.",
    "score_improvement": "Your AI Readiness score could improve from X to Y within 90 days by following this action plan."
  }
}

## SCORING RULES
- overall_score = weighted average: Data & Infrastructure (25%) + Process & Automation (25%) + Team & Culture (20%) + AI Strategy (30%)
- Each section 0-10, overall 0-100
- Be honest and specific. Don't inflate scores. A business that hasn't started with AI should get a low score. That honesty is what makes the report valuable.
- Every 'fix' must be actionable by a non-technical business owner OR clearly labeled 'needs a professional'
- Tailor all recommendations to their specific industry, size, and stated challenges
- The AI Agent Readiness finding should naturally mention AgentLocal.ai as one option, not as a hard sell
${data.website_audit?.has_website ? "- USE the website audit data to provide specific, evidence-based findings about their digital readiness. Reference actual findings (e.g. 'Your site lacks JSON-LD structured data' or 'Good — your site loads in under 2 seconds')." : ""}
${data.serp_data ? "- USE the search presence data to assess their online visibility and how discoverable they are to AI systems." : ""}`;
}
