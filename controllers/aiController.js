const Campaign = require("../models/Campaign");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ 1. AI Message Suggestions
exports.generateMessageVariants = async (req, res) => {
  try {
    const { objective, audience } = req.body;
    if (!objective) return res.status(400).json({ message: "Objective required" });

    const prompt = `
You are a marketing assistant.
Generate exactly 3 short, engaging campaign messages
for a campaign with objective: "${objective}".
Audience: ${audience || "general"}.
Return ONLY a valid JSON array of 3 strings.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    if (raw.startsWith("```")) raw = raw.replace(/```json|```/g, "").trim();

    let suggestions = [];
    try {
      suggestions = JSON.parse(raw);
    } catch {
      suggestions = [raw];
    }

    res.status(200).json({ success: true, suggestions });
  } catch (err) {
    console.error("❌ Gemini message suggestion error:", err);
    res.status(500).json({ success: false, message: "AI error" });
  }
};

// ✅ 2. AI Auto-Tags
exports.autoTagCampaign = async (req, res) => {
  try {
    const { name, description, audience } = req.body;
    if (!name) return res.status(400).json({ message: "Campaign name required" });

    const prompt = `
You are a marketing assistant.
Based on the campaign name "${name}", description "${description}", 
and audience rules ${audience}, suggest 3-5 relevant campaign tags.
Return ONLY a valid JSON array of strings.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    if (raw.startsWith("```")) raw = raw.replace(/```json|```/g, "").trim();

    let tags = [];
    try {
      tags = JSON.parse(raw);
    } catch {
      tags = [raw];
    }

    res.status(200).json({ success: true, tags });
  } catch (err) {
    console.error("❌ Gemini auto-tag error:", err);
    res.status(500).json({ success: false, message: "AI error" });
  }
};

// ✅ 3. Parse Segment Rules from Natural Language
exports.parseSegmentRules = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: "Description required" });

    const prompt = `
Convert this natural language description into logical campaign segment rules
JSON with keys: spend, visits, inactiveDays.
Description: "${description}"
Return ONLY valid JSON.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    if (raw.startsWith("```")) raw = raw.replace(/```json|```/g, "").trim();

    let rules = {};
    try {
      rules = JSON.parse(raw);
    } catch {
      rules = { error: "Failed to parse rules" };
    }

    res.status(200).json({ success: true, rules });
  } catch (err) {
    console.error("❌ Gemini parse segment error:", err);
    res.status(500).json({ success: false, message: "AI error" });
  }
};