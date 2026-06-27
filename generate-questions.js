const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

exports.handler = async function(event, context) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API key tidak ditemukan di environment variables." })
    };
  }

  const prompt = `Kamu adalah pembuat kuis absurd yang kreatif.

Buat 5 pertanyaan pilihan ganda yang absurd, lucu, dan relatable untuk dipakai di website "AI Roast Me". Setiap pertanyaan punya 4 pilihan jawaban.

Syarat pertanyaan:
- Topiknya random dan tidak terduga (kebiasaan aneh, situasi awkward, preferensi absurd, dilema receh, dll)
- Jangan tentang kuliah, pekerjaan, atau politik
- Harus relatable untuk anak muda Indonesia
- Pilihan jawaban harus lucu dan mencerminkan tipe kepribadian berbeda

Balas HANYA dengan JSON valid tanpa markdown, tanpa komentar, format persis:
{"questions":[{"text":"teks pertanyaan","options":["pilihan A","pilihan B","pilihan C","pilihan D"]}]}`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 900,
        temperature: 1.1,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.error?.message || `Groq error: ${res.status}` })
      };
    }

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content?.trim() || "";
    raw = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
