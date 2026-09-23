const PRODUCTION_API_BASE =
  "https://shivam-blackbook-vocab.vercel.app/api";

const configuredApiBase =
  typeof process !== "undefined"
    ? process.env?.EXPO_PUBLIC_API_URL
    : "";

export const getApiBase = () => {
  const configured = configuredApiBase?.toString().trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return PRODUCTION_API_BASE;
};
