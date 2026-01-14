import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  tenantId: string;
  folder: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  previewClassName?: string;
  previewBgClass?: string;
}

export function ImageUpload({
  value,
  onChange,
  tenantId,
  folder,
  label = 'Imagem',
  accept = 'image/*',
  maxSizeMB = 2,
  previewClassName = 'max-h-12 object-contain',
  previewBgClass = 'bg-muted',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview area */}
      {value && (
        <div className={`relative p-4 rounded-lg ${previewBgClass}`}>
          <img
            src={value}
            alt={label}
            className={previewClassName}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? 'Enviando...' : 'Upload'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          URL
        </Button>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit}>
            OK
          </Button>
        </div>
      )}
    </div>
  );
}
