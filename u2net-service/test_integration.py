#!/usr/bin/env python3
"""
Integration test for U²-Net Background Removal Service
Tests the API endpoints and functionality
"""

import requests
import json
import time
import os
from PIL import Image
import io

# Service URL
SERVICE_URL = "http://localhost:5001"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"📊 Available models: {data['models_available']}")
            print(f"🖥️  Device: {data['device']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_models():
    """Test models endpoint"""
    print("\n🔍 Testing models endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/models")
        if response.status_code == 200:
            data = response.json()
            print("✅ Models endpoint working")
            for model in data['models']:
                print(f"   🤖 {model['id']}: {model['description']}")
            return True
        else:
            print(f"❌ Models endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Models endpoint error: {e}")
        return False

def create_test_image():
    """Create a simple test image"""
    # Create a simple RGB image for testing
    img = Image.new('RGB', (300, 300), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return img_buffer

def test_background_removal():
    """Test background removal endpoint"""
    print("\n🔍 Testing background removal...")
    try:
        # Create test image
        test_image = create_test_image()
        
        # Prepare request
        files = {'image': ('test.jpg', test_image, 'image/jpeg')}
        data = {
            'model': 'general',
            'precision': 'fast',
            'edge_smoothing': '2',
            'output_format': 'png'
        }
        
        print("📤 Sending test image to U²-Net service...")
        start_time = time.time()
        
        response = requests.post(f"{SERVICE_URL}/remove-bg", files=files, data=data)
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Background removal successful!")
            print(f"⏱️  Processing time: {processing_time:.2f}s")
            
            # Check response headers
            if 'X-Processing-Time' in response.headers:
                ai_time = float(response.headers['X-Processing-Time']) / 1000
                print(f"🤖 AI processing time: {ai_time:.2f}s")
            if 'X-Confidence' in response.headers:
                confidence = float(response.headers['X-Confidence']) * 100
                print(f"🎯 AI confidence: {confidence:.1f}%")
            if 'X-Model-Used' in response.headers:
                model = response.headers['X-Model-Used']
                print(f"🧠 Model used: {model}")
            
            # Check result size
            result_size = len(response.content)
            print(f"📦 Result size: {result_size} bytes")
            
            return True
        else:
            print(f"❌ Background removal failed: {response.status_code}")
            print(f"📝 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Background removal error: {e}")
        return False

def test_batch_processing():
    """Test batch processing endpoint"""
    print("\n🔍 Testing batch processing...")
    try:
        # Create multiple test images
        files = []
        for i in range(2):
            test_image = create_test_image()
            files.append(('images', (f'test{i}.jpg', test_image, 'image/jpeg')))
        
        data = {
            'model': 'general',
            'precision': 'fast',
            'edge_smoothing': '1'
        }
        
        print("📤 Sending batch request...")
        start_time = time.time()
        
        response = requests.post(f"{SERVICE_URL}/remove-bg-batch", files=files, data=data)
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Batch processing successful!")
            print(f"⏱️  Total time: {processing_time:.2f}s")
            print(f"📊 Processed: {data['processed']}/{data['total']}")
            
            for result in data['results']:
                if result['success']:
                    print(f"   ✅ {result['filename']}: Success")
                else:
                    print(f"   ❌ {result['filename']}: {result['error']}")
            
            return True
        else:
            print(f"❌ Batch processing failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Batch processing error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 U²-Net Service Integration Test")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Models Endpoint", test_models),
        ("Background Removal", test_background_removal),
        ("Batch Processing", test_batch_processing),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        results[test_name] = test_func()
        time.sleep(1)  # Brief pause between tests
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {status} {test_name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! U²-Net service is working correctly.")
        print("🔗 You can now integrate it with your PdfPage backend.")
        print(f"🌐 Service URL: {SERVICE_URL}")
    else:
        print("\n❌ Some tests failed. Check the service configuration.")
        print("💡 Make sure the U²-Net service is running and models are downloaded.")
    
    return all_passed

if __name__ == "__main__":
    main()
