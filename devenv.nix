{ pkgs, ... }:
{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    npm.enable = true;
  };

  languages.typescript = {
    enable = true;
    lsp.enable = true;
  };
}
