// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

const { transform } = require('@svgr/core');
const fs = require('fs');
const path = require('path');

const svgDir = path.join(__dirname, '../src/assets/icons');
const outputDir = path.join(__dirname, '../src/components/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVGR config for React Native
const svgrConfig = {
  native: true,
  typescript: true,
  plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
    ],
  },
};

// Index file content
let indexFileContent = `// This file is auto-generated. Do not edit manually
import { SvgProps } from 'react-native-svg';

`;

// Process all SVG files
function processDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      processDirectory(filePath, path.join(relativePath, file));
    } else if (path.extname(file) === '.svg') {
      const componentName = path
        .basename(file, '.svg')
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

      const svgCode = fs.readFileSync(filePath, 'utf8');

      // Transform SVG to React Native component
      transform(
        svgCode,
        {
          ...svgrConfig,
          componentName,
        },
        { componentName }
      ).then(result => {
        const outputPath = path.join(outputDir, `${componentName}.tsx`);
        fs.writeFileSync(outputPath, result);

        // Add to index file
        indexFileContent += `export { default as ${componentName} } from './${componentName}';\n`;
      });
    }
  });
}

// Start processing
processDirectory(svgDir);

// Write index file after slight delay to ensure all components are processed
setTimeout(() => {
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexFileContent);
  console.log('SVG conversion complete!');
}, 1000); 