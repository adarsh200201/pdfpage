Write-Host "🔧 Setting up PDF encryption tools..."

# Create tools directory if it doesn't exist
$toolsDir = "C:\pdf-tools"
if (!(Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir
}

# Download and install QPDF
Write-Host "📥 Downloading QPDF..."
$qpdfVer = "11.3.0"
$qpdfUrl = "https://github.com/qpdf/qpdf/releases/download/v$qpdfVer/qpdf-$qpdfVer-bin-windows-x64.zip"
$qpdfZip = "$toolsDir\qpdf.zip"
Invoke-WebRequest -Uri $qpdfUrl -OutFile $qpdfZip
Expand-Archive -Path $qpdfZip -DestinationPath "$toolsDir\qpdf" -Force
Remove-Item $qpdfZip

# Add QPDF to system PATH
$qpdfBinPath = (Get-ChildItem -Path "$toolsDir\qpdf" -Filter "bin" -Recurse).FullName
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (!$currentPath.Contains($qpdfBinPath)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$qpdfBinPath", "Machine")
}

# Download and install Ghostscript
Write-Host "📥 Downloading Ghostscript..."
$gsVer = "10.01.1"
$gsUrl = "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10011/gs10011w64.exe"
$gsInstaller = "$toolsDir\gs-installer.exe"
Invoke-WebRequest -Uri $gsUrl -OutFile $gsInstaller
Start-Process -FilePath $gsInstaller -ArgumentList "/S" -Wait

Write-Host "✅ PDF tools setup complete!"
Write-Host "Please restart your terminal/IDE for the PATH changes to take effect."
