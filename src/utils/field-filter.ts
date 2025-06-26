type FieldPath = string | string[];

export function filterFields(data: any, fields: FieldPath[]): any {
  if (!data || !fields || fields.length === 0) {
    return data;
  }

  const result: any = {};

  fields.forEach(field => {
    const path = Array.isArray(field) ? field : field.split('.');
    extractAndSetValue(data, result, path);
  });

  return result;
}

function extractAndSetValue(source: any, target: any, path: string[]): void {
  if (path.length === 0) return;

  const [currentKey, ...remainingPath] = path;
  
  if (remainingPath.length === 0) {
    // This is the final key, extract the value
    if (currentKey === '*') {
      // Wildcard at the end - copy all properties/items
      if (Array.isArray(source)) {
        Object.assign(target, source);
      } else if (source && typeof source === 'object') {
        Object.assign(target, source);
      }
    } else if (source && typeof source === 'object' && currentKey in source) {
      target[currentKey] = source[currentKey];
    }
    return;
  }

  // Not the final key, need to go deeper
  if (currentKey === '*') {
    // Wildcard in the middle of the path
    if (Array.isArray(source)) {
      // Handle array with wildcard
      if (!Array.isArray(target)) {
        // Convert target to array to match source structure
        Object.keys(target).forEach(key => delete target[key]);
        Object.setPrototypeOf(target, Array.prototype);
        target.length = 0;
      }
      
      source.forEach((item, index) => {
        if (!target[index]) {
          target[index] = {};
        }
        extractAndSetValue(item, target[index], remainingPath);
      });
    } else if (source && typeof source === 'object') {
      // Handle object with wildcard
      Object.keys(source).forEach(key => {
        if (!target[key]) {
          target[key] = {};
        }
        extractAndSetValue(source[key], target[key], remainingPath);
      });
    }
  } else if (source && typeof source === 'object' && currentKey in source) {
    // Regular key handling
    const sourceValue = source[currentKey];
    
    if (Array.isArray(sourceValue)) {
      // Handle array - preserve array structure
      if (!target[currentKey]) {
        target[currentKey] = [];
      }
      
      sourceValue.forEach((item, index) => {
        if (!target[currentKey][index]) {
          target[currentKey][index] = {};
        }
        extractAndSetValue(item, target[currentKey][index], remainingPath);
      });
    } else if (sourceValue && typeof sourceValue === 'object') {
      // Handle object
      if (!target[currentKey]) {
        target[currentKey] = {};
      }
      extractAndSetValue(sourceValue, target[currentKey], remainingPath);
    }
  }
}

export function parseFieldPaths(fields: string[]): FieldPath[] {
  return fields.map(field => {
    // Handle array notation
    if (field.includes('[')) {
      const [base, index] = field.split('[');
      return [base, index.replace(']', '')];
    }
    return field;
  });
}

// Helper function to test wildcard patterns
export function matchesWildcardPattern(pattern: string, fieldPath: string): boolean {
  const patternParts = pattern.split('.');
  const fieldParts = fieldPath.split('.');
  
  if (patternParts.length !== fieldParts.length) {
    return false;
  }
  
  return patternParts.every((part, index) => {
    return part === '*' || part === fieldParts[index];
  });
}

// Alternative implementation using a more explicit wildcard handling approach
export function filterFieldsWithWildcards(data: any, fields: string[]): any {
  if (!data || !fields || fields.length === 0) {
    return data;
  }

  const result: any = {};
  
  fields.forEach(fieldPattern => {
    const paths = expandWildcardPattern(data, fieldPattern.split('.'));
    paths.forEach(path => {
      extractAndSetValue(data, result, path);
    });
  });

  return result;
}

function expandWildcardPattern(data: any, pattern: string[], currentPath: string[] = []): string[][] {
  if (pattern.length === 0) {
    return [currentPath];
  }

  const [currentPattern, ...remainingPattern] = pattern;
  const paths: string[][] = [];

  if (currentPattern === '*') {
    // Wildcard - expand to all available keys/indices
    if (Array.isArray(data)) {
      data.forEach((_, index) => {
        const newPath = [...currentPath, index.toString()];
        const subPaths = expandWildcardPattern(data[index], remainingPattern, newPath);
        paths.push(...subPaths);
      });
    } else if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        const newPath = [...currentPath, key];
        const subPaths = expandWildcardPattern(data[key], remainingPattern, newPath);
        paths.push(...subPaths);
      });
    }
  } else {
    // Regular key
    if (data && typeof data === 'object' && currentPattern in data) {
      const newPath = [...currentPath, currentPattern];
      const subPaths = expandWildcardPattern(data[currentPattern], remainingPattern, newPath);
      paths.push(...subPaths);
    }
  }

  return paths;
}