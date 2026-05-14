import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CommandState {
  bootSeenAt: number | null;
  activeWorkspaceId: string | null;
  commandBarOpen: boolean;
  setBootSeen: () => void;
  setActiveWorkspace: (id: string) => void;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  toggleCommandBar: () => void;
}

export const useCommandStore = create<CommandState>()(
  persist(
    (set) => ({
      bootSeenAt: null,
      activeWorkspaceId: null,
      commandBarOpen: false,
      setBootSeen: () => set({ bootSeenAt: Date.now() }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      openCommandBar: () => set({ commandBarOpen: true }),
      closeCommandBar: () => set({ commandBarOpen: false }),
      toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),
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
