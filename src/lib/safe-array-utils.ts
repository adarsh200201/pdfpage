/**
 * Safe Array Access Utilities
 * Prevents MobX array index out of bounds errors
 */

/**
 * Safely access array element by index with bounds checking
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
  fallback?: T,
): T | undefined {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArrayAccess: Array is null, undefined, or not an array");
    return fallback;
  }

  if (index < 0 || index >= array.length) {
    console.warn(
      `safeArrayAccess: Index ${index} is out of bounds for array of length ${array.length}`,
    );
    return fallback;
  }

  return array[index];
}

/**
 * Safely get first element of array
 */
export function safeArrayFirst<T>(
  array: T[] | undefined | null,
  fallback?: T,
): T | undefined {
  return safeArrayAccess(array, 0, fallback);
}

/**
 * Safely get last element of array
 */
export function safeArrayLast<T>(
  array: T[] | undefined | null,
  fallback?: T,
): T | undefined {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return fallback;
  }
  return safeArrayAccess(array, array.length - 1, fallback);
}

/**
 * Safely slice array with bounds checking
 */
export function safeArraySlice<T>(
  array: T[] | undefined | null,
  start: number = 0,
  end?: number,
): T[] {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArraySlice: Array is null, undefined, or not an array");
    return [];
  }

  const safeStart = Math.max(0, Math.min(start, array.length));
  const safeEnd =
    end !== undefined
      ? Math.max(safeStart, Math.min(end, array.length))
      : array.length;

  return array.slice(safeStart, safeEnd);
}

/**
 * Safely check if array has elements
 */
export function safeArrayHasElements<T>(
  array: T[] | undefined | null,
): boolean {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Safely get array length
 */
export function safeArrayLength<T>(array: T[] | undefined | null): number {
  return Array.isArray(array) ? array.length : 0;
}

/**
 * Safely map over array with error handling
 */
export function safeArrayMap<T, U>(
  array: T[] | undefined | null,
  mapFn: (item: T, index: number) => U,
  fallback: U[] = [],
): U[] {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArrayMap: Array is null, undefined, or not an array");
    return fallback;
  }

  try {
    return array.map(mapFn);
  } catch (error) {
    console.error("safeArrayMap: Error during mapping:", error);
    return fallback;
  }
}

/**
 * Safely filter array with error handling
 */
export function safeArrayFilter<T>(
  array: T[] | undefined | null,
  filterFn: (item: T, index: number) => boolean,
  fallback: T[] = [],
): T[] {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArrayFilter: Array is null, undefined, or not an array");
    return fallback;
  }

  try {
    return array.filter(filterFn);
  } catch (error) {
    console.error("safeArrayFilter: Error during filtering:", error);
    return fallback;
  }
}

/**
 * Safely find element in array
 */
export function safeArrayFind<T>(
  array: T[] | undefined | null,
  findFn: (item: T, index: number) => boolean,
  fallback?: T,
): T | undefined {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArrayFind: Array is null, undefined, or not an array");
    return fallback;
  }

  try {
    const result = array.find(findFn);
    return result !== undefined ? result : fallback;
  } catch (error) {
    console.error("safeArrayFind: Error during find:", error);
    return fallback;
  }
}

/**
 * Safely update array element by index
 */
export function safeArrayUpdate<T>(
  array: T[] | undefined | null,
  index: number,
  newValue: T,
): T[] {
  if (!array || !Array.isArray(array)) {
    console.warn("safeArrayUpdate: Array is null, undefined, or not an array");
    return [];
  }

  if (index < 0 || index >= array.length) {
    console.warn(
      `safeArrayUpdate: Index ${index} is out of bounds for array of length ${array.length}`,
    );
    return [...array]; // Return copy without changes
  }

  const newArray = [...array];
  newArray[index] = newValue;
  return newArray;
}

/**
 * Observable array safe access (for MobX compatibility)
 */
export function safeObservableArrayAccess<T>(
  observableArray: any,
  index: number,
  fallback?: T,
): T | undefined {
  // Check if it's a MobX observable array
  if (observableArray && typeof observableArray.get === "function") {
    // Use MobX array's get method for safe access
    try {
      if (index < 0 || index >= observableArray.length) {
        console.warn(
          `safeObservableArrayAccess: Index ${index} is out of bounds for observable array of length ${observableArray.length}`,
        );
        return fallback;
      }
      return observableArray.get(index);
    } catch (error) {
      console.error(
        "safeObservableArrayAccess: Error accessing observable array:",
        error,
      );
      return fallback;
    }
  }

  // Fallback to regular array access
  return safeArrayAccess(observableArray, index, fallback);
}

/**
 * Create a safe wrapper for array operations
 */
export function createSafeArrayWrapper<T>(array: T[] | undefined | null) {
  return {
    get length() {
      return safeArrayLength(array);
    },

    at(index: number, fallback?: T): T | undefined {
      return safeArrayAccess(array, index, fallback);
    },

    first(fallback?: T): T | undefined {
      return safeArrayFirst(array, fallback);
    },

    last(fallback?: T): T | undefined {
      return safeArrayLast(array, fallback);
    },

    slice(start?: number, end?: number): T[] {
      return safeArraySlice(array, start, end);
    },

    hasElements(): boolean {
      return safeArrayHasElements(array);
    },

    map<U>(mapFn: (item: T, index: number) => U, fallback: U[] = []): U[] {
      return safeArrayMap(array, mapFn, fallback);
    },

    filter(
      filterFn: (item: T, index: number) => boolean,
      fallback: T[] = [],
    ): T[] {
      return safeArrayFilter(array, filterFn, fallback);
    },

    find(
      findFn: (item: T, index: number) => boolean,
      fallback?: T,
    ): T | undefined {
      return safeArrayFind(array, findFn, fallback);
    },
  };
}

export default {
  safeArrayAccess,
  safeArrayFirst,
  safeArrayLast,
  safeArraySlice,
  safeArrayHasElements,
  safeArrayLength,
  safeArrayMap,
  safeArrayFilter,
  safeArrayFind,
  safeArrayUpdate,
  safeObservableArrayAccess,
  createSafeArrayWrapper,
};
