# SuiBeacon Documentation

Tài liệu chi tiết về dự án SuiBeacon - Package Manager với CLI tool và API server.

## 📚 Mục lục tài liệu

### [01. Project Overview](./01-project-overview.md)
- Tổng quan về dự án SuiBeacon
- Kiến trúc hệ thống và thành phần chính
- Công nghệ sử dụng và cấu trúc thư mục
- Use cases và roadmap

### [02. CLI Workflow](./02-cli-workflow.md) 
- Luồng hoạt động của CLI tool (`beacon`)
- Chi tiết các commands và workflows
- Configuration files và error handling
- Performance optimizations

### [03. API Server Workflow](./03-api-server-workflow.md)
- Luồng hoạt động của API Server
- Endpoints và middleware stack
- Database models và services
- Deployment configurations

### [04. Interaction Flow Diagram](./04-interaction-flow-diagram.md)
- Sơ đồ tương tác giữa CLI và API Server
- Sequence diagrams cho các workflows chính
- Data flow architecture
- Security và concurrency handling

## 🚀 Quick Start

### Cài đặt CLI
```bash
npm install -g suibeacon
```

### Sử dụng cơ bản
```bash
# Xem help
beacon --help

# Login với wallet address
beacon login 0x123...

# Cài đặt package
beacon install python313

# Liệt kê packages đã cài
beacon list

# Push lên cloud
beacon push myproject

# Pull từ cloud
beacon pull walrus://blobId
```

### Chạy API Server
```bash
# Từ CLI
beacon server --port 3000

# Hoặc trực tiếp
npm run dev
```

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Client    │───▶│   API Server    │───▶│   Database      │
│   (beacon)      │    │   (Express.js)  │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └─────────────▶│  Walrus Network │◀─────────────┘
                        │  (File Storage) │
                        └─────────────────┘
```

## 🔧 Core Components

### CLI Tool
- **Ngôn ngữ**: TypeScript/Node.js
- **Entry Point**: `src/cli.ts`
- **Commands**: `src/command/`
- **Binary**: `beacon`

### API Server  
- **Ngôn ngữ**: TypeScript/Node.js
- **Entry Point**: `src/server.ts`
- **Routes**: `src/router/`
- **Controllers**: `src/controller/`

### External Services
- **Nix**: Package management
- **MongoDB**: Data storage
- **Walrus**: Decentralized file storage

## 📊 Key Features

### CLI Features
- 🔍 Smart package search với cache
- 📦 Version-specific installation
- 🗑️ Clean package removal
- 📋 Installed package listing
- 🌐 Cloud sync với Walrus
- ⚡ Environment templates
- 🛠️ Development server mode

### API Features
- 📤 File upload/download qua Walrus
- 📊 Package data management
- 👤 User data tracking
- 📈 Usage analytics
- 🔒 Rate limiting và security
- 🏥 Health monitoring

## 🔄 Workflows chính

### Package Installation
```
User → CLI → Nix → Local Profile
```

### Cloud Sync
```
CLI → API Server → Walrus Network
                 ↓
             MongoDB Storage
```

### Package Search
```
CLI → Local Cache → API Server → Nix Registry
```

## 🌐 API Endpoints

### Walrus Operations
- `POST /v1/walrus/upload` - Upload data to Walrus
- `GET /v1/walrus/download/:blobId` - Download from Walrus

### Package Management
- `GET /v1/listPackages` - List available packages
- `POST /v1/walrus/pushPackages` - Push package list

### System
- `GET /health` - Health check

## 🔧 Development

### Setup
```bash
git clone https://github.com/PhucLam202/SuiBeacon-BE
cd SuiBeacon
npm install
npm run build
npm link
```

### Scripts
```bash
npm run build    # Compile TypeScript
npm run start    # Start API server
npm run dev      # Development server
```

### Environment Variables
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/suibeacon
```

## 📝 Configuration Files

- **package.json**: Dependencies và scripts
- **tsconfig.json**: TypeScript configuration  
- **flake.nix**: Nix development environment
- **packages-cache.json**: Local package cache
- **.beacon-config.json**: User configuration

## 🚨 Error Handling

### CLI Errors
- Nix không khả dụng
- Package không tìm thấy  
- Network connectivity issues
- Authentication required

### API Errors
- Database connection failures
- Walrus network errors
- Rate limiting
- Validation errors

## 🔒 Security

### CLI Security
- Local file access only
- HTTPS API communications
- Input validation

### API Security
- CORS protection
- Rate limiting (100 req/15min)
- Security headers
- Input sanitization

## 📈 Performance

### Optimizations
- Local caching system
- Parallel operations
- Connection pooling
- Request/response compression

### Monitoring
- Health check endpoints
- Error logging
- Performance metrics
- Resource usage tracking

## 🚀 Deployment

### CLI Distribution
- NPM registry publication
- Global installation support
- Cross-platform compatibility

### Server Deployment
- Cloud platform support (Render, Railway, Heroku)
- Docker containerization
- Environment configuration
- Health monitoring

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Tài liệu này được tạo tự động bởi SuiBeacon documentation system.**