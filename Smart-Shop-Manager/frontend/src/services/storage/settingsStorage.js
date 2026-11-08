const SETTINGS_KEY = "smart_shop_settings";

export const defaultSettings = {
  defaultReportType: "sales",
  compactTables: false,
  theme: "light",
};

const allowedReportTypes = new Set(["sales", "products", "stock", "customers"]);

function normalizeSettings(settings) {
  const merged = { ...defaultSettings, ...(settings ?? {}) };
  if (!allowedReportTypes.has(merged.defaultReportType)) {
    merged.defaultReportType = defaultSettings.defaultReportType;
  }

  if (merged.theme !== "light" && merged.theme !== "dark") {
    merged.theme = defaultSettings.theme;
  }

  return merged;
}

export function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return normalizeSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  try {
    const normalized = normalizeSettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return normalizeSettings(settings);
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // Ignore storage clear errors
  }
  return defaultSettings;
}
