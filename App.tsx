
import React, { useState, useCallback, useRef } from 'react';
import { ImageFormat, ImageState, ConversionResult } from './types';
import { Upload, Image as ImageIcon, Download, RefreshCw, X, Settings, ArrowLeftRight, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<ImageState | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>(ImageFormat.PNG);
  const [quality, setQuality] = useState<number>(0.9);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage({
          file,
          previewUrl: e.target?.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height
        });
        setResult(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const reset = () => {
    setSourceImage(null);
    setResult(null);
    setIsConverting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const convertImage = async () => {
    if (!sourceImage) return;
    setIsConverting(true);

    try {
      const img = new Image();
      img.src = sourceImage.previewUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context error");
      
      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${targetFormat}`;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      // Calculate resulting size (rough estimate from base64)
      const head = `data:${mimeType};base64,`.length;
      const fileSize = Math.round((dataUrl.length - head) * 3 / 4);

      setResult({
        url: dataUrl,
        format: targetFormat,
        size: fileSize
      });
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحويل الصورة');
    } finally {
      setIsConverting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-5xl mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-blue-600 p-2 rounded-xl">
            <RefreshCw className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">PixelConvert</h1>
        </div>
        <p className="text-gray-500">تحويل صيغ الصور بكل سهولة، داخل متصفحك مباشرة مع خصوصية تامة.</p>
      </header>

      <main className="w-full max-w-5xl">
        {!sourceImage ? (
          <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`
              relative w-full aspect-[2/1] min-h-[300px] rounded-3xl border-4 border-dashed 
              flex flex-col items-center justify-center transition-all duration-300
              ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-white hover:border-blue-300'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={onFileChange}
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="bg-blue-100 p-6 rounded-full mb-4">
              <Upload className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">اسحب الصورة هنا أو اضغط للاختيار</h2>
            <p className="text-gray-400">يدعم PNG, JPG, WEBP - التحويل يتم في جهازك فقط</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-lg">إعدادات التحويل</h3>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">الصيغة المطلوبة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(ImageFormat).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={`
                          py-2 rounded-xl font-bold uppercase transition-all
                          ${targetFormat === fmt 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
                        `}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {(targetFormat === ImageFormat.JPEG || targetFormat === ImageFormat.WEBP) && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700">جودة الصورة</label>
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>حجم أقل</span>
                      <span>جودة أعلى</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={convertImage}
                  disabled={isConverting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جاري التحويل...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-5 h-5" />
                      تحويل الآن
                    </>
                  )}
                </button>

                <button
                  onClick={reset}
                  className="w-full mt-4 py-3 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" />
                  إلغاء واختيار صورة أخرى
                </button>
              </div>

              {/* Source Info */}
              <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-sm">
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">معلومات الملف الأصلي</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">الاسم:</span>
                    <span className="text-sm truncate max-w-[150px]">{sourceImage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">الحجم:</span>
                    <span className="text-sm">{formatSize(sourceImage.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">الأبعاد:</span>
                    <span className="text-sm">{sourceImage.width} × {sourceImage.height}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    المعاينة
                  </h3>
                  {result && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      تم التحويل بنجاح
                    </div>
                  )}
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">قبل التحويل</span>
                    <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                      <img 
                        src={sourceImage.previewUrl} 
                        alt="Original" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">النتيجة</span>
                    <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-dashed border-gray-300 flex items-center justify-center">
                      {result ? (
                        <img 
                          src={result.url} 
                          alt="Converted" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <div className="w-12 h-12 border-2 border-gray-300 rounded-xl mx-auto mb-3 flex items-center justify-center">
                            <ImageIcon className="text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400">اضغط على زر التحويل لرؤية النتيجة</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {result && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase font-bold">الحجم الجديد</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatSize(result.size)}
                        <span className="text-sm text-gray-400 mr-2">
                          ({Math.round((result.size / sourceImage.size) * 100)}% من الأصلي)
                        </span>
                      </span>
                    </div>
                    <a
                      href={result.url}
                      download={`converted-${sourceImage.name.split('.')[0]}.${result.format}`}
                      className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all hover:-translate-y-1"
                    >
                      <Download className="w-5 h-5" />
                      تحميل الصورة المحولة
                    </a>
                  </div>
                )}
              </div>

              {/* Security Banner */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-blue-800 font-medium">
                  <strong>ملاحظة أمنية:</strong> جميع عمليات المعالجة تتم محلياً على جهازك. لا يتم إرسال صورك إلى أي خادم (Server).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} PixelConvert - صنع ليكون بسيطاً وآمناً</p>
      </footer>
    </div>
  );
};

export default App;
