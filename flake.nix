{
  description = "Send.app development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
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
          nativeBuildInputs =
            [
              pkgs.foundry
              pkgs.python310
              pkgs.gnused
              pkgs.postgresql_15
              pkgs.bun

              pkgs.unstable.fnm
              pkgs.unstable.jq
              pkgs.unstable.yj
              pkgs.unstable.tilt
              pkgs.unstable.temporal-cli
              pkgs.unstable.ripgrep
              pkgs.unstable.watchman
              pkgs.unstable.maestro
            ]
            ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
              # Playwright browser drivers (Linux only)
              pkgs.unstable.playwright-driver.browsers
            ];
          shellHook =
            ''
              eval "$(fnm env --use-on-cd --corepack-enabled --shell bash)"
              echo "Welcome to the Send.app development environment!"
            ''
            + (pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isDarwin ''
              # On macOS, we unset Nix's compiler/linker wrappers because they
              # conflict with Xcode 26's new linker. iOS builds need system Xcode.
              unset NIX_LDFLAGS
              unset NIX_CFLAGS_COMPILE
              unset NIX_CC
              unset NIX_BINTOOLS
              unset CC
              unset CXX
              unset LD
              export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
              export SDKROOT=$(xcrun --show-sdk-path)
              # We need to add the system Xcode tools to the PATH so that expo works correctly
              export PATH=/usr/bin:$PATH
            '')
            + (pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
              # Set up Playwright environment variables for Linux
              export PLAYWRIGHT_BROWSERS_PATH=${pkgs.unstable.playwright-driver.browsers}
              # may need to set this if encountering validation errors
              # export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            '');
        };

        # For compatibility with older versions of the `nix` binary
        devShell = self.devShells.${system}.default;
      }
    );
}
