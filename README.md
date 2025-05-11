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
beacon pushlist <projectName>
```

### Development Shell

```bash
# Start a development shell
beacon devVM
```

### API Server

```bash
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
│   └── utils/      # Utility functions
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

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
Made with ❤️ by [Your Name]
</div>

## 🌐 API Server

Beacon cung cấp API server với các endpoint sau:

### Khởi động server local

```bash
# Sử dụng CLI command
beacon server

# Với tùy chọn port và host
beacon server --port 5000 --host 0.0.0.0
```

### Deploy server lên cloud

Bạn có thể deploy server lên các nền tảng cloud như Render, Railway hoặc Heroku:

#### Deploy lên Render
1. Fork repository này
2. Đăng ký tài khoản tại [render.com](https://render.com)
3. Tạo Web Service mới và kết nối với repository
4. Cấu hình:
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
5. Thêm các biến môi trường từ file `.env`

#### Deploy lên Railway
1. Đăng ký tại [railway.app](https://railway.app)
2. Tạo project mới và kết nối với GitHub repository
3. Thêm các biến môi trường từ file `.env`

#### Deploy lên Heroku
1. Cài đặt Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Tạo app: `heroku create suibeacon-api`
4. Thêm biến môi trường: `heroku config:set KEY=VALUE`
5. Deploy: `git push heroku main`

### Cấu hình CLI để sử dụng server đã deploy

```bash
# Cấu hình server URL
beacon config:set-server https://your-deployed-server.com

# Xem cấu hình hiện tại
beacon config:show
```

### Các endpoint có sẵn

- `GET /health`: Kiểm tra trạng thái server
- `GET /v1/walrus`: API Walrus
- `GET /v1/listPackages`: Liệt kê packages
- `GET /v1/display`: Hiển thị thông tin
