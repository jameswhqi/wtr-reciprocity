{
  description = "wtr-reciprocity";

  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/79a13f1437e149dc7be2d1290c74d378dad60814";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default =
          pkgs.mkShell {
            packages = (with pkgs.rPackages; [
              pkgs.R
              languageserver
              httpgd
              pkgs.python3Packages.radian
              targets
              usethis
              qs
              rlang
              sloop
              tidyverse
              pwr
              emmeans
              brms
              bridgesampling
              bayestestR
            ]) ++ (with pkgs.elmPackages; [
              elm
              elm-format
              elm-json
              elm-live
              pkgs.nodePackages.uglify-js
            ]) ++ [ pkgs.gettext ];
          };
      }
    );
}
