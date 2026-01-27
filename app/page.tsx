'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from './lib/supabase';
import Auth from './components/Auth'; 
import { 
Search, Send, Play, Star, Download, ChevronDown, ChevronLeft, ChevronRight, Plus, X, Upload, Trash2,
  AlignLeft, MousePointer2, PlusCircle, FileText, Tag, Copy, Check, 
  Smartphone, MessageCircle, Mic, Share2, Globe, Camera, Smile, Layers, LogOut,
  User, LayoutDashboard, Settings, Database, ShieldCheck
} from 'lucide-react';

export default function Home() {
  // --- СТАНИ АВТОРИЗАЦІЇ ТА НАВІГАЦІЇ ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' або 'profile'

// --- ОСНОВНІ СТАНИ ---
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedAd, setSelectedAd] = useState<any>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState<any[]>([]);
const [copied, setCopied] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [profiles, setProfiles] = useState<any[]>([]); 
  const [userProfile, setUserProfile] = useState<any>(null); 
  const [favoriteIds, setFavoriteIds] = useState<any[]>([]); // Стан для збережених креативів ⭐️
  const [activeNavigationList, setActiveNavigationList] = useState<any[]>([]); // Список для гортання 🧭
  
  // --- СТАН ДЛЯ ПОПАПА ОНБОРДИНГУ ---
  const [showOnboarding, setShowOnboarding] = useState(false);

  const workSpheresList = [
    "Affiliate-маркетинг (Telegram)",
    "Арбітраж трафіку (Telegram)",
    "Гемблінг / Беттінг (Telegram)",
    "Крипто / Інвестиції (Telegram)",
    "E-commerce / Товари (Telegram)",
    "Новинні канали",
    "SMM / Адміністрування каналів",
    "Продюсування Telegram-каналів",
    "Креативи / Дизайн / Відео",
    "Інше"
  ];
  const ADMIN_EMAIL = "oleynik.igor.96@gmail.com"; 
  
  // Список пошт модераторів (через кому)
  const MODERATORS = ["moderator@gmail.com", "partner@gmail.com"]; 
  
  // Перевірка: чи має право користувач додавати пости?
  const canPost = user?.email === ADMIN_EMAIL || MODERATORS.includes(user?.email);
  
  const categoriesList = [
    "Гемблінг", "Беттінг", "Криптовалюта", "Інвестиції", "Фінанси", 
    "E-commerce / Товари", "Здоров’я / Краса", "Освіта", 
    "Знайомства / Adult", "Бізнес / Заробіток", "Ігри", 
    "Послуги", "Нерухомість", "Авто", "Інше"
  ];

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

  const [newAd, setNewAd] = useState<any>({
    title: '', mainText: '', format: 'ImageText', categories: ['Інше'], 
    language: 'Українська', geo: 'Україна', hasEmoji: false, 
    buttons: ['Дізнатися більше'], image: null, file: null, type: 'text' 
  });

  const emojiRegex = /\p{Extended_Pictographic}/u;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAds = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) setAds(data);
    } catch (error: any) { console.error('Помилка завантаження:', error.message); } 
    finally { setIsLoading(false); }
  };

  // --- ВОТ ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО ---
  const fetchProfiles = async () => {
    // Якщо пошта не збігається з адмінською — виходимо
    if (user?.email !== ADMIN_EMAIL) return;

    // Стукаємо в таблицю
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Якщо все гуд — записуємо в пам'ять
    if (!error && data) {
      setProfiles(data);
    }
  };
  // --- НОВІ ФУНКЦІЇ (ВСТАВЛЯТИ ПІСЛЯ fetchProfiles) ---
  // --- ЛОГІКА ОБРАНОГО ---
  const fetchFavorites = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setFavoriteIds(data.map((f: any) => f.post_id));
    }
  };

  const toggleFavorite = async (postId: any, e: any) => {
    e.stopPropagation(); // Щоб не відкривалася модалка при кліку на зірочку
    if (!user) return alert("Будь ласка, авторизуйтесь");

    if (favoriteIds.includes(postId)) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
      if (!error) setFavoriteIds(prev => prev.filter(id => id !== postId));
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, post_id: postId }]);
      if (!error) setFavoriteIds(prev => [...prev, postId]);
    }
  };

  // --- ОБНОВЛЕННЫЕ ФУНКЦИИ ---
  
  const checkUserProfile = async () => {
    if (!user) return;
    // Теперь запрашиваем ВСЕ данные профиля (*)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (!error && data) {
      setUserProfile(data); // Сохраняем профиль в память, чтобы показать в кабинете
      if (!data.work_sphere) setShowOnboarding(true); // Если сферы нет — показываем окно
    }
  };
const saveWorkSphere = async (sphere: any) => {
    try {
      console.log("Спроба зберегти сферу:", sphere); // Для перевірки в консолі

      const { error } = await supabase
        .from('profiles')
        .update({ work_sphere: sphere })
        .eq('id', user.id);

      if (error) {
        console.error("Помилка Supabase:", error);
        throw error;
      }
      
      console.log("Успішно збережено!");

      // 1. Оновлюємо профіль у пам'яті сайту (щоб з'явилося в кабінеті)
      if (userProfile) {
        setUserProfile({ ...userProfile, work_sphere: sphere });
      } else {
        // Якщо профіль ще не завантажився, створюємо тимчасовий
        setUserProfile({ id: user.id, work_sphere: sphere });
      }

      // 2. Закриваємо вікно
      setShowOnboarding(false); 

    } catch (error: any) {
      console.error("Критична помилка збереження:", error.message);
      alert("Не вдалося зберегти дані. Перевірте консоль (F12).");
    }
  };
  
  useEffect(() => { 
    if (user) {
      fetchAds(); // Завантажуємо оголошення для всіх
      fetchFavorites();
      checkUserProfile();

      // А це запускаємо ТІЛЬКИ якщо ти — адмін
      if (user.email === ADMIN_EMAIL) {
        fetchProfiles(); 
      }
    }
  }, [user]); // Сайт "прокинеться" кожного разу, коли змінюється статус юзера

// --- 1. ФІЛЬТРАЦІЯ ---
const filteredAds = ads.filter((ad: any) => {
  const searchLow = searchTerm.toLowerCase();
  const matchesSearch = ad.title?.toLowerCase().includes(searchLow) || ad.mainText?.toLowerCase().includes(searchLow);
  const matchesCategory = filters.category === 'Всі' || (Array.isArray(ad.category) && ad.category.includes(filters.category)) || (ad.category === filters.category);
  const matchesFormat = filters.format === 'Всі' || ad.format === filters.format;
  const matchesGeo = filters.geo === 'Всі' || ad.geo === filters.geo;

  return matchesSearch && matchesCategory && matchesFormat && matchesGeo;
});

// --- 2. ЛОГІКА ДОСТУПУ ТА СПИСКІВ ---
const isPro = userProfile?.subscription_tier === 'pro';
const viewableAds = filteredAds.filter((ad: any, index: number) => isPro || (index % 6 === 0));

// --- 2.1 АВТОМАТИЧНЕ ЗАПОВНЕННЯ СПИСКУ НАВІГАЦІЇ ---
useEffect(() => {
    if (viewableAds.length > 0 && activeNavigationList.length === 0) {
      setActiveNavigationList(viewableAds);
    }
}, [viewableAds]);


  // 3. Розумний індекс: шукаємо пост у ТОМУ списку, який зараз активний 🧭
  const currentViewableIndex = selectedAd ? activeNavigationList.findIndex((a: any) => a.id === selectedAd.id) : -1;

  // 4. Функції гортання тепер працюють з activeNavigationList
  const goToNextAd = useCallback(() => {
    if (currentViewableIndex < activeNavigationList.length - 1) {
      setSelectedAd(activeNavigationList[currentViewableIndex + 1]);
      setCurrentMediaIndex(0);
    }
  }, [currentViewableIndex, activeNavigationList]);

  const goToPrevAd = useCallback(() => {
    if (currentViewableIndex > 0) {
      setSelectedAd(activeNavigationList[currentViewableIndex - 1]);
      setCurrentMediaIndex(0);
    }
  }, [currentViewableIndex, activeNavigationList]);

  // 5. Слухач клавіатури
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (!selectedAd) return;
      if (e.key === 'ArrowRight') goToNextAd();
      if (e.key === 'ArrowLeft') goToPrevAd();
      if (e.key === 'Escape') setSelectedAd(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAd, goToNextAd, goToPrevAd]);

  // 6. Додаткові функції
  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- ВИПРАВЛЕНА ФУНКЦІЯ ЗБЕРЕЖЕННЯ (З GIST ВОНА БУЛА ОБІРВАНА) ---
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
      const activeButtons = newAd.buttons.filter((b: any) => b.trim() !== '');
      const { data, error } = await supabase.from('posts').insert([{
        title: newAd.title, mainText: newAd.mainText, format: newAd.format,
        category: Array.from(new Set(newAd.categories)), geo: newAd.geo,
        image: publicUrl, type: newAd.type, has_buttons: activeButtons.length > 0, buttons: activeButtons
      }]).select();
      
      if (error) throw error;
      setAds([data[0], ...ads]);
      setIsModalOpen(false);
      setNewAd({ title: '', mainText: '', format: 'ImageText', categories: ['Інше'], 
        language: 'Українська', geo: 'Україна', hasEmoji: false, 
        buttons: ['Дізнатися більше'], image: null, file: null, type: 'text' 
      });
    } catch (error: any) { 
      alert(error.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // --- ВИПРАВЛЕНА ФУНКЦІЯ (Вміє працювати з Favorites) ---
  const handleAdClick = async (ad: any, isLocked: any, source = 'feed') => {
    if (isLocked) {
      alert("🔒 Цей креатив доступний тільки в PRO версії!");
      return; 
    }

    // 1. Встановлюємо, що саме ми зараз гортаємо
    if (source === 'favorites') {
      const favoritesList = ads.filter((a: any) => favoriteIds.includes(a.id));
      setActiveNavigationList(favoritesList);
    } else {
      setActiveNavigationList(viewableAds);
    }

    setSelectedAd(ad);

    if (userProfile?.subscription_tier === 'pro') return;

    const today = new Date().toDateString(); 
    let currentCount = userProfile?.daily_views_count || 0;
    
    if (userProfile?.last_view_date !== today) {
      currentCount = 0;
    }

    if (currentCount >= 30) {
      alert("⚠️ Ви вичерпали ліміт (30 креативів) на сьогодні. Купіть PRO!");
      setSelectedAd(null);
      return;
    }

    const newCount = currentCount + 1;
    setUserProfile({ ...userProfile, daily_views_count: newCount, last_view_date: today });

    await supabase.from('profiles').update({ 
      daily_views_count: newCount,
      last_view_date: today
    }).eq('id', user.id);
  };

  const toggleSubscription = async (userId: any, currentTier: any) => {
    const newTier = currentTier === 'pro' ? 'free' : 'pro';
    console.log(`Попытка изменить статус для ${userId} на ${newTier}...`);
    const { error } = await supabase.from('profiles').update({ subscription_tier: newTier }).eq('id', userId);

    if (error) {
      alert("Ошибка базы данных: " + error.message);
    } else {
      console.log("Статус успешно обновлен в базе!");
      setProfiles(prev => prev.map((p: any) => p.id === userId ? { ...p, subscription_tier: newTier } : p));
      if (userId === user?.id) {
        setUserProfile((prev: any) => ({ ...prev, subscription_tier: newTier }));
      }
    }
  };
  
  const deleteAd = async (id: any, e: any) => {
    e.stopPropagation();
    if (confirm("Видалити?")) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) setAds(ads.filter((ad: any) => ad.id !== id));
    }
  };

  if (authLoading && !user) return <div className="min-h-screen bg-[#f0f2f5]" />;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky h-screen top-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/10">
             <Send className="text-white" size={20} />
          </div>
          <span className="font-black text-lg text-purple-600 uppercase italic tracking-tighter leading-none">Absolute Spy</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <button onClick={() => setActiveTab('feed')} className={`w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'feed' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <LayoutDashboard size={18} /> Стрічка
          </button>
          
          <button onClick={() => setActiveTab('profile')} className={`w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <User size={18} /> Мій кабінет
          </button>
          
          {user?.email === ADMIN_EMAIL && (
            <button onClick={() => setActiveTab('admin')} className={`w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <ShieldCheck size={18} /> Адмін-панель
            </button>
          )}

          <hr className="border-gray-50 my-4" />

          {activeTab === 'feed' && (
            <div className="space-y-6 px-2 animate-in fade-in slide-in-from-left-2 duration-300">
             {canPost && (
                <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                  <Plus size={18} /> Додати креатив
                </button>
              )}

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Фільтрація</h3>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Ніша</p>
                  <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                    <option value="Всі">Всі ніші</option>
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Географія</p>
                  <select value={filters.geo} onChange={(e) => setFilters({...filters, geo: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                    <option value="Всі">Весь світ</option>
                    {geoList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs uppercase shadow-inner">
                {user.email?.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-gray-900 truncate uppercase">{user.email.split('@')[0]}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Online</p>
                </div>
              </div>
           </div>
           <button onClick={() => supabase.auth.signOut()} className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2">
             <LogOut size={14} /> Вийти
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {activeTab === 'feed' ? (
          <>
            <header className="bg-white p-6 border-b border-gray-100 shadow-sm z-10">
              <div className="max-w-4xl mx-auto relative group">
                <Search className="absolute left-5 top-4 text-gray-300 group-focus-within:text-purple-600" size={20} />
                <input type="text" placeholder="Пошук..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc] no-scrollbar">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                  {filteredAds.map((ad: any, index: number) => {
                    const isLocked = !isPro && (index % 6 !== 0);
                    return (
                      <div key={ad.id} onClick={() => handleAdClick(ad, isLocked, 'feed')} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative flex flex-col h-auto">
                        
                        {canPost && (
                          <button onClick={(e) => {e.stopPropagation(); deleteAd(ad.id, e);}} className="absolute top-3 right-3 z-30 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        <button 
                          onClick={(e) => toggleFavorite(ad.id, e)}
                          className={`absolute top-3 left-3 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm ${
                            favoriteIds.includes(ad.id) 
                              ? 'bg-yellow-400 text-white shadow-yellow-200 scale-110' 
                              : 'bg-white/50 text-gray-400 hover:bg-white hover:text-yellow-400 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star size={16} fill={favoriteIds.includes(ad.id) ? "currentColor" : "none"} />
                        </button>
                        
                        <div className="bg-gray-50 relative flex items-center justify-center overflow-hidden">
                          {isLocked && (
                            <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/40 flex flex-col items-center justify-center text-center p-4">
                              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mb-2 shadow-lg animate-pulse">
                                <ShieldCheck size={24} />
                              </div>
                              <span className="font-black text-gray-900 text-[10px] uppercase tracking-widest bg-white px-3 py-1 rounded-lg shadow-sm">
                                Тільки PRO
                              </span>
                            </div>
                          )}

                          {ad.image ? (
                            ad.type === 'video' ? (
                              <video src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className={`w-full h-auto max-h-[500px] object-contain transition-all duration-500 ${isLocked ? 'blur-sm scale-110 grayscale-[50%]' : ''}`} muted />
                            ) : (
                              <img src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className={`w-full h-auto max-h-[500px] object-contain transition-all duration-500 ${isLocked ? 'blur-sm scale-110 grayscale-[50%]' : ''}`} alt="" />
                            )
                          ) : ( <div className="h-48 flex items-center justify-center w-full"><FileText className="text-purple-100" size={40} /></div> )}
                        </div>

                        <div className="p-4 bg-white relative z-10">
                          <div className="flex justify-between items-center mb-1">
                            {/* --- ДОБАВЛЕНО ОТОБРАЖЕНИЕ КАТЕГОРИЙ В КАРТОЧКЕ --- */}
                            <div className="flex flex-wrap gap-1 items-center">
                                <div className="text-[9px] font-black text-purple-600 uppercase">
                                  {formatsList.find(f => f.id === ad.format)?.label || ad.format}
                                </div>
                                {ad.category && Array.isArray(ad.category) && ad.category.slice(0, 2).map((cat: any, i: number) => (
                                   <span key={i} className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase">
                                     {cat}
                                   </span>
                                ))}
                            </div>
                            <div className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                              <Globe size={8} className="inline mr-1"/>{ad.geo}
                            </div>
                          </div>
                          
                          <h3 className={`font-bold text-gray-800 text-sm line-clamp-2 leading-tight transition-all ${isLocked ? 'blur-[3px] select-none opacity-40' : ''}`}>
                            {isLocked ? "Цей контент доступний у Premium підписці" : ad.title}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'profile' ? (
          <div className="flex-1 overflow-y-auto p-12 bg-[#f8f9fc] no-scrollbar animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Особистий кабінет</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Керування профілем та статистика активності</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><Database size={24}/></div>
                    <p className="text-3xl font-black text-gray-900 mb-1">{ads.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Креативів у базі</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Globe size={24}/></div>
                    <p className="text-3xl font-black text-gray-900 mb-1">{Array.from(new Set(ads.map((ad: any) => ad.geo))).length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Унікальних ГЕО</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck size={24}/></div>
                    <p className="text-3xl font-black text-gray-900 mb-1">{userProfile?.subscription_tier === 'pro' ? 'PRO' : 'FREE'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Тарифний план</p>
                </div>
              </div>

              {/* --- БЛОК ОБРАНОГО (FAVORITES) --- */}
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6 px-1">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" /> Моя колекція ({favoriteIds.length})
                  </h3>
                  {favoriteIds.length > 0 && (
                    <p className="text-[9px] font-bold text-gray-300 uppercase italic">Твої збережені ідеї</p>
                  )}
                </div>
                
                {favoriteIds.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ads.filter((ad: any) => favoriteIds.includes(ad.id)).map((ad: any) => (
                      <div key={ad.id} onClick={() => handleAdClick(ad, false, 'favorites')} className="aspect-[3/4] bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
                        <div className="w-full h-full relative">
                          {ad.type === 'video' ? (
                            <video src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" muted playsInline onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
                          ) : (
                            <img src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <p className="text-[8px] font-black text-white uppercase tracking-wider mb-1 line-clamp-1">{ad.title}</p>
                           <div className="flex items-center gap-1 text-white/80 font-bold text-[7px]">
                             <Play size={8} fill="currentColor" /> ДЕТАЛЬНІШЕ
                           </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(ad.id, e); }} className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border-2 border-dashed border-gray-100 rounded-[3rem] text-center bg-gray-50/30">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star size={24} className="text-gray-200" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Тут поки порожньо</p>
                  </div>
                )}
              </div>

              {/* --- ЛІЧИЛЬНИК ЛІМІТІВ --- */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 mb-8 relative overflow-hidden group">
                {userProfile?.subscription_tier === 'pro' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
                )}

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Доступ на сьогодні</p>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                      {userProfile?.subscription_tier === 'pro' ? (
                        <span className="text-purple-600">💎 Unlimited Access</span>
                      ) : (
                        <span>{userProfile?.daily_views_count || 0} <span className="text-gray-300">/ 30</span> Креативів</span>
                      )}
                    </h3>
                  </div>
                  
                  {userProfile?.subscription_tier !== 'pro' && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Залишилось</p>
                      <p className="text-lg font-black text-gray-900 leading-none">
                        {Math.max(0, 30 - (userProfile?.daily_views_count || 0))}
                      </p>
                    </div>
                  )}
                </div>

                {userProfile?.subscription_tier !== 'pro' ? (
                  <div className="space-y-3">
                    <div className="w-full h-4 bg-gray-50 rounded-full border border-gray-100 p-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${Math.min(100, ((userProfile?.daily_views_count || 0) / 30) * 100)}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase text-center tracking-widest">
                      Оновлення лімітів щоночі о 00:00
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Всі обмеження знято</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                    <Settings className="text-gray-400" size={20} />
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Параметри користувача</h3>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-8 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Логін (Email)</p>
                        <p className="text-sm font-bold text-gray-800">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-8 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Сфера діяльності</p>
                        <p className="text-sm font-bold text-gray-800">{userProfile?.work_sphere || 'Не вказано'}</p>
                      </div>
                      <button onClick={() => setShowOnboarding(true)} className="px-5 py-2.5 bg-gray-50 text-[9px] font-black uppercase rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Змінити</button>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-8 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ваш статус</p>
                        <p className={`text-sm font-bold ${userProfile?.subscription_tier === 'pro' ? 'text-purple-600' : 'text-gray-800'}`}>
                          {userProfile?.subscription_tier === 'pro' ? '💎 Преміум доступ' : '🆓 Безкоштовний план'}
                        </p>
                      </div>
                      {userProfile?.subscription_tier !== 'pro' && (
                        <button className="px-5 py-2.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">Купити PRO</button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Акаунт</p>
                        <p className="text-sm font-bold text-gray-800">Ви авторизовані</p>
                      </div>
                      <button onClick={() => supabase.auth.signOut()} className="px-5 py-2.5 bg-red-50 text-[9px] font-black uppercase rounded-xl text-red-600 hover:bg-red-100 transition-colors">Вийти з акаунта</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'admin' ? (
          <div className="flex-1 overflow-y-auto p-12 bg-[#f8f9fc] no-scrollbar">
            <div className="max-w-6xl mx-auto">
              <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Admin Control</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Керування користувачами ({profiles.length})</p>
              </header>

              <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Користувач (Email)</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Тариф</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Сфера</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Контакти</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {profiles.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-6 text-sm font-bold text-gray-800">{p.email}</td>
                        <td className="p-6">
                          <button 
                            onClick={() => toggleSubscription(p.id, p.subscription_tier)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                              p.subscription_tier === 'pro' 
                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {p.subscription_tier === 'pro' ? '💎 PRO' : 'Free'}
                          </button>
                        </td>
                        <td className="p-6 text-[10px] font-bold text-gray-500">
                          <span className="bg-gray-50 px-2 py-1 rounded-lg">{p.work_sphere || '—'}</span>
                        </td>
                        <td className="p-6">
                           <p className="text-[9px] font-black text-purple-600 uppercase leading-none mb-1">{p.contact_method || '—'}</p>
                           <p className="text-xs font-bold text-gray-900">{p.contact_handle || '—'}</p>
                        </td>
                        <td className="p-6 text-[10px] font-bold text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {profiles.length === 0 && (
                  <div className="p-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">Користувачів поки немає</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* --- МОДАЛКИ (ВСТАВЛЕНІ ПРАВИЛЬНО ПІСЛЯ MAIN) --- */}
      
      {/* 1. Деталі креативу */}
      {selectedAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          
          {/* Кнопка НАЗАД */}
          {currentViewableIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); goToPrevAd(); }} 
              className="absolute left-4 md:left-8 z-[120] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group hidden sm:block"
            >
              <ChevronLeft size={40} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative animate-in zoom-in duration-300 max-h-[90vh]">
            <button onClick={() => setSelectedAd(null)} className="absolute top-6 right-6 z-30 p-3 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X /></button>
            
            <div className="lg:w-1/2 bg-gray-950 flex items-center justify-center">
              {(() => {
                const media = Array.isArray(selectedAd.image) ? selectedAd.image : (selectedAd.image ? [selectedAd.image] : []);
                const currentFile = media[currentMediaIndex];
                if (media.length === 0) return <div className="text-gray-500 font-bold uppercase">Тільки текст</div>;
                return selectedAd.type === 'video' ? (
                  <video src={currentFile} controls className="w-full h-full object-contain" autoPlay key={currentFile} />
                ) : (
                  <img src={currentFile} className="w-full h-full object-contain" alt="" key={currentFile} />
                );
              })()}
            </div>

            <div className="lg:w-1/2 p-12 overflow-y-auto bg-white flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full">{selectedAd.format}</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase bg-gray-50 px-3 py-1 rounded-full">{selectedAd.geo}</span>
                </div>
                {/* ЛІЧИЛЬНИК (виправлено) */}
                <div className="text-[10px] font-bold text-gray-300 uppercase bg-gray-50 px-3 py-1 rounded-full">
                  {currentViewableIndex + 1} / {activeNavigationList.length}
                </div>
              </div>

               {/* --- КАТЕГОРИИ (ТЕГИ) --- */}
              {((selectedAd.category && Array.isArray(selectedAd.category)) || (selectedAd.categories && Array.isArray(selectedAd.categories))) && (
                 <div className="flex flex-wrap gap-2 mb-4">
                    {(selectedAd.category || selectedAd.categories).map((cat: any, i: number) => (
                       <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                         #{cat}
                       </span>
                    ))}
                 </div>
              )}

              <h2 className="text-2xl font-black text-gray-900 uppercase italic mb-6 leading-tight">{selectedAd.title}</h2>
              <div className="p-8 bg-gray-50 rounded-[2rem] text-sm whitespace-pre-wrap leading-relaxed flex-1 border border-gray-100">
                {selectedAd.mainText || "Опис відсутній"}
              </div>

              {/* --- ДОДАНО: КНОПКИ --- */}
              {selectedAd.buttons && Array.isArray(selectedAd.buttons) && selectedAd.buttons.length > 0 && (
                 <div className="space-y-2 mt-4">
                    {selectedAd.buttons.map((btn: any, idx: number) => (
                       <div key={idx} className="w-full py-3 bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/20 rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-[#2AABEE] hover:text-white transition-all shadow-sm">
                          {btn} <MousePointer2 size={14} />
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </div>

          {/* Кнопка ВПЕРЕД (виправлено умову) */}
          {currentViewableIndex < activeNavigationList.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); goToNextAd(); }} 
              className="absolute right-4 md:right-8 z-[120] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group hidden sm:block"
            >
              <ChevronRight size={40} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* 2. Додавання креативу (MAX VERSION) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 animate-in zoom-in max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black uppercase text-purple-600 italic text-xl">Новий креатив</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X /></button>
            </div>

            <div className="space-y-4">
              {/* Заголовок */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Заголовок</p>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100 focus:border-purple-200 transition-colors" 
                  value={newAd.title}
                  onChange={(e) => setNewAd({...newAd, title: e.target.value})} 
                />
              </div>
              
              {/* Текст */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Текст посту</p>
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100 h-28 focus:border-purple-200 transition-colors" 
                  value={newAd.mainText}
                  onChange={(e) => setNewAd({...newAd, mainText: e.target.value})} 
                />
              </div>

              {/* Мульти-вибір категорій */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Категорії (Можна декілька)</p>
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-2xl min-h-[50px] border border-gray-100">
                  {newAd.categories.map((cat: any) => (
                    <span key={cat} className="bg-white border border-purple-100 text-purple-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                      {cat}
                      <button onClick={() => setNewAd({...newAd, categories: newAd.categories.filter((c: any) => c !== cat)})} className="hover:text-red-500"><X size={10}/></button>
                    </span>
                  ))}
                  <select 
                    className="bg-transparent text-xs font-bold text-gray-500 outline-none w-full mt-1" 
                    onChange={(e) => {
                      if (e.target.value && !newAd.categories.includes(e.target.value)) {
                        setNewAd({...newAd, categories: [...newAd.categories, e.target.value]});
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">+ Додати категорію</option>
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Додавання кнопок */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Кнопки (Enter щоб додати)</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                     {newAd.buttons.map((btn: any, idx: number) => (
                        <span key={idx} className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                          {btn}
                          <button onClick={() => setNewAd({...newAd, buttons: newAd.buttons.filter((_: any, i: number) => i !== idx)})}><X size={12}/></button>
                        </span>
                     ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="btn-input"
                      placeholder="Назва кнопки..." 
                      className="flex-1 bg-white p-2 rounded-xl text-xs font-bold border border-gray-200 outline-none"
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setNewAd({...newAd, buttons: [...newAd.buttons, e.currentTarget.value.trim()]});
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('btn-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setNewAd({...newAd, buttons: [...newAd.buttons, input.value.trim()]});
                          input.value = '';
                        }
                      }}
                      className="bg-gray-200 p-2 rounded-xl hover:bg-gray-300"
                    >
                      <Plus size={16}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Вибір параметрів (Формат, ГЕО) */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1">Формат</p>
                    <select value={newAd.format} onChange={(e) => setNewAd({...newAd, format: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100 text-xs">
                        {formatsList.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1">ГЕО</p>
                    <select value={newAd.geo} onChange={(e) => setNewAd({...newAd, geo: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100 text-xs">
                        {geoList.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
              </div>

              {/* Завантаження файлу */}
              <div className="relative pt-2">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={(e) => setNewAd({...newAd, file: e.target.files ? e.target.files[0] : null})} 
                  />
                  <label htmlFor="file-upload" className={`w-full p-4 rounded-2xl font-bold border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all ${newAd.file ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>
                      <Upload size={20} />
                      {newAd.file ? newAd.file.name : "Завантажити медіа (Фото/Відео)"}
                  </label>
              </div>

              {/* Кнопка відправки */}
              <button onClick={saveNewAd} disabled={isLoading} className="w-full py-4 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20 hover:brightness-110 transition-all mt-4">
                {isLoading ? 'Збереження...' : 'ОПУБЛІКУВАТИ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Онбординг (Сфера діяльності) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 text-center animate-in zoom-in shadow-2xl">
            <div className="text-5xl mb-4 animate-bounce">👋</div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">У якій сфері ти працюєш у Telegram?</h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {workSpheresList.map((sphere) => (
                <button key={sphere} onClick={() => saveWorkSphere(sphere)} className="w-full py-4 px-6 border-2 border-gray-50 rounded-2xl font-bold text-sm text-gray-600 hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 transition-all text-left flex justify-between items-center group">
                  {sphere}
                  <ChevronRight size={18} className="text-gray-200 group-hover:text-purple-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}