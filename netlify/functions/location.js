exports.handler = async function (event) {

  try {

    const headers = event.headers || {};

    function getHeader(name) {

      const key = Object.keys(headers).find(
        k => k.toLowerCase() === name.toLowerCase()
      );

      return key ? headers[key] : "";
    }


    const netlifyIp =
      getHeader("x-nf-client-connection-ip");

    const forwardedFor =
      getHeader("x-forwarded-for");


    let clientIp = "";

    if (netlifyIp) {

      clientIp = netlifyIp.trim();

    } else if (forwardedFor) {

      clientIp =
        forwardedFor.split(",")[0].trim();

    }


    if (!clientIp) {

      throw new Error(
        "Unable to determine IP address."
      );

    }


    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`,
      {
        headers: {
          "User-Agent": "LocationVerification/1.0"
        }
      }
    );


    const text = await response.text();

    let geo;

    try {

      geo = JSON.parse(text);

    } catch {

      throw new Error(
        "IP geolocation service returned invalid data."
      );

    }


    if (geo.error) {

      throw new Error(
        geo.reason || "IP geolocation failed."
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

        ip:
          geo.ip || clientIp,

        hostname:
          geo.hostname || "",

        version:
          geo.version || "",

        city:
          geo.city || "",

        region:
          geo.region || "",

        country:
          geo.country_name ||
          geo.country ||
          "",

        latitude:
          geo.latitude ?? "",

        longitude:
          geo.longitude ?? "",

        organization:
          geo.org || "",

        asn:
          geo.asn || "",

        postal:
          geo.postal || "",

        timezone:
          geo.timezone || ""

      })

    };


  } catch (error) {

    console.error(error);


    return {

      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        success: false,

        error:
          error.message ||
          "IP lookup failed."

      })

    };

  }

};