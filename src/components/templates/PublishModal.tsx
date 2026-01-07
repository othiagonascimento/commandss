import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (changelog: string, incrementMajor: boolean) => void;
  isLoading: boolean;
  isNew: boolean;
}

export function PublishModal({ open, onOpenChange, onPublish, isLoading, isNew }: PublishModalProps) {
  const [changelog, setChangelog] = useState('');
  const [incrementMajor, setIncrementMajor] = useState(false);

  const handlePublish = () => {
    if (!changelog.trim()) return;
    onPublish(changelog.trim(), incrementMajor);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Publicar Novo Template' : 'Publicar Alterações'}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? 'O template será criado no projeto de destino e ficará disponível para uso.'
              : 'As alterações serão publicadas e uma nova versão será criada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="changelog">
              Changelog (obrigatório) *
            </Label>
            <Textarea
              id="changelog"
              placeholder="Descreva as alterações realizadas..."
              rows={4}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: "Adicionadas novas etapas de funil e ajustados prompts de qualificação"
            </p>
          </div>

          {!isNew && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="major-version">Versão Major</Label>
                <p className="text-xs text-muted-foreground">
                  Marque para grandes mudanças (1.x → 2.0)
                </p>
              </div>
              <Switch
                id="major-version"
                checked={incrementMajor}
                onCheckedChange={setIncrementMajor}
                disabled={isLoading}
              />
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isNew
                ? 'Após a publicação, você poderá sincronizar o template com tenants específicos.'
                : 'Os tenants subscritos NÃO serão atualizados automaticamente. Use "Sincronizar" depois.'}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handlePublish} disabled={!changelog.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
