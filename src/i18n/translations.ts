// i18n Translations for PixelSlicer

export type Language = 'tr' | 'en';

export const translations = {
  tr: {
    // Header
    appTitle: 'PixelSlicer',
    appSubtitle: 'ONLINE SPRITE CUTTER',
    uploadGif: 'GIF Yükle',
    uploadImage: 'Resim Yükle',
    settings: 'Ayarlar',

    // Sidebar - Manual Mode
    manualSelection: 'Manuel Seçim',
    manualAddOn: 'Manuel Ekle: AÇIK',
    manualAddOff: 'Manuel Ekle: KAPALI',
    clearManualFrames: 'Tüm Manuel Kareleri Sil',
    manualModeHelp: 'Açıkken sürükleyerek kare çizin. Seçili kareyi köşelerinden boyutlandırabilirsiniz.',

    // Sidebar - Grid Settings
    gridSettings: 'Izgara Ayarları',
    columns: 'Sütun (Yatay)',
    rows: 'Satır (Dikey)',
    fineTune: 'İnce Ayar',
    reset: 'Sıfırla',
    offsetX: 'Yatay Kaydır (Offset X)',
    offsetY: 'Dikey Kaydır (Offset Y)',
    padding: 'Genişlik Düzeltme (Padding)',
    paddingHint: 'Kılıç sığmıyorsa bunu arttır.',

    // Sidebar - Preview
    preview: 'Önizleme',
    previewAuto: 'Otomatik',
    fit: 'Sığdır',
    speed: 'Hız (FPS)',

    // Sidebar - Export
    sheetColumns: 'Sheet Sütun',
    downloadSpriteSheet: 'Sprite Sheet',
    downloadZip: 'ZIP İndir',

    // Main Canvas
    welcomeTitle: 'Resim Yükleyin',
    welcomeText: 'Başlamak için sol üstteki butonu kullanın veya sürükleyip bırakın.',

    // Frame Gallery
    noFrames: 'Henüz kare oluşturulmadı.',
    toggleFrame: 'Kareyi aç/kapat',

    // Settings Modal
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'English',
    close: 'Kapat',

    // Tooltip
    canvasHoverInfo: 'Seçmek/kapatmak için tıklayın. Manuel modda çizim yapın.',
  },

  en: {
    // Header
    appTitle: 'PixelSlicer',
    appSubtitle: 'ONLINE SPRITE CUTTER',
    uploadGif: 'Upload GIF',
    uploadImage: 'Upload Image',
    settings: 'Settings',

    // Sidebar - Manual Mode
    manualSelection: 'Manual Selection',
    manualAddOn: 'Manual Add: ON',
    manualAddOff: 'Manual Add: OFF',
    clearManualFrames: 'Clear All Manual Frames',
    manualModeHelp: 'When open, drag to draw frames. Resize selected frame from corners.',

    // Sidebar - Grid Settings
    gridSettings: 'Grid Settings',
    columns: 'Columns (Horizontal)',
    rows: 'Rows (Vertical)',
    fineTune: 'Fine Tune',
    reset: 'Reset',
    offsetX: 'Horizontal Offset (X)',
    offsetY: 'Vertical Offset (Y)',
    padding: 'Width Adjust (Padding)',
    paddingHint: 'Increase if sprite doesn\'t fit.',

    // Sidebar - Preview
    preview: 'Preview',
    previewAuto: 'Auto',
    fit: 'Fit',
    speed: 'Speed (FPS)',

    // Sidebar - Export
    sheetColumns: 'Sheet Columns',
    downloadSpriteSheet: 'Sprite Sheet',
    downloadZip: 'Download ZIP',

    // Main Canvas
    welcomeTitle: 'Upload Image',
    welcomeText: 'Use the button at top left or drag and drop to start.',

    // Frame Gallery
    noFrames: 'No frames created yet.',
    toggleFrame: 'Toggle frame on/off',

    // Settings Modal
    language: 'Language',
    turkish: 'Türkçe',
    english: 'English',
    close: 'Close',

    // Tooltip
    canvasHoverInfo: 'Click to toggle. Draw in manual mode.',
  },
} as const;

export type Translations = typeof translations;
