
import React from 'react';
import { AvatarStyleId } from '../types';
import { ImageMinus, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StyleSelectorProps {
  selectedStyle: AvatarStyleId;
  onSelectStyle: (style: AvatarStyleId) => void;
  removeBackground: boolean;
  onToggleBackground: (remove: boolean) => void;
}

// Using DiceBear API to simulate different visual styles for the preview thumbnails
const STYLES: { 
  id: AvatarStyleId; 
  previewUrl: string;
}[] = [
  { 
    id: '3d', 
    previewUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sunny&backgroundColor=ffdfbf'
  },
  { 
    id: 'anime', 
    previewUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sunny&backgroundColor=ffd5dc'
  },
  { 
    id: 'clay', 
    previewUrl: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Sunny&backgroundColor=d1fae5'
  },
  { 
    id: 'flat', 
    previewUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunny&backgroundColor=dbeafe'
  },
  { 
    id: 'sketch', 
    previewUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sunny&backgroundColor=f3e8ff'
  },
  { 
    id: 'pixel', 
    previewUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Sunny&backgroundColor=e0e7ff'
  },
  { 
    id: 'watercolor', 
    previewUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Sunny&backgroundColor=ccfbf1'
  },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  selectedStyle, 
  onSelectStyle,
  removeBackground,
  onToggleBackground
}) => {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center px-1">
        <label className="text-sm font-bold text-slate-700">{t('style_label')}</label>
      </div>
      
      {/* Horizontal Scrollable List - Image Cards Layout */}
      <div className="flex gap-4 overflow-x-auto py-2 px-2 no-scrollbar -mx-2 snap-x">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className="group flex flex-col items-center gap-2 min-w-[84px] snap-start transition-transform active:scale-95"
              aria-label={`Select ${style.id} style`}
              aria-pressed={isSelected}
            >
              <div className={`
                relative w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm transition-all duration-300 bg-slate-50
                ${isSelected ? 'ring-[3px] ring-offset-2 ring-sun-500' : 'group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-slate-200'}
              `}>
                <img 
                  src={style.previewUrl} 
                  alt={`${style.id} preview`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Selection Indicator - Top Right Dot/Circle */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-sun-500 rounded-full border-2 border-white shadow-sm z-10" />
                )}
              </div>
              
              <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                {t(`styles.${style.id}`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Background Toggle */}
      <div 
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors group" 
        onClick={() => onToggleBackground(!removeBackground)}
      >
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors ${removeBackground ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
              {removeBackground ? <ImageMinus size={20} /> : <ImageIcon size={20} />}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 text-sm">{t('bg_label')}</span>
              <span className="text-xs text-slate-400">{removeBackground ? t('bg_remove') : t('bg_keep')}</span>
            </div>
         </div>
         
         <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${removeBackground ? 'bg-sun-500' : 'bg-slate-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${removeBackground ? 'translate-x-5' : 'translate-x-0'}`} />
         </div>
      </div>
    </div>
  );
};
