function normalizeCompanyKey(companyName) {
  return String(companyName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getCacheKey(companyName) {
  return `company_background:${normalizeCompanyKey(companyName)}`;
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

    const normalized = {
      ok: !!data?.ok,
      source: data?.source || "tavily",
      onlineAvailable: !!data?.onlineAvailable,
      cacheHit: false,
      companyName: data?.companyName || companyName || "",
      answer:
        data?.answer ||
        "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
      results: Array.isArray(data?.results) ? data.results : [],
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
      searchedAt: new Date().toISOString(),
      error: err.message || "Company search failed",
    };
  }
}
