#!/bin/bash

echo "========================================="
echo "  PdfPage Heavy Libraries Docker Download"
echo "========================================="
echo ""
echo "Starting download of all heavy library Docker images..."
echo "This may take 30-60 minutes depending on your internet speed"
echo ""

# Function to print status
print_status() {
    echo "[$1/27] $2"
}

# PDF Processing Images
print_status "1" "Downloading PDF processing images..."
docker pull gotenberg/gotenberg:7
docker pull thecodingmachine/gotenberg
docker pull surnet/alpine-wkhtmltopdf
docker pull madnight/docker-alpine-wkhtmltopdf

# Image Processing Images
print_status "2" "Downloading image processing images..."
docker pull dpokidov/imagemagick
docker pull acleancoder/imagemagick-full
docker pull h2non/imaginary
docker pull vibioh/imagemagick

# OCR Processing Images
print_status "3" "Downloading OCR images..."
docker pull tesseractshadow/tesseract4re
docker pull jbarlow83/ocrmypdf
docker pull hertzg/tesseract-server

# Video/Media Processing Images
print_status "4" "Downloading video processing images..."
docker pull jrottenberg/ffmpeg:4.4-alpine
docker pull linuxserver/ffmpeg
docker pull mwader/static-ffmpeg

# LibreOffice Images
print_status "5" "Downloading LibreOffice images..."
docker pull collabora/code
docker pull linuxserver/libreoffice

# Multi-Purpose Heavy Images
print_status "6" "Downloading base images..."
docker pull ubuntu:22.04
docker pull node:18-bullseye
docker pull buildpack-deps:bullseye

# Specialized Processing Images
print_status "7" "Downloading specialized tools..."
docker pull pandoc/core
docker pull pandoc/latex
docker pull calibre/calibre
docker pull puplink/pupper

# Graphics & Canvas Images
print_status "8" "Downloading graphics images..."
docker pull zenika/alpine-chrome
docker pull alekzonder/puppeteer

# Python-Based Processing Images
print_status "9" "Downloading Python images..."
docker pull python:3.11-bullseye
docker pull jupyter/scipy-notebook

echo ""
echo "========================================="
echo "  Download Complete!"
echo "========================================="
echo ""
echo "All heavy library Docker images have been downloaded."
echo "You can now use them with docker-compose or docker run commands."
echo ""
echo "Total images downloaded: 27"
echo ""
echo "To see all downloaded images, run:"
echo "docker images"
echo ""
