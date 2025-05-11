
// Định nghĩa type cho package
interface Package {
  name: string;
  version: string;
}

// Định nghĩa type cho quickstarts với index signature
export interface Quickstarts {
  [key: string]: Package[];
}

// Định nghĩa các bộ quickstart package
export const quickstarts: Quickstarts = {
  sui: [
    { name: "curl", version: "latest" },
    { name: "gitFull", version: "latest" },
    { name: "cmake", version: "latest" },
    { name: "gcc", version: "latest" },
    { name: "openssl.dev", version: "latest" },
    { name: "pkg-config", version: "latest" },
    { name: "clang.dev", version: "latest" },
    { name: "postgresql.dev", version: "latest" },
    { name: "buildPackages.stdenv", version: "latest" }
  ],
  node: [
    { name: "nodejs", version: "latest" },
    { name: "yarn", version: "latest" },
    { name: "git", version: "latest" }
  ],
  rust: [
    { name: "rustc", version: "latest" },
    { name: "cargo", version: "latest" },
    { name: "rustfmt", version: "latest" },
    { name: "clippy", version: "latest" }
  ]
};
