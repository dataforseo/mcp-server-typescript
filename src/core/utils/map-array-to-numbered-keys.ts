/**
 * Maps an array of strings to an object with numbered keys
 * @param arr Array of strings to map
 * @returns Object with numbered keys (1-based index)
 * @example
 * const arr = ['val_1', 'val_2', 'val_3']
 * const result = mapArrayToNumberedKeys(arr)
 * // result = { '1': 'val_1', '2': 'val_2', '3': 'val_3' }
 */
export function mapArrayToNumberedKeys<T extends string>(arr: T[]): Record<string, T> {
    return arr.reduce((acc, val, index) => {
        acc[String(index + 1)] = val;
        return acc;
    }, {} as Record<string, T>);
} 