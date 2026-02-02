const OPENROUTER_API_KEY =
  "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";

export const analyzeInterview = async (
  base64Audio: string,
  resumeText: string,
) => {
  console.log("=== ANALYZE INTERVIEW STARTED ===");
  console.log("Step 1: Function called");
  console.log("Step 2: API Key present?", OPENROUTER_API_KEY ? "YES" : "NO");
  console.log("Step 3: Base64 audio length:", base64Audio?.length || 0);
  console.log("Step 4: Resume text length:", resumeText?.length || 0);

  try {
    console.log("Step 5: Building request body...");

    const requestBody = {
      model: "openai/gpt-4o-audio-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an expert career coach. Analyze the audio for confidence, pacing, and content match against the resume.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Resume Context: ${resumeText}` },
            {
              type: "input_audio",
              input_audio: { data: base64Audio, format: "wav" },
            },
          ],
        },
      ],
    };

    console.log("Step 6: Request body created");
    console.log("Step 7: Sending fetch request...");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://expo.dev",
          "X-Title": "Career Coach App",
        },
        body: JSON.stringify(requestBody),
      },
    );

    console.log("Step 8: Response received!");
    console.log("Step 9: Response status:", response.status);
    console.log("Step 10: Response ok?", response.ok);

    const data = await response.json();
    console.log("Step 11: Response parsed as JSON");
    console.log("Step 12: Response data keys:", Object.keys(data).join(", "));

    if (data.error) {
      console.log("Step 13: ERROR FOUND IN RESPONSE");
      console.log("Error object:", JSON.stringify(data.error, null, 2));
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    console.log("Step 14: No error, checking for content...");
    console.log("Step 15: Choices array length:", data.choices?.length || 0);

    if (data.choices && data.choices[0]) {
      console.log("Step 16: Content found!");
      const content = data.choices[0]?.message?.content;
      console.log("Step 17: Content length:", content?.length || 0);
      console.log("=== ANALYZE INTERVIEW SUCCESS ===");
      return content || "No response received";
    } else {
      console.log("Step 16: NO CHOICES IN RESPONSE");
      console.log("Full response:", JSON.stringify(data, null, 2));
      return "No response received";
    }
  } catch (error) {
    console.log("=== ERROR CAUGHT ===");
    console.log("Error type:", typeof error);

    if (error instanceof Error) {
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
    } else {
      console.log("Unknown error:", String(error));
    }

    console.log("=== END ERROR ===");
    throw error;
  }
};
