'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from './lib/supabase';
import { 
  Search, Send, Play, 
  ChevronDown, Plus, X, Upload, Trash2, AlignLeft, MousePointer2, PlusCircle, FileText
} from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedAd, setSelectedAd] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Всі');
  const [ads, setAds] = useState([]);
  
  const categories = ["Гемблінг", "Нутра", "Крипта", "Товарка", "Інфоциганство", "Інше"];

  const [newAd, setNewAd] = useState({
    title: '',           
    mainText: '',        
    format: 'Публікація', 
    category: 'Інше',
    buttons: ['Дізнатися більше'],
    image: null,
    file: null,
    type: 'text' 
  });

  // --- 1. ЗАГРУЗКА ИЗ НОВОЙ ТАБЛИЦЫ 'posts' ---
  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setAds(data);
    } catch (error: any) {
      console.error('Помилка завантаження:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const addButton = () => {
    if (newAd.buttons.length < 20) {
      setNewAd({ ...newAd, buttons: [...newAd.buttons, ''] });
    }
  };

  const updateButton = (index, value) => {
    const newButtons = [...newAd.buttons];
    newButtons[index] = value;
    setNewAd({ ...newAd, buttons: newButtons });
  };

  const removeButton = (index) => {
    const newButtons = newAd.buttons.filter((_, i) => i !== index);
    setNewAd({ ...newAd, buttons: newButtons });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.includes('video');
      setNewAd({ 
        ...newAd, 
        image: URL.createObjectURL(file), 
        file: file,
        type: isVideo ? 'video' : 'image'
      });
    }
  };

  // --- 2. СОХРАНЕНИЕ В ТАБЛИЦУ 'posts' ---
  const saveNewAd = async () => {
    if (!newAd.title) {
      return alert("Заповніть хоча б заголовок!");
    }

    setIsLoading(true);
    try {
      let publicUrl = null;
      let finalType = 'text';

      if (newAd.file) {
        const file = newAd.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('creatives') 
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('creatives')
          .getPublicUrl(fileName);
        
        publicUrl = urlData.publicUrl;
        finalType = newAd.type; 
      }

      const { data: insertedData, error: dbError } = await supabase
        .from('posts')
        .insert([{
          title: newAd.title,
          mainText: newAd.mainText,
          format: newAd.format,
          category: newAd.category,
          buttons: newAd.buttons.filter(b => b.trim() !== ''),
          geo: "🇺🇦 UA",
          platform: "Telegram",
          image: publicUrl,
          type: finalType
        }])
        .select();

      if (dbError) throw dbError;

      if (insertedData) setAds([insertedData[0], ...ads]);

      setIsModalOpen(false);
      setNewAd({ title: '', mainText: '', format: 'Публікація', category: 'Інше', buttons: ['Дізнатися більше'], image: null, file: null, type: 'text' });
      
    } catch (error: any) {
      alert('Помилка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAd = async (id, e) => {
    e.stopPropagation();
    if (confirm("Видалити оголошення?")) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) setAds(ads.filter(ad => ad.id !== id));
    }
  };

  const isVideoFile = (url: string, type: string) => {
    if (!url) return false;
    return type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
  };

  const filteredAds = ads.filter((ad) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = ad.title?.toLowerCase().includes(searchLow);
    const matchesCategory = categoryFilter === 'Всі' || ad.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky h-screen top-0">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-purple-600/5 rounded-xl flex items-center justify-center border border-purple-600/10">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg text-purple-600 uppercase leading-none">Absolute Spy</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">UA Analytics</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:bg-purple-700">
            <Plus size={18} /> Додати оголошення
          </button>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 px-1 tracking-widest">Категорії</p>
            <div className="relative">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none cursor-pointer">
                <option value="Всі">Всі категорії</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-4 text-gray-400" size={16} />
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white p-6 border-b border-gray-100 shadow-sm z-10 text-gray-400">
          <div className="max-w-4xl mx-auto relative group">
            <Search className="absolute left-5 top-4" size={20} />
            <input type="text" placeholder="Швидкий пошук за назвою..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc] no-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-purple-600 uppercase italic tracking-tighter">Стрічка Telegram</h2>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-400' : 'bg-purple-600'} animate-pulse`}></span> 
                 Знайдено: {filteredAds.length}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
              {filteredAds.map((ad) => (
                <div key={ad.id} onClick={() => setSelectedAd(ad)} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer relative flex flex-col">
                  <button onClick={(e) => deleteAd(ad.id, e)} className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {ad.image ? (
                      isVideoFile(ad.image, ad.type) ? (
                        <video src={ad.image} className="w-full h-full object-cover" muted loop onMouseEnter={(e:any) => e.target.play()} onMouseLeave={(e:any) => e.target.pause()} />
                      ) : (
                        <img src={ad.image} className="w-full h-full object-cover" alt="" />
                      )
                    ) : <FileText className="text-purple-600/20" size={40} />}
                    <div className="absolute top-4 left-4 z-10 bg-purple-600/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                      <Send size={10} className="text-white" />
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter">{ad.category}</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] bg-purple-600/5 px-3 py-1 rounded-full font-black text-purple-600 uppercase">{ad.format}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-6 line-clamp-2 leading-tight flex-1">{ad.title}</h3>
                    <button className="w-full py-3 bg-gray-50 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-purple-600 group-hover:text-white transition-all border border-purple-600/5 text-center">Аналізувати</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DETAILS */}
      {selectedAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative animate-in zoom-in duration-300 max-h-[90vh]">
            <button onClick={() => setSelectedAd(null)} className="absolute top-6 right-6 z-30 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X /></button>
            <div className="lg:w-1/2 bg-gray-950 flex items-center justify-center overflow-hidden">
              {selectedAd.image ? (
                isVideoFile(selectedAd.image, selectedAd.type) ? <video src={selectedAd.image} controls className="w-full h-full" autoPlay /> : <img src={selectedAd.image} className="w-full h-full object-contain" alt="" />
              ) : <div className="flex flex-col items-center gap-4 text-gray-500"><FileText size={80} /><span className="text-xs uppercase font-black">Тільки текст</span></div>}
            </div>
            <div className="lg:w-1/2 p-12 overflow-y-auto bg-white flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-purple-600/5 text-purple-600"><Send /></div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{selectedAd.title}</h2>
                  <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Telegram • {selectedAd.format} • {selectedAd.category}</p>
                </div>
              </div>
              <div className="space-y-8 flex-1">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><AlignLeft size={14}/> Текст оголошення</p>
                  <div className="p-7 bg-gray-50 rounded-[2rem] text-gray-700 leading-relaxed border border-gray-100 text-sm italic">{selectedAd.mainText || "Опис відсутній"}</div>
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

      {/* MODAL ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-purple-600 uppercase tracking-tighter">Новий Креатив</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative h-44 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-purple-600 transition-colors cursor-pointer group">
                {newAd.image ? (
                  newAd.type === 'video' ? <video src={newAd.image} className="w-full h-full object-cover" muted /> : <img src={newAd.image} className="w-full h-full object-cover" />
                ) : (
                  <> <Upload className="text-gray-300 group-hover:text-purple-600 mb-2" /> <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Завантажити медіа (опціонально)</span> </>
                )}
                <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Заголовок (Обов'язково)" value={newAd.title} onChange={(e) => setNewAd({...newAd, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
                <textarea placeholder="Текст повідомлення" value={newAd.mainText} onChange={(e) => setNewAd({...newAd, mainText: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all h-24 resize-none" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <p className="text-[9px] font-black uppercase text-gray-400 px-1">Формат</p>
                     <select value={newAd.format} onChange={(e) => setNewAd({...newAd, format: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none cursor-pointer">
                        <option value="Публікація">Пост</option>
                        <option value="Сторіз">Сторіз</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-black uppercase text-gray-400 px-1">Категорія</p>
                     <select value={newAd.category} onChange={(e) => setNewAd({...newAd, category: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none cursor-pointer">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                     </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                   <div className="flex items-center justify-between px-1">
                      <p className="text-[9px] font-black uppercase text-purple-600 tracking-widest">Кнопки ({newAd.buttons.length}/20)</p>
                      {newAd.buttons.length < 20 && (
                        <button onClick={addButton} className="text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
                           <PlusCircle size={14} /> <span className="text-[9px] font-black uppercase">Додати</span>
                        </button>
                      )}
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {newAd.buttons.map((btn, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                           <div className="flex-1 relative">
                              <input type="text" placeholder={`Кнопка ${idx + 1}`} value={btn} onChange={(e) => updateButton(idx, e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-purple-600/10 transition-all" />
                           </div>
                           {newAd.buttons.length > 1 && <button onClick={() => removeButton(idx)} className="p-2 text-gray-300 hover:text-red-500"><X size={16} /></button>}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50/50">
              <button onClick={saveNewAd} disabled={isLoading} className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:brightness-110 transition-all disabled:opacity-50">
                {isLoading ? 'Синхронізація...' : 'Опублікувати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}