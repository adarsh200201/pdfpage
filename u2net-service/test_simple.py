#!/usr/bin/env python3
"""
Quick test for U²-Net service
"""

import requests
import json
from PIL import Image
import io

SERVICE_URL = "http://localhost:5001"

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (200, 200), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return img_buffer

def test_service():
    """Quick test of the service"""
    print("🔍 Testing U²-Net Background Removal Service")
    print("=" * 50)
    
    # Test health
    try:
        print("1. Health check...")
        response = requests.get(f"{SERVICE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {data['status']}")
            print(f"   🖥️  Device: {data['device']}")
            print(f"   🤖 Models: {data.get('models_available', [])}")
            if 'mode' in data:
                print(f"   🔧 Mode: {data['mode']}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False
    
    # Test background removal
    try:
        print("\n2. Background removal test...")
        test_image = create_test_image()
        
        files = {'image': ('test.jpg', test_image, 'image/jpeg')}
        data = {'model': 'general', 'precision': 'fast'}
        
        response = requests.post(f"{SERVICE_URL}/remove-bg", files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            print("   ✅ Background removal successful!")
            
            # Check metadata
            if 'X-Processing-Time' in response.headers:
                time_ms = response.headers['X-Processing-Time']
                print(f"   ⏱️  Processing time: {time_ms}ms")
            
            if 'X-Engine' in response.headers:
                engine = response.headers['X-Engine']
                print(f"   🔧 Engine: {engine}")
            
            result_size = len(response.content)
            print(f"   📦 Result size: {result_size} bytes")
            
            return True
        else:
            print(f"   ❌ Background removal failed: {response.status_code}")
            print(f"   📝 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Background removal error: {e}")
        return False

if __name__ == "__main__":
    success = test_service()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed!")
        print("✅ Service is working correctly")
        print(f"🌐 Service URL: {SERVICE_URL}")
        print("\n💡 Next steps:")
        print("1. Set U2NET_SERVICE_URL=http://localhost:5001 in your backend")
        print("2. Visit https://pdfpage.in/img/remove-bg to test")
    else:
        print("❌ Tests failed!")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure Docker is running")
        print("2. Run: docker ps (check if container is running)")
        print("3. Run: docker logs <container_name> (check logs)")
        print("4. Try the quick-start.sh script for easy setup")
