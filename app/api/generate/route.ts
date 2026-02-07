import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return NextResponse.json({ error: "Ключ не знайдено" }, { status: 500 });

  const { topic, audience, style } = await req.json();

  // Список моделей, які актуальні на 2026 рік. Ми спробуємо їх усі!
  const modelsToTry = [
    "gemini-2.0-flash",       // Найновіша на зараз
    "gemini-1.5-flash",       // Стандартна
    "gemini-1.5-flash-8b",    // Полегшена
    "gemini-1.5-pro"          // Потужна
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`📡 Пробуємо модель: ${modelName}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Напиши рекламний пост для Telegram. Тема: ${topic}. Аудиторія: ${audience}. Стиль: ${style}. Українською мовою. Пиши ТІЛЬКИ текст поста.`
              }]
            }]
          })
        }
      );

      const data = await response.json();

      // Якщо модель спрацювала — ми знайшли переможця!
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        console.log(`✅ УСПІХ! Спрацювала модель: ${modelName}`);
        return NextResponse.json({ text: data.candidates[0].content.parts[0].text });
      }

      console.warn(`⚠️ ${modelName} видала помилку: ${data.error?.message || "невідомо"}`);
      
    } catch (err: any) {
      console.error(`❌ Помилка з ${modelName}:`, err.message);
    }
  }

  // Якщо ми тут — жодна модель не підійшла
  return NextResponse.json({ 
    error: "Всі моделі повернули 404", 
    details: "Перевір, чи не заблоковано аккаунт або чи увімкнено VPN." 
  }, { status: 404 });
}