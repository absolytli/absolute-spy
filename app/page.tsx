'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from './lib/supabase';
import { 
  Search, Send, Play, Download, ChevronDown, Plus, X, Upload, Trash2, 
  AlignLeft, MousePointer2, PlusCircle, FileText, Tag, Copy, Check, 
  Smartphone, MessageCircle, Mic, Share2, Globe, Camera, Smile, Layers
} from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedAd, setSelectedAd] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState([]);
  const [copied, setCopied] = useState(false);

  const categoriesList = [
    "Гемблінг", "Беттінг", "Криптовалюта", "Інвестиції", "Фінанси", 
    "E-commerce / Товари", "Здоров’я / Краса", "Освіта", 
    "Знайомства / Adult", "Бізнес / Заробіток", "Ігри", 
    "Послуги", "Нерухомість", "Авто", "Інше"
  ];

  const languagesList = ["Українська", "Англійська", "Польська", "Німецька", "Інша"];
  const geoList = ["Увесь світ", "Україна", "Європа", "США / Канада", "Латам", "Азія"];

  const formatsList = [
    { id: 'Text', label: 'Текстовий пост', icon: <AlignLeft size={14}/> },
    { id: 'ImageText', label: 'Картинка + текст', icon: <Smartphone size={14}/> },
    { id: 'Gallery', label: 'Галерея (2+)', icon: <Layers size={14}/> },
    { id: 'Video', label: 'Відео', icon: <Play size={14}/> },
    { id: 'GIF', label: 'GIF', icon: <Smile size={14}/> },
    { id: 'Audio', label: 'Голосове', icon: <Mic size={14}/> },
    { id: 'Circle', label: 'Кружок', icon: <MessageCircle size={14}/> },
    { id: 'Screenshot', label: 'Скріншот (виплата)', icon: <Camera size={14}/> }
  ];

  const [filters, setFilters] = useState({
    category: 'Всі',
    format: 'Всі',
    language: 'Всі',
    geo: 'Всі',
    hasEmoji: false,
    hasButtons: false
  });

  const [newAd, setNewAd] = useState({
    title: '',           
    mainText: '',        
    format: 'ImageText', 
    categories: ['Інше'],
    language: 'Українська',
    geo: 'Україна',
    hasEmoji: false,
    buttons: ['Дізнатися більше'],
    image: null,
    file: null,
    type: 'text' 
  });

  const emojiRegex = /\p{Extended_Pictographic}/u;

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) setAds(data);
    } catch (error: any) {
      console.error('Помилка завантаження:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const downloadMedia = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'spy-creative';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { alert('Помилка завантаження'); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCategoryField = () => {
    if (newAd.categories.length < 3) setNewAd({ ...newAd, categories: [...newAd.categories, 'Інше'] });
  };
  const updateCategoryField = (index, value) => {
    const updated = [...newAd.categories];
    updated[index] = value;
    setNewAd({ ...newAd, categories: updated });
  };
  const removeCategoryField = (index) => {
    if (newAd.categories.length > 1) {
      const updated = newAd.categories.filter((_, i) => i !== index);
      setNewAd({ ...newAd, categories: updated });
    }
  };

  const saveNewAd = async () => {
    if (!newAd.title) return alert("Заповніть заголовок!");
    setIsLoading(true);
    try {
      let publicUrl = null;
      if (newAd.file) {
        const file = newAd.file;
        const fileName = `${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
        await supabase.storage.from('creatives').upload(fileName, file);
        const { data: urlData } = supabase.storage.from('creatives').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
      const activeButtons = newAd.buttons.filter(b => b.trim() !== '');
      const { data, error } = await supabase.from('posts').insert([{
        title: newAd.title,
        mainText: newAd.mainText,
        format: newAd.format,
        category: Array.from(new Set(newAd.categories)),
        language: newAd.language,
        has_emoji: newAd.hasEmoji,
        has_buttons: activeButtons.length > 0,
        buttons: activeButtons,
        geo: newAd.geo,
        platform: "Telegram",
        image: publicUrl,
        type: newAd.type
      }]).select();
      if (error) throw error;
      setAds([data[0], ...ads]);
      setIsModalOpen(false);
      setNewAd({ title: '', mainText: '', format: 'ImageText', categories: ['Інше'], language: 'Українська', geo: 'Україна', hasEmoji: false, buttons: ['Дізнатися більше'], image: null, file: null, type: 'text' });
    } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
  };

  const deleteAd = async (id, e) => {
    e.stopPropagation();
    if (confirm("Видалити цей креатив?")) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) setAds(ads.filter(ad => ad.id !== id));
    }
  };

  const filteredAds = ads.filter((ad) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = ad.title?.toLowerCase().includes(searchLow) || ad.mainText?.toLowerCase().includes(searchLow);
    
    const matchesCategory = filters.category === 'Всі' || 
                            (Array.isArray(ad.category) && ad.category.includes(filters.category)) ||
                            (ad.category === filters.category);

    const matchesFormat = filters.format === 'Всі' || ad.format === filters.format;
    const matchesLanguage = filters.language === 'Всі' || ad.language === filters.language;
    const matchesGeo = filters.geo === 'Всі' || ad.geo === filters.geo;

    const hasEmojiInText = ad.mainText && emojiRegex.test(ad.mainText);
    const matchesEmoji = !filters.hasEmoji || ad.has_emoji === true || hasEmojiInText;
    const matchesButtons = !filters.hasButtons || ad.has_buttons === true;

    return matchesSearch && matchesCategory && matchesFormat && matchesLanguage && matchesGeo && matchesEmoji && matchesButtons;
  });

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky h-screen top-0">
        <div className="p-6 border-b border-gray-100 flex-shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/10">
             <Image src="/logo.png" alt="Logo" width={24} height={24} />
          </div>
          <span className="font-black text-lg text-purple-600 uppercase italic tracking-tighter leading-none">Absolute Spy</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-95">
            <Plus size={18} /> Додати креатив
          </button>

          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase text-gray-400 px-1 tracking-widest">Фільтрація бази</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Ніша (Vertical)</p>
                <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                  <option value="Всі">Всі ніші</option>
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Формат креативу</p>
                <select value={filters.format} onChange={(e) => setFilters({...filters, format: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                  <option value="Всі">Всі формати</option>
                  {formatsList.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Географія</p>
                <select value={filters.geo} onChange={(e) => setFilters({...filters, geo: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                  <option value="Всі">Весь світ</option>
                  {geoList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors group">
                <input type="checkbox" checked={filters.hasEmoji} onChange={(e) => setFilters({...filters, hasEmoji: e.target.checked})} className="w-4 h-4 rounded accent-purple-600" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-purple-600">З Емодзі 😃</span>
              </label>
              <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors group">
                <input type="checkbox" checked={filters.hasButtons} onChange={(e) => setFilters({...filters, hasButtons: e.target.checked})} className="w-4 h-4 rounded accent-purple-600" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-purple-600">З кнопками 🖱️</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white p-6 border-b border-gray-100 shadow-sm z-10">
          <div className="max-w-4xl mx-auto relative group">
            <Search className="absolute left-5 top-4 text-gray-300 group-focus-within:text-purple-600 transition-colors" size={20} />
            <input type="text" placeholder="Пошук за ключовими словами..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc] no-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
              {filteredAds.map((ad) => (
                <div key={ad.id} onClick={() => setSelectedAd(ad)} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative flex flex-col">
                  <button onClick={(e) => {e.stopPropagation(); deleteAd(ad.id, e);}} className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>

                  {/* --- МЕДІА БЛОК: Максимальний розмір, без обрізання (object-contain) --- */}
                  <div className="bg-gray-50 relative flex items-center justify-center min-h-[250px]">
                    {ad.image ? (
                      ad.type === 'video' ? (
                        <video src={ad.image} className="w-full h-auto max-h-[500px] object-contain" muted />
                      ) : (
                        <img src={ad.image} className="w-full h-auto max-h-[500px] object-contain" alt="" />
                      )
                    ) : (
                      <div className="h-48 flex items-center justify-center w-full"><FileText className="text-purple-100" size={40} /></div>
                    )}
                    
                    {/* КАТЕГОРІЇ */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[80%] z-10">
                      {Array.isArray(ad.category) ? ad.category.map((cat, i) => (
                          <div key={i} className="bg-purple-600/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Tag size={8} className="text-white" />
                            <span className="text-[7px] font-black text-white uppercase">{cat}</span>
                          </div>
                        )) : ad.category && (
                          <div className="bg-purple-600/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Tag size={8} className="text-white" />
                            <span className="text-[7px] font-black text-white uppercase">{ad.category}</span>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* --- ТЕКСТОВИЙ БЛОК: Компактний, без зайвого відступу --- */}
                  <div className="p-3 flex flex-col gap-2 bg-white relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-600 uppercase">
                        {formatsList.find(f => f.id === ad.format)?.icon}
                        {formatsList.find(f => f.id === ad.format)?.label || ad.format}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                        <Globe size={8} /> {ad.geo}
                      </div>
                    </div>

                    {/* ЗАГОЛОВОК: Тільки заголовок, компактно */}
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">
                      {ad.title}
                    </h3>
                    
                     <div className="flex gap-1.5 items-center text-[10px]">
                       {(ad.has_emoji || (ad.mainText && emojiRegex.test(ad.mainText))) && <span title="Містить емодзі">😃</span>}
                       {ad.has_buttons && <span title="Має кнопки">🖱️</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-purple-600 uppercase tracking-tighter italic">Створити Креатив</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 px-1">Формат</p>
                  <select value={newAd.format} onChange={(e) => setNewAd({...newAd, format: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                    {formatsList.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 px-1">ГЕО</p>
                  <select value={newAd.geo} onChange={(e) => setNewAd({...newAd, geo: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                    {geoList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Заголовок креативу" value={newAd.title} onChange={(e) => setNewAd({...newAd, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
                <textarea placeholder="Рекламний текст" value={newAd.mainText} onChange={(e) => setNewAd({...newAd, mainText: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white h-32 resize-none transition-all" />
              </div>

              <div className="relative h-32 bg-purple-50 rounded-3xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center overflow-hidden hover:border-purple-400 transition-colors group cursor-pointer">
                {newAd.image ? (
                  newAd.type === 'video' ? <video src={newAd.image} className="w-full h-full object-cover" muted /> : <img src={newAd.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <> <Upload className="text-purple-300 group-hover:text-purple-500 mb-1" size={24} /> <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Медіафайл</span> </>
                )}
                <input type="file" onChange={(e) => {
                  const f = e.target.files[0];
                  if(f) setNewAd({...newAd, file: f, image: URL.createObjectURL(f), type: f.type.includes('video') ? 'video' : 'image'})
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-black uppercase text-gray-400">Ніші (Max 3)</p>
                  {newAd.categories.length < 3 && (
                    <button onClick={addCategoryField} className="text-purple-600 hover:scale-110 transition-transform"><PlusCircle size={16}/></button>
                  )}
                </div>
                {newAd.categories.map((cat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select value={cat} onChange={(e) => updateCategoryField(idx, e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                      {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {newAd.categories.length > 1 && <button onClick={() => removeCategoryField(idx)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-gray-50/50">
              <button onClick={saveNewAd} disabled={isLoading} className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:brightness-110 transition-all disabled:opacity-50">
                {isLoading ? 'Збереження...' : 'Опублікувати'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAILS */}
      {selectedAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative animate-in zoom-in duration-300 max-h-[90vh]">
            <button onClick={() => setSelectedAd(null)} className="absolute top-6 right-6 z-30 p-3 bg-gray-100 rounded-full transition-colors"><X /></button>
            <div className="lg:w-1/2 bg-gray-950 flex items-center justify-center overflow-hidden">
              {selectedAd.image ? (
                selectedAd.type === 'video' ? <video src={selectedAd.image} controls className="w-full h-full" autoPlay /> : <img src={selectedAd.image} className="w-full h-full object-contain" alt="" />
              ) : <div className="flex flex-col items-center gap-4 text-gray-500"><FileText size={80} /><span className="text-xs uppercase font-black tracking-widest">Тільки текст</span></div>}
            </div>
            <div className="lg:w-1/2 p-12 overflow-y-auto bg-white flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-purple-600/5 text-purple-600"><Send /></div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2">{selectedAd.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full">{selectedAd.format}</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase bg-gray-50 px-3 py-1 rounded-full">{selectedAd.geo}</span>
                    {Array.isArray(selectedAd.category) ? selectedAd.category.map((c, i) => (
                        <span key={i} className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-md">{c}</span>
                      )) : <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-md">{selectedAd.category}</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-8 flex-1">
                <div className="p-7 bg-gray-50/50 rounded-[2rem] border border-gray-100 shadow-inner max-h-[300px] overflow-y-auto no-scrollbar relative group">
                  <button onClick={() => copyToClipboard(selectedAd.mainText)} className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{selectedAd.mainText || "Опис відсутній"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MousePointer2 size={14}/> Активні кнопки</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAd.buttons?.map((btn, idx) => (
                      <div key={idx} className="px-4 py-2 bg-purple-600/5 border border-purple-600/10 rounded-xl font-black text-purple-600 uppercase text-[10px] shadow-sm">{btn}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}