'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Перемикач Вхід / Реєстрація
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    // Перевірка Telegram середовища
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      const user = tg.initDataUnsafe?.user;
      if (user) setTgUser(user);
    }
  }, []);

  // --- ВХІД ЧЕРЕЗ TELEGRAM (АВТОМАТИЧНО) ---
  const handleTelegramLogin = async () => {
    if (!tgUser) return;
    setLoading(true);
    try {
      const fakeEmail = `tg_${tgUser.id}@absolute-spy.internal`;
      const fakePassword = `secret_pass_${tgUser.id}_secure`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
      });

      if (signInError) {
        // Якщо немає - реєструємо
        const { error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: fakePassword,
          options: {
            data: {
              full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
              telegram_id: tgUser.id,
              username: tgUser.username,
              avatar_url: tgUser.photo_url
            }
          }
        });
        if (signUpError) throw signUpError;
        
        // Створюємо профіль
        await supabase.from('profiles').upsert({
          id: (await supabase.auth.getUser()).data.user?.id,
          email: fakeEmail,
          telegram_id: tgUser.id,
          full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          username: tgUser.username,
          avatar_url: tgUser.photo_url
        });
      }
    } catch (error: any) {
      alert("Помилка входу через TG: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ВХІД / РЕЄСТРАЦІЯ ЧЕРЕЗ EMAIL + PASSWORD ---
  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // РЕЄСТРАЦІЯ
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Створюємо профіль для нового юзера
        if (data.user) {
           await supabase.from('profiles').insert([{
             id: data.user.id,
             email: email,
             full_name: email.split('@')[0],
           }]);
           alert("🎉 Реєстрація успішна! Тепер увійдіть.");
           setIsSignUp(false); // Перемикаємо на вхід
        }
      } else {
        // ВХІД
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7000FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200 transform rotate-3">
            <Send className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
            Absolute <span className="text-[#7000FF]">Spy</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
            {tgUser ? 'Швидкий вхід' : (isSignUp ? 'Створення акаунту' : 'Вхід в систему')}
          </p>
        </div>

        {tgUser ? (
          <div className="text-center space-y-6">
             <div className="flex flex-col items-center">
              {tgUser.photo_url ? (
                <img src={tgUser.photo_url} alt="User" className="w-20 h-20 rounded-full border-4 border-purple-100 shadow-lg mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                  {tgUser.first_name[0]}
                </div>
              )}
              <h2 className="text-xl font-black text-gray-900">Привіт, {tgUser.first_name}! 👋</h2>
            </div>
            <button
              onClick={handleTelegramLogin}
              disabled={loading}
              className="w-full h-14 bg-[#7000FF] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Заходимо...' : <><Sparkles size={18} /> Продовжити</>}
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 outline-none focus:border-[#7000FF] focus:ring-4 focus:ring-[#7000FF]/10 transition-all font-bold text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-12 outline-none focus:border-[#7000FF] focus:ring-4 focus:ring-[#7000FF]/10 transition-all font-bold text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? 'Обробка...' : (isSignUp ? 'ЗАРЕЄСТРУВАТИСЯ' : 'УВІЙТИ')}
            </button>
            
            <div className="text-center">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#7000FF] text-xs font-bold uppercase hover:underline">
                {isSignUp ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}