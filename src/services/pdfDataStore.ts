// Global PDF data store to preserve Uint8Array data integrity
// This bypasses React's serialization which corrupts binary data

class PDFDataStore {
  private splitPagesData: Map<string, Uint8Array[]> = new Map();
  private currentSessionId: string | null = null;

  // Generate a unique session ID for the current split operation
  generateSessionId(): string {
    const sessionId =
      Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    this.currentSessionId = sessionId;
    return sessionId;
  }

  // Store split pages data with session ID
  storeSplitPages(sessionId: string, pages: Uint8Array[]): void {
    console.log(
      `📦 Storing ${pages.length} pages in global store for session ${sessionId}`,
    );

    // Log input data before validation
    pages.forEach((page, index) => {
      console.log(`📄 [STORE-INPUT] Page ${index + 1}:`, {
        exists: !!page,
        type: typeof page,
        isUint8Array: page instanceof Uint8Array,
        length: page?.length || 0,
        firstBytes:
          page instanceof Uint8Array && page.length >= 4
            ? Array.from(page.slice(0, 4))
                .map((b) => String.fromCharCode(b))
                .join("")
            : "N/A",
      });
    });

    // Validate and clean pages before storage
    const validatedPages = pages.map((page, index) => {
      console.log(`🔍 [STORE-VALIDATE] Processing page ${index + 1}...`);

      if (!page || !(page instanceof Uint8Array) || page.length === 0) {
        console.error(
          `❌ [STORE] Page ${index + 1} is invalid during storage, marking as null`,
        );
        return null;
      }

      // Additional validation - check for minimum PDF size
      if (page.length < 100) {
        console.error(
          `❌ [STORE] Page ${index + 1} is too small (${page.length} bytes), marking as null`,
        );
        return null;
      }

      // Check PDF header before cloning
      try {
        const header = Array.from(page.slice(0, 4))
          .map((b) => String.fromCharCode(b))
          .join("");
        if (!header.startsWith("%PDF")) {
          console.error(
            `❌ [STORE] Page ${index + 1} has invalid PDF header: ${header}, marking as null`,
          );
          return null;
        }
      } catch (headerError) {
        console.error(
          `❌ [STORE] Page ${index + 1} header check failed:`,
          headerError,
        );
        return null;
      }

      // Clone the array to prevent memory corruption
      const clonedPage = new Uint8Array(page.length);
      clonedPage.set(page);

      // Verify the clone immediately
      if (!clonedPage || clonedPage.length !== page.length) {
        console.error(`❌ [STORE] Page ${index + 1} cloning failed`);
        return null;
      }

      console.log(
        `✅ [STORE] Page ${index + 1} validated and cloned: ${clonedPage.length} bytes`,
      );
      return clonedPage;
    });

    // Calculate total memory usage
    const totalBytes = validatedPages.reduce(
      (sum, page) => sum + (page?.length || 0),
      0,
    );
    const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
    console.log(`💾 Total memory usage: ${totalMB} MB`);

    // Check for memory issues
    if (totalBytes > 200 * 1024 * 1024) {
      // 200MB
      console.warn(
        `⚠️ Very high memory usage detected: ${totalMB} MB. This may cause browser instability.`,
      );
      // Trigger cleanup of old sessions
      this.cleanup();
    }

    const emptyPageCount = validatedPages.filter(
      (page) => page === null,
    ).length;
    const validPageCount = validatedPages.length - emptyPageCount;

    if (validPageCount === 0) {
      console.error("❌ All pages are invalid!");
      throw new Error("All pages are invalid or corrupted");
    }

    if (emptyPageCount > 0) {
      console.warn(
        `⚠️ Found ${emptyPageCount} invalid pages out of ${pages.length} total pages`,
      );
    }

    // Store validated pages - keep original array structure to maintain indexing
    this.splitPagesData.set(sessionId, validatedPages);
    this.currentSessionId = sessionId;

    // Final verification - count what we actually stored
    const finalStoredPages = this.splitPagesData.get(sessionId);
    const finalValidCount =
      finalStoredPages?.filter((p) => p !== null).length || 0;
    const finalNullCount =
      finalStoredPages?.filter((p) => p === null).length || 0;

    // Log storage stats
    console.log(
      `📊 [STORE] Storage complete: ${finalValidCount} valid pages, ${finalNullCount} null pages, ${totalMB} MB total`,
    );
    console.log(
      `📊 [STORE] Stored array length: ${finalStoredPages?.length}, Original array length: ${pages.length}`,
    );
  }

  // Retrieve split pages data by session ID
  getSplitPages(sessionId: string): Uint8Array[] | null {
    const pages = this.splitPagesData.get(sessionId);

    if (!pages) {
      console.error(`❌ No data found for session ${sessionId}`);
      return null;
    }

    console.log(
      `📖 Retrieved ${pages.length} pages from global store for session ${sessionId}`,
    );

    // Log what we found in storage before validation
    pages.forEach((page, index) => {
      console.log(`📄 [RETRIEVE-RAW] Page ${index + 1}:`, {
        exists: !!page,
        type: typeof page,
        isUint8Array: page instanceof Uint8Array,
        length: page?.length || 0,
        isNull: page === null,
        firstBytes:
          page instanceof Uint8Array && page.length >= 4
            ? Array.from(page.slice(0, 4))
                .map((b) => String.fromCharCode(b))
                .join("")
            : "N/A",
      });
    });

    // Verify data integrity when retrieving
    let corruptedCount = 0;
    let validCount = 0;

    const validatedPages = pages.map((page, index) => {
      console.log(`🔍 [RETRIEVE-VALIDATE] Processing page ${index + 1}...`);

      if (page === null) {
        console.error(`❌ [RETRIEVE] Page ${index + 1} was stored as null`);
        corruptedCount++;
        return null;
      }

      if (!page || !(page instanceof Uint8Array) || page.length === 0) {
        console.error(
          `❌ Page ${index + 1} is empty when retrieved from store`,
        );
        corruptedCount++;
        return null;
      }

      // Additional validation for corrupted data
      try {
        // Check if the Uint8Array is still valid
        const testByte = page[0];
        if (testByte === undefined) {
          throw new Error("Invalid Uint8Array");
        }

        // Check for minimum PDF signature (basic validation)
        if (page.length >= 4) {
          const header = Array.from(page.slice(0, 4))
            .map((b) => String.fromCharCode(b))
            .join("");
          if (!header.startsWith("%PDF")) {
            console.warn(
              `⚠️ Page ${index + 1} may be corrupted (invalid PDF header)`,
            );
          }
        }

        console.log(`✅ Page ${index + 1} validated: ${page.length} bytes`);
        validCount++;
        return page;
      } catch (validationError) {
        console.error(
          `❌ Page ${index + 1} failed validation:`,
          validationError,
        );
        corruptedCount++;
        return null;
      }
    });

    if (corruptedCount > 0) {
      console.warn(
        `⚠️ Found ${corruptedCount} corrupted pages out of ${pages.length} total pages`,
      );

      // If more than 50% of pages are corrupted, this is a critical memory issue
      if (corruptedCount > pages.length * 0.5) {
        console.error(
          `🚨 Critical: More than 50% of pages are corrupted. This may indicate memory issues.`,
        );

        // Force cleanup and garbage collection
        this.forceCleanup();

        // Return null to indicate critical failure
        return null;
      }
    }

    // Return validated pages array
    return validatedPages;
  }

  // Get a specific page by session ID and page index
  getPage(sessionId: string, pageIndex: number): Uint8Array | null {
    const pages = this.getSplitPages(sessionId);

    if (!pages || pageIndex < 0 || pageIndex >= pages.length) {
      console.error(
        `❌ Page ${pageIndex + 1} not found in session ${sessionId}`,
      );
      return null;
    }

    const page = pages[pageIndex];
    console.log(
      `📄 Retrieved page ${pageIndex + 1}: ${page?.length || 0} bytes`,
    );

    return page;
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Clear old session data (keep only last 2 sessions to save memory)
  cleanup(): void {
    const sessions = Array.from(this.splitPagesData.keys());
    if (sessions.length > 2) {
      const sessionsToRemove = sessions.slice(0, sessions.length - 2);
      sessionsToRemove.forEach((sessionId) => {
        this.splitPagesData.delete(sessionId);
        console.log(`🗑️ Cleaned up old session: ${sessionId}`);
      });

      // Force garbage collection if available
      this.triggerGarbageCollection();
    }
  }

  // Force cleanup when memory issues are detected
  forceCleanup(): void {
    console.log("🚨 Force cleanup triggered due to memory issues");

    // Keep only current session
    const currentSession = this.currentSessionId;
    const currentData = currentSession
      ? this.splitPagesData.get(currentSession)
      : null;

    this.splitPagesData.clear();

    if (currentSession && currentData) {
      this.splitPagesData.set(currentSession, currentData);
      console.log(`🔄 Preserved current session: ${currentSession}`);
    }

    this.triggerGarbageCollection();
  }

  // Trigger garbage collection if available
  private triggerGarbageCollection(): void {
    try {
      // Try to trigger garbage collection in development/testing environments
      if (typeof window !== "undefined" && (window as any).gc) {
        (window as any).gc();
        console.log("🗑️ Garbage collection triggered");
      }

      // Force memory cleanup by creating pressure
      if (
        typeof window !== "undefined" &&
        window.performance &&
        window.performance.memory
      ) {
        const memInfo = (window.performance as any).memory;
        console.log(
          `💾 Memory info: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB used of ${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB total`,
        );
      }
    } catch (error) {
      console.log("🗑️ Garbage collection not available");
    }
  }

  // Clear all data
  clearAll(): void {
    this.splitPagesData.clear();
    this.currentSessionId = null;
    this.triggerGarbageCollection();
    console.log("🧹 Cleared all PDF data store");
  }

  // Bypass method for direct storage without validation (for debugging)
  storeSplitPagesDirectly(sessionId: string, pages: Uint8Array[]): void {
    console.log(
      `🚨 [DIRECT-STORE] Storing ${pages.length} pages directly without validation`,
    );

    // Simply clone each page and store directly
    const clonedPages = pages.map((page, index) => {
      if (!page) {
        console.error(`🚨 [DIRECT-STORE] Page ${index + 1} is null/undefined`);
        return null;
      }

      const cloned = new Uint8Array(page.length);
      cloned.set(page);
      console.log(
        `🚨 [DIRECT-STORE] Page ${index + 1} cloned: ${cloned.length} bytes`,
      );
      return cloned;
    });

    this.splitPagesData.set(sessionId, clonedPages);
    this.currentSessionId = sessionId;

    console.log(
      `🚨 [DIRECT-STORE] Direct storage complete for session ${sessionId}`,
    );
  }
}

// Export singleton instance
export const pdfDataStore = new PDFDataStore();
