{
  description = "Send.app development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    foundry-overlay.url = "github:0xbigboss/foundry-overlay";

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
    ...
  } @ inputs: let
    overlays = [
      foundry-overlay.overlays.default
      (final: prev: {
        unstable = import nixpkgs-unstable {
          inherit (prev) system;
          overlays = [foundry-overlay.overlays.default];
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

        devShells.default = pkgs.llvmPackages_17.libcxxStdenv.mkDerivation {
          name = "sendapp-dev";
          nativeBuildInputs =
            [
              pkgs.foundry
              pkgs.python310
              pkgs.gnused
              pkgs.postgresql_15

              pkgs.unstable.fnm
              pkgs.unstable.jq
              pkgs.unstable.yj
              pkgs.unstable.caddy
              pkgs.unstable.bun
              pkgs.unstable.tilt
              pkgs.unstable.temporal-cli
            ] # macOS-specific tools
            ++ (pkgs.lib.optionals pkgs.stdenv.isDarwin [
              pkgs.unstable.darwin.xcode_16_3
              pkgs.unstable.apple-sdk
              pkgs.unstable.darwin.apple_sdk.frameworks.CoreServices
              pkgs.unstable.darwin.apple_sdk.frameworks.CoreFoundation
              pkgs.unstable.darwin.apple_sdk.frameworks.SystemConfiguration
            ]);
          # For C++ development
          buildInputs = [
            pkgs.unstable.llvmPackages_17.libcxxStdenv
            pkgs.unstable.llvmPackages_17.libcxxClang
            pkgs.unstable.llvmPackages_17.compiler-rt
            pkgs.unstable.llvmPackages_17.libcxx
          ];
          shellHook = ''
            eval "$(fnm env --use-on-cd --corepack-enabled --shell bash)"
            echo "Welcome to the Send.app development environment!"
          '';
        };

        # For compatibility with older versions of the `nix` binary
        devShell = self.devShells.${system}.default;
      }
    );
}
