"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  RefreshCw, 
  Languages, 
  Target, 
  Zap,
  ChevronLeft,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function AIStudio() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('native');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // РЕАЛЬНА функція генерації через твій API
  const generateAdText = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setCopied(false);
    setResult(''); // Очищаємо попередній текст

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          audience,
          style
        }),
      });

      const data = await response.json();

      if (data.text) {
        setResult(data.text);
        
        // Вібрація "Успіх" в Telegram
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        throw new Error(data.error || 'Помилка генерації');
      }
    } catch (error) {
      console.error("Помилка:", error);
      setResult("❌ Сталася помилка. Перевір, чи правильно вставлений API Key у файлі /api/generate/route.ts та чи встановлена бібліотека google-generative-ai.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Легка вібрація при копіюванні
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      {/* ВЕРХНЯ ПАНЕЛЬ */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-900">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-black uppercase italic tracking-tight text-gray-900">
            AI <span className="text-purple-600">Studio</span>
          </h1>
        </div>
        <div className="bg-purple-50 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Beta</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* КАРТКА НАЛАШТУВАНЬ */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-gray-200/50 border border-white space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="font-black uppercase text-base tracking-widest text-gray-900 leading-tight">Генератор копірайту</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Gemini AI</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Поле: ТЕМА */}
            <div className="group">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-2 block tracking-widest">Про що пишемо?</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Наприклад: Новий курс по арбітражу трафіку або магазин кросівок..."
                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-100 rounded-[1.5rem] focus:ring-0 transition-all font-bold text-gray-700 placeholder:text-gray-300 resize-none h-24"
              />
            </div>

            {/* Поле: АУДИТОРІЯ */}
            <div className="group">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-2 block tracking-widest">Цільова аудиторія</label>
              <div className="relative">
                <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Наприклад: Новачки в ТГ, Мами, Геймери..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-100 rounded-2xl focus:ring-0 transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            {/* ВИБІР СТИЛЮ */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'native', label: 'Нативний', icon: Zap },
                { id: 'aggressive', label: 'Продаж', icon: Send },
                { id: 'story', label: 'Історія', icon: Languages },
                { id: 'clickbait', label: 'Клікбейт', icon: Sparkles },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border-2 ${
                    style === item.id 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-xl' 
                    : 'bg-white text-gray-400 border-gray-50 hover:border-purple-100'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={generateAdText}
            disabled={isGenerating || !topic}
            className="w-full py-6 bg-purple-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-purple-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-purple-200"
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <Zap size={20} className="fill-white" />
            )}
            {isGenerating ? 'Нейронка створює контент...' : 'Створити оголошення'}
          </button>
        </section>

        {/* СЕКЦІЯ РЕЗУЛЬТАТУ */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Готовий креатив</h3>
              <button 
                onClick={copyToClipboard}
                className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all ${copied ? 'text-green-500' : 'text-purple-600'}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Скопійовано' : 'Копіювати'}
              </button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-purple-100/50 border border-purple-50 relative group">
              <div className="absolute top-8 left-0 w-1.5 h-12 bg-purple-600 rounded-r-full group-hover:h-24 transition-all duration-500"></div>
              <p className="text-gray-800 leading-relaxed font-bold whitespace-pre-wrap text-sm md:text-base selection:bg-purple-100">
                {result}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}