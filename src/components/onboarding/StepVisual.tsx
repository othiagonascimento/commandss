import { useState, useCallback } from "react";
import { Palette, Upload, X, Image, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepVisualProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

interface UploadZoneProps {
  label: string;
  description: string;
  value: string;
  fieldKey: "logo_url" | "symbol_url" | "logo_white_url";
  onUpload: (url: string, fieldKey: string) => void;
  onRemove: (fieldKey: string) => void;
  optional?: boolean;
}

function UploadZone({ label, description, value, fieldKey, onUpload, onRemove, optional }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

      onUpload(publicUrl, fieldKey);
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{label}</span>
        {optional && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Opcional
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      
      {value ? (
        <div className="relative group w-32 h-32 rounded-xl border border-border bg-muted/30 overflow-hidden">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-contain p-2"
          />
          <button
            type="button"
            onClick={() => onRemove(fieldKey)}
            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex flex-col items-center justify-center w-full h-32 
            border-2 border-dashed rounded-xl cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
            }
            ${isUploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Arraste ou clique
              </span>
            </>
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
    </div>
  );
}

export function StepVisual({ formData, updateFormData }: StepVisualProps) {
  const handleUpload = (url: string, fieldKey: string) => {
    updateFormData({ [fieldKey]: url });
  };

  const handleRemove = (fieldKey: string) => {
    updateFormData({ [fieldKey]: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Sua Marca no Sistema</h2>
        <p className="text-muted-foreground">
          Envie suas logos para deixar o sistema com a cara da sua empresa
        </p>
      </div>

      {/* Upload zones */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <UploadZone
              label="Logo Principal"
              description="Fundo transparente (PNG)"
              value={formData.logo_url}
              fieldKey="logo_url"
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
            
            <UploadZone
              label="Ícone / Símbolo"
              description="Usado como avatar"
              value={formData.symbol_url}
              fieldKey="symbol_url"
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
            
            <UploadZone
              label="Logo Branca"
              description="Para fundos escuros"
              value={formData.logo_white_url}
              fieldKey="logo_white_url"
              onUpload={handleUpload}
              onRemove={handleRemove}
              optional
            />
          </div>

          {/* Preview */}
          {(formData.logo_url || formData.symbol_url) && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <p className="text-xs text-muted-foreground">Preview:</p>
              <div className="flex items-center gap-4">
                {formData.symbol_url && (
                  <div className="w-10 h-10 rounded-lg bg-card border border-border overflow-hidden">
                    <img 
                      src={formData.symbol_url} 
                      alt="Símbolo" 
                      className="w-full h-full object-contain p-1" 
                    />
                  </div>
                )}
                {formData.logo_url && (
                  <div className="h-10 bg-card border border-border rounded-lg overflow-hidden px-3 flex items-center">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="h-6 object-contain" 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
            <Image className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Use imagens PNG com fundo transparente para melhor resultado. 
              Tamanho recomendado: 500x500px para ícone, 1000x300px para logo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
