'use client';
import Image from 'next/image';
import { 
  Search, Globe, Facebook, Play, Heart, BarChart3, 
  Calendar, Zap, LayoutGrid, ChevronDown, 
  MousePointer2, Hash, Type, Languages, Instagram
} from 'lucide-react';

export default function Home() {
  // Данные для карточек, чтобы сетка ожила
  const adsData = [
    { id: 1, title: "E-com Watch Trend", geo: "🇺🇸 US", roi: "+124%", platform: "Facebook" },
    { id: 2, title: "Crypto App Launch", geo: "🇩🇪 DE", roi: "+89%", platform: "Instagram" },
    { id: 3, title: "Nutra Health Offer", geo: "🇧🇷 BR", roi: "+210%", platform: "Facebook" },
    { id: 4, title: "Gaming Mobile Ad", geo: "🇵🇱 PL", roi: "+67%", platform: "Facebook" },
    { id: 5, title: "Fashion Summer Sale", geo: "🇫🇷 FR", roi: "+156%", platform: "Instagram" },
    { id: 6, title: "Gadget Review Video", geo: "🇰🇿 KZ", roi: "+112%", platform: "Facebook" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans">
      
      {/* --- SIDEBAR: ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky h-screen top-0 shadow-sm">
        
        {/* Логотип */}
        <div className="p-6 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={28} 
                height={28} 
                className="object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')} 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg leading-none tracking-tighter text-primary uppercase">
                Absolute Spy
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">PRO</span>
            </div>
          </div>
        </div>

        {/* Прокручиваемые фильтры */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7 no-scrollbar pb-10">
          
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Медиа данные</p>
            <div className="relative">
              <select className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer">
                <option>Все форматы</option>
                <option>Видео (Video)</option>
                <option>Изображения (Image)</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 text-gray-400" size={16} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Ссылки и офферы</p>
            <div className="relative">
              <MousePointer2 className="absolute left-4 top-4 text-gray-300" size={16} />
              <input type="text" placeholder="Приложение или ID" className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Таргетинг</p>
            <div className="relative">
              <Globe className="absolute left-4 top-4 text-gray-300" size={16} />
              <select className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/10 transition-all">
                <option>Страна (GEO)</option>
                <option>🇺🇸 США</option>
                <option>🇩🇪 Германия</option>
                <option>🇧🇷 Бразилия</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 text-gray-400" size={16} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Время и Активность</p>
            <div className="relative">
              <Calendar className="absolute left-4 top-4 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="Дата создания" 
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="От дней" className="w-1/2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
              <input type="number" placeholder="До дней" className="w-1/2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all">
              Поиск объявлений
            </button>
            <button className="w-full py-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors text-center">
              Сбросить фильтры
            </button>
          </div>
        </div>
      </aside>

      {/* --- ПРАВАЯ ЧАСТЬ: КОНТЕНТ --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Поиск в шапке */}
        <header className="bg-white p-6 border-b border-gray-100 shadow-sm z-10">
          <div className="max-w-4xl mx-auto relative group">
            <Search className="absolute left-5 top-4 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Поиск по ключевому слову или домену..." 
              className="w-full h-14 bg-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all border-transparent focus:border-primary/10 border"
            />
          </div>
        </header>

        {/* Лента объявлений */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc] no-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-primary uppercase tracking-tighter italic">Live Feed</h2>
               <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Найдено: 1,420 объявлений
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {adsData.map((ad) => (
                <div key={ad.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden">
                  <div className="h-48 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                      {ad.platform === "Facebook" ? <Facebook size={12} className="text-blue-600" /> : <Instagram size={12} className="text-pink-600" />}
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{ad.platform}</span>
                    </div>
                    <Play className="text-primary/20 group-hover:text-primary group-hover:scale-125 transition-all duration-500" size={40} />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{ad.geo}</span>
                      <div className="flex items-center gap-1 text-green-500 font-black italic">
                        <BarChart3 size={16} /> {ad.roi}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-6 tracking-tight">{ad.title}</h3>
                    <button className="w-full py-3 bg-gray-50 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
                      Анализировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}