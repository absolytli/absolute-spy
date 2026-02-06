import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return NextResponse.json({ error: "Ключ не знайдено" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);

  // Список моделей, які актуальні на 2026 рік
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

  for (const modelName of modelsToTry) {
    try {
      console.log(`📡 Спроба підключення до: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `Напиши рекламний пост для Telegram. Тема: Тестовий запуск. Мова: Українська.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text) {
        console.log(`✅ УСПІХ! Працює модель: ${modelName}`);
        return NextResponse.json({ text });
      }
    } catch (err: any) {
      console.log(`❌ ${modelName} недоступна: ${err.message}`);
      continue; // Пробуємо наступну
    }
  }

  return NextResponse.json({ 
    error: "Всі моделі повернули 404", 
    details: "Спробуйте створити НОВИЙ ключ на іншому акаунті Google або змініть регіон у VPN на США." 
  }, { status: 404 });
}