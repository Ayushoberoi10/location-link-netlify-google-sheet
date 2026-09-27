exports.handler = async function (event) {
  try {
    const headers = event.headers || {};

    const getHeader = (name) => {
      const key = Object.keys(headers).find(
        (k) => k.toLowerCase() === name.toLowerCase()
      );
      return key ? headers[key] : "";
    };

    const forwardedFor =
      getHeader("x-forwarded-for") ||
      getHeader("x-real-ip") ||
      "";

    const netlifyIp =
      getHeader("x-nf-client-connection-ip") ||
      "";

    let clientIp = "";

    if (netlifyIp) {
      clientIp = netlifyIp.trim();
    } else if (forwardedFor) {
      clientIp = forwardedFor.split(",")[0].trim();
    }

    if (!clientIp) {
      clientIp = "unknown";
    }

    const userAgent = getHeader("user-agent") || "";
    const acceptLanguage = getHeader("accept-language") || "";

    let ipData = {};

    if (clientIp !== "unknown") {
      try {
        const ipResponse = await fetch(
          `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`,
          {
            headers: {
              "User-Agent": "Location-Link-Netlify/1.0"
            }
          }
        );

        if (ipResponse.ok) {
          const text = await ipResponse.text();

          try {
            ipData = JSON.parse(text);
          } catch (e) {
            ipData = {};
          }
        }
      } catch (e) {
        ipData = {};
      }
    }

    const deviceInfo = parseUserAgent(userAgent);

    const data = {
      timestamp: new Date().toISOString(),

      ip: ipData.ip || clientIp,
      hostname: ipData.hostname || "",
      version: ipData.version || "",

      city: ipData.city || "",
      region: ipData.region || "",
      country: ipData.country_name || ipData.country || "",

      ip_latitude: ipData.latitude ?? "",
      ip_longitude: ipData.longitude ?? "",

      organization: ipData.org || "",
      asn: ipData.asn || "",

      postal: ipData.postal || "",
      timezone: ipData.timezone || "",

      device_type: deviceInfo.deviceType,
      operating_system: deviceInfo.os,
      browser: deviceInfo.browser,

      user_agent: userAgent,
      language: acceptLanguage,

      location_source: "IP Geolocation",

      google_maps_location:
        ipData.latitude != null && ipData.longitude != null
          ? `https://www.google.com/maps?q=${ipData.latitude},${ipData.longitude}`
          : ""
    };

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK;

    if (!sheetWebhook) {
      throw new Error("GOOGLE_SHEET_WEBHOOK is not configured");
    }

    const sheetResponse = await fetch(sheetWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const sheetText = await sheetResponse.text();

    let sheetResult = {};

    try {
      sheetResult = JSON.parse(sheetText);
    } catch (e) {
      sheetResult = {
        raw: sheetText
      };
    }

    if (!sheetResponse.ok) {
      throw new Error(
        `Google Sheet returned HTTP ${sheetResponse.status}`
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        success: true,
        saved: true,
        data: data,
        sheet: sheetResult
      })
    };

  } catch (error) {
    console.error("Location function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        success: false,
        saved: false,
        error: error.message || "Location lookup failed"
      })
    };
  }
};


function parseUserAgent(userAgent) {

  let deviceType = "Desktop";
  let os = "Unknown";
  let browser = "Unknown";

  if (/iPhone/i.test(userAgent)) {
    deviceType = "Mobile";
    os = "iOS";
  } else if (/iPad/i.test(userAgent)) {
    deviceType = "Tablet";
    os = "iPadOS";
  } else if (/Android/i.test(userAgent)) {
    deviceType = "Mobile";
    os = "Android";
  } else if (/Windows/i.test(userAgent)) {
    deviceType = "Desktop";
    os = "Windows";
  } else if (/Mac OS X/i.test(userAgent)) {
    deviceType = "Desktop";
    os = "macOS";
  } else if (/Linux/i.test(userAgent)) {
    deviceType = "Desktop";
    os = "Linux";
  }

  if (/Edg\//i.test(userAgent)) {
    browser = "Microsoft Edge";
  } else if (/OPR\//i.test(userAgent)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    browser = "Google Chrome";
  } else if (/Firefox\//i.test(userAgent)) {
    browser = "Mozilla Firefox";
  } else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    browser = "Safari";
  }

  return {
    deviceType,
    os,
    browser
  };
}