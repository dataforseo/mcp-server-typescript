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
    if (source && typeof source === 'object' && currentKey in source) {
      target[currentKey] = source[currentKey];
    }
    return;
  }

  // Not the final key, need to go deeper
  if (source && typeof source === 'object' && currentKey in source) {
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

function getNestedValue(obj: any, path: string[]): any {
  let current = obj;
  
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (key === '*') {
      // Handle wildcard
      if (Array.isArray(current)) {
        return current;
      } else if (typeof current === 'object') {
        return current;
      }
      return undefined;
    }
    
    if (Array.isArray(current)) {
      // When we hit an array, we need to apply the remaining path to each item
      const remainingPath = path.slice(path.indexOf(key));
      return current.map(item => getNestedValue(item, remainingPath)).filter(val => val !== undefined);
    }
    
    if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

function setNestedValue(obj: any, path: string[], value: any): void {
  if (value === undefined) {
    return;
  }
  
  let current = obj;
  
  // Navigate to the parent of the target key
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = path[path.length - 1];
  current[lastKey] = value;
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