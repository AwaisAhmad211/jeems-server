const isProd = process.env.NODE_ENV === "production";

const clientUrls = isProd
  ? process.env.CLIENT_URLS_PROD
  : process.env.CLIENT_URLS_DEV;

export const allowedOrigins = clientUrls?.split(",").map((url) => url.trim());
