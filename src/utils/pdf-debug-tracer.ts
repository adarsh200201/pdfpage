// Debug utility to trace PDF data corruption issues

export function debugPDFPageData(
  page: any,
  location: string,
  pageIndex?: number,
): void {
  const pageNum = pageIndex !== undefined ? pageIndex + 1 : "unknown";

  console.log(`🔍 [DEBUG-${location}] Page ${pageNum} analysis:`, {
    timestamp: new Date().toISOString(),
    exists: !!page,
    type: typeof page,
    isUint8Array: page instanceof Uint8Array,
    isNull: page === null,
    isUndefined: page === undefined,
    length: page?.length || 0,
    constructor: page?.constructor?.name,
    firstBytes:
      page instanceof Uint8Array && page.length >= 4
        ? Array.from(page.slice(0, 4))
            .map((b) => String.fromCharCode(b))
            .join("")
        : "N/A",
    lastBytes:
      page instanceof Uint8Array && page.length >= 4
        ? Array.from(page.slice(-4))
            .map((b) => String.fromCharCode(b))
            .join("")
        : "N/A",
    memoryAddress: page instanceof Uint8Array ? page.buffer : "N/A",
  });

  // Additional checks for corruption
  if (page instanceof Uint8Array && page.length > 0) {
    try {
      // Test access to random bytes
      const midPoint = Math.floor(page.length / 2);
      const testByte = page[midPoint];
      console.log(
        `🔍 [DEBUG-${location}] Page ${pageNum} mid-byte test: ${testByte}`,
      );

      // Test iteration
      let byteSum = 0;
      for (let i = 0; i < Math.min(100, page.length); i++) {
        byteSum += page[i];
      }
      console.log(
        `🔍 [DEBUG-${location}] Page ${pageNum} first 100 bytes sum: ${byteSum}`,
      );
    } catch (error) {
      console.error(
        `❌ [DEBUG-${location}] Page ${pageNum} memory access error:`,
        error,
      );
    }
  }
}

export function validatePDFPage(
  page: any,
  location: string,
  pageIndex?: number,
): boolean {
  const pageNum = pageIndex !== undefined ? pageIndex + 1 : "unknown";

  debugPDFPageData(page, location, pageIndex);

  if (!page) {
    console.error(
      `❌ [VALIDATE-${location}] Page ${pageNum} is null/undefined`,
    );
    return false;
  }

  if (!(page instanceof Uint8Array)) {
    console.error(
      `❌ [VALIDATE-${location}] Page ${pageNum} is not Uint8Array: ${typeof page}`,
    );
    return false;
  }

  if (page.length === 0) {
    console.error(`❌ [VALIDATE-${location}] Page ${pageNum} is empty`);
    return false;
  }

  if (page.length < 100) {
    console.error(
      `❌ [VALIDATE-${location}] Page ${pageNum} too small: ${page.length} bytes`,
    );
    return false;
  }

  try {
    const header = Array.from(page.slice(0, 4))
      .map((b) => String.fromCharCode(b))
      .join("");
    if (!header.startsWith("%PDF")) {
      console.error(
        `❌ [VALIDATE-${location}] Page ${pageNum} invalid header: ${header}`,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `❌ [VALIDATE-${location}] Page ${pageNum} header check failed:`,
      error,
    );
    return false;
  }

  console.log(`✅ [VALIDATE-${location}] Page ${pageNum} is valid`);
  return true;
}
