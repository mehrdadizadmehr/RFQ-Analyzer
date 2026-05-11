import { useState } from "react";
import { AI_PROVIDERS } from "../constants/providers";
import { testClaudeConnection } from "../services/claude";
import { testOpenAIConnection } from "../services/openai";

export function useApiTest(showToast) {
  const [apiTested, setApiTested] = useState({ claude: false, openai: false });

  const testApi = async providerKey => {
    showToast(`در حال تست اتصال ${AI_PROVIDERS[providerKey].label}...`);

    try {
      if (providerKey === "claude") await testClaudeConnection();
      if (providerKey === "openai") await testOpenAIConnection();

      setApiTested(prev => ({ ...prev, [providerKey]: true }));
      showToast(`✅ اتصال ${AI_PROVIDERS[providerKey].label} موفق بود.`);
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  return { apiTested, testApi };
}
