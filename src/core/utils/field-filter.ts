type FieldPath = string | string[];

export function filterFields(data: unknown, fields: FieldPath[]): unknown {
  if (!data || !fields || fields.length === 0) {
    return data;
  }

  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const path = Array.isArray(field) ? field : field.split(".");
    extractAndSetValue(data, result, path);
  }

  pruneEmpty(result);
  return result;
}

function extractAndSetValue(
  source: unknown,
  target: Record<string, unknown> | unknown[],
  path: string[]
): void {
  if (path.length === 0) return;

  const [currentKey, ...remainingPath] = path;

  if (remainingPath.length === 0) {
    if (currentKey === "*") {
      if (Array.isArray(source)) {
        Object.assign(target, source);
      } else if (source && typeof source === "object") {
        Object.assign(target, source);
      }
    } else if (
      source &&
      typeof source === "object" &&
      currentKey in (source as object)
    ) {
      (target as Record<string, unknown>)[currentKey] = (
        source as Record<string, unknown>
      )[currentKey];
    }
    return;
  }

  if (currentKey === "*") {
    if (Array.isArray(source)) {
      const targetArray = target as unknown[];
      if (!Array.isArray(target)) {
        Object.keys(target).forEach((key) => delete (target as Record<string, unknown>)[key]);
        Object.setPrototypeOf(target, Array.prototype);
        (target as unknown as { length: number }).length = 0;
      }

      source.forEach((item, index) => {
        if (!targetArray[index]) {
          targetArray[index] = {};
        }
        extractAndSetValue(
          item,
          targetArray[index] as Record<string, unknown>,
          remainingPath
        );
      });
    } else if (source && typeof source === "object") {
      const sourceObj = source as Record<string, unknown>;
      const targetObj = target as Record<string, unknown>;
      Object.keys(sourceObj).forEach((key) => {
        if (!targetObj[key]) {
          targetObj[key] = {};
        }
        extractAndSetValue(
          sourceObj[key],
          targetObj[key] as Record<string, unknown>,
          remainingPath
        );
      });
    }
  } else if (
    source &&
    typeof source === "object" &&
    currentKey in (source as object)
  ) {
    const sourceValue = (source as Record<string, unknown>)[currentKey];
    const targetObj = target as Record<string, unknown>;

    if (Array.isArray(sourceValue)) {
      if (!targetObj[currentKey]) {
        targetObj[currentKey] = [];
      }
      const targetArray = targetObj[currentKey] as unknown[];

      sourceValue.forEach((item, index) => {
        if (!targetArray[index]) {
          targetArray[index] = {};
        }
        extractAndSetValue(
          item,
          targetArray[index] as Record<string, unknown>,
          remainingPath
        );
      });
    } else if (sourceValue && typeof sourceValue === "object") {
      if (!targetObj[currentKey]) {
        targetObj[currentKey] = {};
      }
      extractAndSetValue(
        sourceValue,
        targetObj[currentKey] as Record<string, unknown>,
        remainingPath
      );
    }
  }
}


// recursively prune empty objects/arrays created during filtering
function pruneEmpty(obj: any): boolean {
  if (Array.isArray(obj)) {
    // prune items from end to start to avoid index skew
    for (let i = obj.length - 1; i >= 0; --i) {
      if (pruneEmpty(obj[i])) {
        obj.splice(i, 1);
      }
    }
    return obj.length === 0;
  }

  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (pruneEmpty(obj[key])) {
        delete obj[key];
      }
    });
    return Object.keys(obj).length === 0;
  }

  // primitives are not empty
  return false;
}

export function parseFieldPaths(fields: string[]): FieldPath[] {
  return fields.map((field) => {
    if (field.includes("[")) {
      const [base, index] = field.split("[");
      return [base, index.replace("]", "")];
    }
    return field;
  });
}
