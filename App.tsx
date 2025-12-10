import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import StyleSelector, { STYLES } from './components/StyleSelector';
import { AppState, StyleOption, AnalysisResult, GenerationResult } from './types';
import { analyzeImage, transformImage } from './services/geminiService';
import { ArrowRight, Loader2, Sparkles, Wand2, Search, Download, RefreshCw, X, BrainCircuit, Palette, Image as ImageIcon, Columns, ArrowLeftRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult>({ text: '', loading: false });
  
  // Generation State
  const [generation, setGeneration] = useState<GenerationResult>({ imageUrl: null, loading: false });
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI...");

  // View Mode State
  const [viewMode, setViewMode] = useState<'result' | 'compare' | 'original'>('result');
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeAction, setActiveAction] = useState<'none' | 'pan' | 'slide'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Mouse position at start
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });   // Pan value at start
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Cycle loading messages
  useEffect(() => {
    if (!generation.loading) return;
    const messages = [
       "Analyzing image composition...",
       "Identifying key subjects...",
       "Mixing artistic palette...",
       "Applying style transformation...",
       "Enhancing details...",
       "Finalizing masterpiece..."
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [generation.loading]);

  // Reset zoom/pan when view/image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [viewMode, generation.imageUrl, selectedImage]);

  const handleAnalyze = async (imageInput?: string | React.MouseEvent) => {
    // Check if called with a string (auto-analyze) or event (button click)
    const imageToAnalyze = (typeof imageInput === 'string') ? imageInput : selectedImage;
    
    if (!imageToAnalyze) return;

    setAnalysis({ text: '', loading: true });
    try {
      const result = await analyzeImage(imageToAnalyze);
      setAnalysis({ text: result, loading: false });
    } catch (err: any) {
      setAnalysis({ text: '', loading: false, error: err.message });
    }
  };

  const handleImageSelected = (base64: string) => {
    setSelectedImage(base64);
    setAppState(AppState.EDIT);
    // Reset states
    setGeneration({ imageUrl: null, loading: false });
    setViewMode('result');
    
    // Auto start analysis
    handleAnalyze(base64);
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setSelectedImage(null);
    setSelectedStyle(STYLES[0]);
    setGeneration({ imageUrl: null, loading: false });
    setAnalysis({ text: '', loading: false });
    setCustomPrompt('');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setGeneration({ imageUrl: null, loading: true });
    
    let promptToUse = customPrompt.trim();
    if (!promptToUse && selectedStyle) {
      promptToUse = selectedStyle.prompt;
    }
    
    if (!promptToUse) {
        promptToUse = "Enhance this image";
    }

    try {
      const resultBase64 = await transformImage(selectedImage, promptToUse);
      setGeneration({ imageUrl: resultBase64, loading: false });
      setViewMode('result'); // Reset view to result on new generation
      setSliderPosition(50);
    } catch (err: any) {
      setGeneration({ imageUrl: null, loading: false, error: err.message });
    }
  };

  // --- Zoom & Pan Logic ---

  const handleWheel = (e: React.WheelEvent) => {
    if (!generation.imageUrl) return;
    e.preventDefault(); // Stop page scroll
    e.stopPropagation();

    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    
    setZoom(newZoom);
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };

  const getClientX = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return e.touches[0].clientX;
    }
    return (e as React.MouseEvent).clientX;
  };

  const getClientY = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return e.touches[0].clientY;
    }
    return (e as React.MouseEvent).clientY;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!generation.imageUrl || !imageContainerRef.current) return;
    
    // If touch, prevent default to stop scrolling
    // e.preventDefault(); 
    
    const clientX = getClientX(e);
    const clientY = getClientY(e);
    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // Check for slider interaction (Split view only)
    let isSliderAction = false;
    if (viewMode === 'compare') {
      const xRel = clientX - rect.left;
      const sliderPx = (sliderPosition / 100) * rect.width;
      // 30px threshold for touch/mouse
      if (Math.abs(xRel - sliderPx) < 30) {
        isSliderAction = true;
      }
    }

    if (isSliderAction) {
      setActiveAction('slide');
    } else {
      setActiveAction('pan');
      setDragStart({ x: clientX, y: clientY });
      setPanStart({ ...pan });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!generation.imageUrl || !imageContainerRef.current) return;

    const clientX = getClientX(e);
    const clientY = getClientY(e);
    const rect = imageContainerRef.current.getBoundingClientRect();

    // 1. Handle Active Dragging
    if (activeAction === 'slide') {
       const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
       setSliderPosition((x / rect.width) * 100);
       return;
    }

    if (activeAction === 'pan') {
       // Only pan if zoomed in or just allow free pan for feel
       if (zoom > 1) {
          const dx = clientX - dragStart.x;
          const dy = clientY - dragStart.y;
          setPan({
            x: panStart.x + dx,
            y: panStart.y + dy
          });
       }
       return;
    }

    // 2. Handle Hover States (only for mouse)
    if (!('touches' in e) && viewMode === 'compare') {
      const xRel = clientX - rect.left;
      const sliderPx = (sliderPosition / 100) * rect.width;
      setIsHoveringSlider(Math.abs(xRel - sliderPx) < 30);
    }
  };

  const handleMouseUp = () => {
    setActiveAction('none');
  };

  // Cursor style helper
  const getCursorStyle = () => {
    if (activeAction === 'slide') return 'cursor-ew-resize';
    if (activeAction === 'pan') return 'cursor-grabbing';
    if (isHoveringSlider) return 'cursor-ew-resize';
    if (zoom > 1) return 'cursor-grab';
    return 'cursor-default';
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    setZoom(newZoom);
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />

      <main className="container mx-auto px-4 pb-12">
        {appState === AppState.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
             <div className="text-center mb-8 max-w-2xl">
               <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                 Transform Your Photos with <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                   AI Magic
                 </span>
               </h2>
               <p className="text-slate-400 text-lg">
                 Upload a photo to analyze its content or completely transform it into different artistic styles using Gemini models.
               </p>
             </div>
             <ImageUpload onImageSelected={handleImageSelected} />
          </div>
        )}

        {appState === AppState.EDIT && selectedImage && (
          <div className="mt-8 flex flex-col xl:flex-row gap-8 items-start">
            
            {/* Left Column: Controls */}
            <div className="w-full xl:w-1/3 space-y-6">
              
              {/* Image Preview & Reset */}
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Original Image
                  </h3>
                  <button 
                    onClick={handleReset}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50 group">
                  <img 
                    src={selectedImage} 
                    alt="Original" 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={handleReset} className="px-4 py-2 bg-red-500/80 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">
                      Change Photo
                    </button>
                  </div>
                </div>
                
                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={analysis.loading}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                >
                  {analysis.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {analysis.loading ? 'Analyzing...' : (analysis.text ? 'Re-analyze Image' : 'Analyze Image Content')}
                </button>

                {/* Analysis Loading State */}
                {analysis.loading && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 space-y-3 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                           <BrainCircuit className="w-4 h-4 text-indigo-400" />
                           <span className="text-xs font-semibold text-indigo-300">Gemini 3 Pro is thinking...</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded w-full" />
                        <div className="h-2 bg-slate-700/50 rounded w-5/6" />
                        <div className="h-2 bg-slate-700/50 rounded w-4/6" />
                    </div>
                )}

                {/* Analysis Result */}
                {analysis.text && !analysis.loading && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <BrainCircuit className="w-3 h-3" />
                      Analysis Result
                    </h4>
                    {analysis.text}
                  </div>
                )}
                
                {analysis.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                    {analysis.error}
                  </div>
                )}
              </div>

              {/* Style Selection */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  Select Style
                </h3>
                <StyleSelector 
                  selectedStyle={selectedStyle}
                  onSelectStyle={(style) => {
                    setSelectedStyle(style);
                    setCustomPrompt('');
                  }}
                />

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Or describe your own style
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      setSelectedStyle(null);
                    }}
                    placeholder="E.g., Make it look like a van gogh painting..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-24"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generation.loading}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generation.loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Wait for it...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Transform Image
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Result */}
            <div className="w-full xl:w-2/3">
              <div className="bg-slate-800/30 rounded-2xl p-1 border border-slate-700/50 min-h-[600px] flex flex-col relative overflow-hidden h-full">
                {generation.loading ? (
                   <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-xl bg-slate-900">
                      {/* Blurred Background */}
                      <div className="absolute inset-0 z-0">
                          {selectedImage && (
                              <img src={selectedImage} className="w-full h-full object-cover blur-2xl opacity-30 scale-110" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90" />
                      </div>
                      
                      {/* Loading Animation */}
                      <div className="relative z-10 flex flex-col items-center p-8 text-center">
                          <div className="relative w-32 h-32 mb-8">
                             {/* Outer Ring */}
                             <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
                             {/* Spinning Gradient Ring */}
                             <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                             {/* Inner Pulsing Circle */}
                             <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center shadow-inner shadow-black/50">
                                <Palette className="w-10 h-10 text-white animate-pulse" />
                             </div>
                             {/* Orbiting particles */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-500 animate-ping" style={{ animationDuration: '3s' }}></div>
                          </div>

                          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3">
                             Creating Magic
                          </h3>
                          
                          <div className="h-6 overflow-hidden">
                              <p className="text-blue-200/80 font-medium animate-pulse transition-all duration-500">
                                {loadingMessage}
                              </p>
                          </div>

                          <div className="mt-8 flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                      </div>
                   </div>
                ) : generation.imageUrl ? (
                  <div className="relative h-full flex flex-col animate-fade-in">
                     
                     {/* Floating Toolbar */}
                     <div className="absolute top-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-xl flex items-center shadow-2xl pointer-events-auto gap-2">
                           
                           {/* View Toggles */}
                           <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50">
                             <button 
                                onClick={() => setViewMode('original')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'original' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                             >
                                <ImageIcon className="w-3.5 h-3.5" /> Original
                             </button>
                              <button 
                                onClick={() => setViewMode('compare')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'compare' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                             >
                                <Columns className="w-3.5 h-3.5" /> Split
                             </button>
                              <button 
                                onClick={() => setViewMode('result')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'result' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                             >
                                <Sparkles className="w-3.5 h-3.5" /> Result
                             </button>
                           </div>

                           <div className="w-px h-6 bg-slate-700 mx-1" />

                           {/* Zoom Controls */}
                           <div className="flex items-center gap-1">
                              <button 
                                onClick={() => adjustZoom(-0.5)}
                                disabled={zoom <= 1}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-mono text-slate-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
                              <button 
                                onClick={() => adjustZoom(0.5)}
                                disabled={zoom >= 5}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setZoom(1); setPan({x:0, y:0}); }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg ml-1 transition-colors"
                                title="Reset View"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Image Viewport */}
                     <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] overflow-hidden relative">
                        
                        <div 
                          ref={imageContainerRef}
                          onWheel={handleWheel}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={handleMouseDown}
                          onTouchMove={handleMouseMove}
                          onTouchEnd={handleMouseUp}
                          className={`relative max-w-full max-h-[70vh] shadow-2xl transition-transform duration-75 origin-center select-none ${getCursorStyle()}`}
                          style={{ 
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            touchAction: 'none' // Prevent default touch actions like scroll
                          }}
                        >
                          {viewMode === 'compare' && selectedImage ? (
                             /* Compare View */
                             <div className="relative group">
                                {/* Result (Base) */}
                                <img src={generation.imageUrl} alt="Result" className="max-w-full max-h-[70vh] object-contain block pointer-events-none" />
                                
                                {/* Original (Overlay) - Clipped */}
                                <div 
                                   className="absolute inset-0 overflow-hidden pointer-events-none"
                                   style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                                >
                                    <img src={selectedImage} alt="Original" className="w-full h-full object-fill" />
                                </div>

                                {/* Slider Handle Visuals */}
                                <div 
                                  className={`absolute inset-y-0 w-1 bg-white/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 ${activeAction === 'slide' || isHoveringSlider ? 'bg-blue-400 w-1.5' : ''} transition-all`}
                                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                                >
                                   <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 ${activeAction === 'slide' || isHoveringSlider ? 'scale-110 bg-blue-500 text-white' : 'bg-white text-slate-900'} rounded-full shadow-xl flex items-center justify-center transition-all`}>
                                      <ArrowLeftRight className="w-4 h-4" />
                                   </div>
                                </div>
                                
                                {/* Labels */}
                                {zoom < 1.5 && (
                                  <>
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/90 pointer-events-none border border-white/10">Original</div>
                                    <div className="absolute top-4 right-4 bg-indigo-600/80 backdrop-blur px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/90 pointer-events-none border border-white/10">Result</div>
                                  </>
                                )}
                             </div>
                          ) : (
                             /* Single View */
                             <div className="relative">
                               <img 
                                 src={viewMode === 'original' && selectedImage ? selectedImage : generation.imageUrl} 
                                 alt={viewMode} 
                                 className="max-w-full max-h-[70vh] rounded-lg pointer-events-none" 
                               />
                             </div>
                          )}
                        </div>

                     </div>

                     <div className="p-4 bg-slate-900/80 border-t border-slate-700 flex items-center justify-between z-20">
                        <div>
                          <p className="text-white font-medium">Transformation Complete</p>
                          <p className="text-xs text-slate-400">
                             {selectedStyle ? selectedStyle.name : 'Custom Style'} • Gemini 2.5 Flash Image
                          </p>
                        </div>
                        <a 
                          href={generation.imageUrl} 
                          download={`gemini-transform-${Date.now()}.png`}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12 text-center bg-slate-800/30">
                     <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 mb-6 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                       <ArrowRight className="w-8 h-8 text-slate-600" />
                     </div>
                     <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to Transform</h3>
                     <p className="max-w-md mx-auto">
                       Select a style from the left panel and click "Transform Image" to see the AI generated result here.
                     </p>
                    
                    {generation.error && !generation.loading && (
                      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl max-w-md">
                        <p className="font-bold mb-1">Error Generating Image</p>
                        <p className="text-sm">{generation.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}