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

    // Video Upload
    uploadVideos: 'Video Yükle',
    dropVideosHere: 'Videoları buraya bırakın',
    dragDropVideos: 'Videoları sürükleyip bırakın veya tıklayarak seçin',
    uploadProgress: 'Yükleme Durumu',
    validatingVideo: 'Video doğrulanıyor...',
    processingVideo: 'Video işleniyor...',
    uploading: 'Yükleniyor...',
    uploadComplete: 'Yükleme tamamlandı!',
    uploadFailed: 'Yükleme başarısız',
    fileTooLarge: 'Dosya çok büyük',
    invalidFormat: 'Geçersiz format',
    invalidCodec: 'Desteklenmeyen codec',
    networkError: 'Ağ hatası',
    maxFileSize: 'Maksimum dosya boyutu: 500MB',
    allowedFormats: 'İzin verilen formatlar: MP4, MOV (H.264)',
    addMore: 'Daha Fazla Ekle',
    uploadedVideos: 'Yüklenen Videolar',
    maxFilesReached: 'Maksimum dosya sayısına ulaşıldı',
    cancelUpload: 'İptal Et',
    clearErrors: 'Hataları Temizle',
    retry: 'Tekrar Dene',
    uploadErrors: 'Yükleme Hataları',
    remaining: 'kaldı',
    
    // Effects & Export
    effects: 'Efektler',
    removeBackgroundColor: 'Arka Plan Rengini Sil',
    colorRgb: 'Renk (RGB)',
    tolerance: 'Tolerans',
    downloadGif: 'GIF İndir',
    
    // Video Settings
    fpsSetting: 'FPS (Kare Hızı)',
    maxFramesSetting: 'Maksimum Kare',
    targetWidthSetting: 'Kare Genişliği',
    keepOriginalRes: 'Orijinal Çözünürlüğü Koru',
    original: 'Orijinal',
    resetToDefault: 'Varsayılana Sıfırla',
    processingSettings: 'İşlem Ayarları',
    presetPixelArt: 'Pixel Art / Retro',
    presetPixelArtDesc: 'Düşük çözünürlüklü ve az kareli retro stili',
    presetSmooth: 'Akıcı Aksiyon',
    presetSmoothDesc: 'Yüksek kare hızlı, akıcı animasyonlar',
    presetLongEffect: 'Uzun Patlama / Efekt',
    presetLongEffectDesc: 'Uzun süren ve daha küçük boyutlu efektler',
    presetStandard: 'Standart',
    presetStandardDesc: 'Standart dengeli ayarlar',
    fpsHint: '{fps} FPS × 6 saniye = {total} kare',
    maxFramesHint: 'Daha fazla kare = Daha akıcı animasyon',
    gridHint: '{cols} sütun × {rows} satır grid',
    resWarning: 'Uyarı: Yüksek çözünürlüklü videolarda orijinal boyut kullanmak tarayıcınızın çökmesine neden olabilir.',
    extractingFrames: 'Kareler çıkarılıyor... {progress}%',
    inactive: 'Pasif',
    zoomIn: 'Büyüt',
    zoomOut: 'Küçült',
    fitScreen: 'Ekrana Sığdır',
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

    // Video Upload
    uploadVideos: 'Upload Videos',
    dropVideosHere: 'Drop videos here',
    dragDropVideos: 'Drag and drop videos here, or click to browse',
    uploadProgress: 'Upload Progress',
    validatingVideo: 'Validating video...',
    processingVideo: 'Processing video...',
    uploading: 'Uploading...',
    uploadComplete: 'Upload complete!',
    uploadFailed: 'Upload failed',
    fileTooLarge: 'File too large',
    invalidFormat: 'Invalid format',
    invalidCodec: 'Unsupported codec',
    networkError: 'Network error',
    maxFileSize: 'Maximum file size: 500MB',
    allowedFormats: 'Allowed formats: MP4, MOV (H.264)',
    addMore: 'Add More',
    uploadedVideos: 'Uploaded Videos',
    maxFilesReached: 'Maximum files reached',
    cancelUpload: 'Cancel',
    clearErrors: 'Clear Errors',
    retry: 'Retry',
    uploadErrors: 'Upload Errors',
    remaining: 'remaining',
    
    // Effects & Export
    effects: 'Effects',
    removeBackgroundColor: 'Remove Background Color',
    colorRgb: 'Color (RGB)',
    tolerance: 'Tolerance',
    downloadGif: 'Download GIF',
    
    // Video Settings
    fpsSetting: 'FPS (Frame Rate)',
    maxFramesSetting: 'Maximum Frames',
    targetWidthSetting: 'Frame Width',
    keepOriginalRes: 'Keep Original Resolution',
    original: 'Original',
    resetToDefault: 'Reset to Default',
    processingSettings: 'Processing Settings',
    presetPixelArt: 'Pixel Art / Retro',
    presetPixelArtDesc: 'Low resolution and few frames retro style',
    presetSmooth: 'Smooth Action',
    presetSmoothDesc: 'High frame rate, smooth animations',
    presetLongEffect: 'Long Effect',
    presetLongEffectDesc: 'Long lasting and smaller effects',
    presetStandard: 'Standard',
    presetStandardDesc: 'Standard balanced settings',
    fpsHint: '{fps} FPS × 6 seconds = {total} frames',
    maxFramesHint: 'More frames = Smoother animation',
    gridHint: '{cols} cols × {rows} rows grid',
    resWarning: 'Warning: Using original size on high resolution videos might crash your browser.',
    extractingFrames: 'Extracting frames... {progress}%',
    inactive: 'Inactive',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitScreen: 'Fit to Screen',
  },
} as const;

export type Translations = typeof translations;
