// Direct page storage without session dependencies
// This stores the latest split pages directly accessible without session IDs

class DirectPageStorage {
  private static instance: DirectPageStorage;
  private currentPages: Uint8Array[] = [];
  private lastUpdate: number = 0;

  static getInstance(): DirectPageStorage {
    if (!DirectPageStorage.instance) {
      DirectPageStorage.instance = new DirectPageStorage();
    }
    return DirectPageStorage.instance;
  }

  // Store pages directly - no session needed
  store(pages: Uint8Array[]): void {
    this.currentPages = [...pages]; // Clone array
    this.lastUpdate = Date.now();

    console.log(`🔥 [DIRECT-STORAGE] Direct storage updated:`, {
      pageCount: this.currentPages.length,
      firstPageSize: this.currentPages[0]?.length || 0,
      timestamp: this.lastUpdate,
    });
  }

  // Get all pages
  getAll(): Uint8Array[] {
    console.log(`🔥 [DIRECT-STORAGE] Retrieving all pages:`, {
      available: this.currentPages.length,
      lastUpdate: this.lastUpdate,
    });
    return this.currentPages;
  }

  // Get single page by index
  getPage(index: number): Uint8Array | null {
    if (index < 0 || index >= this.currentPages.length) {
      console.error(
        `🔥 [DIRECT-STORAGE] Page ${index + 1} out of range (0-${this.currentPages.length - 1})`,
      );
      return null;
    }

    const page = this.currentPages[index];
    console.log(
      `🔥 [DIRECT-STORAGE] Retrieved page ${index + 1}: ${page?.length || 0} bytes`,
    );
    return page;
  }

  // Get page count
  getCount(): number {
    return this.currentPages.length;
  }

  // Check if pages are available
  hasPages(): boolean {
    return this.currentPages.length > 0;
  }

  // Clear all pages
  clear(): void {
    console.log(
      `🔥 [DIRECT-STORAGE] Clearing ${this.currentPages.length} pages`,
    );
    this.currentPages = [];
    this.lastUpdate = 0;
  }

  // Get debug info
  getDebugInfo(): any {
    return {
      pageCount: this.currentPages.length,
      lastUpdate: this.lastUpdate,
      totalSize: this.currentPages.reduce(
        (sum, page) => sum + (page?.length || 0),
        0,
      ),
      pages: this.currentPages.map((page, index) => ({
        index: index + 1,
        size: page?.length || 0,
        exists: !!page,
      })),
    };
  }
}

export const directPageStorage = DirectPageStorage.getInstance();

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).directPageStorage = directPageStorage;
}
