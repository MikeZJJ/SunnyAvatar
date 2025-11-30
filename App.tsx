
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Smile, History, X, ChevronRight, Plus } from 'lucide-react';
import { GeneratedImage, ProcessingStatus, AvatarStyleId } from './types';
import { generateAvatar, editAvatar, generateVideo } from './services/geminiService';
import { createGif } from './services/gifService';
import { CameraView } from './components/CameraView';
import { Gallery } from './components/Gallery';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { Header } from './components/Header';
import { ActionButton } from './components/ActionButton';
import { StyleSelector } from './components/StyleSelector';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { LoginView } from './components/LoginView';

const GUEST_DAILY_LIMIT = 10;

const App: React.FC = () => {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [view, setView] = useState<'home' | 'camera' | 'gallery'>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
  // Track if gallery has been loaded for current user to prevent overwriting
  const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
  
  // New State for configuration
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId>('3d');
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  
  // Guest usage state for UI
  const [guestUsage, setGuestUsage] = useState(0);

  // Load gallery from local storage on user change
  useEffect(() => {
    if (!user) {
        setGallery([]);
        setIsGalleryLoaded(false);
        return;
    }

    const storageKey = `sunny_gallery_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load gallery", e);
        setGallery([]);
      }
    } else {
        setGallery([]);
    }
    setIsGalleryLoaded(true);
    
    // Update guest usage UI
    if (user.id.startsWith('guest-')) {
        const today = new Date().toDateString();
        const usageData = JSON.parse(localStorage.getItem('guest_usage') || '{}');
        if (usageData.date === today) {
            setGuestUsage(usageData.count || 0);
        } else {
            setGuestUsage(0);
        }
    }
  }, [user]);

  // Save gallery when updated (only if loaded and user exists)
  useEffect(() => {
    if (user && isGalleryLoaded) {
        const storageKey = `sunny_gallery_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(gallery));
    }
  }, [gallery, user, isGalleryLoaded]);

  // Helper functions for Guest Limits
  const checkGuestLimit = (): boolean => {
      // If no user or not a guest, limit does not apply (Google login = unlimited)
      if (!user || !user.id.startsWith('guest-')) return true;

      const today = new Date().toDateString();
      const usageData = JSON.parse(localStorage.getItem('guest_usage') || '{}');

      // If stored date is different from today, reset logic handles in increment, 
      // but for checking, if date is different we assume 0 usage.
      if (usageData.date !== today) return true;

      if (usageData.count >= GUEST_DAILY_LIMIT) {
          setErrorMessage(`${t('error_limit_reached')}: ${t('error_limit_desc')}`);
          return false;
      }

      return true;
  };

  const incrementGuestUsage = () => {
      if (!user || !user.id.startsWith('guest-')) return;

      const today = new Date().toDateString();
      const usageData = JSON.parse(localStorage.getItem('guest_usage') || '{}');
      
      let newCount = 1;
      if (usageData.date === today) {
          newCount = (usageData.count || 0) + 1;
      }
      
      localStorage.setItem('guest_usage', JSON.stringify({ date: today, count: newCount }));
      setGuestUsage(newCount);
  };


  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setView('home');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id));
  };

  // Helper to extract readable error message
  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    // Handle nested error objects often returned by APIs
    if (err?.error?.message) return err.error.message;
    if (err?.toString) return err.toString();
    return t('error_generic');
  };

  const handleGenerate = async () => {
    if (!capturedImage) return;

    // Check limit
    if (!checkGuestLimit()) return;

    setStatus(ProcessingStatus.GENERATING_AVATAR);
    setErrorMessage(null);

    try {
      const base64Data = capturedImage.split(',')[1];
      const mimeType = capturedImage.split(';')[0].split(':')[1];
      
      const resultBase64 = await generateAvatar(base64Data, mimeType, selectedStyle, removeBackground);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: resultBase64,
        timestamp: Date.now(),
        style: selectedStyle,
        mediaType: 'image'
      };

      setGallery(prev => [newImage, ...prev]);
      setCapturedImage(null); 
      
      // Increment limit
      incrementGuestUsage();

      setStatus(ProcessingStatus.SUCCESS);
      setView('gallery');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(extractErrorMessage(err));
      setStatus(ProcessingStatus.ERROR);
    } finally {
      setTimeout(() => setStatus(ProcessingStatus.IDLE), 2000);
    }
  };

  // Logic for editing a single image
  const handleEditImage = async (id: string, prompt: string) => {
      // Check limit
      if (!checkGuestLimit()) return;

      const originalImage = gallery.find(img => img.id === id);
      if (!originalImage) return;

      setStatus(ProcessingStatus.EDITING_IMAGE);
      setErrorMessage(null);

      try {
          if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
          }

          const base64Data = originalImage.url.split(',')[1];
          const mimeType = originalImage.url.split(';')[0].split(':')[1] || 'image/png';

          const resultBase64 = await editAvatar(base64Data, mimeType, prompt);

          const newImage: GeneratedImage = {
              id: Date.now().toString(),
              url: resultBase64,
              timestamp: Date.now(),
              style: originalImage.style, 
              mediaType: 'image'
          };

          setGallery(prev => [newImage, ...prev]);
          
          // Increment limit
          incrementGuestUsage();

          setStatus(ProcessingStatus.SUCCESS);
      } catch (err: any) {
          console.error(err);
          setErrorMessage(extractErrorMessage(err));
          setStatus(ProcessingStatus.ERROR);
      } finally {
          setTimeout(() => setStatus(ProcessingStatus.IDLE), 2000);
      }
  };

  // Logic for creating GIF or Video
  const handleCreateGifOrVideo = async (selectedIds: string[], prompt?: string) => {
    if (selectedIds.length === 0) return;
    
    const selectedImages = gallery.filter(img => selectedIds.includes(img.id));

    if (prompt) {
        // Video Generation (Costs quota/money, so apply limit)
        if (!checkGuestLimit()) return;

        // Filter out any previously generated videos; Veo reference assets must be images.
        const validImages = selectedImages.filter(img => img.mediaType !== 'video' && img.url);
        
        if (validImages.length === 0) {
            setErrorMessage(t('error_select_images'));
            return;
        }

        setStatus(ProcessingStatus.GENERATING_VIDEO);
        setErrorMessage(null);
        try {
            if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    await (window as any).aistudio.openSelectKey();
                }
            }

            const imageUrls = validImages.map(img => img.url);
            const videoUrl = await generateVideo(imageUrls, prompt);
            
            const newImage: GeneratedImage = {
                id: Date.now().toString(),
                url: videoUrl,
                timestamp: Date.now(),
                mediaType: 'video' // Mark as video
            };
            setGallery(prev => [newImage, ...prev]);
            
            // Increment limit
            incrementGuestUsage();

            setVideoPreviewUrl(videoUrl);
            setStatus(ProcessingStatus.SUCCESS);
        } catch (err: any) {
            setErrorMessage(`${t('error_generic')} ${extractErrorMessage(err)}`);
            setStatus(ProcessingStatus.ERROR);
        } finally {
            setTimeout(() => setStatus(ProcessingStatus.IDLE), 2000);
        }

    } else {
        // GIF Generation (Client side, does not consume API, no limit needed)
        const validImages = selectedImages.filter(img => img.mediaType !== 'video' && img.url);
        
        if (validImages.length < 2) {
            setErrorMessage(t('error_select_images'));
            return;
        }

        const imageUrls = validImages.map(img => img.url);

        setStatus(ProcessingStatus.GENERATING_GIF);
        try {
            const gifBlob = await createGif(imageUrls);
            const gifUrl = URL.createObjectURL(gifBlob);
            
            // Optionally save the GIF to gallery? For now just preview.
            // setGallery(prev => [{...}, ...prev]); 

            setGifPreviewUrl(gifUrl);
            setStatus(ProcessingStatus.SUCCESS);
        } catch (err: any) {
            setErrorMessage(`${t('error_generic')} ${extractErrorMessage(err)}`);
            setStatus(ProcessingStatus.ERROR);
        } finally {
            setTimeout(() => setStatus(ProcessingStatus.IDLE), 2000);
        }
    }
  };

  const closePreview = () => {
      if (gifPreviewUrl) {
          URL.revokeObjectURL(gifPreviewUrl);
          setGifPreviewUrl(null);
      }
      if (videoPreviewUrl) {
          setVideoPreviewUrl(null);
      }
  };

  // Auth Loading State
  if (isAuthLoading) {
      return <div className="h-[100dvh] flex items-center justify-center bg-sun-50"><div className="animate-spin text-sun-500"><Sparkles size={48} /></div></div>;
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden relative">
      
      {!user ? (
        <LoginView />
      ) : (
        <>
            {/* If Camera is active, render it as an overlay independent of Header/Main */}
            {view === 'camera' && (
                <CameraView onCapture={handleCapture} onCancel={() => setView('home')} />
            )}

            {/* Main App Content - Only visible when not in camera mode to preserve state */}
            <div className={`flex flex-col flex-1 h-full overflow-hidden ${view === 'camera' ? 'hidden' : 'flex'}`}>
                <Header />
                
                <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                
                {/* Error Toast */}
                {errorMessage && (
                    <div className="absolute top-4 left-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50 animate-bounce">
                    <div className="flex justify-between items-center">
                        <p className="text-sm break-words">{errorMessage}</p>
                        <button onClick={() => setErrorMessage(null)} className="ml-2 flex-shrink-0"><X size={16} /></button>
                    </div>
                    </div>
                )}

                {view === 'home' && !capturedImage && (
                    <div className="flex-1 flex flex-col p-6 animate-fade-in space-y-8">
                        
                        {/* Hero Section */}
                        <div className="bg-gradient-to-br from-sun-100 to-white rounded-3xl p-6 shadow-sm border border-sun-100 flex flex-col items-center text-center space-y-4">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-1">
                                <Smile size={48} className="text-sun-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('welcome_user', {name: user.name.split(' ')[0]})}</h2>
                                <p className="text-slate-500 text-sm mt-1">{t('home_subtitle')}</p>
                            </div>
                        </div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button 
                                onClick={() => setView('camera')}
                                className="group flex flex-col items-center justify-center gap-3 bg-white hover:bg-sun-50 border-2 border-transparent hover:border-sun-200 aspect-square rounded-3xl shadow-sm transition-all active:scale-95"
                            >
                                <div className="p-4 bg-sun-100 text-sun-600 rounded-full group-hover:bg-sun-500 group-hover:text-white transition-colors">
                                    <Camera size={32} />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-sun-700">{t('btn_camera')}</span>
                            </button>
                            
                            <label className="group flex flex-col items-center justify-center gap-3 bg-white hover:bg-sky-50 border-2 border-transparent hover:border-sky-200 aspect-square rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer">
                                <div className="p-4 bg-sky-100 text-sky-500 rounded-full group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                    <ImageIcon size={32} />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-sky-700">{t('btn_upload')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* Recent History Preview */}
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <History size={18} className="text-sun-500"/>
                                    {t('gallery_title')}
                                </h3>
                                {gallery.length > 0 && (
                                    <button 
                                        onClick={() => setView('gallery')}
                                        className="text-xs font-bold text-slate-400 hover:text-sun-600 flex items-center gap-1"
                                    >
                                        {t('btn_history')} <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                            
                            {gallery.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
                                    <button 
                                        onClick={() => setView('camera')}
                                        className="shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-sun-400 hover:text-sun-500 transition-colors bg-white snap-start"
                                    >
                                        <Plus size={24} />
                                    </button>
                                    {gallery.slice(0, 5).map((img) => (
                                        <button 
                                            key={img.id}
                                            onClick={() => setView('gallery')}
                                            className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white snap-start transition-transform active:scale-95"
                                        >
                                            {img.mediaType === 'video' ? (
                                                <video src={img.url} className="w-full h-full object-cover pointer-events-none" />
                                            ) : (
                                                <img src={img.url} className="w-full h-full object-cover" alt="history" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm">{t('empty_gallery')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'home' && capturedImage && (
                    <div className="flex-1 flex flex-col p-6 animate-fade-in bg-white h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">{t('style_label')}</h2>
                            <button 
                                onClick={() => setCapturedImage(null)}
                                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden shadow-sm mb-6 aspect-square bg-slate-100 shrink-0">
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="mt-auto space-y-6">
                            <StyleSelector 
                                selectedStyle={selectedStyle} 
                                onSelectStyle={setSelectedStyle}
                                removeBackground={removeBackground}
                                onToggleBackground={setRemoveBackground}
                            />

                            <div className="space-y-2">
                                {/* Guest Usage Indicator */}
                                {user.id.startsWith('guest-') && (
                                    <div className="flex justify-center">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${guestUsage >= GUEST_DAILY_LIMIT ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {t('guest_usage', { count: guestUsage, limit: GUEST_DAILY_LIMIT })}
                                        </span>
                                    </div>
                                )}

                                <ActionButton 
                                    onClick={handleGenerate} 
                                    icon={<Sparkles size={24} />}
                                    label={t('btn_generate')}
                                    variant="primary"
                                    fullWidth
                                    className="shadow-xl shadow-sun-200"
                                    disabled={user.id.startsWith('guest-') && guestUsage >= GUEST_DAILY_LIMIT}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {view === 'gallery' && (
                    <Gallery 
                    images={gallery} 
                    onCreateGif={handleCreateGifOrVideo} 
                    onEditImage={handleEditImage}
                    onDeleteImage={handleDeleteImage}
                    onBack={() => setView('home')}
                    />
                )}

                </main>
            </div>

            {/* Preview Modal for GIF or Video */}
            {(gifPreviewUrl || videoPreviewUrl) && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-4 w-full max-w-sm flex flex-col items-center space-y-4 relative">
                    <button onClick={closePreview} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    <h3 className="text-xl font-bold text-sun-500 mt-2">
                        {videoPreviewUrl ? t('preview_video') : t('preview_gif')}
                    </h3>
                    
                    <div className="rounded-xl overflow-hidden shadow-inner border-2 border-slate-100 w-full bg-slate-100">
                        {videoPreviewUrl ? (
                            <video src={videoPreviewUrl} controls autoPlay loop className="w-full h-auto max-h-[60vh]" />
                        ) : (
                            <img src={gifPreviewUrl!} alt="Generated GIF" className="w-full h-auto" />
                        )}
                    </div>
                    
                    <a 
                        href={videoPreviewUrl || gifPreviewUrl!} 
                        download={`sunny-avatar-${Date.now()}.${videoPreviewUrl ? 'mp4' : 'gif'}`}
                        className="flex items-center justify-center gap-2 w-full bg-sun-500 text-white font-bold py-3 rounded-xl shadow hover:bg-sun-600 transition"
                    >
                        {videoPreviewUrl ? t('btn_download_video') : t('btn_download_gif')}
                    </a>
                </div>
                </div>
            )}

            {/* Loading Overlay */}
            {status !== ProcessingStatus.IDLE && status !== ProcessingStatus.SUCCESS && status !== ProcessingStatus.ERROR && (
                <ProcessingOverlay status={status} />
            )}
        </>
      )}
    </div>
  );
};

export default App;
