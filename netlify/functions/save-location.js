exports.handler = async function (event) {
  try {
    if (!event.body) {
      throw new Error("No location data received.");
    }

    const data = JSON.parse(event.body);

    const sheetWebhook =
      "https://script.google.com/macros/s/AKfycbxsOhdYtQHdYkxM0d5jNTRtE29v4gtIl0yI0hXMGSGfANTGXS-9PYXbH35W0_6178qB/exec";

    const response = await fetch(sheetWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      redirect: "follow"
    });

    const responseText = await response.text();

    console.log(
      "Google Apps Script status:",
      response.status
    );

    console.log(
      "Google Apps Script response:",
      responseText
    );

    if (!response.ok) {
      throw new Error(
        "Google Sheet request failed. HTTP " +
        response.status
      );
    }

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        success: true,
        message: "Location saved to Google Sheet",
        sheetResponse: responseText
      })
    };

  } catch (error) {
    console.error(
      "Save location error:",
      error
    );

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        success: false,
        error:
          error.message ||
          "Unable to save location"
      })
    };
  }
};