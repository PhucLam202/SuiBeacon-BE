# SuiBeacon CLI - Luồng hoạt động

## Tổng quan CLI

SuiBeacon CLI (`beacon`) là công cụ dòng lệnh được xây dựng trên **Commander.js** để quản lý gói Nix với khả năng đồng bộ cloud thông qua Walrus Network.

## Kiến trúc CLI

```
┌─────────────────┐
│   CLI Entry     │ cli.ts
│   (beacon)      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Commander     │ Program setup
│   Program       │ & Command routing
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Commands      │    │   Services      │    │   External      │
│   - install     │───▶│   - walrus      │───▶│   - Nix         │
│   - list        │    │   - listPkg     │    │   - MongoDB     │
│   - push/pull   │    │   - api         │    │   - Walrus      │
│   - search      │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```

## Commands và Workflows

### 1. Installation Flow - `beacon install <package> [version]`

```mermaid
flowchart TD
    A[beacon install python313] --> B{Package installed?}
    B -->|Yes| C{Version match?}
    C -->|Yes| D[Skip installation]
    C -->|No| E[Update to requested version]
    B -->|No| F[Search package]
    F --> G[Build install path]
    G --> H[Execute nix profile install]
    H --> I[Verify installation]
    I --> J[Display success message]
    E --> H
```

**Chi tiết implementation:**
```typescript
// src/command/install.ts
async function installPackage(pkg: string, spinner: Ora, requestedVersion?: string, flakeUrl?: string) {
    // 1. Check if package already installed
    const profileJson = await execPromise(`nix profile list --json`);
    
    // 2. Version checking logic
    if (packageExists && versionMatches) return;
    
    // 3. Search for specific version if requested
    if (requestedVersion) {
        const searchResults = await execPromise(`nix search ${flakeSource} '${pkg}' --json`);
    }
    
    // 4. Install package
    await execPromise(`nix profile install ${installPath}`);
    
    // 5. Verify and display results
}
```

### 2. List Packages Flow - `beacon list`

```mermaid
flowchart TD
    A[beacon list] --> B[Execute nix profile list --json]
    B --> C[Parse JSON response]
    C --> D[Extract package info]
    D --> E[Format display]
    E --> F[Show package table]
```

### 3. Search Flow - `beacon search [query]`

```mermaid
flowchart TD
    A[beacon search python] --> B{Cache exists?}
    B -->|Yes| C[Search in cache]
    B -->|No| D[Call API /v1/listPackages]
    D --> E[Cache response]
    E --> C
    C --> F[Filter by query]
    F --> G[Display results]
```

### 4. Push to Cloud - `beacon push <projectName>`

```mermaid
flowchart TD
    A[beacon push myproject] --> B{User logged in?}
    B -->|No| C[Error: Login required]
    B -->|Yes| D[Get installed packages]
    D --> E{Packages exist?}
    E -->|No| F[Error: No packages found]
    E -->|Yes| G[Create payload]
    G --> H[Upload to Walrus]
    H --> I[Save to MongoDB]
    I --> J[Display success + blobId]
```

**Payload structure:**
```typescript
const payload = {
  projectName: "myproject",
  packages: [
    { name: "python313", version: "3.13.0" },
    { name: "nodejs", version: "18.19.0" }
  ],
  metadata: {
    totalCount: 2,
    timestamp: "2024-01-01T00:00:00.000Z",
    source: "beacon-cli"
  }
}
```

### 5. Pull from Cloud - `beacon pull <url>`

```mermaid
flowchart TD
    A[beacon pull walrus://blobId] --> B[Download from Walrus]
    B --> C[Parse package list]
    C --> D[For each package]
    D --> E[Install package]
    E --> F{More packages?}
    F -->|Yes| D
    F -->|No| G[Display summary]
```

### 6. Login Flow - `beacon login <userAddress>`

```mermaid
flowchart TD
    A[beacon login 0x123...] --> B[Validate address]
    B --> C[Save to local config]
    C --> D[Display success]
```

### 7. Quickstart Environment - `beacon quickstart <env>`

```mermaid
flowchart TD
    A[beacon quickstart sui] --> B{Environment exists?}
    B -->|No| C[Error: Unknown environment]
    B -->|Yes| D[Load environment template]
    D --> E[For each package in template]
    E --> F[Install package]
    F --> G{More packages?}
    G -->|Yes| E
    G -->|No| H[Display completion]
```

**Available environments:**
- `sui`: SUI blockchain development
- `node`: Node.js development  
- `rust`: Rust development

### 8. Server Mode - `beacon server`

```mermaid
flowchart TD
    A[beacon server --port 3000] --> B[Import server.ts]
    B --> C[Connect to MongoDB]
    C --> D[Setup Express app]
    D --> E[Register routes]
    E --> F[Start HTTP server]
    F --> G[Display server info]
```

## Command Line Interface

### Core Commands
```bash
# Package management
beacon install <package> [version]    # Install package
beacon remove <packages...>           # Remove packages
beacon list                          # List installed
beacon search [query]                # Search packages
beacon update <package>              # Update package

# Cloud sync
beacon login <userAddress>           # Login with wallet
beacon push <projectName>            # Push to cloud
beacon pull <url>                    # Pull from cloud

# Environment
beacon quickstart <environment>      # Quick setup
beacon environments                 # List environments

# Server
beacon server [options]             # Start API server
```

### Global Options
```bash
beacon --version                     # Show version
beacon --help                       # Show help
beacon <command> --help              # Command help
```

## Configuration Files

### 1. Package Cache - `packages-cache.json`
```json
{
  "packages": [
    {
      "name": "python313",
      "version": "3.13.0",
      "description": "Python programming language"
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 2. User Config - `.beacon-config.json`
```json
{
  "serverUrl": "https://suibeacon-be.onrender.com",
  "userAddress": "0x123...",
  "lastLogin": "2024-01-01T00:00:00.000Z"
}
```

### 3. Nix Configuration - `flake.nix`
```nix
{
  description = "SuiBeacon development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: {
    devShells.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs
        python313
      ];
    };
  };
}
```

## Error Handling

### 1. Nix Not Available
```bash
Error: Command 'nix' not found
Please install Nix: https://nixos.org/download.html
```

### 2. Package Not Found
```bash
Error: Package 'nonexistent' not found
Try: beacon search nonexistent
```

### 3. Network Issues
```bash
Error: Failed to connect to API server
Check: beacon config:show
```

### 4. Authentication Required
```bash
Error: You need to login first
Use: beacon login <userAddress>
```

## Performance Optimizations

### 1. Caching Strategy
- Local package cache (`packages-cache.json`)
- API response caching
- Nix profile parsing optimization

### 2. Parallel Operations
- Multiple package installations
- Concurrent API calls
- Background cache updates

### 3. Progress Indicators
- Spinner for long operations
- Progress bars for multiple items
- ETA calculations

## Integration Points

### 1. Nix Package Manager
```bash
# CLI sử dụng các lệnh Nix
nix profile list --json
nix profile install nixpkgs#python313
nix search nixpkgs python --json
```

### 2. MongoDB Connection
```typescript
// Kết nối database cho CLI commands
await connectDB();
// Lưu dữ liệu push/pull
await DataModel.create({...});
```

### 3. Walrus Network
```typescript
// Upload data
const blobId = await walrusService.uploadBlob(data, description);
// Download data  
const blob = await walrusService.readBlobAsText(blobId);
```

## Exit Handling

```typescript
// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  console.log('Database connection closed.');
  process.exit(0);
});

// Force exit timeout
setTimeout(() => {
  if (mongoose.connection.readyState === 1) {
    mongoose.disconnect().finally(() => {
      process.exit(0);
    });
  }
}, 1000);
```