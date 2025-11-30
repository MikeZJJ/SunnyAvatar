
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Film, CheckCircle, Circle, Trash2, ArrowLeft, Wand2, Edit, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { useLanguage } from '../contexts/LanguageContext';

interface GalleryProps {
  images: GeneratedImage[];
  onCreateGif: (ids: string[], prompt?: string) => void; 
  onEditImage: (id: string, prompt: string) => void;
  onDeleteImage: (id: string) => void;
  onBack: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ images, onCreateGif, onEditImage, onDeleteImage, onBack }) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPromptDialog, setShowPromptDialog] = useState<boolean>(false);
  const [prompt, setPrompt] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'video' | 'gif'>('gif');
  
  // Changed from viewingImage object to index tracking for navigation
  const [viewingIndex, setViewingIndex] = useState<number>(-1);

  // Derived current image
  const viewingImage = viewingIndex >= 0 && viewingIndex < images.length ? images[viewingIndex] : null;

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Ensure index remains valid if images change (e.g. deletion)
  useEffect(() => {
    if (viewingIndex >= images.length && images.length > 0) {
      setViewingIndex(images.length - 1);
    } else if (images.length === 0 && viewingIndex !== -1) {
      setViewingIndex(-1);
    }
  }, [images.length, viewingIndex]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const deleteImage = (id: string) => {
    onDeleteImage(id);
    // If we delete the last image and we are at the end, the useEffect will handle index adjustment
    // If we delete the only image, useEffect handles closing
    if (images.length <= 1) {
        setViewingIndex(-1);
    }
  };

  const handleActionClick = (type: 'edit' | 'video' | 'gif') => {
      setActionType(type);
      setPrompt(''); 
      setShowPromptDialog(true);
  };

  const handleConfirmAction = () => {
      setShowPromptDialog(false);
      const ids = Array.from(selectedIds);
      
      if (actionType === 'edit' && ids.length === 1) {
          onEditImage(ids[0], prompt);
      } else if (actionType === 'video') {
          onCreateGif(ids, prompt); 
      } else if (actionType === 'gif') {
          onCreateGif(ids); 
      }
  };

  const handleInternalBack = () => {
      if (viewingImage) {
          setViewingIndex(-1);
      } else {
          onBack();
      }
  };

  // Navigation Logic
  const handleNext = () => {
    if (viewingIndex < images.length - 1) {
      setViewingIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (viewingIndex > 0) {
      setViewingIndex(prev => prev - 1);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  // If viewing an image, show Detail Layout
  if (viewingImage) {
      return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
             <div className="p-4 flex items-center gap-4 bg-white shadow-sm z-10 sticky top-0 shrink-0">
                <button 
                onClick={handleInternalBack} 
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
                >
                <ArrowLeft size={24} />
                </button>
                <h2 className="font-bold text-xl text-slate-800">{t('gallery_detail_title')}</h2>
                <div className="ml-auto text-sm text-slate-400 font-medium">
                  {viewingIndex + 1} / {images.length}
                </div>
            </div>

            {/* Content Container - No swipe handlers here to prevent interference with buttons */}
            <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto no-scrollbar">
                
                {/* Image Container - Swipe handlers moved here */}
                <div 
                  className="relative w-full aspect-square mb-6 shrink-0 max-w-md touch-pan-y"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                    {/* Navigation Buttons (Desktop/Accessible) */}
                    {viewingIndex > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
                      >
                        <ChevronLeft size={28} />
                      </button>
                    )}
                    
                    {viewingIndex < images.length - 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
                      >
                        <ChevronRight size={28} />
                      </button>
                    )}

                    <div 
                      key={viewingImage.id} // Key forces animation on change
                      className="w-full h-full rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white animate-fade-in select-none"
                    >
                      {viewingImage.mediaType === 'video' ? (
                          <video src={viewingImage.url} className="w-full h-full object-cover" controls autoPlay loop />
                      ) : (
                          <img src={viewingImage.url} alt="Detail" className="w-full h-full object-cover" />
                      )}
                    </div>
                </div>

                {/* Actions - Outside swipe container for reliable clicking */}
                <div className="w-full max-w-md flex flex-col gap-4 relative z-20">
                  <a 
                      href={viewingImage.url} 
                      download={`sunny_avatar_${viewingImage.id}.${viewingImage.mediaType === 'video' ? 'mp4' : 'png'}`}
                      className="w-full flex items-center justify-center gap-2 bg-sun-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-sun-600 transition active:scale-95"
                  >
                      <Download size={24} />
                      <span>{t('save_to_photos')}</span>
                  </a>

                  <div className="flex gap-4 w-full">
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              // Simple confirm dialog
                              if(window.confirm(t('delete_confirm'))) {
                                  deleteImage(viewingImage.id);
                              }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-500 font-bold rounded-2xl hover:bg-red-200 transition cursor-pointer active:scale-95"
                      >
                          <Trash2 size={20} />
                          <span>{t('btn_delete')}</span>
                      </button>
                  </div>
                </div>
            </div>
        </div>
      );
  }

  // Default Grid Layout
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      <div className="p-4 flex items-center gap-4 bg-white shadow-sm z-10 sticky top-0">
         <button 
           onClick={handleInternalBack} 
           className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
         >
           <ArrowLeft size={24} />
         </button>
         <h2 className="font-bold text-xl text-slate-800">{t('gallery_title')}</h2>
      </div>

      {images.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
           <Film size={48} className="mb-4 opacity-50" />
           <p>{t('empty_gallery')}</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4 pb-24">
           {images.map((img, index) => (
             <div 
                key={img.id} 
                className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-200 shadow-md transition-all ${selectedIds.has(img.id) ? 'ring-4 ring-sun-400 scale-95' : 'active:scale-95'}`}
                onClick={() => {
                    // If in selection mode, toggle. If not, open detail at specific index.
                    if (selectedIds.size > 0) {
                        toggleSelection(img.id);
                    } else {
                        setViewingIndex(index);
                    }
                }}
             >
                {img.mediaType === 'video' ? (
                     <video src={img.url} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                     <img src={img.url} alt="Gallery item" className="w-full h-full object-cover" />
                )}
                
                {/* Selection Circle */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(img.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full shadow-sm bg-black/20 backdrop-blur-sm"
                >
                    {selectedIds.has(img.id) ? (
                        <CheckCircle className="text-sun-400 bg-white rounded-full" size={24} />
                    ) : (
                        <Circle className="text-white" size={24} />
                    )}
                </button>
                
                {img.mediaType === 'video' && <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">{t('label_video')}</div>}
             </div>
           ))}
        </div>
      )}
      
      {/* Floating Action Bar for Selection */}
      {selectedIds.size > 0 && (
         <div className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center justify-between border border-sun-100 animate-slide-up z-20">
            <span className="font-bold text-slate-700 ml-2">{t('selected_count', { count: selectedIds.size })}</span>
            
            <div className="flex gap-2">
                {selectedIds.size === 1 && (
                    <button onClick={() => handleActionClick('edit')} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-sun-100 hover:text-sun-600">
                        <Edit size={20} />
                    </button>
                )}
                
                <button onClick={() => handleActionClick('video')} className="p-3 bg-sun-100 text-sun-600 rounded-xl hover:bg-sun-200">
                    <Wand2 size={20} />
                </button>
                
                <button onClick={() => handleActionClick('gif')} className="p-3 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200">
                    <Film size={20} />
                </button>

                <div className="w-px bg-slate-200 mx-1"></div>

                <button 
                   onClick={() => {
                       if(confirm(t('delete_confirm'))) {
                           selectedIds.forEach(id => onDeleteImage(id));
                           setSelectedIds(new Set());
                       }
                   }} 
                   className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"
                >
                    <Trash2 size={20} />
                </button>
            </div>
         </div>
      )}

      {/* Prompt Dialog */}
      {showPromptDialog && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {actionType === 'edit' ? t('dialog_edit_title') : t('dialog_video_title')}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                      {actionType === 'edit' ? t('dialog_edit_desc') : t('dialog_video_desc')}
                  </p>
                  
                  <textarea 
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-sun-400 outline-none min-h-[100px]"
                    placeholder={t('prompt_placeholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  
                  <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setShowPromptDialog(false)}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                      >
                          {t('btn_cancel')}
                      </button>
                      <button 
                        onClick={handleConfirmAction}
                        className="flex-1 py-3 bg-sun-500 text-white font-bold rounded-xl shadow-lg hover:bg-sun-600"
                      >
                          {actionType === 'edit' ? t('btn_generate_action') : t('btn_create')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
