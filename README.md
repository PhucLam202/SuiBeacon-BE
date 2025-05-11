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
- 🌐 **API Server** - Access package data via REST API

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Nix Package Manager](https://nixos.org/download.html)

### Installation

```bash
# Install from npm
npm install -g suibeacon

# Or clone the repository
git clone https://github.com/yourusername/beacon.git
cd beacon

# Install dependencies
npm install

# Build the project
npm run build

# Install CLI globally
npm link
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
beacon search python

# Install a package with specific version
beacon install python313 3.13.0

# View installed packages
beacon installed

# Remove a package
beacon remove python313

# Push all installed packages to hub
beacon push <projectName>
```

### Development Shell

```bash
# Start a development shell
beacon devVM
```

### API Server

```bash
# Start the API server
beacon server

# Start with custom port and host
beacon server --port 5000 --host 0.0.0.0

# The CLI uses our hosted API by default
# You can check the current server configuration
beacon config:show

# To use a different server
beacon config:set-server https://your-custom-server.com
```

## 🏗️ Project Structure

```
beacon/
├── dist/           # Compiled JavaScript code
├── src/            # TypeScript source files
│   ├── cli.ts      # Main CLI implementation
│   ├── server.ts   # API server implementation
│   ├── command/    # CLI commands
│   ├── router/     # API routes
│   └── service/    # Business logic
├── package.json    # Project configuration
└── tsconfig.json   # TypeScript settings
```

## 🛠️ Development

If you want to contribute to the project:

```bash
# Clone the repository
git clone https://github.com/yourusername/beacon.git

# Navigate to project directory
cd beacon

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

## 📝 Configuration

The CLI uses several configuration files:
- `packages-cache.json` - Stores package information for faster searches
- `flake.nix` - Nix configuration for development shell
- `.beacon-config.json` - User configuration for API server URL

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

3. **API Connection Issues**
   ```bash
   # Check current server configuration
   beacon config:show
   
   # Reset to default server
   beacon config:set-server https://suibeacon-be.onrender.com
   ```

## 🌐 API Server

Beacon provides an API server with the following endpoints:

### Starting Local Server

```bash
# Start the API server
beacon server

# With custom port and host
beacon server --port 5000 --host 0.0.0.0
```

### Deploying to Cloud

You can deploy the server to cloud platforms like Render, Railway, or Heroku:

#### Deploy to Render
1. Fork this repository
2. Sign up at [render.com](https://render.com)
3. Create a new Web Service and connect to your repository
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
5. Add environment variables from `.env.example`

#### Deploy to Railway
1. Sign up at [railway.app](https://railway.app)
2. Create a new project and connect to your GitHub repository
3. Add environment variables from `.env.example`

#### Deploy to Heroku
1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create suibeacon-api`
4. Add environment variables: `heroku config:set KEY=VALUE`
5. Deploy: `git push heroku main`

### Configuring CLI to Use Deployed Server

```bash
# Configure server URL
beacon config:set-server https://your-deployed-server.com

# View current configuration
beacon config:show
```

### Available Endpoints

- `GET /health`: Check server status
- `GET /v1/walrus`: Walrus API
- `GET /v1/listPackages`: List packages
- `GET /v1/display`: Display information

## 📮 Support

- Report bugs by creating an [issue](https://github.com/yourusername/beacon/issues)
- Join our [Discord community](https://discord.gg/your-invite)

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
Made with ❤️ by [Your Name]
</div>
