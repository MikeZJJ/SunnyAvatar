
import React from 'react';
import { ProcessingStatus } from '../types';
import { Wand2, Film, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProcessingOverlayProps {
  status: ProcessingStatus;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ status }) => {
  const { t } = useLanguage();

  let icon = <Wand2 size={48} className="text-sun-600" />;
  let title = t('processing_avatar');
  let desc = t('processing_avatar_desc');

  switch (status) {
      case ProcessingStatus.GENERATING_GIF:
          icon = <Film size={48} className="text-sun-600" />;
          title = t('processing_gif');
          desc = t('processing_gif_desc');
          break;
      case ProcessingStatus.EDITING_IMAGE:
          icon = <Sparkles size={48} className="text-sun-600" />;
          title = t('processing_edit');
          desc = t('processing_edit_desc');
          break;
      case ProcessingStatus.GENERATING_VIDEO:
          icon = <Loader2 size={48} className="text-sun-600 animate-spin" />;
          title = t('processing_video');
          desc = t('processing_video_desc');
          break;
  }
  
  return (
    <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-sun-300 rounded-full animate-ping opacity-20"></div>
        <div className="relative bg-sun-100 p-6 rounded-full animate-bounce">
           {icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-black text-slate-800 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 max-w-xs animate-pulse">
        {desc}
      </p>
    </div>
  );
};
