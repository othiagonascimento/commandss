import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { commandDb } from '@/lib/command/db';
import { useCommandStore } from '@/lib/command/store';
import { generateContent } from '@/lib/command/content';
import { Plus, Loader2, X, Sparkles, Instagram, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  brief: string;
  channel: string;
  format: string;
  caption: string;
  hashtags: string[] | null;
  media_urls: Array<{ url: string }> | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const STATUS_TONE: Record<string, string> = {
  draft: 'hsl(var(--ink-muted))',
  ready: 'hsl(var(--brand-magenta))',
  scheduled: 'hsl(var(--brand-magenta))',
  published: 'hsl(var(--jade))',
  failed: 'hsl(var(--brand-magenta))',
};

export default function ContentPage() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: items, refetch } = useQuery({
    queryKey: ['command', 'content', wsId],
    queryFn: async () => {
      const { data } = await commandDb
        .from('content_items')
        .select('id,title,brief,channel,format,caption,hashtags,media_urls,status,scheduled_at,published_at,created_at')
        .eq('workspace_id', wsId!)
        .order('created_at', { ascending: false })
        .limit(40);
      return (data ?? []) as ContentItem[];
    },
    enabled: !!wsId,
  });

  return (
    <div className="px-8 lg:px-14 py-12 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-2">
            command · conteúdo
          </div>
          <h1 className="font-display text-[44px] leading-[0.95] tracking-tight text-[hsl(var(--ink-primary))]">
            Estúdio editorial.
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-md border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))] transition-colors text-[13px]"
        >
          <Plus className="w-3.5 h-3.5 text-[hsl(var(--brand-magenta))]" />
          Gerar conteúdo
        </button>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState onNew={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const cover = it.media_urls?.[0]?.url;
            return (
              <motion.button
                key={it.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/command/content/${it.id}`)}
                className="text-left rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] overflow-hidden hover:border-[hsl(var(--hairline-strong))] transition-colors flex flex-col"
              >
                <div className="aspect-square bg-[hsl(var(--surface-2))] relative overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[hsl(var(--ink-faint))]" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--canvas)/0.7)] backdrop-blur-md font-mono text-[9.5px] uppercase tracking-widest text-[hsl(var(--ink-secondary))]">
                    {it.channel === 'instagram' && <Instagram className="w-3 h-3" />}
                    {it.channel} · {it.format}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--canvas)/0.7)] backdrop-blur-md font-mono text-[9.5px] uppercase tracking-widest">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: STATUS_TONE[it.status] ?? 'hsl(var(--ink-muted))' }}
                    />
                    <span className="text-[hsl(var(--ink-secondary))]">{it.status}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[12.5px] text-[hsl(var(--ink-primary))] line-clamp-2 mb-1.5">
                    {it.caption || it.title}
                  </div>
                  {it.hashtags && it.hashtags.length > 0 && (
                    <div className="text-[10.5px] text-[hsl(var(--ink-muted))] line-clamp-1 mt-auto">
                      {it.hashtags.map((h) => `#${h}`).join(' ')}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <NewContentDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(id) => {
          refetch();
          navigate(`/command/content/${id}`);
        }}
        wsId={wsId}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[hsl(var(--hairline-strong))] py-20 px-6 text-center">
      <div className="font-display text-[24px] text-[hsl(var(--ink-secondary))] mb-3">
        Nenhuma peça ainda.
      </div>
      <div className="text-[13.5px] text-[hsl(var(--ink-muted))] mb-6 max-w-md mx-auto">
        Brifeie. Scribe escreve 3 variantes, Atelier produz a imagem editorial.
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[hsl(var(--brand-magenta))] text-[hsl(var(--brand-magenta))] text-[13px] hover:bg-[hsl(var(--brand-magenta)/0.08)] transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Gerar primeira peça
      </button>
    </div>
  );
}

function NewContentDialog({
  open,
  onClose,
  onCreated,
  wsId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  wsId: string | null;
}) {
  const [brief, setBrief] = useState('');
  const [channel, setChannel] = useState('instagram');
  const [format, setFormat] = useState('post');
  const [withImage, setWithImage] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!wsId || !brief.trim()) return;
    setBusy(true);
    try {
      const r = await generateContent({
        workspace_id: wsId,
        brief: brief.trim(),
        channel,
        format,
        with_image: withImage,
      });
      toast.success(`Conteúdo gerado · ${r.variants} variantes${r.has_image ? ' + imagem' : ''}`);
      setBrief('');
      onClose();
      onCreated(r.content_item_id);
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[hsl(var(--canvas)/0.78)] backdrop-blur-2xl" />
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-[min(620px,94vw)] rounded-2xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2)/0.94)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-[hsl(var(--hairline))]">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                gerar conteúdo · scribe + atelier
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-[hsl(var(--surface-3))]">
                <X className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <Pill label="Instagram" active={channel === 'instagram'} onClick={() => setChannel('instagram')} />
                <Pill label="Email" active={channel === 'email'} onClick={() => setChannel('email')} />
                <Pill label="LinkedIn" active={channel === 'linkedin'} onClick={() => setChannel('linkedin')} />
                <div className="flex-1" />
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-[hsl(var(--surface-1))] border border-[hsl(var(--hairline))] rounded-md px-2.5 h-8 text-[12px] text-[hsl(var(--ink-secondary))] focus:outline-none"
                >
                  <option value="post">post</option>
                  <option value="carousel">carrossel</option>
                  <option value="reel">reel</option>
                  <option value="story">story</option>
                  <option value="newsletter">newsletter</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] block mb-2">
                  brief
                </label>
                <textarea
                  autoFocus
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={4}
                  placeholder="Ex.: Como CRM com IA muda a operação de um restaurante. Tom provocador, 1 dado real, CTA de demo."
                  className="w-full bg-[hsl(var(--surface-1))] border border-[hsl(var(--hairline))] rounded-md px-3 py-2.5 text-[14px] text-[hsl(var(--ink-primary))] placeholder:text-[hsl(var(--ink-muted))] focus:outline-none focus:border-[hsl(var(--hairline-strong))]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withImage}
                  onChange={(e) => setWithImage(e.target.checked)}
                  className="accent-[hsl(var(--brand-magenta))]"
                />
                <span className="text-[12.5px] text-[hsl(var(--ink-secondary))]">
                  Atelier também produz a imagem
                </span>
              </label>
            </div>

            <div className="border-t border-[hsl(var(--hairline))] px-6 py-3 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                {busy ? 'gerando…' : 'gemini 2.5 flash · gemini image preview'}
              </div>
              <button
                onClick={submit}
                disabled={busy || !brief.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-[hsl(var(--brand-magenta))] text-white text-[12.5px] hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Gerar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-[12px] border transition-colors ${
        active
          ? 'border-[hsl(var(--brand-magenta)/0.6)] text-[hsl(var(--ink-primary))] bg-[hsl(var(--brand-magenta)/0.1)]'
          : 'border-[hsl(var(--hairline))] text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))]'
      }`}
    >
      {label}
    </button>
  );
}
