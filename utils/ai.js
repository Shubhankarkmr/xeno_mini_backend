const OpenAI = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env has this key
});

/**
 * Generate campaign message suggestions based on objective
 * @param {string} objective
 * @param {number} numSuggestions
 * @returns {Promise<string[]>}
 */
const generateMessages = async (objective, numSuggestions = 3) => {
  try {
    const prompt = `
You are a marketing assistant. 
Generate ${numSuggestions} creative and concise message variants for a campaign with the following objective:
"${objective}"
Return the messages as a JSON array of strings.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use gpt-3.5-turbo instead of gpt-4
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const text = response.choices[0].message.content.trim();

    let messages = [];
    try {
      messages = JSON.parse(text);
    } catch (err) {
      // Fallback: extract JSON array if OpenAI added extra text
      const match = text.match(/\[.*\]/s);
      if (match) {
        try {
          messages = JSON.parse(match[0]);
        } catch {
          messages = text.split("\n").filter((m) => m.trim() !== "");
        }
      } else {
        messages = text.split("\n").filter((m) => m.trim() !== "");
      }
    }

    // Fallback default messages if AI fails or empty
    if (!messages.length) {
      messages = [
        "Try to re-engage your customers!",
        "Offer discounts to bring back users.",
        "Send personalized product recommendations."
      ];
    }

    return messages;
  } catch (error) {
    console.error("AI Error:", error);
    // Return fallback messages on API failure
    return [
      "Try to re-engage your customers!",
      "Offer discounts to bring back users.",
      "Send personalized product recommendations."
    ];
  }
};

module.exports = { generateMessages };

