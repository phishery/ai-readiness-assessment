"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./report.css";

interface Finding {
  item: string;
  status: "good" | "warning" | "critical";
  detail: string;
  fix?: string;
}

interface ActionItem {
  action: string;
  effort: string;
  impact: string;
  detail: string;
}

interface Priority {
  timeframe: string;
  label: string;
  actions: ActionItem[];
  estimated_impact: string;
}

interface Report {
  company_name: string;
  report_date: string;
  overall_score: number;
  overall_grade: string;
  overall_verdict: string;
  section_1_data_infrastructure: {
    score: number;
    title: string;
    summary: string;
    findings: Finding[];
  };
  section_2_process_automation: {
    score: number;
    title: string;
    summary: string;
    findings: Finding[];
  };
  section_3_team_culture: {
    score: number;
    title: string;
    summary: string;
    findings: Finding[];
  };
  section_4_ai_strategy: {
    score: number;
    title: string;
    summary: string;
    findings: Finding[];
    industry_snapshot: string;
  };
  section_5_action_plan: {
    title: string;
    priority_1: Priority;
    priority_2: Priority;
    priority_3: Priority;
  };
  next_steps_cta: {
    headline: string;
    body: string;
    score_improvement: string;
  };
}

function scoreColor(score: number, max = 10) {
  const pct = (score / max) * 100;
  if (pct >= 70) return "#10B981";
  if (pct >= 45) return "#F59E0B";
  return "#EF4444";
}

function statusIcon(status: string) {
  switch (status) {
    case "good":
      return "✓";
    case "warning":
      return "!";
    case "critical":
      return "✕";
    default:
      return "•";
  }
}

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/report/${params.id}`);
        const data = await res.json();

        if (data.status === "processing") {
          setTimeout(load, 2000);
          return;
        }

        if (data.error) {
          setError(data.error);
        } else {
          setReport(data.report);
        }
      } catch {
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="report-loading">
        <div className="spinner-lg" />
        <p>Loading your report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-loading">
        <p style={{ color: "var(--red)" }}>{error || "Report not found"}</p>
      </div>
    );
  }

  const s1 = report.section_1_data_infrastructure;
  const s2 = report.section_2_process_automation;
  const s3 = report.section_3_team_culture;
  const s4 = report.section_4_ai_strategy;
  const s5 = report.section_5_action_plan;
  const overallColor = scoreColor(report.overall_score, 100);
  const projectedScore = Math.min(100, report.overall_score + 30);

  const gauges = [
    { score: s1.score, label: "Data & Infra" },
    { score: s2.score, label: "Automation" },
    { score: s3.score, label: "Team" },
    { score: s4.score, label: "AI Strategy" },
  ];

  return (
    <div className="report-container">
      {/* Cover */}
      <div className="cover">
        <div className="cover-topline">
          <span className="cover-brand-name">AI Readiness Assessment</span>
          <span className="cover-date">{report.report_date}</span>
        </div>

        <div className="cover-label">AI Readiness &amp; Optimization Report</div>
        <div className="cover-business">{report.company_name}</div>

        <div className="score-hero">
          <div className="score-ring">
            <svg viewBox="0 0 36 36">
              <path
                className="score-ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="score-ring-value"
                stroke={overallColor}
                strokeDasharray={`${report.overall_score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="score-ring-number">
              <span className="num">{report.overall_score}</span>
              <span className="of">of 100</span>
            </div>
          </div>
          <div className="score-meta">
            <div className={`score-grade grade-${report.overall_grade}`}>
              <span>●</span> Grade {report.overall_grade}
            </div>
            <div className="score-verdict">{report.overall_verdict}</div>
          </div>
        </div>
      </div>

      {/* Mini Gauges */}
      <div className="gauges-bar">
        {gauges.map((g) => (
          <div key={g.label} className="gauge-item">
            <div className="gauge-mini-ring">
              <svg viewBox="0 0 36 36">
                <path
                  className="gauge-mini-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="gauge-mini-val"
                  stroke={scoreColor(g.score)}
                  strokeDasharray={`${g.score * 10}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="gauge-mini-num">{g.score}</span>
            </div>
            <div className="gauge-label">{g.label}</div>
          </div>
        ))}
      </div>

      <div className="report-body">
        {/* Sections 1-4 */}
        {[
          { num: 1, section: s1 },
          { num: 2, section: s2 },
          { num: 3, section: s3 },
          { num: 4, section: s4 },
        ].map(({ num, section }) => (
          <div key={num} className="section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-num">{num}</div>
                <div className="section-title">{section.title}</div>
              </div>
              <div className="section-score-badge">
                <span style={{ color: scoreColor(section.score) }}>
                  {section.score}/10
                </span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${section.score * 10}%`,
                      background: scoreColor(section.score),
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="section-summary">{section.summary}</div>
            {section.findings.map((f: Finding, i: number) => (
              <div key={i} className={`finding finding-${f.status}`}>
                <div className="finding-icon">{statusIcon(f.status)}</div>
                <div className="finding-content">
                  <div className="finding-label">{f.item}</div>
                  <div className="finding-detail">{f.detail}</div>
                  {f.fix && <div className="finding-fix">{f.fix}</div>}
                </div>
              </div>
            ))}

            {/* Industry snapshot for AI Strategy section */}
            {num === 4 && s4.industry_snapshot && (
              <div className="ai-sim">
                <div className="ai-sim-label">
                  <span className="dot" /> Industry AI Snapshot
                </div>
                <div className="ai-sim-response">{s4.industry_snapshot}</div>
              </div>
            )}
          </div>
        ))}

        {/* Section 5: Action Plan */}
        <div className="section">
          <div className="section-header">
            <div className="section-header-left">
              <div className="section-num">5</div>
              <div className="section-title">{s5.title}</div>
            </div>
          </div>
          {[s5.priority_1, s5.priority_2, s5.priority_3].map((p, i) => (
            <div key={i} className={`action-phase phase-${i + 1}`}>
              <div className="action-phase-header">
                <div className="action-phase-left">
                  <div className="action-phase-badge">{p.timeframe}</div>
                  <div className="action-phase-time">{p.label}</div>
                </div>
                <div className="action-phase-impact">{p.estimated_impact}</div>
              </div>
              <div className="action-items">
                {(p.actions || []).map((a: ActionItem, j: number) => (
                  <div key={j} className="action-item">
                    <div className="action-check" />
                    <div className="action-text">
                      <strong>{a.action}</strong>
                      <span>{a.detail}</span>
                    </div>
                    <div className="action-effort">{a.effort}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta-block">
          <div className="cta-score-jump">
            <span className="cta-score-from">{report.overall_score}</span>
            <span className="cta-score-arrow">&rarr;</span>
            <span className="cta-score-to">{projectedScore}</span>
          </div>
          <div className="cta-headline">
            {report.next_steps_cta?.headline || "Ready to accelerate your AI journey?"}
          </div>
          <div className="cta-body">
            {report.next_steps_cta?.body || ""}
          </div>
          <div className="cta-improvement">
            {report.next_steps_cta?.score_improvement || ""}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="report-footer">
        <div className="footer-left">
          <strong>AI Readiness Assessment</strong>
          <br />
          Generated for {report.company_name} &middot; {report.report_date}
        </div>
        <div className="footer-right">
          <span className="footer-confidential">Confidential</span>
        </div>
      </div>
    </div>
  );
}
