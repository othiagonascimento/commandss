import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { TemplateFormData, QuickReply } from '@/types/templates';

export function QuickRepliesEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'quick_replies',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<QuickReply | null>(null);

  const handleAdd = () => {
    append({
      id: `qr_${Date.now()}`,
      label: '',
      trigger: '',
      message: '',
      technique: '',
    });
    setEditingIndex(fields.length);
    setEditingData({
      id: `qr_${Date.now()}`,
      label: '',
      trigger: '',
      message: '',
      technique: '',
    });
  };

  const handleEdit = (index: number) => {
    const reply = watch(`quick_replies.${index}`);
    setEditingIndex(index);
    setEditingData({ ...reply });
  };

  const handleSave = () => {
    if (editingIndex !== null && editingData) {
      setValue(`quick_replies.${editingIndex}`, editingData);
      setEditingIndex(null);
      setEditingData(null);
    }
  };

  const handleCancel = () => {
    // If it was a new item with no data, remove it
    if (editingIndex !== null) {
      const reply = watch(`quick_replies.${editingIndex}`);
      if (!reply.label && !reply.trigger && !reply.message) {
        remove(editingIndex);
      }
    }
    setEditingIndex(null);
    setEditingData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Respostas Rápidas</h3>
          <p className="text-sm text-muted-foreground">
            Configure atalhos de resposta para perguntas frequentes
          </p>
        </div>
        <Button type="button" onClick={handleAdd} disabled={editingIndex !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Resposta
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma resposta rápida configurada</p>
            <Button type="button" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Resposta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Label</TableHead>
                <TableHead className="w-[150px]">Gatilho</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-[120px]">Técnica</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const isEditing = editingIndex === index;
                const reply = watch(`quick_replies.${index}`);

                if (isEditing && editingData) {
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          placeholder="Saudação"
                          value={editingData.label}
                          onChange={(e) => setEditingData({ ...editingData, label: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="oi, olá"
                          value={editingData.trigger}
                          onChange={(e) => setEditingData({ ...editingData, trigger: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Olá! Como posso ajudar?"
                          rows={2}
                          value={editingData.message}
                          onChange={(e) => setEditingData({ ...editingData, message: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Rapport"
                          value={editingData.technique}
                          onChange={(e) => setEditingData({ ...editingData, technique: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleSave}
                            disabled={!editingData.label || !editingData.message}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{reply.label}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {reply.trigger}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm">{reply.message}</p>
                    </TableCell>
                    <TableCell>
                      {reply.technique && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">{reply.technique}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(index)}
                          disabled={editingIndex !== null}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(index)}
                          disabled={editingIndex !== null || fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Mínimo de 1 resposta rápida. O gatilho é o texto que ativa a resposta automaticamente.
      </p>
    </div>
  );
}
