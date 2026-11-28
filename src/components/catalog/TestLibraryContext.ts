import { createContext } from 'react'

/** Only the library route opts into the premium presentation. */
export const TestLibraryContext = createContext<{ search: string; onSearchChange: (value: string) => void } | null>(null)
