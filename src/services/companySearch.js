function normalizeCompanyKey(companyName) {
  return String(companyName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getCacheKey(companyName) {
  return `company_background:${normalizeCompanyKey(companyName)}`;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function tokenizeCompanyName(companyName) {
  return String(companyName || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(x => x.trim())
    .filter(x => x.length >= 3)
    .filter(x => !["llc", "ltd", "co", "company", "corp", "corporation", "inc", "fze", "fzco", "dmcc", "trading"].includes(x));
}

function enrichSearchResults(companyName, results) {
  const safeResults = Array.isArray(results) ? results : [];
  const tokens = tokenizeCompanyName(companyName);

  const linkedinCandidates = [];
  const officialWebsiteCandidates = [];
  const otherSourceCandidates = [];

  safeResults.forEach(r => {
    const url = r?.url || "";
    const host = getHostname(url);
    const title = r?.title || "";
    const content = r?.content || "";

    const item = {
      title,
      url,
      content,
      host,
      score: r?.score || 0,
    };

    if (!url) return;

    const isLinkedInCompany =
      host.includes("linkedin.com") &&
      (url.includes("/company/") || title.toLowerCase().includes("linkedin"));

    if (isLinkedInCompany) {
      linkedinCandidates.push(item);
      return;
    }

    const isKnownDirectory =
      host.includes("linkedin.com") ||
      host.includes("facebook.com") ||
      host.includes("instagram.com") ||
      host.includes("twitter.com") ||
      host.includes("x.com") ||
      host.includes("zoominfo.com") ||
      host.includes("dnb.com") ||
      host.includes("rocketreach.co") ||
      host.includes("crunchbase.com") ||
      host.includes("yellowpages") ||
      host.includes("kompass") ||
      host.includes("exporthub") ||
      host.includes("tradekey") ||
      host.includes("made-in-china") ||
      host.includes("alibaba");

    const hostLooksOfficial = tokens.some(t => host.includes(t));

    if (hostLooksOfficial && !isKnownDirectory) {
      officialWebsiteCandidates.push(item);
      return;
    }

    otherSourceCandidates.push(item);
  });

  return {
    enrichedResults: safeResults.map(r => ({
      ...r,
      host: getHostname(r?.url || ""),
    })),
    linkedinCandidates,
    officialWebsiteCandidates,
    otherSourceCandidates,
  };
}

export function getCachedCompanyBackground(companyName) {
  if (!companyName) return null;

  try {
    const raw = localStorage.getItem(getCacheKey(companyName));

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    const ageMs = Date.now() - new Date(parsed.cachedAt).getTime();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

    // cache تا ۳۰ روز معتبر بماند
    if (ageMs > maxAgeMs) {
      localStorage.removeItem(getCacheKey(companyName));
      return null;
    }

    return {
      ...parsed.data,
      cacheHit: true,
    };
  } catch {
    return null;
  }
}

export function setCachedCompanyBackground(companyName, data) {
  if (!companyName || !data) return;

  try {
    localStorage.setItem(
      getCacheKey(companyName),
      JSON.stringify({
        cachedAt: new Date().toISOString(),
        data,
      })
    );
  } catch {
    // ignore localStorage errors
  }
}

export async function searchCompanyBackground(companyName, rfqText) {
  const cached = getCachedCompanyBackground(companyName);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch("/api/company-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName,
        rfqText,
      }),
    });

    const data = await response.json();

    const baseResults = Array.isArray(data?.results) ? data.results : [];
    const enriched = enrichSearchResults(
      data?.companyName || companyName || "",
      baseResults
    );

    const normalized = {
      ok: !!data?.ok,
      source: data?.source || "tavily",
      onlineAvailable: !!data?.onlineAvailable,
      cacheHit: false,
      companyName: data?.companyName || companyName || "",
      answer:
        data?.answer ||
        "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
      results: enriched.enrichedResults,
      officialWebsiteCandidates: enriched.officialWebsiteCandidates,
      linkedinCandidates: enriched.linkedinCandidates,
      otherSourceCandidates: enriched.otherSourceCandidates,
      searchedAt: data?.searchedAt || new Date().toISOString(),
      error: data?.error || null,
    };

    // فقط اگر جواب معتبر بود cache کن
    if (normalized.ok && normalized.results.length > 0) {
      setCachedCompanyBackground(companyName, normalized);
    }

    return normalized;
  } catch (err) {
    return {
      ok: false,
      source: "tavily",
      onlineAvailable: false,
      cacheHit: false,
      companyName: companyName || "",
      answer:
        "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
      results: [],
      officialWebsiteCandidates: [],
      linkedinCandidates: [],
      otherSourceCandidates: [],
      searchedAt: new Date().toISOString(),
      error: err.message || "Company search failed",
    };
  }
}
