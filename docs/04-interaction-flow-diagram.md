# SuiBeacon - Sơ đồ luồng tương tác

## Tổng quan luồng tương tác

Sơ đồ này mô tả cách CLI và API Server tương tác với nhau và với các services bên ngoài trong các workflow chính.

## 1. Luồng tương tác tổng quan

```mermaid
graph TB
    subgraph "User Environment"
        U[User]
        CLI[Beacon CLI]
        LOCAL[Local Config<br/>packages-cache.json<br/>.beacon-config.json]
    end
    
    subgraph "Nix Environment"
        NIX[Nix Package Manager]
        PROFILE[Nix Profile]
        FLAKE[Flake Registry]
    end
    
    subgraph "Cloud Infrastructure"
        API[SuiBeacon API Server]
        DB[(MongoDB)]
        WALRUS[Walrus Network]
    end
    
    U -->|Commands| CLI
    CLI <-->|Config| LOCAL
    CLI <-->|Install/List| NIX
    NIX <-->|Packages| PROFILE
    NIX <-->|Search| FLAKE
    CLI <-->|HTTP API| API
    API <-->|Store| DB
    API <-->|Upload/Download| WALRUS
    
    style CLI fill:#e1f5fe
    style API fill:#e8f5e8
    style NIX fill:#fff3e0
    style WALRUS fill:#f3e5f5
```

## 2. Package Installation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as CLI
    participant N as Nix
    participant P as Profile
    
    U->>C: beacon install python313
    C->>P: nix profile list --json
    P-->>C: Current packages
    
    alt Package not installed
        C->>N: nix search nixpkgs python313
        N-->>C: Package info
        C->>N: nix profile install nixpkgs#python313
        N->>P: Add to profile
        P-->>N: Success
        N-->>C: Installation complete
    else Package already installed
        C-->>U: Package already installed
    end
    
    C-->>U: Installation result
```

## 3. Push to Cloud Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as CLI
    participant P as Profile
    participant A as API Server
    participant W as Walrus
    participant D as Database
    
    U->>C: beacon push myproject
    
    Note over C: Check login status
    C->>P: nix profile list --json
    P-->>C: Package list
    
    C->>A: POST /v1/walrus/upload
    Note over C,A: Payload: {projectName, packages, metadata}
    
    A->>W: Upload blob
    W-->>A: blobId
    
    A->>D: Save DataModel
    A->>D: Save Package records
    A->>D: Save PushHistory
    
    A-->>C: {success: true, blobId}
    C-->>U: Success + blobId
```

## 4. Pull from Cloud Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as CLI
    participant A as API Server
    participant W as Walrus
    participant N as Nix
    
    U->>C: beacon pull walrus://blobId
    
    C->>A: GET /v1/walrus/download/blobId
    A->>W: Download blob
    W-->>A: Package data
    A-->>C: Package list
    
    loop For each package
        C->>N: nix profile install
        N-->>C: Install result
    end
    
    C-->>U: Installation summary
```

## 5. Search Flow với Cache

```mermaid
sequenceDiagram
    participant U as User
    participant C as CLI
    participant L as Local Cache
    participant A as API Server
    participant N as Nix
    
    U->>C: beacon search python
    
    C->>L: Check packages-cache.json
    
    alt Cache exists and fresh
        L-->>C: Cached package list
    else Cache missing or stale
        C->>A: GET /v1/listPackages
        A->>N: nix search nixpkgs --json
        N-->>A: All packages
        A-->>C: Package list
        C->>L: Update cache
    end
    
    C->>C: Filter by "python"
    C-->>U: Search results
```

## 6. Server Startup Flow

```mermaid
flowchart TD
    A[CLI: beacon server] --> B[Load server.ts]
    B --> C[Create Express App]
    C --> D[Setup Middleware]
    D --> E[CORS + Security Headers]
    E --> F[Rate Limiting]
    F --> G[Connect MongoDB]
    G --> H{Database Connected?}
    H -->|No| I[Exit with error]
    H -->|Yes| J[Register Routes]
    J --> K[/health endpoint]
    K --> L[/v1/walrus routes]
    L --> M[/v1/listPackages routes]
    M --> N[/v1/display routes]
    N --> O[Start HTTP Server]
    O --> P[Listen on port]
    P --> Q[Setup Graceful Shutdown]
    Q --> R[Server Ready]
```

## 7. Complete User Journey Flow

```mermaid
journey
    title SuiBeacon User Journey
    section Setup
      Install CLI: 5: User
      Login: 4: User, CLI
      Check environments: 3: User, CLI
    section Development
      Setup environment: 5: User, CLI, Nix
      Install packages: 5: User, CLI, Nix
      Work on project: 5: User
    section Sharing
      Push to cloud: 4: User, CLI, API, Walrus
      Share blob URL: 3: User
      Pull by teammate: 5: Teammate, CLI, API
    section Maintenance
      Update packages: 4: User, CLI, Nix
      Remove packages: 3: User, CLI, Nix
      Clean environment: 3: User, CLI, Nix
```

## 8. Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Sources"
        UC[User Commands]
        API_REQ[API Requests]
        NIX_DATA[Nix Registry]
    end
    
    subgraph "Processing Layer"
        CLI_PROC[CLI Processing]
        API_PROC[API Processing]
        VALIDATION[Validation]
    end
    
    subgraph "Storage Layer"
        LOCAL_CACHE[Local Cache]
        MONGODB[(MongoDB)]
        WALRUS_STORE[Walrus Storage]
        NIX_PROFILE[Nix Profile]
    end
    
    subgraph "Output"
        USER_OUTPUT[User Output]
        API_RESPONSE[API Response]
        SYSTEM_STATE[System State]
    end
    
    UC --> CLI_PROC
    API_REQ --> API_PROC
    NIX_DATA --> CLI_PROC
    
    CLI_PROC --> VALIDATION
    API_PROC --> VALIDATION
    
    VALIDATION --> LOCAL_CACHE
    VALIDATION --> MONGODB
    VALIDATION --> WALRUS_STORE
    VALIDATION --> NIX_PROFILE
    
    LOCAL_CACHE --> USER_OUTPUT
    MONGODB --> API_RESPONSE
    WALRUS_STORE --> SYSTEM_STATE
    NIX_PROFILE --> USER_OUTPUT
```

## 9. Error Handling Flow

```mermaid
flowchart TD
    A[User Action] --> B{Action Type}
    
    B -->|CLI Command| C[Execute CLI]
    B -->|API Request| D[Execute API]
    
    C --> E{Success?}
    D --> F{Success?}
    
    E -->|Yes| G[Display Success]
    E -->|No| H[Handle CLI Error]
    
    F -->|Yes| I[Return Success Response]
    F -->|No| J[Handle API Error]
    
    H --> K{Error Type}
    J --> L{Error Type}
    
    K -->|Nix Error| M[Show Nix troubleshooting]
    K -->|Network Error| N[Show connectivity help]
    K -->|Auth Error| O[Show login instructions]
    
    L -->|Database Error| P[Log error + graceful response]
    L -->|Walrus Error| Q[Log error + retry logic]
    L -->|Validation Error| R[Return validation message]
    
    M --> S[Exit with code]
    N --> S
    O --> S
    P --> T[HTTP Error Response]
    Q --> T
    R --> T
```

## 10. Concurrent Operations Flow

```mermaid
graph TB
    subgraph "Multiple CLI Instances"
        C1[CLI Instance 1]
        C2[CLI Instance 2] 
        C3[CLI Instance 3]
    end
    
    subgraph "Shared Resources"
        PROFILE[Nix Profile<br/>Thread-safe]
        CACHE[Local Cache<br/>File locking]
        CONFIG[User Config<br/>File locking]
    end
    
    subgraph "API Server"
        API[Express Server]
        RATE[Rate Limiter]
        DB[MongoDB Pool]
    end
    
    C1 <-->|Concurrent access| PROFILE
    C2 <-->|Concurrent access| PROFILE
    C3 <-->|Concurrent access| PROFILE
    
    C1 --> CACHE
    C2 --> CACHE
    C3 --> CACHE
    
    C1 --> CONFIG
    C2 --> CONFIG
    C3 --> CONFIG
    
    C1 -->|HTTP| RATE
    C2 -->|HTTP| RATE
    C3 -->|HTTP| RATE
    
    RATE --> API
    API --> DB
```

## 11. Security Flow

```mermaid
sequenceDiagram
    participant C as CLI
    participant A as API Server
    participant R as Rate Limiter
    participant V as Validator
    participant D as Database
    
    C->>A: HTTP Request
    A->>R: Check rate limit
    
    alt Rate limit exceeded
        R-->>A: 429 Too Many Requests
        A-->>C: Error response
    else Within rate limit
        R->>V: Validate request
        
        alt Invalid request
            V-->>A: Validation error
            A-->>C: 400 Bad Request
        else Valid request
            V->>D: Process request
            D-->>V: Result
            V-->>A: Success
            A-->>C: 200 OK
        end
    end
```

## 12. Deployment Flow

```mermaid
graph TB
    subgraph "Development"
        DEV[Developer]
        GIT[Git Repository]
    end
    
    subgraph "CI/CD"
        BUILD[Build Process]
        TEST[Tests]
        PACKAGE[Package]
    end
    
    subgraph "Distribution"
        NPM[NPM Registry]
        DOCKER[Docker Hub]
        CLOUD[Cloud Platform]
    end
    
    subgraph "User Installation"
        INSTALL[npm install -g]
        CLI_USE[beacon commands]
        SERVER_USE[beacon server]
    end
    
    DEV --> GIT
    GIT --> BUILD
    BUILD --> TEST
    TEST --> PACKAGE
    PACKAGE --> NPM
    PACKAGE --> DOCKER
    PACKAGE --> CLOUD
    
    NPM --> INSTALL
    INSTALL --> CLI_USE
    CLOUD --> SERVER_USE
    
    CLI_USE <--> SERVER_USE
```

## Các điểm quan trọng trong luồng tương tác:

### 1. **Stateless Design**
- CLI không lưu trữ state phức tạp
- API server stateless, dựa vào database
- Nix profile là single source of truth cho packages

### 2. **Error Recovery**
- Graceful degradation khi services không available
- Local cache fallback khi API không accessible
- Database connection retry logic

### 3. **Concurrency Handling**
- Multiple CLI instances có thể chạy đồng thời
- Nix profile operations là thread-safe
- API server handle concurrent requests

### 4. **Security Boundaries**
- CLI chỉ truy cập local system và public APIs
- API server validate all inputs
- Walrus network cung cấp immutable storage

### 5. **Performance Optimization**
- Local caching giảm API calls
- Batch operations khi có thể
- Rate limiting bảo vệ server resources