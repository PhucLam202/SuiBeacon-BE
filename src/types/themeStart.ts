
interface Package {
  name: string;
  version: string;
}

export interface Quickstarts {
  [key: string]: Package[];
}

export const quickstarts: Quickstarts = {
  sui: [
    { name: "curl", version: "latest" },
    { name: "git", version: "latest" },
    { name: "cmake", version: "latest" },
    { name: "libgcc", version: "latest" },
    { name: "openssl", version: "latest" },
    { name: "pkg-config", version: "latest" },
    { name: "clang", version: "latest" },
    { name: "postgresql", version: "latest" },
  ],
  node: [
    { name: "nodejs_23", version: "latest" },
    { name: "yarn", version: "latest" },
    { name: "git", version: "latest" }
  ],
};
