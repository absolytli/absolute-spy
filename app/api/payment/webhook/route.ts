import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Створюємо клієнта бази даних
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Telegram запитує: "Чи все ок перед оплатою?" (Pre-checkout)
    if (update.pre_checkout_query) {
      const queryId = update.pre_checkout_query.id;
      // Кажемо Telegram: "Так, все ок, проводь платіж"
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
      });
      return NextResponse.json({ ok: true });
    }

    // 2. ОПЛАТА ПРОЙШЛА УСПІШНО (Successful Payment)
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const userId = update.message.successful_payment.invoice_payload; // Ми сюди клали ID юзера
      const amount = payment.total_amount; // Скільки зірок заплатив

      // --- ОНОВЛЮЄМО БАЗУ ДАНИХ ---
      
      // А) Записуємо платіж в історію
      await supabase.from('payments').insert({
        user_id: userId,
        amount: amount,
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        status: 'paid'
      });

      // Б) Видаємо PRO статус і поповнюємо баланс
      const { error } = await supabase.from('profiles').update({
        subscription_tier: 'pro',
        stars_balance: amount // Можна плюсувати, якщо треба: stars_balance + amount
      }).eq('id', userId);

      if (error) console.error("DB Update Error:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}