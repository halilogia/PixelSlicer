// i18n Translations for PixelSlicer

export type Language = 'tr' | 'en';

export const translations = {
  tr: {
    // Header
    appTitle: 'PixelSlicer',
    appSubtitle: 'ONLINE SPRITE CUTTER',
    uploadGif: 'GIF Yükle',
    uploadImage: 'Resim(ler) Yükle',
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

    galleryEmpty: 'Henüz kare oluşturulmadı.',

    // Sidebar - Export
    sheetColumns: 'Sheet Sütun',
    downloadSpriteSheet: 'Sprite Sheet',
    downloadZip: 'ZIP İndir',

    // Atlas Packer & Pivot
    atlasPacker: 'Atlas Packer',
    atlasOpen: 'Paketle & Dışa Aktar',
    atlasAutoTrim: 'Şeffaf Kenarları Kırp',
    atlasAlphaThreshold: 'Alfa Eşiği',
    atlasPadding: 'Boşluk (Padding)',
    atlasExtrude: 'Kenar Taşması (Extrude)',
    atlasPowerOfTwo: '2^n Boyut (POT)',
    atlasMaxPageSize: 'Maks. Sayfa Boyutu',
    atlasFormats: 'Motor Formatları',
    atlasAnimationName: 'Animasyon Adı',
    atlasBuild: 'Atlası Oluştur',
    atlasBuilding: 'Oluşturuluyor...',
    atlasExport: 'ZIP Olarak İndir',
    atlasExporting: 'Hazırlanıyor...',
    atlasPreviewHint: 'Ayarları seçip "Atlası Oluştur"a basın.',
    atlasSprites: 'Sprite',
    atlasPages: 'Sayfa',
    atlasOccupancy: 'Doluluk',
    atlasSaved: 'Kazanç (piksel)',
    atlasWorkerBadge: 'Worker (OffscreenCanvas)',
    atlasMainThreadBadge: 'Ana iş parçacığı',
    atlasAllowRotation: '90° Rotasyona İzin Ver',
    atlasAllowRotationHint: 'Daha sıkı sığdırır; Phaser ve Unity destekler, Godot için dikdörtgen döndürülmez.',
    atlasFramesPerGroup: 'Animasyon Kare Sayısı',
    atlasFramesPerGroupHint: 'Kareler bu sayıda gruplanır ve bir grubun sayfası bölünmez.',
    atlasFree: 'Serbest',
    atlasNaming: 'Sprite Adlandırma',
    atlasRename: 'Sprite adlarını düzenle',
    pivotMode: 'Pivot Noktası',
    pivotPick: 'Pivot Seç',
    pivotPickingOn: 'Pivot Seç: AÇIK',
    pivotPickHint: 'Kareye tıklayarak origin noktasını yerleştirin.',
    pivotClear: 'Pivotları Sıfırla',

    // Main Canvas
    welcomeTitle: 'Resim(leri) Yükleyin',
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
    removeColor: 'Renk Seç',
    eyedropper: 'Renk Seçici (Damlalık)',
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
    play: 'Oynat',
    pause: 'Duraklat',
    fitScreen: 'Ekrana Sığdır',
  },

  en: {
    // Header
    appTitle: 'PixelSlicer',
    appSubtitle: 'ONLINE SPRITE CUTTER',
    uploadGif: 'Upload GIF',
    uploadImage: 'Upload Image(s)',
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

    galleryEmpty: 'No frames yet.',

    // Sidebar - Export
    sheetColumns: 'Sheet Columns',
    downloadSpriteSheet: 'Sprite Sheet',
    downloadZip: 'Download ZIP',

    // Atlas Packer & Pivot
    atlasPacker: 'Atlas Packer',
    atlasOpen: 'Pack & Export',
    atlasAutoTrim: 'Trim Transparent Borders',
    atlasAlphaThreshold: 'Alpha Threshold',
    atlasPadding: 'Padding',
    atlasExtrude: 'Extrude',
    atlasPowerOfTwo: 'Power of Two Size',
    atlasMaxPageSize: 'Max Page Size',
    atlasFormats: 'Engine Formats',
    atlasAnimationName: 'Animation Name',
    atlasBuild: 'Build Atlas',
    atlasBuilding: 'Building...',
    atlasExport: 'Download ZIP',
    atlasExporting: 'Preparing...',
    atlasPreviewHint: 'Pick your options, then press "Build Atlas".',
    atlasSprites: 'Sprites',
    atlasPages: 'Pages',
    atlasOccupancy: 'Occupancy',
    atlasSaved: 'Saved (px)',
    atlasWorkerBadge: 'Worker (OffscreenCanvas)',
    atlasMainThreadBadge: 'Main thread',
    atlasAllowRotation: 'Allow 90° Rotation',
    atlasAllowRotationHint: 'Packs tighter. Phaser and Unity support it, Godot cannot rotate a region.',
    atlasFramesPerGroup: 'Frames per Animation',
    atlasFramesPerGroupHint: 'Frames are grouped by this count and a group is never split across pages.',
    atlasFree: 'Free',
    atlasNaming: 'Sprite Naming',
    atlasRename: 'Edit sprite names',
    pivotMode: 'Pivot Point',
    pivotPick: 'Pick Pivot',
    pivotPickingOn: 'Pick Pivot: ON',
    pivotPickHint: 'Click a frame to place its origin point.',
    pivotClear: 'Reset Pivots',

    // Main Canvas
    welcomeTitle: 'Upload Image(s)',
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
    removeColor: 'Select Color',
    eyedropper: 'Eyedropper Tool',
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
    play: 'Play',
    pause: 'Pause',
    fitScreen: 'Fit to Screen',
  },
} as const;

export type Translations = typeof translations;
