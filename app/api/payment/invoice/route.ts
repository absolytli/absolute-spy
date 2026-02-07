import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const { title, description, payload, amount } = await req.json();

    if (!BOT_TOKEN) return NextResponse.json({ error: 'Bot token not set' }, { status: 500 });

    // 1. Формуємо запит до Telegram на створення чеку
    // Важливо: для Stars (XTR) provider_token має бути пустим!
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,       // Назва товару (PRO Subscription)
        description, // Опис
        payload,     // Сюди ми запхаємо ID юзера, щоб знати, кому дати PRO
        provider_token: "", // ДЛЯ STARS ЦЕ МАЄ БУТИ ПУСТИМ
        currency: "XTR",    // Валюта Telegram Stars
        prices: [{ label: "PRO Access", amount: amount }], // Сума
      })
    });

    const data = await response.json();

    if (!data.ok) {
        console.error("Telegram Error:", data);
        throw new Error(data.description);
    }

    // Повертаємо посилання на оплату на фронтенд
    return NextResponse.json({ invoiceLink: data.result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}