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

// Detailed progress steps that map to actual report sections + enrichment.
// Each step has a label (what we're doing) and a subtext (why it matters / proof of value).
const PROGRESS_STEPS = [
  {
    label: "Scanning your website...",
    sub: "Checking HTTPS, mobile readiness, structured data, and page performance",
    icon: "🌐",
  },
  {
    label: "Analyzing SEO & schema markup...",
    sub: "JSON-LD, meta descriptions, and AI-discoverable structured data",
    icon: "🔍",
  },
  {
    label: "Checking conversion elements...",
    sub: "Contact forms, click-to-call, chat widgets, and booking flows",
    icon: "📱",
  },
  {
    label: "Searching your online presence...",
    sub: "Google visibility, Knowledge Graph, and AI overview mentions",
    icon: "📊",
  },
  {
    label: "Researching AI trends in your industry...",
    sub: "How your competitors are adopting AI and where leaders are pulling ahead",
    icon: "📈",
  },
  {
    label: "Evaluating data infrastructure readiness...",
    sub: "Scoring your data organization, system integration, and accessibility",
    icon: "🗄️",
  },
  {
    label: "Assessing process automation potential...",
    sub: "Identifying workflows that could save 10-20 hours/week with AI",
    icon: "⚙️",
  },
  {
    label: "Analyzing team & culture readiness...",
    sub: "AI literacy, change management readiness, and leadership alignment",
    icon: "👥",
  },
  {
    label: "Scoring your AI strategy position...",
    sub: "Strategic clarity, competitive positioning, and customer experience gaps",
    icon: "🎯",
  },
  {
    label: "Evaluating AI agent readiness...",
    sub: "Can AI agents handle your customer support, scheduling, and lead qualification?",
    icon: "🤖",
  },
  {
    label: "Benchmarking against industry peers...",
    sub: "Comparing your readiness score to similar companies in your sector",
    icon: "🏆",
  },
  {
    label: "Building your personalized 90-day action plan...",
    sub: "Prioritizing quick wins, foundation work, and strategic AI integration",
    icon: "🗺️",
  },
  {
    label: "Calculating ROI projections...",
    sub: "Estimating time and cost savings from recommended AI implementations",
    icon: "💰",
  },
  {
    label: "Generating your AI Readiness Report...",
    sub: "Compiling findings into your comprehensive scored assessment",
    icon: "📋",
  },
  {
    label: "Report ready!",
    sub: "Your personalized AI Readiness Assessment is complete",
    icon: "✅",
  },
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

    // Advance progress steps on a cadence to fill ~30-45 seconds
    // Each step shows 2-3 seconds — fast enough to feel dynamic
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
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Free AI Assessment</div>
          <div className="hero-gauge">
            <svg viewBox="0 0 36 36">
              <path
                className="bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="value"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="hero-gauge-label">
              <span className="num">73</span>
              <span className="sub">of 100</span>
            </div>
          </div>
          <h1>Is Your Business Ready for AI?</h1>
          <p>
            Get a free AI Readiness Assessment in under 2 minutes. Discover your
            score, see how you compare to your industry, and get a personalized
            90-day action plan.
          </p>
          <a href="#assess" className="hero-cta">
            Get Your Free Assessment &rarr;
          </a>
        </div>
      </section>

      {/* Value Cards */}
      <section className="cards-section">
        <div className="card">
          <div className="card-icon" style={{ background: "#DBEAFE" }}>
            📊
          </div>
          <h3>AI Readiness Score</h3>
          <p>
            See exactly where your business stands on data, processes, team
            readiness, and AI strategy.
          </p>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: "#FEF3C7" }}>
            🏆
          </div>
          <h3>Industry Benchmark</h3>
          <p>
            Understand how your AI adoption compares to peers in your industry
            and where you can gain an edge.
          </p>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: "#D1FAE5" }}>
            🗺️
          </div>
          <h3>90-Day Action Plan</h3>
          <p>
            Get a prioritized roadmap of quick wins and strategic moves,
            tailored to your business.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="form-section" id="assess">
        <h2>Your AI Readiness Assessment</h2>
        <p className="subtitle">
          Answer a few questions and get your personalized report instantly.
        </p>

        {!loading ? (
          <div className="form-card">
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Your Name <span className="req">*</span>
                  </label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>
                    Email <span className="req">*</span>
                  </label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>
                    Company Name <span className="req">*</span>
                  </label>
                  <input type="text" name="company_name" required />
                </div>
                <div className="form-group">
                  <label>
                    Industry <span className="req">*</span>
                  </label>
                  <select name="industry" required defaultValue="">
                    <option value="" disabled>
                      Select your industry
                    </option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
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
                  <input
                    type="url"
                    name="website_url"
                    placeholder="https://..."
                  />
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
                  <label>AI Tools You Currently Use</label>
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
                  <label>Monthly AI/Tech Budget</label>
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
                    What&apos;s your biggest challenge where AI could help?{" "}
                    <span className="req">*</span>
                  </label>
                  <textarea
                    name="biggest_challenge"
                    required
                    placeholder="e.g., Too much manual data entry, slow customer response times, can't keep up with competitors..."
                  />
                </div>
              </div>

              {error && (
                <p
                  style={{
                    color: "var(--red)",
                    fontSize: 14,
                    marginTop: 12,
                  }}
                >
                  {error}
                </p>
              )}

              <button type="submit" className="submit-btn">
                Generate My Free Assessment &rarr;
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
                  <h3>Building your AI Readiness Report</h3>
                  <p className="processing-sub">
                    Our AI is analyzing 14 dimensions across 4 categories
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
                        <span className="step-icon">{s.icon}</span>
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
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <h3>Trusted by growing businesses</h3>
        <div className="testimonials">
          <div className="testimonial">
            &ldquo;This assessment showed us exactly where to start with AI. We
            implemented the quick wins and saw results in the first week.&rdquo;
            <div className="author">&mdash; Sarah K., Marketing Agency</div>
          </div>
          <div className="testimonial">
            &ldquo;The 90-day action plan was incredibly specific to our
            industry. Not generic advice &mdash; real, actionable steps.&rdquo;
            <div className="author">&mdash; Mike R., SaaS Founder</div>
          </div>
          <div className="testimonial">
            &ldquo;We scored a 34 and it was a wake-up call. Three months later,
            we&apos;re at 71 and saving 20 hours a week.&rdquo;
            <div className="author">&mdash; Lisa T., Operations Director</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Your data is never shared or sold. &nbsp;&middot;&nbsp; Privacy-first.</p>
      </footer>
    </div>
  );
}
