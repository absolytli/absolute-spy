'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Lock, Mail, UserPlus, LogIn, MessageCircle, SendHorizonal } from 'lucide-react';

// Іконки для вибору месенджера
const messengers = [
  { id: 'telegram', label: 'Telegram', icon: <SendHorizonal size={18}/> },
  { id: 'discord', label: 'Discord', icon: <MessageCircle size={18}/> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <span className="font-bold text-[10px]">WA</span> },
];

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactMethod, setContactMethod] = useState('telegram');
  const [contactHandle, setContactHandle] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      // Реєстрація з додатковими даними (metadata)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            contact_method: contactMethod,
            contact_handle: contactHandle,
          }
        }
      });
      if (error) alert(error.message);
      else alert('Реєстрація успішна! Перевірте пошту.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-600/20 mb-4">
            <Send className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Absolute Spy</h1>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
            {isRegistering ? 'Створити акаунт' : 'Вхід у систему'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-purple-600/10 transition-all text-sm"
            required
          />
          <input 
            type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-purple-600/10 transition-all text-sm"
            required
          />

          {isRegistering && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Оберіть месенджер для зв'язку</p>
              
              {/* Ряд іконок як на прикладі */}
              <div className="flex justify-center gap-3">
                {messengers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setContactMethod(m.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${
                      contactMethod === m.id 
                      ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' 
                      : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                placeholder={contactMethod === 'telegram' ? 'Нікнейм у Telegram' : 'Ваш контакт'} 
                value={contactHandle} 
                onChange={(e) => setContactHandle(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-purple-600/10 transition-all text-sm"
                required={isRegistering}
              />
            </div>
          )}
          
          <button 
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Зачекайте...' : (isRegistering ? 'Створити акаунт' : 'Увійти')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:underline"
          >
            {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
          </button>
        </div>
      </div>
    </div>
  );
}