export interface WebsiteAudit {
  has_website: boolean;
  url: string | null;
  is_https: boolean;
  has_viewport: boolean;
  has_title: boolean;
  page_title: string;
  has_meta_description: boolean;
  has_h1: boolean;
  has_schema_org: boolean;
  has_json_ld: boolean;
  has_click_to_call: boolean;
  has_contact_form: boolean;
  has_chat_widget: boolean;
  html_size_kb: number;
  is_heavy: boolean;
  load_time_ms: number;
  error: string | null;
}

export async function auditWebsite(
  websiteUrl: string
): Promise<WebsiteAudit> {
  const blank: WebsiteAudit = {
    has_website: false,
    url: null,
    is_https: false,
    has_viewport: false,
    has_title: false,
    page_title: "",
    has_meta_description: false,
    has_h1: false,
    has_schema_org: false,
    has_json_ld: false,
    has_click_to_call: false,
    has_contact_form: false,
    has_chat_widget: false,
    html_size_kb: 0,
    is_heavy: false,
    load_time_ms: 0,
    error: null,
  };

  if (!websiteUrl) return blank;

  // Ensure URL has protocol
  let url = websiteUrl.trim();
  if (!url.startsWith("http")) url = "https://" + url;

  const start = Date.now();
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIReadinessBot/1.0; +https://aireadiness.tools)",
      },
    });
    clearTimeout(timeout);
    html = await res.text();
    url = res.url; // follow redirects
  } catch (err: unknown) {
    return {
      ...blank,
      has_website: true,
      url,
      error:
        err instanceof Error ? err.message : "Could not reach website",
    };
  }
  const loadTime = Date.now() - start;

  const isHttps = url.startsWith("https");
  const hasViewport = /meta\s+name=["']viewport["']/i.test(html);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  const hasMetaDescription = /meta\s+name=["']description["']/i.test(html);
  const hasH1 = /<h1/i.test(html);
  const hasSchemaOrg = /schema\.org/i.test(html);
  const hasJsonLd = /application\/ld\+json/i.test(html);
  const hasClickToCall = /tel:/i.test(html);
  const hasContactForm =
    /form/i.test(html) &&
    /(contact|quote|estimate|book|schedule|demo|signup|sign-up)/i.test(html);
  const hasChatWidget =
    /(tawk|intercom|drift|livechat|crisp|hubspot|tidio|zendesk|freshchat|chatbot)/i.test(
      html
    );

  const htmlSizeKb = Math.round(
    new TextEncoder().encode(html).length / 1024
  );

  return {
    has_website: true,
    url,
    is_https: isHttps,
    has_viewport: hasViewport,
    has_title: !!pageTitle,
    page_title: pageTitle.substring(0, 200),
    has_meta_description: hasMetaDescription,
    has_h1: hasH1,
    has_schema_org: hasSchemaOrg,
    has_json_ld: hasJsonLd,
    has_click_to_call: hasClickToCall,
    has_contact_form: hasContactForm,
    has_chat_widget: hasChatWidget,
    html_size_kb: htmlSizeKb,
    is_heavy: htmlSizeKb > 500,
    load_time_ms: loadTime,
    error: null,
  };
}
