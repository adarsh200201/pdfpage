@echo off
echo =========================================
echo  Quick Essential Heavy Libraries Download
echo =========================================
echo.
echo Downloading only the most essential heavy library images...
echo This will take about 10-15 minutes
echo.

REM Essential PDF Processing
echo [1/8] PDF Processing - Gotenberg...
docker pull gotenberg/gotenberg:7

REM Essential Image Processing  
echo [2/8] Image Processing - ImageMagick...
docker pull dpokidov/imagemagick

REM Essential OCR
echo [3/8] OCR Processing - OCRmyPDF...
docker pull jbarlow83/ocrmypdf

REM Essential Video Processing
echo [4/8] Video Processing - FFmpeg...
docker pull jrottenberg/ffmpeg:4.4-alpine

REM Essential Document Conversion
echo [5/8] Document Processing - LibreOffice...
docker pull collabora/code

REM Essential Canvas/Graphics
echo [6/8] Graphics Processing - Puppeteer...
docker pull alekzonder/puppeteer

REM Essential Image API
echo [7/8] Fast Image API - Imaginary...
docker pull h2non/imaginary

REM Essential Base
echo [8/8] Base Image - Node.js...
docker pull node:18-bullseye

echo.
echo =========================================
echo  Essential Download Complete!
echo =========================================
echo.
echo Downloaded 8 most essential heavy library images:
echo - gotenberg/gotenberg:7 (PDF processing)
echo - dpokidov/imagemagick (Image processing)
echo - jbarlow83/ocrmypdf (OCR)
echo - jrottenberg/ffmpeg:4.4-alpine (Video)
echo - collabora/code (LibreOffice)
echo - alekzonder/puppeteer (Graphics)
echo - h2non/imaginary (Fast images)
echo - node:18-bullseye (Base)
echo.
echo To see images: docker images
echo.
pause
