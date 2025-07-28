from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import torch
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2
import io
import time
import logging
import urllib.request
from pathlib import Path
import hashlib

# Import U2Net model
from model import U2NET

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configurations with real download URLs
MODEL_CONFIG = {
    'general': {
        'model_name': 'u2net.pth',
        'url': 'https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net.pth',
        'input_size': 320,
        'description': 'General purpose background removal',
        'md5': 'e4f636406ca4e2af789941e7f139ee2e'
    },
    'person': {
        'model_name': 'u2net_human_seg.pth', 
        'url': 'https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net_human_seg.pth',
        'input_size': 320,
        'description': 'Optimized for human portraits',
        'md5': '347c3d51b01528e5c6c071e3cff1cb55'
    },
    'product': {
        'model_name': 'u2net.pth',  # Same as general for products
        'url': 'https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net.pth',
        'input_size': 320,
        'description': 'E-commerce product photography',
        'md5': 'e4f636406ca4e2af789941e7f139ee2e'
    }
}

# Global model cache
model_cache = {}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"🚀 U²-Net AI Service - Using device: {device}")

# Create models directory
os.makedirs('saved_models', exist_ok=True)

def download_model(model_type='general'):
    """Download U²-Net model weights if not present"""
    config = MODEL_CONFIG[model_type]
    model_path = os.path.join('saved_models', config['model_name'])
    
    if os.path.exists(model_path):
        # Verify existing model with MD5
        with open(model_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        if file_hash == config['md5']:
            logger.info(f"✅ Model {config['model_name']} already exists and verified")
            return model_path
        else:
            logger.warning(f"⚠️  Model {config['model_name']} exists but hash mismatch, re-downloading")
            os.remove(model_path)
    
    logger.info(f"📥 Downloading {config['model_name']} from {config['url']}")
    
    try:
        # Download with progress
        def show_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = min(100, (downloaded / total_size) * 100)
            if block_num % 100 == 0:  # Log every 100 blocks
                logger.info(f"📥 Download progress: {percent:.1f}%")
        
        urllib.request.urlretrieve(config['url'], model_path, show_progress)
        
        # Verify download
        with open(model_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        if file_hash == config['md5']:
            logger.info(f"✅ Successfully downloaded and verified {config['model_name']}")
            return model_path
        else:
            raise Exception(f"Downloaded model hash mismatch. Expected: {config['md5']}, Got: {file_hash}")
            
    except Exception as e:
        logger.error(f"❌ Failed to download {config['model_name']}: {e}")
        if os.path.exists(model_path):
            os.remove(model_path)
        raise

def load_model(model_type='general'):
    """Load U²-Net model with caching"""
    if model_type in model_cache:
        logger.info(f"🔄 Using cached {model_type} model")
        return model_cache[model_type]
    
    config = MODEL_CONFIG.get(model_type, MODEL_CONFIG['general'])
    logger.info(f"🧠 Loading U²-Net {model_type} model: {config['description']}")
    
    try:
        # Download model if needed
        model_path = download_model(model_type)
        
        # Initialize model
        net = U2NET(3, 1)
        
        # Load weights
        if device.type == 'cuda':
            net.load_state_dict(torch.load(model_path))
        else:
            net.load_state_dict(torch.load(model_path, map_location='cpu'))
        
        net.to(device)
        net.eval()
        
        # Cache the model
        model_cache[model_type] = net
        logger.info(f"✅ Successfully loaded {model_type} model on {device}")
        
        return net
        
    except Exception as e:
        logger.error(f"❌ Failed to load {model_type} model: {e}")
        raise

def preprocess_image(image_pil, input_size):
    """Preprocess image for U²-Net input"""
    # Convert to RGB if needed
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
    
    # Store original size
    original_size = image_pil.size
    
    # Resize image
    image_resized = image_pil.resize((input_size, input_size), Image.LANCZOS)
    
    # Convert to tensor
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = transform(image_resized).unsqueeze(0).to(device)
    
    return input_tensor, original_size

def postprocess_mask(mask_tensor, original_size, edge_smoothing=3):
    """Postprocess U²-Net output mask"""
    # Convert tensor to numpy
    mask_np = mask_tensor.squeeze().cpu().detach().numpy()
    
    # Resize to original size
    mask_resized = cv2.resize(mask_np, original_size, interpolation=cv2.INTER_LANCZOS4)
    
    # Apply edge smoothing
    if edge_smoothing > 0:
        kernel_size = max(3, edge_smoothing * 2 + 1)
        mask_resized = cv2.GaussianBlur(mask_resized, (kernel_size, kernel_size), edge_smoothing * 0.5)
    
    # Threshold and normalize
    mask_resized = np.clip(mask_resized * 255, 0, 255).astype(np.uint8)
    
    return mask_resized

def apply_mask_to_image(image_pil, mask_np, output_format='png'):
    """Apply mask to remove background"""
    # Convert image to numpy
    image_np = np.array(image_pil)
    
    # Ensure mask has same dimensions as image
    if len(image_np.shape) == 3:
        h, w, c = image_np.shape
    else:
        h, w = image_np.shape
        c = 1
    
    if mask_np.shape != (h, w):
        mask_np = cv2.resize(mask_np, (w, h), interpolation=cv2.INTER_LANCZOS4)
    
    # Create RGBA image
    if c == 3:
        # Add alpha channel
        image_rgba = np.dstack([image_np, mask_np])
    else:
        # Already has alpha or is grayscale
        image_rgba = image_np.copy()
        if len(image_rgba.shape) == 2:
            image_rgba = np.dstack([image_rgba, image_rgba, image_rgba, mask_np])
        else:
            image_rgba[..., 3] = mask_np
    
    # Convert back to PIL
    result_image = Image.fromarray(image_rgba, 'RGBA')
    
    return result_image

def real_u2net_inference(image_pil, model_type='general', precision='precise', edge_smoothing=3):
    """Perform real U²-Net inference for background removal"""
    start_time = time.time()
    
    config = MODEL_CONFIG[model_type]
    
    try:
        # Load model
        net = load_model(model_type)
        
        # Preprocess image
        input_tensor, original_size = preprocess_image(image_pil, config['input_size'])
        
        # Inference
        logger.info(f"🔍 Running U²-Net inference on {device}")
        with torch.no_grad():
            d1, d2, d3, d4, d5, d6, d7 = net(input_tensor)
            
            # Use the main output (d1) for best quality
            mask_tensor = d1
        
        # Postprocess mask
        mask_np = postprocess_mask(mask_tensor, original_size, edge_smoothing)
        
        # Apply mask to remove background
        result_image = apply_mask_to_image(image_pil, mask_np)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Calculate confidence based on mask quality
        mask_mean = np.mean(mask_np) / 255.0
        mask_std = np.std(mask_np) / 255.0
        confidence = min(0.99, max(0.7, mask_mean * (1 - mask_std)))
        
        # Calculate edge quality based on mask gradient
        sobel_x = cv2.Sobel(mask_np, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(mask_np, cv2.CV_64F, 0, 1, ksize=3)
        edge_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        edge_quality = min(0.99, max(0.7, 1.0 - np.mean(edge_magnitude) / 255.0))
        
        metadata = {
            'model': f"U²-Net-{model_type}",
            'confidence': round(confidence, 3),
            'edge_quality': round(edge_quality, 3),
            'processing_time': round(processing_time, 1),
            'precision': precision,
            'device': str(device),
            'algorithm': 'Real U²-Net Neural Network',
            'engine': 'PyTorch U²-Net',
            'input_size': config['input_size']
        }
        
        logger.info(f"✅ U²-Net inference completed:")
        logger.info(f"   🤖 Model: {metadata['model']}")
        logger.info(f"   🎯 Confidence: {metadata['confidence']*100:.1f}%")
        logger.info(f"   📏 Edge Quality: {metadata['edge_quality']*100:.1f}%")
        logger.info(f"   ⚡ Time: {metadata['processing_time']}ms")
        
        return result_image, metadata
        
    except Exception as e:
        logger.error(f"❌ U²-Net inference failed: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Try to load a model to verify everything works
        test_model = model_cache.get('general', None)
        models_loaded = len(model_cache)
        
        return jsonify({
            'status': 'healthy',
            'models_available': list(MODEL_CONFIG.keys()),
            'models_loaded': models_loaded,
            'device': str(device),
            'cuda_available': torch.cuda.is_available(),
            'mode': 'real_u2net_ai',
            'version': '2.0.0'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    models = []
    for model_id, config in MODEL_CONFIG.items():
        models.append({
            'id': model_id,
            'name': f"U²-Net {model_id.title()}",
            'description': config['description'],
            'input_size': config['input_size'],
            'loaded': model_id in model_cache
        })
    
    return jsonify({'models': models})

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    """AI background removal endpoint"""
    start_time = time.time()
    
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Parse options
        model_type = request.form.get('model', 'general')
        precision = request.form.get('precision', 'precise')
        edge_smoothing = int(request.form.get('edge_smoothing', 3))
        output_format = request.form.get('output_format', 'png')
        
        # Validate model type
        if model_type not in MODEL_CONFIG:
            return jsonify({
                'error': f'Invalid model: {model_type}. Available: {list(MODEL_CONFIG.keys())}'
            }), 400
        
        # Load and validate image
        try:
            image_pil = Image.open(file.stream)
            original_size = image_pil.size
            logger.info(f"📥 Processing image: {file.filename} ({original_size[0]}x{original_size[1]})")
        except Exception as e:
            return jsonify({'error': f'Invalid image file: {e}'}), 400
        
        # Perform AI inference
        result_image, metadata = real_u2net_inference(
            image_pil, 
            model_type=model_type,
            precision=precision,
            edge_smoothing=edge_smoothing
        )
        
        # Convert result to bytes
        output_buffer = io.BytesIO()
        if output_format.lower() == 'webp':
            result_image.save(output_buffer, format='WEBP', quality=95)
            content_type = 'image/webp'
        else:
            result_image.save(output_buffer, format='PNG', optimize=True)
            content_type = 'image/png'
        
        output_buffer.seek(0)
        
        # Calculate total processing time
        total_time = (time.time() - start_time) * 1000
        
        # Create response with metadata headers
        response = send_file(
            output_buffer,
            mimetype=content_type,
            as_attachment=False
        )
        
        # Add metadata to response headers
        response.headers['X-AI-Model'] = metadata['model']
        response.headers['X-Confidence'] = str(metadata['confidence'])
        response.headers['X-Edge-Quality'] = str(metadata['edge_quality'])
        response.headers['X-Processing-Time'] = str(int(total_time))
        response.headers['X-Precision'] = metadata['precision']
        response.headers['X-Device'] = metadata['device']
        response.headers['X-Engine'] = metadata['engine']
        response.headers['X-Original-Size'] = f"{original_size[0]}x{original_size[1]}"
        response.headers['X-Result-Size'] = str(output_buffer.getbuffer().nbytes)
        
        logger.info(f"🎉 Background removal completed in {total_time:.1f}ms")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Background removal failed: {e}")
        return jsonify({
            'error': 'Background removal failed',
            'details': str(e)
        }), 500

@app.route('/preload-model', methods=['POST'])
def preload_model():
    """Preload a specific model into memory"""
    try:
        data = request.get_json()
        model_type = data.get('model', 'general')
        
        if model_type not in MODEL_CONFIG:
            return jsonify({
                'error': f'Invalid model: {model_type}'
            }), 400
        
        # Load the model
        load_model(model_type)
        
        return jsonify({
            'success': True,
            'message': f'Model {model_type} loaded successfully',
            'models_loaded': list(model_cache.keys())
        })
        
    except Exception as e:
        logger.error(f"❌ Failed to preload model: {e}")
        return jsonify({
            'error': 'Failed to preload model',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting U²-Net AI Background Removal Service")
    logger.info(f"🖥️  Device: {device}")
    logger.info(f"🧠 Models available: {list(MODEL_CONFIG.keys())}")

    # Get port from environment variable (for Google Cloud Run compatibility)
    port = int(os.environ.get('PORT', 8080))
    logger.info(f"🌐 Starting server on port {port}")

    # Preload the general model on startup
    try:
        logger.info("🔄 Preloading general model...")
        load_model('general')
        logger.info("✅ General model preloaded successfully")
    except Exception as e:
        logger.warning(f"⚠️  Failed to preload general model: {e}")
        logger.info("📝 Models will be loaded on first request")

    app.run(host='0.0.0.0', port=port, debug=False)
