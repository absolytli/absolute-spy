'use client';

import AdCard from './components/AdCard';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from './lib/supabase';
import Auth from './components/Auth'; 

// Об'єднаний імпорт іконок
import { 
  Sparkles, Menu, Search, Filter, X, ChevronDown, Star,
  Send, Play, Download, ChevronLeft, ChevronRight, Plus, Upload, Trash2,
  AlignLeft, MousePointer2, PlusCircle, FileText, Tag, Copy, Check, 
  Smartphone, MessageCircle, Mic, Share2, Globe, Camera, Smile, Layers, LogOut,
  User, LayoutDashboard, Settings, Database, ShieldCheck
} from 'lucide-react';

export default function Home() {
  // --- СТАНИ АВТОРИЗАЦІЇ ТА НАВІГАЦІЇ ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); 
  
  // --- СТАН МОБІЛЬНОГО МЕНЮ ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- ОСНОВНІ СТАНИ ---
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedAd, setSelectedAd] = useState<any>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const [profiles, setProfiles] = useState<any[]>([]); 
  const [userProfile, setUserProfile] = useState<any>(null); 
  const [favoriteIds, setFavoriteIds] = useState<any[]>([]); 
  const [activeNavigationList, setActiveNavigationList] = useState<any[]>([]); 

  // --- 📧 ПРИВ'ЯЗКА ПОШТИ ТА ПАРОЛЯ (HYBRID LOGIN) ---
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // --- СТАТИ ДЛЯ ОБ'ЄДНАННЯ АКАУНТІВ ---
  const [isMergeMode, setIsMergeMode] = useState(false); // Чи показувати форму вводу
  const [mergeEmail, setMergeEmail] = useState('');      // Сюди пишемо стару пошту
  const [mergePassword, setMergePassword] = useState(''); // Сюди пишемо старий пароль

  // --- 📱 СВАЙПИ ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  const onTouchStart = (e: any) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: any) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goToNextAd();
    if (isRightSwipe) goToPrevAd();
  };

  // --- 🧠 РОЗУМНІ КАТЕГОРІЇ ---
  const ALL_CATEGORIES = [
    "Гемблінг", "Беттінг", "Криптовалюта", "Вакансії", "Інвестиції", "Фінанси", 
    "E-commerce / Товари", "Здоров’я / Краса", "Освіта", 
    "Знайомства / Adult", "Бізнес / Заробіток", "Ігри", 
    "Послуги", "Нерухомість", "Авто", "Інше"
  ];

  const [displayCategories, setDisplayCategories] = useState<string[]>(ALL_CATEGORIES.slice(0, 5)); 
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const updateInterest = (category: string) => {
    if (!category || category === 'Всі') return;
    const saved = localStorage.getItem('category_scores');
    let scores = saved ? JSON.parse(saved) : {};
    scores[category] = (scores[category] || 0) + 1;
    localStorage.setItem('category_scores', JSON.stringify(scores));
    reorderCategories(scores);
  };

  const reorderCategories = (scores: any) => {
    const sorted = [...ALL_CATEGORIES].sort((a, b) => {
      const scoreA = scores[a] || 0;
      const scoreB = scores[b] || 0;
      return scoreB - scoreA; 
    });
    setDisplayCategories(sorted.slice(0, 5));
  };

  useEffect(() => {
    const saved = localStorage.getItem('category_scores');
    if (saved) reorderCategories(JSON.parse(saved));
  }, []);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const workSpheresList = [
    "Affiliate-маркетинг (Telegram)", "Арбітраж трафіку (Telegram)", "Гемблінг / Беттінг (Telegram)",
    "Крипто / Інвестиції (Telegram)", "E-commerce / Товари (Telegram)", "Новинні канали",
    "SMM / Адміністрування каналів", "Продюсування Telegram-каналів", "Креативи / Дизайн / Відео", "Інше"
  ];
  const ADMIN_EMAIL = "oleynik.igor.96@gmail.com"; 
  const MODERATORS = ["moderator@gmail.com", "partner@gmail.com"]; 
  const canPost = user?.email === ADMIN_EMAIL || MODERATORS.includes(user?.email);
  const categoriesList = ALL_CATEGORIES;

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
    category: 'Всі', format: 'Всі', language: 'Всі', geo: 'Всі', hasEmoji: false, hasButtons: false
  });

  const [newAd, setNewAd] = useState<any>({
    title: '', mainText: '', format: 'ImageText', categories: ['Інше'], 
    language: 'Українська', geo: 'Україна', hasEmoji: false, 
    buttons: ['Дізнатися більше'], image: null, file: null, files: [], type: 'text' 
  });

  // --- ⭐️ ФУНКЦІЯ ОПЛАТИ (TELEGRAM STARS) ---
  const handleBuyPro = async () => {
    if (!user) return alert("Спочатку увійдіть!");
    
    setIsLoading(true);
    try {
      // 1. Просимо наш сервер створити чек на 250 зірок
      const response = await fetch('/api/payment/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Absolute Spy PRO',
          description: 'Повний доступ на 1 місяць',
          payload: user.id, // Передаємо ID, щоб знати, кого оновити
          amount: 250 // Ціна в зірках (XTR)
        })
      });

      const data = await response.json();
      if (!data.invoiceLink) throw new Error("Не вдалося створити посилання");

      // 2. Відкриваємо вікно оплати прямо в Telegram
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.openInvoice(data.invoiceLink, (status: string) => {
          if (status === 'paid') {
            // Якщо оплата пройшла успішно — оновлюємо інтерфейс миттєво
            alert("🎉 Вітаємо! PRO активовано!");
            setUserProfile((prev: any) => ({ ...prev, subscription_tier: 'pro' }));
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        });
      } else {
        // Якщо відкрили з браузера (не з ТГ)
        window.open(data.invoiceLink, '_blank');
        setIsLoading(false);
      }

    } catch (error: any) {
      alert("Помилка: " + error.message);
      setIsLoading(false);
    }
  };

  // --- ЛОГІКА ПРИВ'ЯЗКИ EMAIL ---
  const handleLinkEmail = async () => {
    if (!newEmail.includes('@')) return alert("Введіть коректну пошту");
    setIsLoading(true);

    try {
      // 1. Відправляємо запит на зміну пошти (Прийде підтвердження)
      const { data, error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;

      // 2. Оновлюємо також таблицю профілів (візуально)
      await supabase.from('profiles').update({ email: newEmail }).eq('id', user.id);

      alert(`✅ Підтвердження відправлено на ${newEmail}!\n\nОБОВ'ЯЗКОВО перейдіть за посиланням у листі, щоб завершити прив'язку.`);
      setIsEditingEmail(false);
      setNewEmail('');
      
    } catch (error: any) {
      alert("Помилка: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ЛОГІКА ВСТАНОВЛЕННЯ ПАРОЛЯ ---
  const handleSetPassword = async () => {
    if (newPassword.length < 6) return alert("Пароль має бути мінімум 6 символів");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("✅ Пароль встановлено! Тепер ви можете входити на сайт за допомогою Email та цього пароля.");
      setNewPassword('');
    } catch (error: any) {
      alert("Помилка: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ФУНКЦІЯ ОБ'ЄДНАННЯ (LOGIN & LINK) ---
  const handleMergeAccount = async () => {
    if (!mergeEmail || !mergePassword) return alert("Заповніть пошту та пароль!");
    setIsLoading(true);

    try {
      // 1. Отримуємо дані з Telegram WebApp
      const tg = (window as any).Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;
      
      if (!tgUser) throw new Error("Відкрийте додаток через Telegram");

      // 2. Авторизуємо користувача в існуючий акаунт
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: mergeEmail,
        password: mergePassword,
      });

      if (loginError) throw loginError;

      // 3. Додаємо Telegram ID до цього акаунта в таблиці profiles
      const { error: updateError } = await supabase.from('profiles').update({
        telegram_id: tgUser.id,
        avatar_url: tgUser.photo_url,
        full_name: tgUser.first_name
      }).eq('id', data.user.id);

      if (updateError) throw updateError;

      alert("✅ Акаунти успішно синхронізовано!");
      window.location.reload(); // Оновлюємо, щоб підтягнути нову сесію

    } catch (error: any) {
      alert("Помилка: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramAuth = async (tgUser: any) => {
    try {
      const tgEmail = `tg_${tgUser.id}@absolutespy.com`;
      const tgPassword = `tg_pass_${tgUser.id}_secret_key`; 

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tgEmail,
        password: tgPassword,
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tgEmail,
          password: tgPassword,
          options: {
            data: {
              full_name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
              username: tgUser.username,
              avatar_url: tgUser.photo_url,
            }
          }
        });
        if (signUpError) throw signUpError;
        setUser(signUpData.user);
      } else {
        setUser(signInData.user);
      }

      await supabase.from('profiles').upsert({
        id: (signInData.user || (await supabase.auth.getUser()).data.user)?.id,
        email: tgEmail,
        telegram_id: tgUser.id,
        full_name: tgUser.first_name,
        avatar_url: tgUser.photo_url,
      });

    } catch (err: any) {
      console.error("ТГ Авторизація не вдалася:", err.message);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#ffffff');
        tg.setBackgroundColor('#f0f2f5');
        tg.enableClosingConfirmation();
        tg.HapticFeedback.impactOccurred('medium');

        const tgData = tg.initDataUnsafe?.user;
        if (tgData) await handleTelegramAuth(tgData);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    initApp();

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

  const fetchProfiles = async () => {
    if (user?.email !== ADMIN_EMAIL) return;
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setProfiles(data);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('favorites').select('post_id').eq('user_id', user.id);
    if (!error && data) setFavoriteIds(data.map((f: any) => f.post_id));
  };

  const toggleFavorite = async (postId: any, e: any) => {
    e.stopPropagation();
    if (!user) return alert("Будь ласка, авторизуйтесь");
    if (favoriteIds.includes(postId)) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('post_id', postId);
      if (!error) setFavoriteIds(prev => prev.filter(id => id !== postId));
    } else {
      const { error } = await supabase.from('favorites').insert([{ user_id: user.id, post_id: postId }]);
      if (!error) setFavoriteIds(prev => [...prev, postId]);
    }
  };

  const checkUserProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!error && data) {
      setUserProfile(data);
      if (!data.work_sphere) setShowOnboarding(true);
    }
  };

  const saveWorkSphere = async (sphere: any) => {
    try {
      const { error } = await supabase.from('profiles').update({ work_sphere: sphere }).eq('id', user.id);
      if (error) throw error;
      if (userProfile) setUserProfile({ ...userProfile, work_sphere: sphere });
      else setUserProfile({ id: user.id, work_sphere: sphere });
      setShowOnboarding(false); 
    } catch (error: any) { 
      console.error("Критична помилка збереження:", error.message);
      alert("Не вдалося зберегти дані. Перевірте консоль (F12).");
    }
  };
  
  useEffect(() => { 
    if (user) {
      fetchAds();
      fetchFavorites();
      checkUserProfile();
      if (user.email === ADMIN_EMAIL) fetchProfiles();
    }
  }, [user]);

  // --- ФІЛЬТРАЦІЯ ---
  const filteredList = ads.filter((ad: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (ad.title && ad.title.toLowerCase().includes(term)) || 
      (ad.mainText && ad.mainText.toLowerCase().includes(term)) ||
      (ad.description && ad.description.toLowerCase().includes(term));

    let matchesTopCategory = true;
    if (activeCategory) {
      let cats = ad.category || ad.categories;
      if (typeof cats === 'string') { try { cats = JSON.parse(cats); } catch { cats = [cats]; } }
      const safeCats = Array.isArray(cats) ? cats : [];
      matchesTopCategory = safeCats.some((c: string) => c.toLowerCase() === activeCategory.toLowerCase());
    }

    let matchesSidebarCategory = true;
    if (filters.category !== 'Всі') {
      let cats = ad.category || ad.categories;
      if (typeof cats === 'string') { try { cats = JSON.parse(cats); } catch { cats = [cats]; } }
      const safeCats = Array.isArray(cats) ? cats : [];
      matchesSidebarCategory = safeCats.some((c: string) => c.toLowerCase() === filters.category.toLowerCase());
    }

    let matchesGeo = true;
    if (filters.geo !== 'Всі') matchesGeo = ad.geo === filters.geo;
    return matchesSearch && matchesTopCategory && matchesSidebarCategory && matchesGeo;
  });

  const isPro = userProfile?.subscription_tier === 'pro';
  const filteredAds = filteredList;
  const viewableAds = filteredAds.filter((ad: any, index: number) => isPro || (index % 6 === 0));

  useEffect(() => {
    if (viewableAds.length > 0 && activeNavigationList.length === 0) {
      setActiveNavigationList(viewableAds);
    }
  }, [viewableAds]);

  const currentViewableIndex = selectedAd ? activeNavigationList.findIndex((a: any) => a.id === selectedAd.id) : -1;

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

  const saveNewAd = async () => {
    if (!newAd.title) return alert("Заповніть заголовок!");
    setIsLoading(true);
    
    try {
      let finalImageUrls = "";

      if (newAd.files && newAd.files.length > 0) {
        const uploadPromises = newAd.files.map(async (file: File) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            
            const { error } = await supabase.storage.from('creatives').upload(fileName, file);
            if (error) throw error;

            const { data: urlData } = supabase.storage.from('creatives').getPublicUrl(fileName);
            return urlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        finalImageUrls = urls.join(',');
      } else if (newAd.file) {
         const file = newAd.file;
         const fileName = `${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
         await supabase.storage.from('creatives').upload(fileName, file);
         const { data: urlData } = supabase.storage.from('creatives').getPublicUrl(fileName);
         finalImageUrls = urlData.publicUrl;
      }

      const activeButtons = newAd.buttons.filter((b: any) => b.trim() !== '');
      
      const { data, error } = await supabase.from('posts').insert([{
        title: newAd.title, 
        mainText: newAd.mainText, 
        format: newAd.files?.length > 1 ? 'Gallery' : (newAd.format || 'ImageText'),
        category: Array.from(new Set(newAd.categories)), 
        geo: newAd.geo,
        image: finalImageUrls, 
        type: newAd.type, 
        has_buttons: activeButtons.length > 0, 
        buttons: activeButtons
      }]).select();
      
      if (error) throw error;
      setAds([data[0], ...ads]);
      setIsModalOpen(false);
      setNewAd({ title: '', mainText: '', format: 'ImageText', categories: ['Інше'], 
        language: 'Українська', geo: 'Україна', hasEmoji: false, 
        buttons: ['Дізнатися більше'], image: null, file: null, files: [], type: 'text' 
      });
      alert('Успішно опубліковано!');

    } catch (error: any) { 
      alert("Помилка при збереженні: " + error.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleAdClick = async (ad: any, isLocked: any, source = 'feed') => {
    if (isLocked) {
      alert("🔒 Цей креатив доступний тільки в PRO версії!");
      return; 
    }
    
    setCurrentMediaIndex(0); 
    
    let cats = ad.category || ad.categories;
    if (typeof cats === 'string') { try { cats = JSON.parse(cats); } catch { cats = [cats]; } }
    const safeCategories = Array.isArray(cats) ? cats : [];
    safeCategories.forEach((c: string) => updateInterest(c));

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
    if (userProfile?.last_view_date !== today) currentCount = 0;

    if (currentCount >= 30) {
      alert("⚠️ Ви вичерпали ліміт (30 креативів) на сьогодні. Купіть PRO!");
      setSelectedAd(null);
      return;
    }
    const newCount = currentCount + 1;
    setUserProfile({ ...userProfile, daily_views_count: newCount, last_view_date: today });
    await supabase.from('profiles').update({ daily_views_count: newCount, last_view_date: today }).eq('id', user.id);
  };

  const toggleSubscription = async (userId: any, currentTier: any) => {
    const newTier = currentTier === 'pro' ? 'free' : 'pro';
    const { error } = await supabase.from('profiles').update({ subscription_tier: newTier }).eq('id', userId);
    if (!error) {
      setProfiles(prev => prev.map((p: any) => p.id === userId ? { ...p, subscription_tier: newTier } : p));
      if (userId === user?.id) setUserProfile((prev: any) => ({ ...prev, subscription_tier: newTier }));
    }
  };
  
  const deleteAd = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Ви впевнені, що хочете видалити цей креатив з бази назавжди?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) { throw error; }
      setAds(prev => prev.filter(ad => ad.id !== id));
      if (selectedAd?.id === id) { setSelectedAd(null); }
      console.log(`Креатив з ID ${id} успішно видалено`);
    } catch (error: any) {
      console.error('Full error object:', error);
      alert('Помилка при видаленні: ' + (error.message || 'Невідома помилка'));
    }
  };
  
  if (authLoading && !user) return <div className="min-h-screen bg-[#f0f2f5]" />;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans text-gray-900 overflow-x-hidden">
      
      {/* 1. --- 🍔 МОБІЛЬНЕ МЕНЮ (ШТОРКА) --- */}
      <div className={`fixed inset-0 z-[200] flex transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div className={`relative w-[85%] max-w-[320px] h-full bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col gap-2 transition-transform duration-300 transform shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white"><X size={24} /></button>

          {/* ЛОГО В МЕНЮ (КЛІКАБЕЛЬНЕ) */}
          <button onClick={() => { setActiveTab('feed'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 mb-10 px-2 group">
             <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white group-hover:scale-105 transition-transform">AS</div>
             <span className="text-white font-bold text-lg">Absolute Spy</span>
          </button>

          <Link href="/studio" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30 rounded-xl mb-4" onClick={() => setIsMobileMenuOpen(false)}>
            <Sparkles size={20} className="animate-pulse" />
            <span className="font-bold">AI Studio</span>
            <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">NEW</span>
          </Link>

          <button onClick={() => { setActiveTab('feed'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
            <LayoutDashboard size={20} /> Стрічка
          </button>

          <button onClick={() => { setActiveTab('favorites'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
            <Star size={20} /> Обране
          </button>

          <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
            <User size={20} /> Мій кабінет
          </button>

          {user?.email === ADMIN_EMAIL && (
            <button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white">
              <ShieldCheck size={20} /> Адмінка
            </button>
          )}

          {/* --- НОВИЙ БЛОК СИНХРОНІЗАЦІЇ --- */}
                    <div className="mt-8 p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-inner">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-600 text-white rounded-lg"><Globe size={18} /></div>
                        <h3 className="font-black text-blue-900 uppercase text-[10px] tracking-widest">Синхронізація з ПК</h3>
                      </div>

                      {!isMergeMode ? (
                        <button 
                          onClick={() => setIsMergeMode(true)}
                          className="w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase border border-blue-200 hover:shadow-lg transition-all"
                        >
                          У мене вже є акаунт на сайті
                        </button>
                      ) : (
                        <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                          <input 
                            type="email" 
                            placeholder="Ваш Email на сайті"
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                            value={mergeEmail}
                            onChange={(e) => setMergeEmail(e.target.value)}
                          />
                          <input 
                            type="password" 
                            placeholder="Ваш Пароль"
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                            value={mergePassword}
                            onChange={(e) => setMergePassword(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={handleMergeAccount} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Увійти та прив'язати</button>
                            <button onClick={() => setIsMergeMode(false)} className="px-4 py-3 bg-gray-200 text-gray-500 rounded-xl"><X size={18}/></button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* ------------------------------- */}

          <div className="mt-auto pt-6 border-t border-white/10">
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full">
              <LogOut size={20} /> Вийти
            </button>
          </div>
        </div>
      </div>


      {/* 2. --- SIDEBAR (ДЛЯ КОМП'ЮТЕРІВ) --- */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky h-screen top-0">
        
        {/* ЛОГО В SIDEBAR (КЛІКАБЕЛЬНЕ) */}
        <div className="p-6 border-b border-gray-100">
           <button onClick={() => setActiveTab('feed')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/10 group-hover:scale-105 transition-transform">
              <Send className="text-white" size={20} />
            </div>
            <span className="font-black text-lg text-purple-600 uppercase italic tracking-tighter leading-none">Absolute Spy</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <button onClick={() => setActiveTab('feed')} className={`w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'feed' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <LayoutDashboard size={18} /> Стрічка
          </button>
          
          <Link 
            href="/studio" 
            className="w-full p-4 mb-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all bg-gradient-to-r from-[#7000FF]/10 to-blue-600/10 text-[#7000FF] border border-[#7000FF]/20 hover:bg-[#7000FF] hover:text-white group"
          >
            <Sparkles size={18} className="group-hover:animate-spin-slow" />
            <span>AI Studio</span>
            <span className="ml-auto bg-[#7000FF] text-white px-2 py-0.5 rounded text-[9px] font-black group-hover:bg-white group-hover:text-[#7000FF]">
              NEW
            </span>
          </Link>

          <button onClick={() => setActiveTab('favorites')} className={`w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'favorites' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <Star size={18} /> Обране
            {favoriteIds.length > 0 && (
              <span className="ml-auto bg-purple-100 text-purple-600 px-2 py-0.5 rounded-md text-[9px] font-black">
                {favoriteIds.length}
              </span>
            )}
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
                <p className="text-[9px] font-bold text-gray-400 px-1 uppercase">🔹 Категорії</p>
                  <select value={filters.category} onChange={(e) => { setFilters({...filters, category: e.target.value}); updateInterest(e.target.value); }} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-20 lg:pb-0">
        
        {/* 3. --- Мобільна Шапка (Тільки на телефонах) --- */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
           <div className="flex items-center gap-2">
             {/* Кнопка Бургера 🍔 */}
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Menu size={24} />
             </button>
             {/* ЛОГО В ШАПЦІ (КЛІКАБЕЛЬНЕ) */}
             <button onClick={() => setActiveTab('feed')}>
               <span className="font-black text-lg text-purple-600 uppercase italic">Absolute Spy</span>
             </button>
           </div>
        </div>


        {activeTab === 'feed' ? (
          <>
            <header className="bg-white p-6 border-b border-gray-100 shadow-sm z-10 hidden lg:block">
              <div className="max-w-4xl mx-auto relative group">
                <Search className="absolute left-5 top-4 text-gray-300 group-focus-within:text-purple-600" size={20} />
                <input type="text" placeholder="Пошук..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-600/5 transition-all" />
              </div>
            </header>
            
            {/* Мобільний пошук */}
            <div className="lg:hidden p-4 bg-white border-b border-gray-100">
               <div className="relative">
                 <Search className="absolute left-4 top-3 text-gray-300" size={18} />
                 <input type="text" placeholder="Пошук..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 bg-gray-100 rounded-xl pl-10 pr-4 text-sm font-bold outline-none" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#f8f9fc] no-scrollbar">
              <div className="max-w-5xl mx-auto">
                
                {/* --- SMART KATEGORII --- */}
                <div className="w-full mb-6 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 min-w-max pb-2 px-1">
                    <button 
                      onClick={() => setActiveCategory(null)}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                        activeCategory === null 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Все
                    </button>
                    {displayCategories.map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => {
                          setActiveCategory(activeCategory === cat ? null : cat);
                          updateInterest(cat); 
                        }}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border whitespace-nowrap ${
                          activeCategory === cat 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

              {/* СІТКА КРЕАТИВІВ */}
                <div className="columns-2 md:columns-3 xl:columns-4 gap-4 px-2 pb-24">
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <div key={i} className="break-inside-avoid mb-4 bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
                        <div className="w-full aspect-[4/5] bg-gray-200 rounded-2xl mb-4 animate-pulse relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_1.5s_infinite]" />
                        </div>
                        <div className="flex gap-2 mb-4">
                          <div className="w-16 h-5 bg-gray-200 rounded-lg animate-pulse" />
                          <div className="w-10 h-5 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="w-3/4 h-6 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                        <div className="space-y-2 mb-5">
                          <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
                          <div className="w-5/6 h-3 bg-gray-200 rounded animate-pulse" />
                          <div className="w-4/6 h-3 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="w-full h-10 bg-gray-100 rounded-xl animate-pulse" />
                      </div>
                    ))
                  ) : (
                    filteredList.map((ad: any, index: number) => {
                      const isLocked = !isPro && (index % 6 !== 0);
                      return (
                        <div key={ad.id} className="break-inside-avoid mb-4">
                          <AdCard 
                            ad={ad}
                            isLocked={isLocked}
                            isFavorite={favoriteIds.includes(ad.id)}
                            canPost={canPost}
                            formatsList={formatsList}
                            onClick={() => handleAdClick(ad, isLocked, 'feed')}
                            onToggleFavorite={(e: any) => toggleFavorite(ad.id, e)}
                            onDelete={(e: any) => deleteAd(ad.id, e)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'favorites' ? (
          <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc] no-scrollbar animate-in fade-in duration-300">
            <header className="mb-8 max-w-5xl mx-auto flex items-center gap-4">
               <div className="w-12 h-12 bg-yellow-100 text-yellow-500 rounded-2xl flex items-center justify-center shadow-sm">
                 <Star size={24} fill="currentColor" />
               </div>
               <div>
                 <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Моя колекція</h1>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                   Збережені креативи: {favoriteIds.length}
                 </p>
               </div>
            </header>

            <div className="max-w-5xl mx-auto">
              {favoriteIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                  {ads.filter((ad: any) => favoriteIds.includes(ad.id)).map((ad: any) => {
                    return (
                      <AdCard 
                        key={ad.id}
                        ad={ad}
                        isLocked={false} 
                        isFavorite={true}
                        canPost={canPost}
                        formatsList={formatsList}
                        onClick={() => handleAdClick(ad, false, 'favorites')}
                        onToggleFavorite={(e: any) => toggleFavorite(ad.id, e)}
                        onDelete={(e: any) => deleteAd(ad.id, e)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                   <Star size={64} className="text-gray-200 mb-4" />
                   <h3 className="text-xl font-black text-gray-300 uppercase">Тут поки порожньо</h3>
                   <p className="text-gray-400 text-xs font-bold uppercase mt-2">Додавай креативи зі стрічки, щоб не загубити</p>
                   <button onClick={() => setActiveTab('feed')} className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-purple-700 transition-all">
                     Перейти до стрічки
                   </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#f8f9fc] no-scrollbar animate-in fade-in duration-500">
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
                    
                    {/* --- БЛОК EMAIL З МОЖЛИВІСТЮ ЗМІНИ --- */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-8 border-b border-gray-50">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Логін (Email)
                        </p>
                        
                        {isEditingEmail ? (
                          <div className="flex gap-2 mt-2">
                            <input 
                              type="email" 
                              placeholder="vash_email@gmail.com"
                              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none w-full max-w-[250px]"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <button onClick={handleLinkEmail} className="bg-green-500 text-white p-2 rounded-xl hover:bg-green-600 transition-colors">
                              <Check size={18} />
                            </button>
                            <button onClick={() => setIsEditingEmail(false)} className="bg-gray-200 text-gray-500 p-2 rounded-xl hover:bg-gray-300 transition-colors">
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800 break-all">
                              {user.email}
                            </p>
                            {/* Якщо пошта фейкова (починається на tg_), показуємо кнопку прив'язки */}
                            {user.email?.startsWith('tg_') && (
                              <span className="bg-yellow-100 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                                Тимчасова
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditingEmail && user.email?.startsWith('tg_') && (
                        <button 
                          onClick={() => setIsEditingEmail(true)} 
                          className="px-5 py-2.5 bg-blue-50 text-[9px] font-black uppercase rounded-xl text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <Globe size={14} /> Прив'язати Email
                        </button>
                      )}
                    </div>
                    
                    {/* --- БЛОК ВСТАНОВЛЕННЯ ПАРОЛЯ --- */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-8 border-b border-gray-50">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Пароль для сайту
                        </p>
                        <div className="flex gap-2 mt-2">
                           <input 
                              type="password" 
                              placeholder="Новий пароль (мін. 6 симв.)"
                              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none w-full max-w-[250px]"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                           <button onClick={handleSetPassword} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-purple-700 transition-colors">
                             Зберегти
                           </button>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-2">Встановіть пароль, щоб заходити з комп'ютера без Telegram.</p>
                      </div>
                    </div>
                    {/* --------------------------------- */}

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
                        <button 
                          onClick={handleBuyPro} 
                          disabled={isLoading}
                          className="px-5 py-2.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                        >
                          {isLoading ? 'Завантаження...' : 'Купити PRO (250 ⭐️)'}
                        </button>
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

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between w-full max-w-md mx-auto px-10 py-3">
            <button 
              onClick={() => {
                setActiveTab('feed');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <LayoutDashboard size={22} strokeWidth={activeTab === 'feed' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-wider">Головна</span>
            </button>

            {canPost && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform -translate-y-4 border-4 border-white"
              >
                <Plus size={28} />
              </button>
            )}

            <button 
              onClick={() => setActiveTab('favorites')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'favorites' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <Star size={22} fill={activeTab === 'favorites' ? "currentColor" : "none"} strokeWidth={2} />
              <span className="text-[9px] font-black uppercase tracking-wider">Обране</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-wider">Профіль</span>
            </button>
          </div>
        </div>
      </main>

      {/* --- МОДАЛКИ (БЕЗ ЗМІН) --- */}
      {selectedAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center lg:p-4 bg-black/95 backdrop-blur-md" onClick={() => setSelectedAd(null)}>
          {/* Навігація ПК */}
          <div className="hidden lg:flex fixed inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none justify-between px-8 z-[130]">
            {currentViewableIndex > 0 ? (
              <button onClick={(e) => { e.stopPropagation(); goToPrevAd(); }} className="pointer-events-auto p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10 group"><ChevronLeft size={48} className="group-hover:-translate-x-1 transition-transform" /></button>
            ) : <div />}
            {currentViewableIndex < activeNavigationList.length - 1 ? (
              <button onClick={(e) => { e.stopPropagation(); goToNextAd(); }} className="pointer-events-auto p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10 group"><ChevronRight size={48} className="group-hover:translate-x-1 transition-transform" /></button>
            ) : <div />}
          </div>

          <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="relative w-full lg:max-w-6xl h-full lg:h-[90vh] bg-white lg:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAd(null)} className="absolute top-4 right-4 z-[120] p-2 bg-black/20 backdrop-blur-md text-white rounded-full lg:hidden"><X size={20} /></button>

            {/* Медіа */}
            <div className="w-full lg:w-1/2 h-[45vh] lg:h-full bg-gray-950 flex items-center justify-center relative border-b lg:border-b-0 lg:border-r border-gray-100 group select-none">
              {(() => {
                const mediaUrls = selectedAd.image?.includes(',') 
                  ? selectedAd.image.split(',').map((url: string) => url.trim()).filter(Boolean)
                  : (selectedAd.image ? [selectedAd.image] : []);
                
                if (mediaUrls.length === 0) return <div className="text-gray-500 font-bold uppercase">Тільки текст</div>;
                const currentUrl = mediaUrls[currentMediaIndex] || mediaUrls[0];
                const isVideo = /\.(mp4|mov|avi|webm)$/i.test(currentUrl) || selectedAd.type === 'video';

                return (
                  <>
                    {isVideo ? (
                      <video key={currentUrl} src={currentUrl} className="w-full h-full object-contain" controls autoPlay muted playsInline />
                    ) : (
                      <img key={currentUrl} src={currentUrl} className="w-full h-full object-contain" alt="Ad Content" />
                    )}
                    {mediaUrls.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : mediaUrls.length - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 z-20"><ChevronLeft size={20} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev < mediaUrls.length - 1 ? prev + 1 : 0); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 z-20"><ChevronRight size={20} /></button>
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white tracking-widest z-20">{currentMediaIndex + 1} / {mediaUrls.length}</div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Інфо */}
            <div className="w-full lg:w-1/2 flex-1 overflow-y-auto bg-white flex flex-col p-5 md:p-10 no-scrollbar">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-purple-600 uppercase bg-purple-50 px-2.5 py-1 rounded-md">{selectedAd.format || 'Post'}</span>
                  <span className="text-[9px] font-black text-gray-500 uppercase bg-gray-50 px-2.5 py-1 rounded-md">{selectedAd.geo || 'World'}</span>
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{currentViewableIndex + 1} / {activeNavigationList.length}</div>
              </div>
              <h2 className="text-xl lg:text-3xl font-black text-gray-900 mb-4 leading-tight uppercase italic">{selectedAd.title}</h2>
              <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                <p className="text-gray-700 leading-relaxed font-medium text-sm whitespace-pre-wrap">{selectedAd.mainText || selectedAd.description}</p>
              </div>
              {selectedAd.buttons && Array.isArray(selectedAd.buttons) && selectedAd.buttons.length > 0 && (
                  <div className="flex flex-col gap-2 mb-6">
                      {selectedAd.buttons.map((btn: string, i: number) => (
                          <div key={i} className="w-full py-3 bg-white text-gray-800 rounded-xl font-bold text-center text-[10px] uppercase tracking-widest border border-gray-200 shadow-sm">{btn}</div>
                      ))}
                  </div>
              )}
              <div className="mt-auto pt-6 flex gap-2">
                <button className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-200"><Download size={16} /> Завантажити</button>
                {selectedAd.url && (
                  <a href={selectedAd.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Share2 size={16} /> Перейти</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 animate-in zoom-in max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black uppercase text-purple-600 italic text-xl">Новий креатив</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Заголовок</p><input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100" value={newAd.title} onChange={(e) => setNewAd({...newAd, title: e.target.value})} /></div>
              <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Текст посту</p><textarea className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-100 h-28" value={newAd.mainText} onChange={(e) => setNewAd({...newAd, mainText: e.target.value})} /></div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Категорії</p>
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-2xl min-h-[50px] border border-gray-100">
                  {newAd.categories.map((cat: any) => (
                    <span key={cat} className="bg-white border border-purple-100 text-purple-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">{cat} <button onClick={() => setNewAd({...newAd, categories: newAd.categories.filter((c: any) => c !== cat)})}><X size={10}/></button></span>
                  ))}
                  <select className="bg-transparent text-xs font-bold text-gray-500 outline-none w-full" onChange={(e) => { if (e.target.value && !newAd.categories.includes(e.target.value)) setNewAd({...newAd, categories: [...newAd.categories, e.target.value]}); e.target.value = ""; }}>
                    <option value="">+ Додати категорію</option>
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Кнопки (Enter)</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                     {newAd.buttons.map((btn: any, idx: number) => (
                        <span key={idx} className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">{btn}<button onClick={() => setNewAd({...newAd, buttons: newAd.buttons.filter((_: any, i: number) => i !== idx)})}><X size={12}/></button></span>
                     ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" id="btn-input" placeholder="Назва кнопки..." className="flex-1 bg-white p-2 rounded-xl text-xs font-bold border border-gray-200 outline-none" onKeyDown={(e: any) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setNewAd({...newAd, buttons: [...newAd.buttons, e.currentTarget.value.trim()]}); e.currentTarget.value = ''; } }} />
                    <button onClick={() => { const input = document.getElementById('btn-input') as HTMLInputElement; if (input && input.value.trim()) { setNewAd({...newAd, buttons: [...newAd.buttons, input.value.trim()]}); input.value = ''; } }} className="bg-gray-200 p-2 rounded-xl hover:bg-gray-300"><Plus size={16}/></button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><p className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Формат</p><select value={newAd.format} onChange={(e) => setNewAd({...newAd, format: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl font-bold text-xs">{formatsList.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                 <div><p className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">ГЕО</p><select value={newAd.geo} onChange={(e) => setNewAd({...newAd, geo: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl font-bold text-xs">{geoList.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              </div>
              <div className="relative pt-2">
                <input type="file" id="file-upload" className="hidden" multiple onChange={(e) => { if (e.target.files) { const filesArray = Array.from(e.target.files); setNewAd({ ...newAd, files: filesArray, file: filesArray[0] }); } }} />
                  <label htmlFor="file-upload" className={`w-full p-4 rounded-2xl font-bold border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer ${newAd.files?.length > 0 ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      <Upload size={20} /> {newAd.files?.length > 0 ? `Вибрано файлів: ${newAd.files.length}` : (newAd.file ? newAd.file.name : "Завантажити медіа")}
                  </label>
              </div>
              <button onClick={saveNewAd} disabled={isLoading} className="w-full py-4 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl mt-4">{isLoading ? 'Завантаження...' : 'ОПУБЛІКУВАТИ'}</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 text-center animate-in zoom-in shadow-2xl">
            <div className="text-5xl mb-4 animate-bounce">👋</div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">У якій сфері ти працюєш у Telegram?</h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {workSpheresList.map((sphere) => (
                <button key={sphere} onClick={() => saveWorkSphere(sphere)} className="w-full py-4 px-6 border-2 border-gray-50 rounded-2xl font-bold text-sm text-gray-600 hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 transition-all text-left flex justify-between items-center group">{sphere} <ChevronRight size={18} className="text-gray-200 group-hover:text-purple-600" /></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}