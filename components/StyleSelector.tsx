import React from 'react';
import { StyleOption } from '../types';
import { Palette, Zap, Cpu, Brush, Ghost, PenTool, Grid, Monitor, Aperture } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: StyleOption | null;
  onSelectStyle: (style: StyleOption) => void;
}

export const STYLES: StyleOption[] = [
  {
    id: 'cartoon',
    name: 'Cartoon',
    prompt: 'Transform this image into a colorful, clean 2D cartoon style illustration.',
    icon: 'palette',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    prompt: 'Apply a cyberpunk style with neon lights, dark moody atmosphere, and futuristic elements.',
    icon: 'cpu',
    color: 'from-cyan-400 to-blue-500'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    prompt: 'Paint this image in a soft, artistic watercolor style with bleeding edges and paper texture.',
    icon: 'brush',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    prompt: 'Convert this into a detailed black and white graphite pencil sketch.',
    icon: 'pen-tool',
    color: 'from-slate-400 to-slate-600'
  },
  {
    id: 'anime',
    name: 'Anime',
    prompt: 'Transform this photo into a high-quality anime style illustration.',
    icon: 'zap',
    color: 'from-pink-400 to-rose-500'
  },
  {
    id: 'retro',
    name: 'Retro 80s',
    prompt: 'Give this image a retro 1980s synthwave aesthetic with vintage grain.',
    icon: 'ghost',
    color: 'from-purple-400 to-indigo-500'
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    prompt: 'Convert this image into a detailed ancient mosaic tile masterpiece with distinct grout lines.',
    icon: 'grid',
    color: 'from-amber-400 to-yellow-600'
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    prompt: 'Transform this image into a retro 16-bit pixel art style game graphic.',
    icon: 'monitor',
    color: 'from-lime-400 to-green-500'
  },
  {
    id: 'abstract',
    name: 'Abstract',
    prompt: 'Reimagine this image as an abstract expressionist painting with bold, chaotic strokes and vivid colors.',
    icon: 'aperture',
    color: 'from-fuchsia-400 to-pink-600'
  }
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelectStyle }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'palette': return <Palette className="w-5 h-5" />;
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'brush': return <Brush className="w-5 h-5" />;
      case 'pen-tool': return <PenTool className="w-5 h-5" />;
      case 'zap': return <Zap className="w-5 h-5" />;
      case 'ghost': return <Ghost className="w-5 h-5" />;
      case 'grid': return <Grid className="w-5 h-5" />;
      case 'monitor': return <Monitor className="w-5 h-5" />;
      case 'aperture': return <Aperture className="w-5 h-5" />;
      default: return <Palette className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelectStyle(style)}
          className={`relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 text-left ${
            selectedStyle?.id === style.id
              ? 'border-blue-500 bg-slate-800 ring-1 ring-blue-500'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
          }`}
        >
          <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${style.color} rounded-bl-3xl`}>
             {getIcon(style.icon)}
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${style.color} text-white shadow-lg`}>
              {getIcon(style.icon)}
            </div>
          </div>
          
          <span className="text-sm font-medium text-slate-200 block">{style.name}</span>
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;