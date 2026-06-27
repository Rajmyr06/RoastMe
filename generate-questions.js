export default async (req, context) => {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "API key tidak ditemukan." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const prompt = `Kamu adalah pembuat kuis absurd yang kreatif.

Buat 5 pertanyaan pilihan ganda yang absurd, lucu, dan relatable untuk dipakai di website "AI Roast Me". Setiap pertanyaan punya 4 pilihan jawaban.

Syarat pertanyaan:
- Topiknya random dan tidak terduga (bisa soal kebiasaan aneh, situasi awkward, preferensi absurd, dilema receh, dll)
- Jangan tentang kuliah, pekerjaan, atau politik
- Harus relatable untuk anak muda Indonesia
- Pilihan jawaban harus lucu dan mencerminkan tipe kepribadian yang berbeda

Balas HANYA dengan JSON valid tanpa markdown, format:
{
  "questions": [
    {
      "text": "teks pertanyaan",
      "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"]
    }
  ]
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 1.1,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content?.trim();

    // Strip markdown jika ada
    raw = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify(parsed), {
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

export const config = { path: "/api/generate-questions" };
