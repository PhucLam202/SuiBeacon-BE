{
  description = "Development environment for suibeacon-cli using Node.js";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nix # Required for nix search
            nodejs
            nodePackages.pnpm
            nodePackages.typescript
            go
            python311
          ];

          shellHook = ''
            echo "Welcome to the development environment!"
            export PS1="\[\033[1;32m\][Suibeacon]\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] $ "
            export IN_NIX_SHELL=1
            # Ensure experimental features are enabled
            mkdir -p ~/.config/nix
            echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf
          '';
        };
      });
}