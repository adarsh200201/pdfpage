/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// React 18 createRoot type declarations
declare module 'react-dom/client' {
  import { ReactNode } from 'react';

  interface RootOptions {
    identifierPrefix?: string;
    onRecoverableError?: (error: Error) => void;
  }

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root;
  export function hydrateRoot(container: Element | Document, initialChildren: ReactNode, options?: RootOptions): Root;
}
