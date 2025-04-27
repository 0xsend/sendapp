{
  description = "Send.app development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
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
        };
      })
    ];

    # Our supported systems are the same as foundry-overlay
    systems = ["x86_64-linux" "x86_64-darwin" "aarch64-darwin"];
  in
    flake-utils.lib.eachSystem systems (
      system: let
        pkgs = import nixpkgs {inherit overlays system;};
        nodejs = pkgs.nodejs_20;
        yarn = pkgs.yarn.override {inherit nodejs;};
      in {
        formatter = pkgs.alejandra;

        devShells.default = pkgs.mkShell {
          nativeBuildInputs = [
            pkgs.foundry
            nodejs
            yarn
            pkgs.python310
            pkgs.gnused
            pkgs.postgresql_15

            pkgs.unstable.jq
            pkgs.unstable.yj
            pkgs.unstable.caddy
            pkgs.unstable.bun
            pkgs.unstable.tilt
            pkgs.unstable.temporal-cli
          ];
        };

        # For compatibility with older versions of the `nix` binary
        devShell = self.devShells.${system}.default;
      }
    );
}
