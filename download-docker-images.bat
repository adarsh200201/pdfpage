@echo off
echo =========================================
echo  PdfPage Heavy Libraries Docker Download
echo =========================================
echo.
echo Starting download of all heavy library Docker images...
echo This may take 30-60 minutes depending on your internet speed
echo.

REM PDF Processing Images
echo [1/27] Downloading PDF processing images...
docker pull gotenberg/gotenberg:7
docker pull thecodingmachine/gotenberg
docker pull surnet/alpine-wkhtmltopdf
docker pull madnight/docker-alpine-wkhtmltopdf

REM Image Processing Images
echo [2/27] Downloading image processing images...
docker pull dpokidov/imagemagick
docker pull acleancoder/imagemagick-full
docker pull h2non/imaginary
docker pull vibioh/imagemagick

REM OCR Processing Images
echo [3/27] Downloading OCR images...
docker pull tesseractshadow/tesseract4re
docker pull jbarlow83/ocrmypdf
docker pull hertzg/tesseract-server

REM Video/Media Processing Images
echo [4/27] Downloading video processing images...
docker pull jrottenberg/ffmpeg:4.4-alpine
docker pull linuxserver/ffmpeg
docker pull mwader/static-ffmpeg

REM LibreOffice Images
echo [5/27] Downloading LibreOffice images...
docker pull collabora/code
docker pull linuxserver/libreoffice

REM Multi-Purpose Heavy Images
echo [6/27] Downloading base images...
docker pull ubuntu:22.04
docker pull node:18-bullseye
docker pull buildpack-deps:bullseye

REM Specialized Processing Images
echo [7/27] Downloading specialized tools...
docker pull pandoc/core
docker pull pandoc/latex
docker pull calibre/calibre
docker pull puplink/pupper

REM Graphics & Canvas Images
echo [8/27] Downloading graphics images...
docker pull zenika/alpine-chrome
docker pull alekzonder/puppeteer

REM Python-Based Processing Images
echo [9/27] Downloading Python images...
docker pull python:3.11-bullseye
docker pull jupyter/scipy-notebook

echo.
echo =========================================
echo  Download Complete!
echo =========================================
echo.
echo All heavy library Docker images have been downloaded.
echo You can now use them with docker-compose or docker run commands.
echo.
echo Total images downloaded: 27
echo.
echo To see all downloaded images, run:
echo docker images
echo.
pause
