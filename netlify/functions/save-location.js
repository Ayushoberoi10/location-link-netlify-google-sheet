exports.handler = async function (event) {

  try {

    if (!event.body) {

      throw new Error(
        "No location data received."
      );

    }


    const data =
      JSON.parse(event.body);


    const sheetWebhook =
      "https://script.google.com/macros/s/AKfycbxbw8gTGuP8GQzY8ijva4xJe3y5h9l4iNQ-ZbZe2wMAQBGU27kV5jJe9b6Ejsdxks7W/exec";


    const response =
      await fetch(
        sheetWebhook,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(data),

          redirect:
            "follow"

        }
      );


    const responseText =
      await response.text();


    console.log(
      "Google Sheet status:",
      response.status
    );

    console.log(
      "Google Sheet response:",
      responseText
    );


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

          sheet_response:
            responseText

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
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({

          success: false,

          error:
            error.message ||
            "Unable to save location"

        })

    };

  }

};