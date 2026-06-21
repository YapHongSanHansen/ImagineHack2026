/**
 * Utility for calling the Google Gemini API client-side to perform NLP analysis on project briefs.
 * Returns: { workload, skills: [Tech, Management, Design, Operations], taskDescriptions }
 */

export async function analyzeBriefWithGemini(brief, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
Analyze the following project brief or requirements document and extract:
1. An estimated project workload rating between 1 and 10 (where 1 is a simple short task, 5 is a moderate system redesign, and 10 is a massive, multi-department enterprise scale migration, billing, or payments build).
2. The relative weight/importance of these 4 skill categories: [Tech, Management, Design, Operations]. The weights must be numbers between 0 and 1, representing how much this project demands each category (they do not need to sum to 1, but should reflect relative demand).
3. A short, customized 1-sentence action-oriented task string for the drafted team members in each key category (Tech, Management, Design, Operations) that matches this specific project.

You MUST respond with a JSON object in this exact schema:
{
  "workload": number,
  "skills": [number, number, number, number], // corresponding to [Tech, Management, Design, Operations]
  "taskDescriptions": {
    "tech": string,
    "management": string,
    "design": string,
    "operations": string
  }
}

Project brief text:
"${brief.replace(/"/g, '\\"')}"
`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const resJson = await response.json();
  const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty or invalid response.');
  }

  const result = JSON.parse(rawText.trim());

  // Validate and clamp parsed values
  const workload = Math.max(1, Math.min(10, Math.round(result.workload || 5)));
  const skills = (result.skills || [0.5, 0.5, 0.5, 0.5]).map((s) => Math.max(0, Math.min(1, s)));
  const taskDescriptions = result.taskDescriptions || {
    tech: 'Own the core technical build',
    management: 'Lead delivery & stakeholders',
    design: 'Drive UX & design direction',
    operations: 'Run rollout, ops & reliability',
  };

  return {
    workload,
    skills,
    taskDescriptions,
  };
}
