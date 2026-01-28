'use client';

import { Play, Star, FileText, Globe, ShieldCheck, Trash2 } from 'lucide-react';

interface AdCardProps {
  ad: any;
  isLocked: boolean;
  isFavorite: boolean;
  canPost: boolean; // Является ли юзер админом
  formatsList: any[];
  onClick: () => void;
  onToggleFavorite: (e: any) => void;
  onDelete: (e: any) => void;
}

export default function AdCard({ 
  ad, 
  isLocked, 
  isFavorite, 
  canPost, 
  formatsList, 
  onClick, 
  onToggleFavorite, 
  onDelete 
}: AdCardProps) {
  
  // Универсальная функция получения категорий (ищет и category, и categories)
  const getCategories = () => {
    const cats = ad.category || ad.categories;
    return Array.isArray(cats) ? cats : [];
  };

  const categories = getCategories();

  return (
    <div 
      onClick={onClick} 
      className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative flex flex-col h-auto"
    >
      
      {/* Кнопка удаления (для админа) */}
      {canPost && (
        <button 
          onClick={onDelete} 
          className="absolute top-3 right-3 z-30 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
      
      {/* Кнопка Избранного */}
      <button 
        onClick={onToggleFavorite}
        className={`absolute top-3 left-3 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm ${
          isFavorite 
            ? 'bg-yellow-400 text-white shadow-yellow-200 scale-110' 
            : 'bg-white/50 text-gray-400 hover:bg-white hover:text-yellow-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      
      {/* МЕДИА БЛОК (Картинка/Видео) */}
      <div className="bg-gray-50 relative flex items-center justify-center overflow-hidden aspect-video">
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
            <video src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className={`w-full h-full object-contain transition-all duration-500 ${isLocked ? 'blur-sm scale-110 grayscale-[50%]' : ''}`} muted />
          ) : (
            <img src={Array.isArray(ad.image) ? ad.image[0] : ad.image} className={`w-full h-full object-contain transition-all duration-500 ${isLocked ? 'blur-sm scale-110 grayscale-[50%]' : ''}`} alt="" />
          )
        ) : ( <div className="h-48 flex items-center justify-center w-full"><FileText className="text-purple-100" size={40} /></div> )}
      </div>

      {/* ИНФОРМАЦИЯ */}
      <div className="p-4 bg-white relative z-10 flex flex-col gap-2">
        <div className="flex justify-between items-start">
            
            <div className="flex flex-col gap-1.5 items-start">
               {/* Формат */}
               <div className="text-[9px] font-black text-purple-600 uppercase whitespace-nowrap bg-purple-50 px-1.5 py-0.5 rounded-md">
                 {formatsList.find(f => f.id === ad.format)?.label || ad.format}
               </div>

               {/* 🔥 КАТЕГОРИИ (ТЕГИ) 🔥 */}
               {categories.length > 0 && (
                 <div className="flex flex-wrap gap-1">
                   {categories.slice(0, 2).map((cat: any, i: number) => (
                     <span key={i} className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase whitespace-nowrap border border-blue-100">
                       {cat}
                     </span>
                   ))}
                   {categories.length > 2 && (
                     <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">+ {categories.length - 2}</span>
                   )}
                 </div>
               )}
            </div>

            {/* ГЕО */}
            <div className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
              <Globe size={8} className="inline mr-1"/>{ad.geo}
            </div>
        </div>
        
        <h3 className={`font-bold text-gray-800 text-sm line-clamp-2 leading-tight transition-all ${isLocked ? 'blur-[3px] select-none opacity-40' : ''}`}>
          {isLocked ? "Цей контент доступний у Premium підписці" : ad.title}
        </h3>
      </div>
    </div>
  );
}