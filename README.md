# TypeScript to JavaScript Converter

A command-line tool to convert TypeScript (`.ts`) and TSX (`.tsx`) files to JavaScript (`.js`) and JSX (`.jsx`) files.

## Features

- Converts TypeScript/TSX files to JavaScript/JSX while preserving code structure
- Supports both single file and directory conversion
- Recursive directory processing
- Skips node_modules and hidden directories
- Dry-run mode to preview conversions
- Verbose output option for debugging
- Tracks and reports conversion success/failure statistics


## Usage

Run the tool using Node.js:

```bash
npx ttj [options]
```

### Options

- `-d, --dir <directory>`: Specify directory to convert (defaults to current working directory)
- `-f, --file <file>`: Convert a single file
- `-r, --dry-run`: Preview files that would be converted without making changes
- `-v, --verbose`: Show detailed output
- `-V, --version`: Display version number
- `-h, --help`: Display help information

### Examples

Convert a single file:

```bash
npx ttj -f src/index.ts
```

Convert all files in a directory:

```bash
npx ttj -d src
```

Dry run to preview conversions:

```bash
npx ttj -d src --dry-run
```

Verbose output:

```bash
npx ttj -d src --verbose
```

## License

This project is licensed under the MIT License - see the [LICENSE](https://grok.com/chat/LICENSE) file for details.
