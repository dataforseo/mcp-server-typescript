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