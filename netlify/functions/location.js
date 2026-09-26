exports.handler = async function (event) {
  try {
    const headers = event.headers || {};

    const forwardedFor =
      headers["x-forwarded-for"] ||
      headers["X-Forwarded-For"] ||
      "";

    const clientIp =
      (forwardedFor.split(",")[0] || "").trim() ||
      headers["x-nf-client-connection-ip"] ||
      headers["X-Nf-Client-Connection-Ip"] ||
      "";

    if (!clientIp) {
      throw new Error("Could not determine visitor IP.");
    }

    const geoResponse = await fetch(
      `https://ipwho.is/${encodeURIComponent(clientIp)}`
    );

    const responseText = await geoResponse.text();

    let geo;

    try {
      geo = JSON.parse(responseText);
    } catch (error) {
      throw new Error(
        "Geolocation API returned invalid response: " +
        responseText.substring(0, 200)
      );
    }

    if (!geo.success) {
      throw new Error(
        geo.message || "IP geolocation failed."
      );
    }

    const data = {
      success: true,
      ip: geo.ip || clientIp,
      hostname: "",
      version: clientIp.includes(":") ? "IPv6" : "IPv4",

      city: geo.city || "",
      region: geo.region || "",
      region_code: geo.region_code || "",

      country: geo.country || "",
      country_code: geo.country_code || "",

      latitude: geo.latitude ?? "",
      longitude: geo.longitude ?? "",

      postal: geo.postal || "",

      timezone: geo.timezone?.id || "",
      utc_offset: geo.timezone?.utc || "",

      asn: geo.connection?.asn || "",
      organization: geo.connection?.org || "",

      timestamp: new Date().toISOString()
    };

    const sheetWebhook =
      "https://script.google.com/macros/s/AKfycbxsOhdYtQHdYkxM0d5jNTRtE29v4gtIl0yI0hXMGSGfANTGXS-9PYXbH35W0_6178qB/exec";

    try {
      const sheetResponse = await fetch(sheetWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const sheetResponseText = await sheetResponse.text();

      console.log(
        "Google Sheet response:",
        sheetResponse.status,
        sheetResponseText
      );

    } catch (sheetError) {
      console.error(
        "Google Sheet save failed:",
        sheetError
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {

    console.error("Location error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Location lookup failed"
      })
    };
  }
};