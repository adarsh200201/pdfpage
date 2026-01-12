# Stop any running Node.js processes
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force

# Remove node_modules and lock files
Remove-Item -Path ".\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\yarn.lock" -Force -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Start the development server
npm run dev
