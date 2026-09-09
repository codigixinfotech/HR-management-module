import { useEffect, useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallMobilePunch() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Android/Desktop Chrome install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  // Show if install prompt is available OR on iOS Safari
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100 rounded-2xl p-3.5 shadow-2xs text-slate-800 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900">Install Mobile Punch App</p>
              <p className="text-[10.5px] text-slate-500">Add to your home screen for 1-tap fast attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold h-7.5 px-3 rounded-lg shadow-xs gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </Button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  Tap the <strong className="text-slate-900">Share</strong> button in Safari's bottom toolbar:
                  <div className="inline-flex items-center gap-1 bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold ml-1">
                    <Share2 className="w-3 h-3 text-indigo-600" /> Share
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  Scroll down and tap:
                  <div className="inline-flex items-center gap-1 bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold ml-1">
                    <PlusSquare className="w-3 h-3 text-emerald-600" /> Add to Home Screen
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  Tap <strong className="text-slate-900">Add</strong> in the top-right corner. Mobile Punch will be added directly to your home screen!
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              onClick={() => setShowIosGuide(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
