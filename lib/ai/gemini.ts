export async function callGemini(
  prompt: string,
  systemInstruction: string = 'Anda adalah AI Business Advisor cerdas untuk pedagang pasar tradisional dan pelaku UMKM Indonesia (VokaSync). Selalu gunakan bahasa Indonesia yang hangat, bersahabat, mudah dipahami orang awam tanpa istilah akuntansi rumit.'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body = {
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const text = parts
          .map((p: any) => p.text)
          .filter(Boolean)
          .join('\n');
        if (text && text.trim()) {
          return text.trim();
        }
      } else {
        const errorText = await response.text();
        lastError = new Error(`Gemini ${model} status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  console.error('All Gemini models failed:', lastError);
  throw lastError || new Error('Gemini API call failed');
}
