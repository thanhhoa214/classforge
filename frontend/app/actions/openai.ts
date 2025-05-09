"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompt = `
You are a helpful assistant that can extract information from a given text.

You will be given a text and you need to extract the information from the text and return it in the following structured format:
{
  "target_id": number,
  "class_id": number,
  "suggestion": string,
}

The target_id is the id of the student you need to reallocate.
The class_id is the id of the class you need to reallocate the student to.
The suggestion is a suggestion to the student in markdown format.
If you cannot find the information, return null.
`;

export async function getReallocationSuggestion(message: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message },
    ],
  });
  const content = response.choices[0].message.content;
  if (!content) return;
  const parsed = JSON.parse(content);
  return parsed as {
    target_id: number;
    class_id: number;
    suggestion: string;
  } | null;
}
