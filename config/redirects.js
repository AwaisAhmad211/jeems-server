import { allowedOrigins } from "./clientUrls.js";

export const getClientRedirect = (type = "client") => {
  const map = {
    client: allowedOrigins.find((u) => !u.includes("admin")),
    admin: allowedOrigins.find((u) => u.includes("admin")),
  };

  return map[type];
};
