import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { commandDb } from '@/lib/command/db';
import { ArrowLeft, ImageIcon, CheckCircle2, Calendar, Send, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Item {
  id: string;
  title: string;
  brief: string;
  channel: string;
  format: string;
  caption: string;
  hashtags: string[] | null;
  media_urls: Array<{ url: string; path?: string }> | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  external_permalink: string | null;
}
interface Variant {
  id: string;
  label: string;
  caption: string;
  hashtags: string[] | null;
  media_urls: Array<{ url: string }> | null;
  is_chosen: boolean;
}

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const { data: item, refetch } = useQuery({
    queryKey: ['command', 'content-item', id],
    queryFn: async () => {
      const { data } = await commandDb
        .from('content_items')
        .select('id,title,brief,channel,format,caption,hashtags,media_urls,status,scheduled_at,published_at,external_permalink')
        .eq('id', id!)
        .maybeSingle();
      return data as Item | null;
    },
    enabled: !!id,
  });

  const { data: variants } = useQuery({
    queryKey: ['command', 'content-variants', id],
    queryFn: async () => {
      const { data } = await commandDb
        .from('content_variants')
        .select('id,label,caption,hashtags,media_urls,is_chosen')
        .eq('content_item_id', id!)
        .order('created_at');
      return (data ?? []) as Variant[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (variants && !activeVariant) {
      const chosen = variants.find((v) => v.is_chosen) ?? variants[0];
      if (chosen) setActiveVariant(chosen.id);
    }
  }, [variants, activeVariant]);

  const chooseVariant = async (vId: string) => {
    if (!item || !variants) return;
    const v = variants.find((x) => x.id === vId);
    if (!v) return;
    setActiveVariant(vId);
    await commandDb.from('content_variants').update({ is_chosen: false }).eq('content_item_id', item.id);
    await commandDb.from('content_variants').update({ is_chosen: true }).eq('id', vId);
    await commandDb
      .from('content_items')
      .update({
        caption: v.caption,
        hashtags: v.hashtags ?? [],
        media_urls: v.media_urls?.length ? v.media_urls : item.media_urls,
      })
      .eq('id', item.id);
    refetch();
    toast.success('Variante escolhida');
  };

  const markScheduled = async () => {
    if (!item) return;
    const when = prompt('Agendar para (YYYY-MM-DD HH:mm) — local:');
    if (!when) return;
    const dt = new Date(when);
    if (isNaN(dt.getTime())) return toast.error('Data inválida');
    await commandDb
      .from('content_items')
      .update({ status: 'scheduled', scheduled_at: dt.toISOString() })
      .eq('id', item.id);
    refetch();
    toast.success('Agendado');
  };

  const copyCaption = () => {
    if (!item) return;
    const txt = `${item.caption}\n\n${(item.hashtags ?? []).map((h) => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(txt);
    toast.success('Caption copiada');
  };

  const active = variants?.find((v) => v.id === activeVariant) ?? null;
  const cover = active?.media_urls?.[0]?.url ?? item?.media_urls?.[0]?.url;

  return (
    <div className="px-8 lg:px-14 py-10 max-w-[1400px] mx-auto">
      <Link
        to="/command/content"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))] mb-6"
      >
        <ArrowLeft className="w-3 h-3" /> conteúdo
      </Link>

      {item && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10">
          {/* Preview */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
              preview · {item.channel} {item.format}
            </div>
            <div className="aspect-square rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] overflow-hidden flex items-center justify-center">
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-[hsl(var(--ink-faint))]" />
              )}
            </div>
            <div className="mt-4 text-[12.5px] text-[hsl(var(--ink-muted))]">
              <span className="font-mono text-[10px] uppercase tracking-widest mr-2">brief:</span>
              {item.brief}
            </div>
          </div>

          {/* Variants + actions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                variantes · escolha uma
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyCaption}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-3))] text-[11.5px]"
                >
                  <Copy className="w-3 h-3" /> copiar
                </button>
                <button
                  onClick={markScheduled}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-3))] text-[11.5px]"
                >
                  <Calendar className="w-3 h-3" /> agendar
                </button>
                <button
                  disabled
                  title="Conexão Meta/IG na próxima onda"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[hsl(var(--brand-magenta)/0.4)] text-[hsl(var(--brand-magenta))] text-[11.5px] disabled:opacity-50"
                >
                  <Send className="w-3 h-3" /> publicar
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {variants?.map((v) => {
                const isActive = v.id === activeVariant;
                return (
                  <motion.button
                    key={v.id}
                    onClick={() => chooseVariant(v.id)}
                    whileHover={{ x: 2 }}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      isActive
                        ? 'border-[hsl(var(--brand-magenta)/0.6)] bg-[hsl(var(--brand-magenta)/0.06)]'
                        : 'border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] hover:border-[hsl(var(--hairline-strong))]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                        {v.label}
                      </div>
                      {v.is_chosen && (
                        <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--jade))]">
                          <CheckCircle2 className="w-3 h-3" /> escolhida
                        </div>
                      )}
                    </div>
                    <div className="text-[13.5px] text-[hsl(var(--ink-primary))] leading-snug whitespace-pre-wrap">
                      {v.caption}
                    </div>
                    {v.hashtags && v.hashtags.length > 0 && (
                      <div className="text-[11px] text-[hsl(var(--ink-muted))] mt-2">
                        {v.hashtags.map((h) => `#${h}`).join(' ')}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-[hsl(var(--hairline))] flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
              <span>status · {item.status}</span>
              <span>{item.scheduled_at ? `agendado para ${new Date(item.scheduled_at).toLocaleString('pt-BR')}` : item.published_at ? `publicado ${new Date(item.published_at).toLocaleString('pt-BR')}` : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
