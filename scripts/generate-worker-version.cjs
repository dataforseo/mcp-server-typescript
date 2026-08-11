const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const content = `// Auto-generated from package.json - do not edit manually
// Generated on: ${new Date().toISOString()}

export const version = ${JSON.stringify(packageJson.version)};
export const name = ${JSON.stringify(packageJson.name)};

export default {
  version,
  name
};
`;

const workerDir = path.join(__dirname, "../src/worker");
if (!fs.existsSync(workerDir)) {
  fs.mkdirSync(workerDir, { recursive: true });
}

const outputPath = path.join(workerDir, "version.worker.ts");
fs.writeFileSync(outputPath, content);

console.log(
  `Generated worker version file with version ${packageJson.version}`
);
console.log(`Output: ${outputPath}`);
