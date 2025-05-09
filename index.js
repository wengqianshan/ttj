#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { parse, print } from 'recast';
import { transformFromAstSync } from '@babel/core';
import transformTypescript from '@babel/plugin-transform-typescript';
import $bo from 'recast/parsers/_babel_options.js';
import { parser } from 'recast/parsers/babel.js';
import { program } from 'commander';
import { createRequire } from 'node:module';

// Using more reliable version fetching method
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

// Configuration constants
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx']);
const OUTPUT_EXTENSIONS = {
  '.ts': '.js',
  '.tsx': '.jsx'
};
const IGNORED_DIRS = new Set(['node_modules', '.git', '.vscode', '.idea']);

/**
 * Converts TypeScript code to JavaScript
 * @param {string} sourceCode - Source code to convert
 * @returns {string|null} Converted code or null if conversion fails
 */
function convertTypeScript(sourceCode) {
  try {
    const ast = parse(sourceCode, {
      parser: {
        parse: (source, options) => {
          const babelOptions = $bo.default(options);
          babelOptions.plugins.push('typescript', 'jsx');
          return parser.parse(source, babelOptions);
        },
      },
    });

    const { ast: transformedAST } = transformFromAstSync(ast, sourceCode, {
      cloneInputAst: false,
      code: false,
      ast: true,
      plugins: [[transformTypescript, { isTSX: sourceCode.includes('tsx') }]],
      configFile: false,
    });

    return print(transformedAST).code;
  } catch (error) {
    console.error('Conversion error:', error.message);
    return null;
  }
}

/**
 * Processes a single file conversion
 * @param {string} filePath - Path to the file to process
 * @returns {Promise<boolean>} Whether the conversion was successful
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    console.warn(`Skipping unsupported file type: ${filePath}`);
    return false;
  }

  try {
    const sourceCode = await fs.readFile(filePath, 'utf-8');
    const convertedCode = convertTypeScript(sourceCode);

    if (!convertedCode) {
      throw new Error('Conversion failed');
    }

    const newExt = OUTPUT_EXTENSIONS[ext];
    const newPath = filePath.slice(0, -ext.length) + newExt;

    // Write new file first before deleting original for data safety
    await fs.writeFile(newPath, convertedCode);
    await fs.unlink(filePath);

    console.log(`Successfully converted: ${path.basename(filePath)} → ${path.basename(newPath)}`);
    return true;
  } catch (error) {
    console.error(`Failed to process file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively converts files in a directory
 * @param {string} dirPath - Directory path to process
 * @returns {Promise<{success: number, failure: number}>} Conversion statistics
 */
async function convertDirectory(dirPath) {
  let successCount = 0;
  let failureCount = 0;

  async function processDirectory(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
            await processDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const result = await processFile(fullPath);
          result ? successCount++ : failureCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${currentDir}:`, error.message);
      failureCount++;
    }
  }

  await processDirectory(dirPath);
  return { success: successCount, failure: failureCount };
}

// Configure command line interface
program
  .version(version)
  .description('Convert TypeScript/TSX files to JavaScript/JSX files')
  .option('-d, --dir <directory>', 'Directory to convert', process.cwd())
  .option('-f, --file <file>', 'Single file to convert')
  .option('-r, --dry-run', 'Show what files would be converted without actually doing it')
  .option('-v, --verbose', 'Show verbose output')
  .parse(process.argv);

async function main() {
  const { dir, file, dryRun, verbose } = program.opts();

  if (verbose) {
    console.log('Runtime parameters:', { dir, file, dryRun });
  }

  if (dryRun) {
    console.log('Dry run mode: Only showing what files would be converted');
  }

  try {
    if (file) {
      if (dryRun) {
        console.log(`Would convert file: ${file}`);
      } else {
        await processFile(file);
      }
    } else {
      if (dryRun) {
        console.log(`Would scan directory: ${dir}`);
      } else {
        const { success, failure } = await convertDirectory(dir);
        console.log(`Conversion complete! Success: ${success}, Failures: ${failure}`);
      }
    }
  } catch (error) {
    console.error('Error during processing:', error.message);
    process.exit(1);
  }
}

main();