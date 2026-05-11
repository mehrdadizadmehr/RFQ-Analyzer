

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      source: "tavily",
      onlineAvailable: false,
      error: "Method not allowed",
    });
  }

  try {
    const { companyName, rfqText } = req.body || {};

    const cleanCompanyName = String(companyName || "").trim();
    const cleanRfqText = String(rfqText || "").trim();

    if (!cleanCompanyName && !cleanRfqText) {
      return res.status(400).json({
        ok: false,
        source: "tavily",
        onlineAvailable: false,
        error: "companyName or rfqText is required",
      });
    }

    if (!process.env.TAVILY_API_KEY) {
      return res.status(200).json({
        ok: false,
        source: "tavily",
        onlineAvailable: false,
        error: "TAVILY_API_KEY is not configured",
        answer: "اطلاعات آنلاین قابل دریافت نیست؛ کلید Tavily تنظیم نشده است.",
        results: [],
        searchedAt: new Date().toISOString(),
      });
    }

    const query = [
      cleanCompanyName,
      "company background industry location official website LinkedIn",
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        topic: "general",
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(200).json({
        ok: false,
        source: "tavily",
        onlineAvailable: false,
        error: "Invalid Tavily response",
        answer: "اطلاعات آنلاین قابل دریافت نیست؛ پاسخ Tavily قابل خواندن نبود.",
        results: [],
        searchedAt: new Date().toISOString(),
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        source: "tavily",
        onlineAvailable: false,
        error: data?.error || data?.message || `Tavily HTTP ${response.status}`,
        answer: "اطلاعات آنلاین قابل دریافت نیست؛ سرویس جستجو در دسترس نبود.",
        results: [],
        searchedAt: new Date().toISOString(),
      });
    }

    const results = (data.results || []).map(r => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
      score: r.score || 0,
    }));

    return res.status(200).json({
      ok: true,
      source: "tavily",
      onlineAvailable: true,
      companyName: cleanCompanyName,
      query,
      answer: data.answer || "",
      results,
      searchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      source: "tavily",
      onlineAvailable: false,
      error: err.message || "Company search failed",
      answer: "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
      results: [],
      searchedAt: new Date().toISOString(),
    });
  }
}