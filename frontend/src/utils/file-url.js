export function resolveFileUrl(filePath) {
  if (!filePath) {
    return "";
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  return `${baseUrl}${filePath}`;
}
