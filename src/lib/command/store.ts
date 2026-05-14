import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BarPrefill {
  agentSlug?: string;
  text?: string;
}

interface CommandState {
  bootSeenAt: number | null;
  activeWorkspaceId: string | null;
  commandBarOpen: boolean;
  activeRunId: string | null;
  barPrefill: BarPrefill | null;
  setBootSeen: () => void;
  setActiveWorkspace: (id: string) => void;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  toggleCommandBar: () => void;
  openBriefing: (prefill: BarPrefill) => void;
  consumeBarPrefill: () => BarPrefill | null;
  openRun: (id: string) => void;
  closeRun: () => void;
}

export const useCommandStore = create<CommandState>()(
  persist(
    (set, get) => ({
      bootSeenAt: null,
      activeWorkspaceId: null,
      commandBarOpen: false,
      activeRunId: null,
      barPrefill: null,
      setBootSeen: () => set({ bootSeenAt: Date.now() }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      openCommandBar: () => set({ commandBarOpen: true }),
      closeCommandBar: () => set({ commandBarOpen: false }),
      toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),
      openBriefing: (prefill) => set({ commandBarOpen: true, barPrefill: prefill }),
      consumeBarPrefill: () => {
        const p = get().barPrefill;
        if (p) set({ barPrefill: null });
        return p;
      },
      openRun: (id) => set({ activeRunId: id, commandBarOpen: false }),
      closeRun: () => set({ activeRunId: null }),
    }),
    {
      name: 'command-ai-shell',
      partialize: (s) => ({
        bootSeenAt: s.bootSeenAt,
        activeWorkspaceId: s.activeWorkspaceId,
      }),
    },
  ),
);
