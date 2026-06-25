import { create } from 'zustand'

/**
 * Tiny UI store for the mobile navigation drawer. The TopBar hamburger toggles
 * it; the Sidebar renders the drawer and closes it on navigation. Kept separate
 * from authStore so layout chrome never re-renders auth consumers.
 */
export type NavState = {
  mobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
  toggleMobileNav: () => void
}

export const useNavStore = create<NavState>((set) => ({
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
}))
