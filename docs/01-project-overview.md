# SuiBeacon - Tổng quan dự án

## Giới thiệu

**SuiBeacon** là một hệ thống quản lý gói (package manager) được xây dựng trên nền tảng Nix với khả năng lưu trữ và chia sẻ danh sách gói thông qua Walrus Network. Dự án bao gồm hai thành phần chính:

1. **CLI Tool** - Công cụ dòng lệnh để quản lý gói
2. **API Server** - Máy chủ backend cung cấp API REST

## Kiến trúc hệ thống

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

## Thành phần chính

### 1. CLI Tool (`beacon`)
- **Ngôn ngữ**: TypeScript/Node.js
- **Framework**: Commander.js
- **Mục đích**: Quản lý gói Nix từ dòng lệnh
- **Chức năng chính**:
  - Cài đặt/gỡ bỏ gói
  - Tìm kiếm gói
  - Đồng bộ danh sách gói với cloud
  - Hỗ trợ environment templates

### 2. API Server
- **Ngôn ngữ**: TypeScript/Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Mục đích**: Cung cấp API REST cho việc lưu trữ và truy xuất dữ liệu
- **Chức năng chính**:
  - Upload/Download file qua Walrus
  - Quản lý danh sách gói
  - Lưu trữ lịch sử và thống kê

### 3. Walrus Network Integration
- **Mục đích**: Lưu trữ phi tập trung cho danh sách gói
- **Tính năng**: Upload/Download dữ liệu dưới dạng blob

## Cấu trúc thư mục

```
SuiBeacon/
├── src/
│   ├── cli.ts              # Entry point cho CLI
│   ├── server.ts           # Entry point cho API server
│   ├── command/            # CLI commands
│   │   ├── install.ts      # Cài đặt gói
│   │   ├── list.ts         # Liệt kê gói
│   │   ├── push.ts         # Đẩy lên cloud
│   │   ├── pull.ts         # Kéo từ cloud
│   │   └── ...
│   ├── router/             # API routes
│   │   ├── walrusRouter.ts # Walrus endpoints
│   │   ├── displayRouter.ts
│   │   └── ...
│   ├── controller/         # Business logic
│   ├── service/           # Services
│   ├── models/            # Database models
│   └── types/             # TypeScript types
├── dist/                  # Compiled JavaScript
├── package.json           # Dependencies và scripts
└── tsconfig.json          # TypeScript config
```

## Công nghệ sử dụng

### Dependencies chính
- **@mysten/sui**: Tích hợp Sui blockchain
- **@mysten/walrus**: Tích hợp Walrus network
- **commander**: CLI framework
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **chalk**: Terminal styling
- **ora**: Loading spinners

### Development Tools
- **TypeScript**: Type safety
- **tsx**: TypeScript execution
- **nodemon**: Development server

## Luồng hoạt động chung

1. **CLI Installation**: User cài đặt `suibeacon` từ npm
2. **Package Management**: User sử dụng CLI để quản lý gói Nix
3. **Data Sync**: CLI đồng bộ danh sách gói với server qua API
4. **Storage**: Server lưu trữ dữ liệu trong MongoDB và Walrus
5. **Sharing**: User có thể chia sẻ danh sách gói qua URL

## Điểm nổi bật

### 🔍 **Smart Package Search**
- Tìm kiếm nhanh trong cache local
- Kết nối với Nix package registry

### 📦 **Version Control**
- Cài đặt phiên bản cụ thể
- Quản lý conflicts và dependencies

### 🌐 **Cloud Sync**
- Đồng bộ danh sách gói qua Walrus
- Backup và restore environment

### ⚡ **Performance**
- Cache system cho tìm kiếm nhanh
- Parallel processing
- Rate limiting cho API

### 🛡️ **Security**
- CORS protection
- Rate limiting
- Input validation
- Secure headers

## Deployment

### CLI Distribution
- Publish qua npm registry
- Global installation: `npm install -g suibeacon`
- Binary name: `beacon`

### Server Deployment
- Hỗ trợ Render, Railway, Heroku
- Environment variables config
- MongoDB connection
- Health check endpoints

## Use Cases

1. **Development Environment Setup**: Nhanh chóng setup môi trường cho team
2. **Package Sharing**: Chia sẻ danh sách gói giữa các developers
3. **Environment Templates**: Tạo template cho các loại project khác nhau
4. **Backup & Restore**: Sao lưu và khôi phục môi trường development

## Roadmap

- [ ] Frontend web interface
- [ ] Package dependency resolution
- [ ] Team collaboration features
- [ ] Advanced caching strategies
- [ ] Plugin system