@echo off
cd /d %~dp0
start "" cmd /k "npx @builder.io/dev-tools@latest"
