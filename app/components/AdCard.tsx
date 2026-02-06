import { Star, Trash2, Lock, Play, AlignLeft, Quote, Smartphone, Layers, Smile, Mic, MessageCircle, Camera } from 'lucide-react';

interface AdCardProps {
  ad: any;
  isLocked?: boolean;
  isFavorite: boolean;
  canPost: boolean;
  formatsList?: any[];
  onClick: () => void;
  onToggleFavorite: (e: any) => void;
  onDelete: (e: any) => void;
}

export default function AdCard({ 
  ad, 
  isLocked = false, 
  isFavorite, 
  canPost, 
  formatsList = [], 
  onClick, 
  onToggleFavorite, 
  onDelete 
}: AdCardProps) {
  
  // 1. ТОЧНИЙ ПЕРЕКЛАД (як у меню додавання)
  const formatTranslations: Record<string, string> = {
    'Text': 'Текстовий пост',
    'ImageText': 'Картинка + текст',
    'Gallery': 'Галерея (2+)',
    'Video': 'Відео',
    'GIF': 'GIF',
    'Audio': 'Голосове',
    'Circle': 'Кружок',
    'Screenshot': 'Скріншот (виплата)'
  };

  // 🔥 ВИПРАВЛЕННЯ: Розбиваємо список посилань і беремо ПЕРШЕ для прев'ю
  const mediaList = ad.image ? (ad.image.includes(',') ? ad.image.split(',') : [ad.image]) : [];
  const previewUrl = mediaList[0] ? mediaList[0].trim() : null;
  
  // Перевіряємо, чи це галерея (більше 1 файлу)
  const isGallery = mediaList.length > 1;

  // 2. Перевіряємо, чи це відео (дивимось на ПЕРШИЙ файл)
  const isVideo = 
    ad.type === 'video' || 
    ad.format === 'Video' || 
    (previewUrl && /\.(mp4|mov|avi|webm)$/i.test(previewUrl));

  // 3. Перевіряємо, чи є картинка взагалі
  const hasImage = !!previewUrl && previewUrl.length > 5;

  // Отримуємо правильну іконку
  const getFormatIcon = (formatId: string) => {
    const found = formatsList.find(f => f.id === formatId);
    if (found) return found.icon;
    
    // Запасні іконки
    switch (formatId) {
      case 'Text': return <AlignLeft size={14}/>;
      case 'Video': return <Play size={14}/>;
      case 'Gallery': return <Layers size={14}/>;
      case 'Audio': return <Mic size={14}/>;
      case 'Circle': return <MessageCircle size={14}/>;
      case 'Screenshot': return <Camera size={14}/>;
      case 'GIF': return <Smile size={14}/>;
      default: return <Smartphone size={14}/>;
    }
  };

  // Парсинг категорій
  let categories: string[] = [];
  try {
    if (Array.isArray(ad.category)) {
      categories = ad.category;
    } else if (Array.isArray(ad.categories)) {
      categories = ad.categories;
    } else if (typeof ad.category === 'string') {
      categories = JSON.parse(ad.category);
    }
  } catch (e) {
    categories = ['Інше'];
  }
  const mainCategory = categories[0] || 'Інше';

  // Визначаємо текст бейджа
  const badgeLabel = formatTranslations[ad.format] || ad.format;

  return (
    <div 
      onClick={!isLocked ? onClick : undefined}
      className={`group relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isLocked ? 'opacity-80' : ''}`}
    >
      {/* --- ВЕРХНЯ ЧАСТИНА --- */}
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
        
        {isLocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/50 backdrop-blur-md z-10">
            <div className="bg-white/80 p-4 rounded-full shadow-lg mb-2">
              <Lock className="text-gray-400" size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Тільки PRO</span>
          </div>
        ) : (
          <>
            {isVideo ? (
               <div className="w-full h-full relative bg-black">
                 {/* Використовуємо previewUrl замість ad.image */}
                 <video 
                   src={previewUrl} 
                   className="w-full h-full object-cover opacity-90" 
                   muted 
                   loop 
                   playsInline
                   onMouseOver={e => e.currentTarget.play()}
                   onMouseOut={e => e.currentTarget.pause()}
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity bg-black/10">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                      <Play className="text-white fill-white" size={20} />
                    </div>
                 </div>
               </div>
            ) : hasImage ? (
               // Використовуємо previewUrl замість ad.image
               <img 
                 src={previewUrl} 
                 alt={ad.title}
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 loading="lazy"
               />
            ) : (
               // Стильна заглушка для Текстових постів
               <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <Quote className="absolute top-4 left-4 text-white/20 rotate-180" size={60} />
                  <Quote className="absolute bottom-4 right-4 text-white/20" size={60} />
                  <p className="text-white font-black text-lg line-clamp-5 leading-snug z-10 drop-shadow-md">
                    {ad.mainText || ad.description || ad.title}
                  </p>
                  <div className="mt-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Читати</span>
                  </div>
               </div>
            )}

            {(hasImage || isVideo) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            )}

            {/* ІКОНКА ГАЛЕРЕЇ (якщо є більше 1 фото) */}
            {isGallery && (
               <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md p-1.5 rounded-lg text-white">
                 <Layers size={14} />
               </div>
            )}
          </>
        )}

        {/* --- БЕЙДЖІ --- */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-20 max-w-[85%] flex-wrap">
          <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm whitespace-nowrap">
            {getFormatIcon(ad.format)}
            {badgeLabel}
          </span>
          {ad.geo && (
            <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10">
              {ad.geo}
            </span>
          )}
        </div>

        {canPost && (
          <button 
            onClick={onDelete}
            className="absolute bottom-3 right-3 p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-colors z-30 opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* --- НИЖНЯ ЧАСТИНА --- */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md">
            {mainCategory}
          </span>
          <button 
            onClick={onToggleFavorite}
            className={`transition-transform active:scale-90 ${isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
          </button>
        </div>

        <h3 className="font-black text-gray-900 text-sm leading-tight mb-2 line-clamp-2 uppercase italic">
          {ad.title}
        </h3>
        
        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed font-medium">
          {ad.mainText || ad.description}
        </p>
      </div>
    </div>
  );
}