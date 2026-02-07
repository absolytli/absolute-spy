'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Sparkles, Lock, Mail } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    // Використовуємо Magic Link (вхід без пароля, по пошті)
    // Це найпростіший і найнадійніший спосіб
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      setIsSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
        
        {/* Декоративний фон */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7000FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200 transform rotate-3">
            <Send className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
            Absolute <span className="text-[#7000FF]">Spy</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
            Вхід в систему
          </p>
        </div>

        {isSent ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Перевірте пошту!</h3>
            <p className="text-gray-500 text-sm">Ми відправили магічне посилання на <strong>{email}</strong>.</p>
            <button onClick={() => setIsSent(false)} className="text-[#7000FF] font-bold text-xs uppercase hover:underline">
              Ввести іншу пошту
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 outline-none focus:border-[#7000FF] focus:ring-4 focus:ring-[#7000FF]/10 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {/* text-gray-900 — це колір тексту (ЧОРНИЙ), який виправить проблему */}
            </div>

            <button
              disabled={loading}
              className="w-full h-14 bg-[#7000FF] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Відправка...' : 'Отримати посилання для входу'}
            </button>

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-6">
              Ми використовуємо вхід без пароля для максимальної безпеки 🔒
            </p>
          </form>
        )}
      </div>
    </div>
  );
}