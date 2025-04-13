{
  description = "Development environment for the Sendapp project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; # Or specify a pinned version
    flake-utils.url = "github:numtide/flake-utils";
    foundry.url = "github:foundry-rs/foundry"; # Use official Foundry flake
  };

  outputs = { self, nixpkgs, flake-utils, foundry }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          # overlays = [ ... ]; # Add overlays if needed
          # config = { allowUnfree = true; }; # If needed for specific packages
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "sendapp-dev";

          # Development tools and dependencies from CONTRIBUTING.md and user feedback
          packages = with pkgs; [
            # Version Control
            git

            # Node.js ecosystem
            nodejs_20  # Provides Node.js v20.x and Corepack
            bun        # Bun runtime
            python3    # Required by node-gyp
            python3Packages.setuptools # Required by node-gyp

            # Ethereum / Smart Contracts
            foundry.packages.${system}.foundry # Use package from Foundry flake input

            # Containerization & Orchestration
            docker     # Docker CLI client
            tilt       # Local development environment orchestrator

            # Build dependencies (especially for native Node modules like better-sqlite3)
            sqlite     # SQLite library
            pkg-config # Helper tool used by build systems
            gcc        # C compiler
            gnumake    # Make utility

            # Utilities mentioned in Brewfile context
            jq         # Command-line JSON processor
            caddy      # Web server
          ];

          # Shell hook to run commands when entering the environment
          shellHook = ''
            echo "Entering Sendapp development environment..."

            # Enable Yarn 4 via Corepack (comes with Node.js >= 16.10)
            corepack enable

            # Environment variables for SQLite (often needed for native modules)
            # Nix usually handles linking, but uncomment if build issues persist
            # export LDFLAGS="-L${pkgs.sqlite.out}/lib"
            # export CPPFLAGS="-I${pkgs.sqlite.dev}/include"
            # export PKG_CONFIG_PATH="${pkgs.sqlite.dev}/lib/pkgconfig"

            echo "Node version: $(node --version)"
            echo "Yarn version: $(yarn --version)"
            echo "Bun version: $(bun --version)"
            echo "Foundry version: $(forge --version)"
            echo "Tilt version: $(tilt version)"
            echo "Docker version: $(docker --version)"
            echo "SQLite version: $(sqlite3 --version)"
            echo "Caddy version: $(caddy version)"
            echo "Python version: $(python --version)"
            echo "Ready!"
          '';
        };
      });
}
