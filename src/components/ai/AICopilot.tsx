import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Sparkles, X, Send, Loader2, User, Bot, Maximize2, Minimize2,
  Mic, MicOff, Image as ImageIcon, Trash2, Plus, Wrench, Zap, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface ToolCallEvent { name: string; args: any; ok?: boolean }
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  layer?: string;
  model?: string;
  tools?: ToolCallEvent[];
  attachments?: { type: 'image' | 'audio'; dataUrl: string }[];
}

const LAYER_BADGE: Record<string, { label: string; color: string; Icon: any }> = {
  layer_1: { label: 'L1 Router', color: 'bg-blue-500/15 text-blue-500', Icon: Zap },
  layer_2: { label: 'L2 Standard', color: 'bg-amber-500/15 text-amber-500', Icon: Cpu },
  layer_3: { label: 'L3 Elite', color: 'bg-purple-500/15 text-purple-500', Icon: Sparkles },
};

const SUGGESTIONS_BY_ROUTE: Record<string, string[]> = {
  '/tenants': ['Quais tenants estão em risco esta semana?', 'Top 5 tenants por consumo de IA', 'Quantos tenants ativos no plano Pro?'],
  '/finops': ['Custo total de API nos últimos 30 dias', 'Qual provedor está mais caro?', 'Compare custos OpenAI vs Gemini'],
  '/dashboard': ['Resumo executivo do mês', 'MRR atual e variação', 'Tenants criados nos últimos 7 dias'],
};

function getSuggestions(pathname: string): string[] {
  for (const k of Object.keys(SUGGESTIONS_BY_ROUTE)) if (pathname.startsWith(k)) return SUGGESTIONS_BY_ROUTE[k];
  return ['Resumo executivo do mês', 'Quais tenants estão em risco?', 'Custo de API últimos 7 dias'];
}

export function AICopilot() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ type: 'image' | 'audio'; dataUrl: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cmd+J / Ctrl+J shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape' && expanded) setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen, expanded]);

  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setAttachments([]);
  }, []);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && attachments.length === 0) || isLoading) return;

    // Build user message content (multimodal-aware)
    let userContent: any = content;
    if (attachments.length > 0) {
      userContent = [
        ...(content ? [{ type: 'text', text: content }] : []),
        ...attachments.map((a) =>
          a.type === 'image'
            ? { type: 'image_url', image_url: { url: a.dataUrl } }
            : { type: 'input_audio', input_audio: { data: a.dataUrl.split(',')[1], format: 'webm' } }
        ),
      ];
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      attachments: attachments.length ? [...attachments] : undefined,
    };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', tools: [] };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sessão expirada');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/master-copilot`;
      const historyForApi = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent },
      ];
      const requestController = new AbortController();
      const requestTimeout = window.setTimeout(() => requestController.abort(), 60_000);

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            messages: historyForApi,
            conversation_id: conversationId,
            route_context: location.pathname,
          }),
          signal: requestController.signal,
        });
        if (!resp.ok || !resp.body) {
          const txt = await resp.text();
          throw new Error(`Erro ${resp.status}: ${txt.slice(0, 200)}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            let evt: any;
            try {
              evt = JSON.parse(json);
            } catch {
              continue;
            }
            if (evt.type === 'meta') {
              if (evt.conversation_id) setConversationId(evt.conversation_id);
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsg.id ? { ...m, layer: evt.layer, model: evt.model } : m))
              );
            } else if (evt.type === 'tool_call') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, tools: [...(m.tools || []), { name: evt.name, args: evt.args }] }
                    : m
                )
              );
            } else if (evt.type === 'tool_result') {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantMsg.id) return m;
                  const tools = [...(m.tools || [])];
                  for (let i = tools.length - 1; i >= 0; i--) {
                    if (tools[i].name === evt.name && tools[i].ok === undefined) { tools[i].ok = evt.ok; break; }
                  }
                  return { ...m, tools };
                })
              );
            } else if (evt.type === 'delta') {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + evt.text } : m))
              );
            } else if (evt.type === 'done') {
              streamDone = true;
            } else if (evt.type === 'error') {
              throw new Error(evt.message);
            }
          }
        }
      } finally {
        window.clearTimeout(requestTimeout);
      }
    } catch (e: any) {
      const message = e?.name === 'AbortError'
        ? 'Tempo limite excedido ao chamar o Copiloto. Verifique as secrets do provedor de IA no Supabase.'
        : e?.message || 'Erro no copilot';
      toast.error(message);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: `❌ ${message}` } : m))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Voice recording =====
  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments((a) => [...a, { type: 'audio', dataUrl: reader.result as string }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorderRef.current = mr;
      setIsRecording(true);
    } catch {
      toast.error('Permissão de microfone negada');
    }
  };
  const stopRecord = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onloadend = () => setAttachments((a) => [...a, { type: 'image', dataUrl: r.result as string }]);
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const suggestions = getSuggestions(location.pathname);

  // ===== UI =====
  const ChatBody = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Copiloto Master</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={newConversation} title="Nova conversa">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)} title={expanded ? 'Reduzir' : 'Expandir'}>
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Olá! 👋 Pergunte sobre tenants, MRR, custos, ou peça análises. Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd+J</kbd> para abrir/fechar.
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">Sugestões para esta página:</div>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-md border hover:bg-accent transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={cn('max-w-[85%] space-y-1.5', m.role === 'user' && 'items-end')}>
                {m.role === 'assistant' && m.layer && (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const b = LAYER_BADGE[m.layer];
                      const I = b?.Icon || Sparkles;
                      return (
                        <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded', b?.color)}>
                          <I className="h-2.5 w-2.5" /> {b?.label} · {m.model}
                        </span>
                      );
                    })()}
                  </div>
                )}
                {m.tools && m.tools.length > 0 && (
                  <div className="space-y-1">
                    {m.tools.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Wrench className="h-3 w-3" />
                        <code className="bg-muted px-1 rounded">{t.name}</code>
                        {t.ok === undefined ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className={t.ok ? 'text-emerald-500' : 'text-destructive'}>{t.ok ? '✓' : '×'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {m.attachments?.map((a, i) =>
                    a.type === 'image' ? (
                      <img key={i} src={a.dataUrl} className="max-h-32 rounded mb-1" />
                    ) : (
                      <div key={i} className="text-xs italic mb-1">🎤 áudio anexado</div>
                    )
                  )}
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-ul:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || (isLoading ? '…' : '')}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
              {m.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t flex gap-2 flex-wrap">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              {a.type === 'image' ? (
                <img src={a.dataUrl} className="h-12 w-12 object-cover rounded" />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs">🎤</div>
              )}
              <button
                onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => fileRef.current?.click()} title="Anexar imagem">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={isRecording ? stopRecord : startRecord}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Pergunte algo… (Enter envia, Shift+Enter quebra linha)"
            rows={1}
            className="min-h-[36px] max-h-32 resize-none text-sm"
            disabled={isLoading}
          />
          <Button onClick={() => sendMessage()} disabled={isLoading} size="icon" className="h-9 w-9 flex-shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating button — sits above mobile bottom nav and respects safe-area */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)',
            }}
            className="lg:!bottom-6 fixed right-4 lg:right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            title="Abrir copiloto (Cmd+J)"
          >
            <Sparkles className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile: full-screen sheet from bottom for native feel */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            className="h-[100dvh] w-full p-0 border-0 rounded-none gap-0 flex flex-col"
          >
            <div className="flex-1 min-h-0 pt-safe pb-safe">
              {ChatBody}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <>
          {/* Floating panel (compact) */}
          <AnimatePresence>
            {isOpen && !expanded && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] rounded-xl shadow-2xl border bg-background overflow-hidden"
              >
                {ChatBody}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded sheet */}
          <Sheet open={isOpen && expanded} onOpenChange={(o) => !o && setIsOpen(false)}>
            <SheetContent side="right" className="w-[80vw] sm:max-w-[900px] p-0">
              {ChatBody}
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  );
}
