import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Define it in your environment before starting the server.");
}

const getModelForRole = (role) => (role === "merchant" ? Merchant : User);

/**
 * Verify JWT and attach user to request.
 *
 * In addition to verifying the signature, this loads the account and compares the
 * token's tokenVersion against the current one in the DB. This makes access tokens
 * immediately revocable: logout-all / password-reset / etc. bump tokenVersion, so any
 * previously-issued (but still unexpired) access token is rejected here. It also
 * rejects tokens for accounts that no longer exist (e.g. deleted accounts).
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return res.status(401).json({
      message: "Authorization token missing",
      code: "TOKEN_MISSING"
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Handle expired vs invalid tokens differently
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    return res.status(401).json({
      message: "Invalid token",
      code: "TOKEN_INVALID"
    });
  }

  try {
    const account = await getModelForRole(decoded.role)
      .findById(decoded.id)
      .select("+tokenVersion");

    if (!account) {
      return res.status(401).json({
        message: "Account no longer exists",
        code: "ACCOUNT_NOT_FOUND",
      });
    }

    // Reject tokens issued before a session-invalidating event (logout-all, password reset, etc.)
    if ((decoded.tokenVersion || 0) !== (account.tokenVersion || 0)) {
      return res.status(401).json({
        message: "Session has been invalidated. Please log in again.",
        code: "SESSION_INVALIDATED",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tokenVersion: decoded.tokenVersion,
    };
    return next();
  } catch (error) {
    console.error("[auth] protect error:", error.message);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

/**
 * Require specific role(s) - use after protect()
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Forbidden - insufficient permissions",
      code: "FORBIDDEN"
    });
  }
  return next();
};

/**
 * Optional auth - continues even if token missing/invalid.
 * When a valid, non-revoked token is present it attaches req.user; otherwise it proceeds
 * anonymously. Used on public endpoints that behave differently for logged-in users
 * (e.g. Khata, which must be bound to the authenticated account, never a body-supplied id).
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await getModelForRole(decoded.role)
      .findById(decoded.id)
      .select("+tokenVersion");

    // Only trust the identity if the account exists and the token hasn't been revoked.
    if (account && (decoded.tokenVersion || 0) === (account.tokenVersion || 0)) {
      req.user = {
        id: decoded.id,
        role: decoded.role,
        tokenVersion: decoded.tokenVersion,
      };
    }
  } catch (error) {
    // Invalid/expired token - continue without user
  }

  return next();
};
