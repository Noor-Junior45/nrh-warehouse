import crypto from "crypto";
import dbInstance from "./db";

// Use a simple, stable secret for signing demo tokens
const JWT_SECRET = process.env.JWT_SECRET || "wms_jwt_secure_super_secret_key_2026";

export interface DecodedToken {
  userId: string;
  email: string;
  orgId: string;
}

// Simple deterministic password encryption
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_wms_salt_key").digest("hex");
}

// Generate secure JWT-like token (signed base64 string)
export function signToken(payload: DecodedToken): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours expiry
  })).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
    
  return `${header}.${body}.${signature}`;
}

// Verify and decode token
export function verifyToken(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const computedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    if (signature !== computedSignature) {
      return null;
    }
    
    const decodedVal = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (decodedVal.exp && Date.now() > decodedVal.exp) {
      return null; // Expired
    }
    
    return {
      userId: decodedVal.userId,
      email: decodedVal.email,
      orgId: decodedVal.orgId
    };
  } catch (e) {
    return null;
  }
}

// Verify API Key
export function verifyMachineApiKey(apiKey: string): { orgId: string; scopes: string[] } | null {
  try {
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const matchedKey = dbInstance.findApiKeyByHash(hash);
    if (!matchedKey || !matchedKey.is_active) {
      return null;
    }
    return {
      orgId: matchedKey.organization_id,
      scopes: matchedKey.scopes
    };
  } catch (e) {
    return null;
  }
}

// Date-time standard formats - strictly ISO 8601 Regex checking
export function isValidISO8601(dateStr: string): boolean {
  if (!dateStr) return false;
  // Matches "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  return iso8601Regex.test(dateStr) && !isNaN(Date.parse(dateStr));
}
