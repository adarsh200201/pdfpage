#!/usr/bin/env python3
"""
Simple U²-Net Background Removal Service Starter
Runs the Flask app directly without Docker for development
"""

import subprocess
import sys
import os
import time

def check_requirements():
    """Check if required packages are installed"""
    required_packages = [
        'flask',
        'flask-cors', 
        'pillow',
        'numpy',
        'opencv-python'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:", missing_packages)
        print("📦 Install with: pip install", ' '.join(missing_packages))
        return False
    
    return True

def start_service():
    """Start the U²-Net service"""
    print("🚀 Starting U²-Net Background Removal Service...")
    print("📍 Service will run on: http://localhost:5001")
    print("🔄 Press Ctrl+C to stop")
    
    # Change to the u2net-service directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Set environment variables
    env = os.environ.copy()
    env['FLASK_APP'] = 'app_simple.py'
    env['FLASK_ENV'] = 'development'
    env['FLASK_RUN_PORT'] = '5001'
    env['FLASK_RUN_HOST'] = '0.0.0.0'
    
    try:
        # Start the Flask app
        subprocess.run([
            sys.executable, '-m', 'flask', 'run',
            '--host=0.0.0.0',
            '--port=5001'
        ], env=env, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Service failed to start: {e}")
        return False
    
    return True

def test_service():
    """Test if the service is running"""
    import requests
    try:
        response = requests.get('http://localhost:5001/health', timeout=5)
        if response.status_code == 200:
            print("✅ Service is running and healthy!")
            return True
    except:
        pass
    
    print("❌ Service is not responding")
    return False

if __name__ == '__main__':
    print("🧠 U²-Net Background Removal Service")
    print("====================================")
    
    if not check_requirements():
        sys.exit(1)
    
    print("✅ All requirements satisfied")
    
    # Start the service
    if start_service():
        print("🎉 Service started successfully!")
    else:
        print("❌ Failed to start service")
        sys.exit(1)
