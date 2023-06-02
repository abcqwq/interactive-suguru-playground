@echo off

set TAILWIND_ARCHITECTURE=x64
set TAILWIND_VERSION=v3.3.2

set SOURCE_NAME=tailwindcss-windows-%TAILWIND_ARCHITECTURE%
set OUTPUT_NAME=tailwindcss

echo Downloding required tailwind executables...
set DOWNLOAD_URL=https://github.com/tailwindlabs/tailwindcss/releases/download/%TAILWIND_VERSION%/%SOURCE_NAME%.exe
powershell -Command "Invoke-WebRequest %DOWNLOAD_URL% -Outfile %OUTPUT_NAME%.exe"
echo Done!