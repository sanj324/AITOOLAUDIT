import fs from "fs";
import { env } from "../../config/env.js";

function extractJson(text) {
  if (!text) {
    throw new Error("No text returned from AI response");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No structured JSON found in AI response");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function extractTextFromResponsePayload(data) {
  if (data.output_text) {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  const textParts = [];

  for (const item of data.output) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const part of item.content) {
      if (typeof part.text === "string") {
        textParts.push(part.text);
      } else if (Array.isArray(part.text)) {
        textParts.push(part.text.join("\n"));
      }
    }
  }

  return textParts.join("\n").trim();
}

export async function analyzeScreenshotWithAi({ filePath, toolName, parameterName, parameterDescription, severity }) {
  if (!env.openAiApiKey) {
    const error = new Error("OPENAI_API_KEY is not configured for screenshot analysis");
    error.statusCode = 400;
    throw error;
  }

  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `
You are an internal audit assistant for AI governance reviews.
Analyze the uploaded screenshot evidence in the context below and return JSON only.

Context:
- Tool: ${toolName}
- Checklist parameter: ${parameterName}
- Checklist description: ${parameterDescription || "No description provided"}
- Checklist severity baseline: ${severity}

Return strict JSON with these keys:
{
  "suggestedResponseStatus": "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "NA",
  "comments": "short audit comment",
  "observationTitle": "title if non-compliant else empty string",
  "observationDescription": "description if non-compliant else empty string",
  "observationSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "observationRecommendation": "recommendation if non-compliant else empty string"
}

Use conservative audit judgment. If the screenshot does not prove compliance, prefer PARTIAL or NON_COMPLIANT rather than COMPLIANT.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiVisionModel,
      temperature: 0.2,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${base64Image}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`OpenAI screenshot analysis failed: ${errorBody}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const outputText = extractTextFromResponsePayload(data);
  let parsed;

  try {
    parsed = extractJson(outputText);
  } catch (error) {
    const fallbackText = JSON.stringify(data.output || []);
    parsed = extractJson(fallbackText);
  }

  return {
    suggestedResponseStatus: parsed.suggestedResponseStatus || "PARTIAL",
    comments: parsed.comments || "",
    observationTitle: parsed.observationTitle || "",
    observationDescription: parsed.observationDescription || "",
    observationSeverity: parsed.observationSeverity || severity,
    observationRecommendation: parsed.observationRecommendation || ""
  };
}
