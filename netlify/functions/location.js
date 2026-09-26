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


    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(clientIp)}`
    );


    const responseText =
      await response.text();


    let geo;


    try {

      geo = JSON.parse(responseText);

    } catch (error) {

      throw new Error(
        "Geolocation service returned invalid data."
      );

    }


    if (!geo.success) {

      throw new Error(
        geo.message ||
        "IP geolocation failed."
      );

    }


    const data = {

      success: true,

      ip: geo.ip || clientIp,

      hostname: "",

      version:
        clientIp.includes(":")
          ? "IPv6"
          : "IPv4",

      city: geo.city || "",

      region: geo.region || "",

      country: geo.country || "",

      country_code:
        geo.country_code || "",

      latitude:
        geo.latitude ?? "",

      longitude:
        geo.longitude ?? "",

      postal:
        geo.postal || "",

      timezone:
        geo.timezone?.id || "",

      organization:
        geo.connection?.org || "",

      asn:
        geo.connection?.asn || "",

      timestamp:
        new Date().toISOString()

    };


    return {

      statusCode: 200,

      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store"
      },

      body:
        JSON.stringify(data)

    };


  } catch (error) {

    console.error(
      "Location error:",
      error
    );


    return {

      statusCode: 500,

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({

        success: false,

        error:
          error.message ||
          "Location lookup failed"

      })

    };

  }

};