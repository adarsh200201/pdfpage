/**
 * Device Detection Utility
 * Detects device type (mobile, tablet, desktop) from User-Agent headers
 * Supports all major browsers and platforms: Android, iOS, Windows, Mac, Linux
 */

/**
 * Detect device type from User-Agent string
 * @param {string} userAgent - User-Agent header string
 * @returns {string} - Device type: "mobile", "tablet", or "desktop"
 */
function detectDeviceType(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return "desktop"; // Default fallback
  }

  // Convert to lowercase for case-insensitive matching
  const ua = userAgent.toLowerCase();

  // Mobile device patterns
  const mobilePatterns = [
    // Android phones
    /android.*mobile/,
    // iPhone
    /iphone/,
    // Windows Phone
    /windows phone/,
    /iemobile/,
    /wpdesktop/,
    // BlackBerry
    /blackberry/,
    /bb10/,
    // Palm
    /palm/,
    /webos/,
    // Symbian
    /symbian/,
    /series60/,
    /s60/,
    // Other mobile indicators
    /mobile/,
    /phone/,
    // Specific mobile browsers
    /opera mini/,
    /opera mobi/,
    /ucbrowser/,
    // Mobile-specific keywords
    /pocket/,
    /psp/,
    /smartphone/,
    /fennec/,
    /maemo/,
    /silk/,
  ];

  // Tablet device patterns
  const tabletPatterns = [
    // iPad (all generations)
    /ipad/,
    // Android tablets (without mobile keyword)
    /android(?!.*mobile)/,
    // Windows tablets
    /windows.*touch/,
    // Kindle
    /kindle/,
    /silk/,
    // PlayBook
    /playbook/,
    // Samsung Galaxy Tab
    /gt-p\d{4}/,
    /sm-t\d{3}/,
    // Other tablet indicators
    /tablet/,
    // Specific tablet browsers
    /crkey/,
    // TouchPad
    /hp-tablet/,
    /touchpad/,
    // Xoom
    /xoom/,
    // Surface
    /surface/,
  ];

  // Check for tablets first (more specific)
  for (const pattern of tabletPatterns) {
    if (pattern.test(ua)) {
      return "tablet";
    }
  }

  // Then check for mobile devices
  for (const pattern of mobilePatterns) {
    if (pattern.test(ua)) {
      return "mobile";
    }
  }

  // Default to desktop if no mobile/tablet patterns match
  return "desktop";
}

/**
 * Get detailed device information from User-Agent
 * @param {string} userAgent - User-Agent header string
 * @returns {object} - Detailed device info
 */
function getDetailedDeviceInfo(userAgent) {
  if (!userAgent) {
    return {
      type: "desktop",
      os: "unknown",
      browser: "unknown",
      version: "unknown",
    };
  }

  const deviceType = detectDeviceType(userAgent);
  const ua = userAgent.toLowerCase();

  // Detect Operating System
  let os = "unknown";
  if (/android/i.test(userAgent)) {
    os = "android";
  } else if (/ipad|iphone|ipod/i.test(userAgent)) {
    os = "ios";
  } else if (/windows/i.test(userAgent)) {
    os = "windows";
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = "macos";
  } else if (/linux/i.test(userAgent)) {
    os = "linux";
  } else if (/cros/i.test(userAgent)) {
    os = "chromeos";
  }

  // Detect Browser
  let browser = "unknown";
  if (/edg/i.test(userAgent)) {
    browser = "edge";
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = "chrome";
  } else if (/firefox/i.test(userAgent)) {
    browser = "firefox";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "safari";
  } else if (/opera|opr/i.test(userAgent)) {
    browser = "opera";
  }

  return {
    type: deviceType,
    os: os,
    browser: browser,
    userAgent: userAgent,
  };
}

/**
 * Get device type from Express request object
 * @param {Request} req - Express request object
 * @returns {string} - Device type: "mobile", "tablet", or "desktop"
 */
function getDeviceTypeFromRequest(req) {
  const userAgent = req.headers["user-agent"];
  return detectDeviceType(userAgent);
}

/**
 * Log device detection for debugging
 * @param {Request} req - Express request object
 */
function debugDeviceDetection(req) {
  if (process.env.NODE_ENV === "development") {
    const userAgent = req.headers["user-agent"];
    const deviceInfo = getDetailedDeviceInfo(userAgent);

    if (process.env.DEBUG_DEVICE === "true") {
      console.log(
        "📱 Device:",
        `${deviceInfo.type}/${deviceInfo.os}/${deviceInfo.browser}`,
      );
    }
  }
}

/**
 * Test device detection with various User-Agent strings
 */
function testDeviceDetection() {
  const testCases = [
    // Mobile devices
    {
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      expected: "mobile",
      device: "iPhone",
    },
    {
      ua: "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
      expected: "mobile",
      device: "Android Phone",
    },
    // Tablets
    {
      ua: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      expected: "tablet",
      device: "iPad",
    },
    {
      ua: "Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      expected: "tablet",
      device: "Android Tablet",
    },
    // Desktop
    {
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      expected: "desktop",
      device: "Windows Desktop",
    },
    {
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      expected: "desktop",
      device: "Mac Desktop",
    },
  ];

  console.log("🧪 Testing Device Detection:");
  testCases.forEach(({ ua, expected, device }) => {
    const detected = detectDeviceType(ua);
    const status = detected === expected ? "✅" : "❌";
    console.log(`${status} ${device}: ${detected} (expected: ${expected})`);
  });
}

module.exports = {
  detectDeviceType,
  getDetailedDeviceInfo,
  getDeviceTypeFromRequest,
  debugDeviceDetection,
  testDeviceDetection,
};
