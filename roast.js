export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "API key tidak ditemukan." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Request body tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { name, answers } = body;

  if (!name || !answers || !Array.isArray(answers)) {
    return new Response(JSON.stringify({ error: "Data tidak lengkap." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const answersText = answers
    .map((a, i) => `Pertanyaan ${i + 1}: ${a.question}\nJawaban: ${a.answer}`)
    .join("\n\n");

  const prompt = `Kamu adalah roaster profesional yang jago roast seseorang dengan cara yang lucu, relatable, dan sedikit pedas — tapi tidak kasar atau menyinggung SARA.

Nama orang yang mau di-roast: ${name}

Berikut jawaban-jawaban absurd yang dia pilih:
${answersText}

Tugas kamu:
- Buat roast personal sekitar 4–6 kalimat
- Gunakan bahasa Indonesia gaul yang santai dan natural
- Analisis pola kepribadian dari jawaban-jawaban itu dan jadikan bahan roast
- Boleh ada sedikit hiperbola atau analogi lucu
- Akhiri dengan satu kalimat yang sedikit nyindir tapi tetap lucu
- Langsung ke roast-nya, tanpa pembuka seperti "Oke" atau "Baik"
- Jangan terlalu formal, jangan pakai emoji berlebihan`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const roast = data.choices?.[0]?.message?.content?.trim();

    if (!roast) throw new Error("Respons kosong dari API.");

    return new Response(JSON.stringify({ roast }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/roast" };
