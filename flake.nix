{
  description = "Send.app development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    foundry-overlay.url = "github:0xbigboss/foundry-overlay";
    bun-overlay.url = "github:0xbigboss/bun-overlay";

    # Used for shell.nix
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    nixpkgs-unstable,
    flake-utils,
    foundry-overlay,
    bun-overlay,
    ...
  } @ inputs: let
    overlays = [
      foundry-overlay.overlays.default
      bun-overlay.overlays.default
      (final: prev: {
        unstable = import nixpkgs-unstable {
          inherit (prev) system;
          overlays = [
            foundry-overlay.overlays.default
            bun-overlay.overlays.default
          ];
          config = {
            allowUnfree = true;
          };
        };
      })
    ];

    # Our supported systems are the same as foundry-overlay
    systems = ["x86_64-linux" "x86_64-darwin" "aarch64-darwin"];
  in
    flake-utils.lib.eachSystem systems (
      system: let
        pkgs = import nixpkgs {
          inherit overlays system;
          config = {
            allowUnfree = true; # Allow unfree packages like Xcode
          };
        };
      in {
        formatter = pkgs.alejandra;

        devShells.default = pkgs.mkShell {
          name = "sendapp-dev";
          nativeBuildInputs = [
            pkgs.foundry
            pkgs.python310
            pkgs.gnused
            pkgs.postgresql_15
            pkgs.bun

            pkgs.unstable.fnm
            pkgs.unstable.jq
            pkgs.unstable.yj
            pkgs.unstable.caddy
            pkgs.unstable.tilt
            pkgs.unstable.temporal-cli
            pkgs.unstable.ripgrep
            pkgs.unstable.watchman
            pkgs.unstable.maestro
          ];
          shellHook =
            ''
              eval "$(fnm env --use-on-cd --corepack-enabled --shell bash)"
              echo "Welcome to the Send.app development environment!"
            ''
            + (pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isDarwin ''
              # On macOS, we unset the macOS SDK env vars that Nix sets up because
              # we rely on a system installation. Nix only provides a macOS SDK
              # and we need iOS too.
              unset SDKROOT
              unset DEVELOPER_DIR
              # We need to add the system Xcode tools to the PATH so that expo works correctly
              export PATH=/usr/bin:$PATH
            '');
        };

        # For compatibility with older versions of the `nix` binary
        devShell = self.devShells.${system}.default;
      }
    );
}
