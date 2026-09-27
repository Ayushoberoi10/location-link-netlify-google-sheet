exports.handler = async function (event) {

  try {

    if (!event.body) {

      throw new Error(
        "No location data received."
      );

    }


    const data =
      JSON.parse(event.body);


    const webhook =
      process.env.GOOGLE_SHEET_WEBHOOK;


    if (!webhook) {

      throw new Error(
        "GOOGLE_SHEET_WEBHOOK is not configured."
      );

    }


    const response =
      await fetch(
        webhook,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(data)
        }
      );


    const text =
      await response.text();


    let result;

    try {

      result =
        JSON.parse(text);

    } catch {

      result = {
        raw: text
      };

    }


    if (!response.ok) {

      throw new Error(
        "Google Sheet returned HTTP " +
        response.status
      );

    }


    return {

      statusCode: 200,

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({

          success: true,

          message:
            "Location saved successfully",

          sheet:
            result

        })

    };


  } catch (error) {

    console.error(error);


    return {

      statusCode: 500,

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({

          success: false,

          error:
            error.message ||
            "Failed to save location."

        })

    };

  }

};