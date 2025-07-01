const crypto = require("crypto");

/**
 * Generate or retrieve a unique cookie ID for anonymous user tracking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} - Unique cookie ID
 */
function getOrCreateCookieId(req, res) {
  const cookieName = "pdfpage_session";
  let cookieId = req.cookies[cookieName];

  if (!cookieId) {
    // Generate a new unique cookie ID
    cookieId = crypto.randomBytes(32).toString("hex");

    // Set cookie with long expiration (1 year) for tracking
    res.cookie(cookieName, cookieId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".pdfpage.com" : undefined,
    });
  }

  return cookieId;
}

/**
 * Get unique identifier for anonymous user (cookieId with IP fallback)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Tracking information
 */
function getAnonymousUserIdentifier(req, res) {
  const cookieId = getOrCreateCookieId(req, res);
  const ipAddress = require("./ipUtils").getRealIPAddress(req);

  return {
    primaryId: cookieId,
    fallbackId: ipAddress,
    idType: "cookieId",
  };
}

module.exports = {
  getOrCreateCookieId,
  getAnonymousUserIdentifier,
};
