import { useState, useCallback } from "react";
import { Palette, Upload, X, Image, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepVisualProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

interface UploadConfig {
  label: string;
  description: string;
  fieldKey: "logo_url" | "symbol_url" | "logo_white_url";
  optional?: boolean;
}

const UPLOAD_CONFIGS: UploadConfig[] = [
  {
    label: "Logo Principal",
    description: "Fundo transparente (PNG)",
    fieldKey: "logo_url",
  },
  {
    label: "Ícone / Símbolo",
    description: "Usado como avatar",
    fieldKey: "symbol_url",
  },
  {
    label: "Logo Branca",
    description: "Para fundos escuros",
    fieldKey: "logo_white_url",
    optional: true,
  },
];

export function StepVisual({ formData, updateFormData }: StepVisualProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  const currentConfig = UPLOAD_CONFIGS[currentUploadIndex];
  const currentValue = formData[currentConfig.fieldKey];

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, envie apenas imagens");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `onboarding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("onboarding-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("onboarding-files")
        .getPublicUrl(filePath);

      updateFormData({ [currentConfig.fieldKey]: publicUrl });
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    updateFormData({ [currentConfig.fieldKey]: "" });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [currentConfig.fieldKey]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const goToPrev = () => {
    if (currentUploadIndex > 0) {
      setCurrentUploadIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentUploadIndex < UPLOAD_CONFIGS.length - 1) {
      setCurrentUploadIndex(prev => prev + 1);
    }
  };

  // Count uploaded items
  const uploadedCount = [formData.logo_url, formData.symbol_url, formData.logo_white_url].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Palette className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sua Marca no Sistema</h2>
        <p className="text-sm text-muted-foreground">
          Envie suas logos para personalizar o sistema
        </p>
      </div>

      {/* Carousel indicator */}
      <div className="flex items-center justify-center gap-2">
        {UPLOAD_CONFIGS.map((config, index) => {
          const hasValue = !!formData[config.fieldKey];
          return (
            <button
              key={config.fieldKey}
              onClick={() => setCurrentUploadIndex(index)}
              className={`
                w-3 h-3 rounded-full transition-all duration-200
                ${index === currentUploadIndex 
                  ? "bg-primary w-6" 
                  : hasValue 
                    ? "bg-primary/50" 
                    : "bg-muted-foreground/30"
                }
              `}
            />
          );
        })}
      </div>

      {/* Main upload area - mobile carousel */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="pt-6 pb-4 space-y-4">
          {/* Navigation header */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrev}
              disabled={currentUploadIndex === 0}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold text-foreground">{currentConfig.label}</span>
                {currentConfig.optional && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Opcional
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{currentConfig.description}</p>
            </div>
            
            <button
              onClick={goToNext}
              disabled={currentUploadIndex === UPLOAD_CONFIGS.length - 1}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Upload zone - large touch target */}
          {currentValue ? (
            <div className="relative group mx-auto w-full max-w-[200px] aspect-square rounded-2xl border-2 border-border bg-muted/30 overflow-hidden">
              <img
                src={currentValue}
                alt={currentConfig.label}
                className="w-full h-full object-contain p-4"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-3 right-3 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                flex flex-col items-center justify-center 
                mx-auto w-full max-w-[200px] aspect-square
                border-2 border-dashed rounded-2xl cursor-pointer
                transition-all duration-200
                ${isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
                ${isUploading ? "pointer-events-none opacity-60" : ""}
              `}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Enviando...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">Toque para enviar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou arraste a imagem aqui
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}

          {/* Status indicator */}
          <div className="text-center text-sm text-muted-foreground">
            {uploadedCount} de {UPLOAD_CONFIGS.length} imagens enviadas
          </div>
        </CardContent>
      </Card>

      {/* Preview - all uploaded */}
      {uploadedCount > 0 && (
        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Suas logos:</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {formData.symbol_url && (
              <div className="w-12 h-12 rounded-lg bg-card border border-border overflow-hidden shadow-sm">
                <img 
                  src={formData.symbol_url} 
                  alt="Símbolo" 
                  className="w-full h-full object-contain p-1.5" 
                />
              </div>
            )}
            {formData.logo_url && (
              <div className="h-12 bg-card border border-border rounded-lg overflow-hidden shadow-sm px-3 flex items-center">
                <img 
                  src={formData.logo_url} 
                  alt="Logo" 
                  className="h-7 object-contain" 
                />
              </div>
            )}
            {formData.logo_white_url && (
              <div className="h-12 bg-slate-800 border border-border rounded-lg overflow-hidden shadow-sm px-3 flex items-center">
                <img 
                  src={formData.logo_white_url} 
                  alt="Logo Branca" 
                  className="h-7 object-contain" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
        <Image className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong>Dica:</strong> Use PNG com fundo transparente. Tamanho recomendado: 500x500px para ícone.
        </p>
      </div>
    </div>
  );
}
