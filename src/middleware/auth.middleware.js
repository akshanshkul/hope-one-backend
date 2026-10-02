import { createHmac, timingSafeEqual } from "node:crypto";
import env from "../config/env.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, signature] = token.split(".");

  if (!payload || !signature || !env.auth.tokenSecret) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const expected = createHmac("sha256", env.auth.tokenSecret).update(payload).digest("base64url");
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return res.status(401).json({ success: false, message: "Invalid authentication token" });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    req.user = { id: user.sub };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid authentication token" });
  }
};
