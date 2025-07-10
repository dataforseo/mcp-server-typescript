const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Generate worker version file content
const content = `// Auto-generated from package.json - do not edit manually
// Generated on: ${new Date().toISOString()}

export const version = "${packageJson.version}";
export const name = "${packageJson.name}";

export default {
  version,
  name
};
`;

// Ensure the worker directory exists
const workerDir = path.join(__dirname, '../src/worker');
if (!fs.existsSync(workerDir)) {
  fs.mkdirSync(workerDir, { recursive: true });
}

// Write the version file
const outputPath = path.join(workerDir, 'version.worker.ts');
fs.writeFileSync(outputPath, content);

console.log(`✅ Generated worker version file with version ${packageJson.version}`);
console.log(`📁 Output: ${outputPath}`);
