{
  description = "Development environment for drop-cli using Node.js, TypeScript, and PNPM";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }: flake-utils.lib.eachSystem [
    "x86_64-linux"
    "aarch64-linux"
  ] (system: {
    devShell = nixpkgs.legacyPackages.${system}.mkShell {
      buildInputs = [nixpkgs.legacyPackages.${system}.nodePackages.pnpm
        nixpkgs.legacyPackages.${system}.typescript 
        nixpkgs.legacyPackages.${system}.go nixpkgs.python311];

      shellHook = ''
        echo "Welcome to the development environment!"
        export PS1="\[\033[1;32m\][Drop]\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] $ "
        export IN_NIX_SHELL=1
      '';
    };
  });
}
