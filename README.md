# Drop 🚀

<div align="center">

![Drop CLI](https://your-banner-image-url.png)

A powerful CLI tool powered by Nix for seamless package management.

<!-- [![Version](https://img.shields.io/npm/v/drop)](https://npmjs.org/package/drop)
[![Downloads/week](https://img.shields.io/npm/dw/drop)](https://npmjs.org/package/drop)
[![License](https://img.shields.io/npm/l/drop)](https://github.com/yourusername/drop/blob/master/package.json) -->

</div>

## ✨ Features

- 🔍 **Smart Package Search** - Fast and efficient package discovery
- 📦 **Version Control** - Install specific package versions
- 🗑️ **Clean Uninstallation** - Remove packages without residual files
- 📋 **Package Listing** - View all installed packages
- 🛠️ **Dev Shell Support** - Isolated development environments
- ⚡ **Cache System** - Lightning-fast package searches

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [pnpm](https://pnpm.io/) (v6 or higher)
- [Nix Package Manager](https://nixos.org/download.html)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/drop.git

# Navigate to project directory
cd drop

# Install dependencies
pnpm install

# Build the project
pnpm build

# Install CLI globally
pnpm link --global
```

## 📚 Usage Guide

### Basic Commands

```bash
# View all available commands
drop --help

# Check CLI version
drop --version
```

### Package Management

```bash
# List all available packages
drop list

# Search for specific packages
drop list python

# Install a package with specific version
drop install python313 3.13.0

# View installed packages
drop installed

# Remove a package
drop remove python313
```

### Development Shell

```bash
# Start a development shell
drop devVM
```

## 🏗️ Project Structure

```
drop/
├── dist/           # Compiled JavaScript code
├── src/            # TypeScript source files
│   ├── cli.ts      # Main CLI implementation
│   └── utils/      # Utility functions
├── package.json    # Project configuration
└── tsconfig.json   # TypeScript settings
```

## 🛠️ Development

```bash

# Build the project
pnpm run build

# Run directly after building
node dist/cli.js
```

## 📝 Configuration

The CLI uses several configuration files:
- `packages-cache.json` - Stores package information for faster searches
- `flake.nix` - Nix configuration for development shell

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Troubleshooting

### Common Issues

1. **Package Not Found**
   ```bash
   # Try updating the package cache
   rm packages-cache.json
   drop list
   ```

2. **Installation Fails**
   - Ensure Nix is properly installed
   - Check your system permissions
   - Verify package name and version

## 📮 Support

- Report bugs by creating an [issue](https://github.com/yourusername/drop/issues)
- Join our [Discord community](https://discord.gg/your-invite)
- Follow updates on [Twitter](https://twitter.com/your-handle)

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
Made with ❤️ by [Your Name]
</div>