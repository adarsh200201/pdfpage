/**
 * Utility functions for IP address detection
 */

/**
 * Get the real IP address from request, handling various proxy configurations
 * @param {Request} req - Express request object
 * @returns {string} - Real IP address
 */
function getRealIPAddress(req) {
  // Check various headers that might contain the real IP
  const possibleIPs = [
    req.headers["x-forwarded-for"], // Most common proxy header
    req.headers["x-real-ip"], // Nginx proxy
    req.headers["x-client-ip"], // Apache proxy
    req.headers["cf-connecting-ip"], // Cloudflare
    req.headers["x-cluster-client-ip"], // Cluster
    req.headers["x-forwarded"], // General forwarded
    req.headers["forwarded-for"], // RFC 7239
    req.headers["forwarded"], // RFC 7239
    req.connection.remoteAddress, // Fallback to connection
    req.socket.remoteAddress, // Fallback to socket
    req.connection.socket ? req.connection.socket.remoteAddress : null, // Deep fallback
    req.ip, // Express default (works when trust proxy is set)
  ];

  // Find the first valid IP
  for (const ip of possibleIPs) {
    if (ip) {
      // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
      const cleanIP = ip.split(",")[0].trim();

      // Validate IP format
      if (isValidIP(cleanIP)) {
        return cleanIP;
      }
    }
  }

  // Ultimate fallback
  return "127.0.0.1";
}

/**
 * Validate if a string is a valid IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IP
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== "string") return false;

  // Remove IPv6 prefix if present
  ip = ip.replace(/^::ffff:/, "");

  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get geographical information from IP (placeholder for future implementation)
 * @param {string} ip - IP address
 * @returns {object} - Location info
 */
function getLocationFromIP(ip) {
  // This could be enhanced with a geo-IP service like MaxMind
  return {
    country: null,
    city: null,
    timezone: null,
    ip: ip,
  };
}

/**
 * Log IP detection for debugging
 * @param {Request} req - Express request object
 */
function debugIPDetection(req) {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEBUG_IP === "true"
  ) {
    const ip = getRealIPAddress(req);
    console.log("🔍 IP Debug:", ip === "::1" ? "localhost" : ip);
  }
}

module.exports = {
  getRealIPAddress,
  isValidIP,
  getLocationFromIP,
  debugIPDetection,
};
