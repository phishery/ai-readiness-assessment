import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/claude-prompt";
import { auditWebsite } from "@/lib/website-audit";
import { searchBusiness, searchIndustryAI } from "@/lib/serpapi";

export const maxDuration = 60; // Vercel function timeout

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const required = ["email", "name", "company_name", "industry", "biggest_challenge"];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const sql = getDb();

    // 1. Insert lead immediately
    const [row] = await sql`
      INSERT INTO assessments (
        email, name, company_name, industry, company_size, website_url,
        current_ai_usage, biggest_challenge, ai_tools_used, data_readiness, budget_range,
        status
      ) VALUES (
        ${body.email.trim().toLowerCase()},
        ${body.name.trim()},
        ${body.company_name.trim()},
        ${body.industry},
        ${body.company_size || "Not specified"},
        ${body.website_url?.trim() || null},
        ${body.current_ai_usage || "Not specified"},
        ${body.biggest_challenge.trim()},
        ${body.ai_tools_used || []},
        ${body.data_readiness || "Not specified"},
        ${body.budget_range || "Not specified"},
        'processing'
      )
      RETURNING id
    `;

    const assessmentId = row.id;

    // 2. Run enrichment in parallel: website audit + SerpAPI (if key set)
    const [websiteAudit, serpData, industryTrends] = await Promise.all([
      body.website_url ? auditWebsite(body.website_url) : Promise.resolve(null),
      searchBusiness(body.company_name, body.industry),
      searchIndustryAI(body.industry),
    ]);

    // 3. Build prompt with all enrichment data and call Claude
    const prompt = buildUserPrompt({
      ...body,
      website_audit: websiteAudit,
      serp_data: serpData,
      industry_ai_trends: industryTrends,
    });

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error("Claude API error:", errBody);
      throw new Error("AI report generation failed");
    }

    const claudeData = await claudeRes.json();
    const content = claudeData.content?.[0]?.text || "";
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const report = JSON.parse(cleaned);

    // 4. Validate / recalculate score
    if (!report.overall_score || report.overall_score < 0 || report.overall_score > 100) {
      const s1 = report.section_1_data_infrastructure?.score || 5;
      const s2 = report.section_2_process_automation?.score || 5;
      const s3 = report.section_3_team_culture?.score || 5;
      const s4 = report.section_4_ai_strategy?.score || 5;
      report.overall_score = Math.round(s1 * 2.5 + s2 * 2.5 + s3 * 2 + s4 * 3);
    }

    const score = report.overall_score;
    if (score >= 85) report.overall_grade = "A";
    else if (score >= 70) report.overall_grade = "B";
    else if (score >= 55) report.overall_grade = "C";
    else if (score >= 40) report.overall_grade = "D";
    else report.overall_grade = "F";

    // 5. Store completed report
    await sql`
      UPDATE assessments
      SET report_json = ${JSON.stringify(report)}::jsonb,
          overall_score = ${report.overall_score},
          status = 'complete',
          updated_at = NOW()
      WHERE id = ${assessmentId}
    `;

    return NextResponse.json({
      id: assessmentId,
      score: report.overall_score,
      grade: report.overall_grade,
    });
  } catch (err: unknown) {
    console.error("Assessment error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
