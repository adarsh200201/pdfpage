// Simple PDF data store without complex validation
// This bypasses all validation issues and directly stores/retrieves data

interface SimplePDFStorage {
  sessionId: string;
  pages: Uint8Array[];
  timestamp: number;
}

class SimplePDFDataStore {
  private storage = new Map<string, SimplePDFStorage>();
  private readonly STORAGE_KEY = "pdfstore_sessions";

  constructor() {
    // Try to restore from localStorage on initialization
    this.loadFromLocalStorage();
  }

  // Generate simple session ID
  generateSessionId(): string {
    return `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save to localStorage as backup
  private saveToLocalStorage(): void {
    try {
      const sessionIds = Array.from(this.storage.keys());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionIds));
      console.log(
        `💾 [SIMPLE-STORE] Saved session IDs to localStorage:`,
        sessionIds,
      );
    } catch (error) {
      console.warn(`⚠️ [SIMPLE-STORE] Failed to save to localStorage:`, error);
    }
  }

  // Load from localStorage
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const sessionIds = JSON.parse(stored);
        console.log(
          `📂 [SIMPLE-STORE] Found session IDs in localStorage:`,
          sessionIds,
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ [SIMPLE-STORE] Failed to load from localStorage:`,
        error,
      );
    }
  }

  // Store pages with minimal processing
  store(sessionId: string, pages: Uint8Array[]): boolean {
    console.log(
      `📦 [SIMPLE-STORE] Storing ${pages.length} pages for ${sessionId}`,
    );

    // Log each page before storage
    pages.forEach((page, index) => {
      console.log(`📄 [SIMPLE-STORE] Page ${index + 1}:`, {
        exists: !!page,
        type: typeof page,
        length: page?.length || 0,
        isUint8Array: page instanceof Uint8Array,
      });
    });

    try {
      // Store the data
      this.storage.set(sessionId, {
        sessionId,
        pages: pages, // Direct reference, no cloning
        timestamp: Date.now(),
      });

      // Save session ID to localStorage
      this.saveToLocalStorage();

      // Immediate verification
      const verified = this.storage.get(sessionId);
      const success = !!verified && verified.pages.length === pages.length;

      console.log(`✅ [SIMPLE-STORE] Storage verification:`, {
        sessionId,
        stored: !!verified,
        pageCount: verified?.pages?.length || 0,
        expectedPages: pages.length,
        success: success,
        timestamp: verified?.timestamp,
        allSessionIds: Array.from(this.storage.keys()),
        storageSize: this.storage.size,
      });

      if (!success) {
        console.error(
          `❌ [SIMPLE-STORE] Storage verification failed for ${sessionId}`,
        );
        return false;
      }

      // Double-check by trying to retrieve
      const testRetrieve = this.retrieve(sessionId);
      if (!testRetrieve || testRetrieve.length !== pages.length) {
        console.error(
          `❌ [SIMPLE-STORE] Test retrieval failed for ${sessionId}`,
        );
        return false;
      }

      console.log(
        `🎉 [SIMPLE-STORE] Storage and verification successful for ${sessionId}`,
      );
      return true;
    } catch (error) {
      console.error(
        `❌ [SIMPLE-STORE] Storage failed for ${sessionId}:`,
        error,
      );
      return false;
    }
  }

  // Retrieve pages with minimal processing
  retrieve(sessionId: string): Uint8Array[] | null {
    console.log(`📖 [SIMPLE-STORE] Retrieving pages for ${sessionId}`);
    console.log(
      `📖 [SIMPLE-STORE] Available sessions:`,
      Array.from(this.storage.keys()),
    );
    console.log(`📖 [SIMPLE-STORE] Storage size:`, this.storage.size);

    const storage = this.storage.get(sessionId);
    if (!storage) {
      console.error(`❌ [SIMPLE-STORE] No data found for session ${sessionId}`);
      console.error(
        `❌ [SIMPLE-STORE] Available sessions:`,
        Array.from(this.storage.keys()),
      );
      console.error(`❌ [SIMPLE-STORE] Session ID length:`, sessionId.length);
      console.error(`❌ [SIMPLE-STORE] Session ID type:`, typeof sessionId);
      return null;
    }

    console.log(`✅ [SIMPLE-STORE] Retrieved ${storage.pages.length} pages`);

    // Log each retrieved page
    storage.pages.forEach((page, index) => {
      console.log(`📄 [SIMPLE-STORE] Retrieved page ${index + 1}:`, {
        exists: !!page,
        type: typeof page,
        length: page?.length || 0,
        isUint8Array: page instanceof Uint8Array,
      });
    });

    return storage.pages;
  }

  // Get single page
  getPage(sessionId: string, pageIndex: number): Uint8Array | null {
    const pages = this.retrieve(sessionId);
    if (!pages || pageIndex < 0 || pageIndex >= pages.length) {
      return null;
    }
    return pages[pageIndex];
  }

  // Clear session
  clear(sessionId: string): void {
    this.storage.delete(sessionId);
    console.log(`🗑️ [SIMPLE-STORE] Cleared session ${sessionId}`);
  }

  // Clear all
  clearAll(): void {
    this.storage.clear();
    console.log(`🧹 [SIMPLE-STORE] Cleared all sessions`);
  }
}

// Ensure singleton instance
let storeInstance: SimplePDFDataStore | null = null;

export const simplePdfStore = (() => {
  if (!storeInstance) {
    storeInstance = new SimplePDFDataStore();
    console.log(`🏗️ [SIMPLE-STORE] Created new singleton instance`);
  }
  return storeInstance;
})();

// Also make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).simplePdfStore = simplePdfStore;
}
