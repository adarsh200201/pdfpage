#!/usr/bin/env python3
"""
Development U²-Net AI Service Starter
Runs the real AI service locally with automatic dependency installation
"""

import subprocess
import sys
import os
import time
import platform

def install_package(package):
    """Install a Python package using pip"""
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def check_and_install_requirements():
    """Check and install required packages"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'flask==3.0.0',
        'flask-cors==4.0.0', 
        'torch==2.1.0',
        'torchvision==0.16.0',
        'pillow==10.0.0',
        'numpy==1.24.3',
        'opencv-python-headless==4.8.0.74'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        package_name = package.split('==')[0].replace('-', '_')
        try:
            __import__(package_name)
            print(f"✅ {package_name} - installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package_name} - missing")
    
    if missing_packages:
        print(f"\n📦 Installing {len(missing_packages)} missing packages...")
        for package in missing_packages:
            print(f"⏳ Installing {package}...")
            try:
                install_package(package)
                print(f"✅ {package} installed successfully")
            except Exception as e:
                print(f"❌ Failed to install {package}: {e}")
                return False
    
    print("✅ All dependencies satisfied!")
    return True

def start_service():
    """Start the U²-Net AI service"""
    print("\n🚀 Starting Real U²-Net AI Background Removal Service...")
    print("🧠 This service uses actual PyTorch neural networks for AI inference")
    print("📍 Service will run on: http://localhost:5001")
    print("🔄 Press Ctrl+C to stop")
    print("⏳ First run may take time to download AI models...")
    
    # Change to the u2net-service directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Set environment variables
    env = os.environ.copy()
    env['FLASK_APP'] = 'app.py'
    env['FLASK_ENV'] = 'development'
    env['FLASK_RUN_PORT'] = '5001'
    env['FLASK_RUN_HOST'] = '0.0.0.0'
    env['PYTHONUNBUFFERED'] = '1'
    
    try:
        # Start the Flask app
        subprocess.run([
            sys.executable, '-m', 'flask', 'run',
            '--host=0.0.0.0',
            '--port=5001'
        ], env=env, check=True)
    except KeyboardInterrupt:
        print("\n🛑 U²-Net AI service stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Service failed to start: {e}")
        return False
    
    return True

def test_service():
    """Test if the service is running"""
    import requests
    try:
        print("🔍 Testing service health...")
        response = requests.get('http://localhost:5001/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ U²-Net AI service is running and healthy!")
            print(f"🧠 Mode: {data.get('mode', 'unknown')}")
            print(f"🖥️  Device: {data.get('device', 'unknown')}")
            print(f"📦 Models: {', '.join(data.get('models_available', []))}")
            return True
    except Exception as e:
        print(f"❌ Service health check failed: {e}")
    
    return False

def show_usage_examples():
    """Show usage examples"""
    print("\n📚 Usage Examples:")
    print("  Health check:")
    print("    curl http://localhost:5001/health")
    print("\n  Remove background:")
    print("    curl -X POST -F 'image=@your_image.jpg' \\")
    print("         -F 'model=general' \\")
    print("         -F 'precision=precise' \\")
    print("         http://localhost:5001/remove-bg \\")
    print("         --output result.png")
    print("\n  Available models: general, person, product")
    print("  Precision levels: fast, balanced, precise")

if __name__ == '__main__':
    print("🤖 Real U²-Net AI Background Removal Service")
    print("=" * 50)
    print(f"🐍 Python: {sys.version}")
    print(f"🖥️  OS: {platform.system()} {platform.release()}")
    
    # Check and install dependencies
    if not check_and_install_requirements():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Show usage examples
    show_usage_examples()
    
    print("\n" + "=" * 50)
    
    # Start the service
    if start_service():
        print("🎉 Service started successfully!")
    else:
        print("❌ Failed to start service")
        sys.exit(1)
