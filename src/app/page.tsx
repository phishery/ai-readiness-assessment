"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";

const INDUSTRIES = [
  "Technology / SaaS",
  "Professional Services",
  "Healthcare",
  "Financial Services",
  "Retail / E-commerce",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Marketing / Agency",
  "Construction",
  "Legal",
  "Hospitality",
  "Logistics / Transportation",
  "Nonprofit",
  "Other",
];

const AI_TOOLS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Midjourney / DALL-E",
  "Zapier / Make",
  "Custom AI tools",
  "None yet",
];

const PROGRESS_STEPS = [
  { label: "Scanning website infrastructure", sub: "HTTPS, mobile readiness, structured data, page performance" },
  { label: "Analyzing SEO and schema markup", sub: "JSON-LD, meta descriptions, AI-discoverable structured data" },
  { label: "Auditing conversion elements", sub: "Contact forms, click-to-call, chat widgets, booking flows" },
  { label: "Mapping online presence", sub: "Google visibility, Knowledge Graph, AI overview mentions" },
  { label: "Researching industry AI trends", sub: "Competitor adoption patterns and market leader strategies" },
  { label: "Evaluating data infrastructure", sub: "Data organization, system integration, accessibility scoring" },
  { label: "Assessing automation potential", sub: "Identifying workflows with 10-20hr/week savings potential" },
  { label: "Analyzing team readiness", sub: "AI literacy, change management, leadership alignment" },
  { label: "Scoring AI strategy position", sub: "Strategic clarity, competitive positioning, experience gaps" },
  { label: "Evaluating AI agent readiness", sub: "Customer support, scheduling, and lead qualification automation" },
  { label: "Benchmarking against peers", sub: "Comparing readiness score to similar companies in your sector" },
  { label: "Building 90-day action plan", sub: "Prioritizing quick wins, foundation work, strategic integration" },
  { label: "Calculating ROI projections", sub: "Time and cost savings from recommended implementations" },
  { label: "Compiling final assessment", sub: "Generating your comprehensive scored report" },
  { label: "Assessment complete", sub: "Your personalized AI Readiness Report is ready" },
];

export default function Home() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStep(0);

    const form = formRef.current!;
    const data = {
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      company_name: (form.elements.namedItem("company_name") as HTMLInputElement).value,
      industry: (form.elements.namedItem("industry") as HTMLSelectElement).value,
      company_size: (form.elements.namedItem("company_size") as HTMLSelectElement).value,
      website_url: (form.elements.namedItem("website_url") as HTMLInputElement).value,
      current_ai_usage: (form.elements.namedItem("current_ai_usage") as HTMLSelectElement).value,
      biggest_challenge: (form.elements.namedItem("biggest_challenge") as HTMLTextAreaElement).value,
      ai_tools_used: selectedTools,
      data_readiness: (form.elements.namedItem("data_readiness") as HTMLSelectElement).value,
      budget_range: (form.elements.namedItem("budget_range") as HTMLSelectElement).value,
    };

    const stepInterval = setInterval(() => {
      setStep((s) => {
        if (s >= PROGRESS_STEPS.length - 2) {
          clearInterval(stepInterval);
          return s;
        }
        return s + 1;
      });
    }, 2500);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      const result = await res.json();
      setStep(PROGRESS_STEPS.length - 1);

      setTimeout(() => {
        router.push(`/report/${result.id}`);
      }, 1500);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="nav">
        <span className="nav-brand">AI Readiness Assessment</span>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">Complimentary Assessment</div>
            <h1>Measure your organization&apos;s AI readiness</h1>
            <p className="hero-desc">
              A data-driven diagnostic that scores your business across four
              critical dimensions and delivers a prioritized 90-day
              transformation roadmap.
            </p>
            <a href="#assess" className="hero-cta">
              Start your assessment
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <div className="hero-visual">
            <div className="hero-ring">
              <svg viewBox="0 0 36 36">
                <path className="track" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="hero-ring-inner">
                <span className="hero-ring-score">73</span>
                <span className="hero-ring-label">out of 100</span>
                <span className="hero-ring-grade">GRADE B</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="metrics-strip">
        <div className="metric">
          <div className="metric-value">14</div>
          <div className="metric-label">Dimensions Analyzed</div>
        </div>
        <div className="metric">
          <div className="metric-value">4</div>
          <div className="metric-label">Strategic Categories</div>
        </div>
        <div className="metric">
          <div className="metric-value">90</div>
          <div className="metric-label">Day Action Plan</div>
        </div>
        <div className="metric">
          <div className="metric-value">2</div>
          <div className="metric-label">Minutes to Complete</div>
        </div>
      </section>

      {/* Value Props */}
      <section className="value-section">
        <div className="value-eyebrow">What You Receive</div>
        <h2 className="value-heading">
          A comprehensive diagnostic, not a generic checklist
        </h2>
        <div className="value-grid">
          <div className="value-card">
            <div className="value-card-num">01</div>
            <h3>Readiness Score</h3>
            <p>
              A weighted score across data infrastructure, process automation,
              team readiness, and strategic positioning. Benchmarked against
              your industry.
            </p>
          </div>
          <div className="value-card">
            <div className="value-card-num">02</div>
            <h3>Gap Analysis</h3>
            <p>
              Specific findings with severity ratings across every dimension.
              Each gap includes a concrete, actionable recommendation
              tailored to your context.
            </p>
          </div>
          <div className="value-card">
            <div className="value-card-num">03</div>
            <h3>Transformation Roadmap</h3>
            <p>
              A phased 90-day action plan with quick wins, foundation work,
              and strategic integration milestones. Effort-rated and
              impact-scored.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="form-section" id="assess">
        <div className="form-inner">
          <div className="form-eyebrow">Begin Assessment</div>
          <h2>Tell us about your organization</h2>
          <p className="subtitle">
            Your responses are analyzed by AI to generate a personalized report.
          </p>

          {!loading ? (
            <div className="form-card">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Your Name <span className="req">*</span></label>
                    <input type="text" name="name" required />
                  </div>
                  <div className="form-group">
                    <label>Email <span className="req">*</span></label>
                    <input type="email" name="email" required />
                  </div>
                  <div className="form-group">
                    <label>Company Name <span className="req">*</span></label>
                    <input type="text" name="company_name" required />
                  </div>
                  <div className="form-group">
                    <label>Industry <span className="req">*</span></label>
                    <select name="industry" required defaultValue="">
                      <option value="" disabled>Select your industry</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Company Size</label>
                    <select name="company_size" defaultValue="">
                      <option value="">Select</option>
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Company Website</label>
                    <input type="url" name="website_url" placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Current AI Usage</label>
                    <select name="current_ai_usage" defaultValue="">
                      <option value="">Select</option>
                      <option>Not using AI at all</option>
                      <option>Experimenting / exploring</option>
                      <option>Using AI tools individually</option>
                      <option>AI integrated into some workflows</option>
                      <option>AI is core to our operations</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data Readiness</label>
                    <select name="data_readiness" defaultValue="">
                      <option value="">Select</option>
                      <option>Data is scattered / disorganized</option>
                      <option>Some data is organized, most isn&apos;t</option>
                      <option>Data is mostly organized and accessible</option>
                      <option>Data is well-structured and centralized</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>AI Tools Currently in Use</label>
                    <div className="checkbox-group">
                      {AI_TOOLS.map((tool) => (
                        <label key={tool} className="chip">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes(tool)}
                            onChange={() => toggleTool(tool)}
                          />
                          {tool}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Monthly AI / Tech Budget</label>
                    <select name="budget_range" defaultValue="">
                      <option value="">Select</option>
                      <option>Under $500</option>
                      <option>$500 - $2,000</option>
                      <option>$2,000 - $10,000</option>
                      <option>$10,000+</option>
                      <option>Not sure</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>
                      Primary challenge where AI could help <span className="req">*</span>
                    </label>
                    <textarea
                      name="biggest_challenge"
                      required
                      placeholder="e.g., Too much manual data entry, slow customer response times, difficulty scaling operations..."
                    />
                  </div>
                </div>

                {error && (
                  <p style={{ color: "var(--coral)", fontSize: 14, marginTop: 16 }}>
                    {error}
                  </p>
                )}

                <button type="submit" className="submit-btn">
                  Generate Assessment
                </button>
              </form>
            </div>
          ) : (
            <div className="form-card processing-card">
              <div className="processing">
                <div className="processing-header">
                  <div className="processing-gauge">
                    <svg viewBox="0 0 36 36">
                      <path
                        className="processing-gauge-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="processing-gauge-val"
                        strokeDasharray={`${Math.round(
                          (step / (PROGRESS_STEPS.length - 1)) * 100
                        )}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="processing-pct">
                      {Math.round((step / (PROGRESS_STEPS.length - 1)) * 100)}%
                    </span>
                  </div>
                  <div>
                    <h3>Building your assessment</h3>
                    <p className="processing-sub">
                      Analyzing 14 dimensions across 4 strategic categories
                    </p>
                  </div>
                </div>
                <div className="progress-steps">
                  {PROGRESS_STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`progress-step ${
                        i < step ? "done" : i === step ? "active" : ""
                      }`}
                    >
                      <div className="dot">
                        {i < step ? (
                          "✓"
                        ) : i === step ? (
                          <div className="spinner" />
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--slate-40)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div className="step-text">
                        <span className="step-label">{s.label}</span>
                        <span className="step-sub">{s.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="section-eyebrow">What Leaders Say</div>
        <div className="testimonials">
          <div className="testimonial">
            &ldquo;This assessment showed us exactly where to start with AI. We
            implemented the quick wins and saw measurable results in the first
            week.&rdquo;
            <div className="author">Sarah K. &mdash; Marketing Agency CEO</div>
          </div>
          <div className="testimonial">
            &ldquo;The 90-day action plan was incredibly specific to our
            industry. Not generic advice&mdash;real, prioritized steps we could
            act on immediately.&rdquo;
            <div className="author">Mike R. &mdash; SaaS Founder</div>
          </div>
          <div className="testimonial">
            &ldquo;We scored a 34 and it was the wake-up call we needed. Three
            months later, we&apos;re at 71 and saving 20 hours a week on manual
            processes.&rdquo;
            <div className="author">Lisa T. &mdash; Operations Director</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Your data is never shared or sold &middot; Privacy-first &middot; Powered by AI</p>
      </footer>
    </div>
  );
}
