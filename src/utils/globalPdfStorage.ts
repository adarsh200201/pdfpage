// Global PDF storage that persists across component lifecycles
// This is the ultimate backup when everything else fails

interface GlobalPDFData {
  sessionId: string;
  pages: Uint8Array[];
  timestamp: number;
  componentId: string;
}

class GlobalPDFStorage {
  private static instance: GlobalPDFStorage;
  private storage = new Map<string, GlobalPDFData>();

  static getInstance(): GlobalPDFStorage {
    if (!GlobalPDFStorage.instance) {
      GlobalPDFStorage.instance = new GlobalPDFStorage();
      console.log(`🌍 [GLOBAL-STORAGE] Created global storage instance`);
    }
    return GlobalPDFStorage.instance;
  }

  store(sessionId: string, pages: Uint8Array[], componentId?: string): void {
    console.log(
      `🌍 [GLOBAL-STORAGE] Storing ${pages.length} pages for ${sessionId}`,
    );

    this.storage.set(sessionId, {
      sessionId,
      pages,
      timestamp: Date.now(),
      componentId: componentId || "unknown",
    });

    console.log(
      `🌍 [GLOBAL-STORAGE] Global storage now has ${this.storage.size} sessions`,
    );
  }

  retrieve(sessionId: string): Uint8Array[] | null {
    console.log(`🌍 [GLOBAL-STORAGE] Retrieving ${sessionId}`);
    console.log(
      `🌍 [GLOBAL-STORAGE] Available sessions:`,
      Array.from(this.storage.keys()),
    );

    const data = this.storage.get(sessionId);
    if (!data) {
      console.error(`🌍 [GLOBAL-STORAGE] Session ${sessionId} not found`);
      return null;
    }

    console.log(`🌍 [GLOBAL-STORAGE] Found ${data.pages.length} pages`);
    return data.pages;
  }

  getPage(sessionId: string, pageIndex: number): Uint8Array | null {
    const pages = this.retrieve(sessionId);
    if (!pages || pageIndex < 0 || pageIndex >= pages.length) {
      return null;
    }
    return pages[pageIndex];
  }

  listSessions(): string[] {
    return Array.from(this.storage.keys());
  }

  clear(sessionId?: string): void {
    if (sessionId) {
      this.storage.delete(sessionId);
      console.log(`🌍 [GLOBAL-STORAGE] Cleared session ${sessionId}`);
    } else {
      this.storage.clear();
      console.log(`🌍 [GLOBAL-STORAGE] Cleared all sessions`);
    }
  }
}

// Export singleton instance
export const globalPdfStorage = GlobalPDFStorage.getInstance();

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).globalPdfStorage = globalPdfStorage;
}
