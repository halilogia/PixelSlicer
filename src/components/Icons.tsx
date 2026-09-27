import React from 'react';
import {
  Scissors,
  FolderOpen,
  Save,
  Zap,
  Palette,
  Search,
  Plus,
  Image as ImageIcon,
  Download,
  Rocket,
  Layers,
  Settings,
  Trash2,
  Check,
  X,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icons = {
  Slice: ({ size = 20, color, className, style }: IconProps) => <Scissors size={size} color={color} className={className} style={style} />,
  Folder: ({ size = 20, color, className, style }: IconProps) => <FolderOpen size={size} color={color} className={className} style={style} />,
  Save: ({ size = 20, color, className, style }: IconProps) => <Save size={size} color={color} className={className} style={style} />,
  Zap: ({ size = 20, color = "#f3c669", className, style }: IconProps) => <Zap size={size} color={color} className={className} style={style} />,
  Palette: ({ size = 20, color, className, style }: IconProps) => <Palette size={size} color={color} className={className} style={style} />,
  Search: ({ size = 18, color, className, style }: IconProps) => <Search size={size} color={color} className={className} style={style} />,
  Plus: ({ size = 18, color, className, style }: IconProps) => <Plus size={size} color={color} className={className} style={style} />,
  Image: ({ size = 20, color, className, style }: IconProps) => <ImageIcon size={size} color={color} className={className} style={style} />,
  Download: ({ size = 18, color, className, style }: IconProps) => <Download size={size} color={color} className={className} style={style} />,
  Rocket: ({ size = 18, color, className, style }: IconProps) => <Rocket size={size} color={color} className={className} style={style} />,
  Layers: ({ size = 18, color, className, style }: IconProps) => <Layers size={size} color={color} className={className} style={style} />,
  Settings: ({ size = 18, color, className, style }: IconProps) => <Settings size={size} color={color} className={className} style={style} />,
  Trash: ({ size = 18, color, className, style }: IconProps) => <Trash2 size={size} color={color} className={className} style={style} />,
  Check: ({ size = 18, color, className, style }: IconProps) => <Check size={size} color={color} className={className} style={style} />,
  Close: ({ size = 18, color, className, style }: IconProps) => <X size={size} color={color} className={className} style={style} />,
  Help: ({ size = 18, color, className, style }: IconProps) => <HelpCircle size={size} color={color} className={className} style={style} />,
  Sparkles: ({ size = 18, color, className, style }: IconProps) => <Sparkles size={size} color={color} className={className} style={style} />,
};
