# beacon 🚀

<div align="center">

![beacon CLI](https://your-banner-image-url.png)

A powerful CLI tool powered by Nix for seamless package management.

<!-- [![Version](https://img.shields.io/npm/v/beacon)](https://npmjs.org/package/beacon)
[![Downloads/week](https://img.shields.io/npm/dw/beacon)](https://npmjs.org/package/beacon)
[![License](https://img.shields.io/npm/l/beacon)](https://github.com/yourusername/beacon/blob/master/package.json) -->

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
- [Nix Package Manager](https://nixos.org/download.html)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/beacon.git

# Navigate to project directory
cd beacon

# Install dependencies
npm install

# Build the project
npm build

# Install CLI globally
npm link --global
```

## 📚 Usage Guide

### Basic Commands

```bash
# View all available commands
beacon --help

# Check CLI version
beacon --version
```

### Package Management

```bash
# List all available packages
beacon list

# Search for specific packages
beacon list python

# Install a package with specific version
beacon install python313 3.13.0

# View installed packages
beacon installed

# Remove a package
beacon remove python313

# Push all installed packages to hub
beacon pushlist
```

### Development Shell

```bash
# Start a development shell
beacon devVM
```

## 🏗️ Project Structure

```
beacon/
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
npm run build

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
   beacon list
   ```

2. **Installation Fails**
   - Ensure Nix is properly installed
   - Check your system permissions
   - Verify package name and version

## 📮 Support

- Report bugs by creating an [issue](https://github.com/yourusername/beacon/issues)
- Join our [Discord community](https://discord.gg/your-invite)
- Follow updates on [Twitter](https://twitter.com/your-handle)

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
Made with ❤️ by [Your Name]
</div>
