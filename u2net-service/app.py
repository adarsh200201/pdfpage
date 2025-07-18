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
from skimage import io as skio, transform
import torch.nn.functional as F
import logging

# Import U2Net model
from model import U2NET

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configurations
MODEL_CONFIG = {
    'general': {
        'model_name': 'u2net.pth',
        'input_size': 320,
        'description': 'General purpose background removal'
    },
    'person': {
        'model_name': 'u2net_human_seg.pth', 
        'input_size': 320,
        'description': 'Optimized for human portraits'
    },
    'product': {
        'model_name': 'u2net.pth',
        'input_size': 320,
        'description': 'E-commerce product photography'
    }
}

# Global model cache
model_cache = {}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

def load_model(model_type='general'):
    """Load U²-Net model with caching"""
    if model_type in model_cache:
        return model_cache[model_type]
    
    try:
        config = MODEL_CONFIG.get(model_type, MODEL_CONFIG['general'])
        model_path = f"saved_models/{config['model_name']}"
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Initialize U²-Net
        net = U2NET(3, 1)
        net.load_state_dict(torch.load(model_path, map_location=device))
        net.to(device)
        net.eval()
        
        model_cache[model_type] = net
        logger.info(f"Loaded {model_type} model from {model_path}")
        return net
        
    except Exception as e:
        logger.error(f"Failed to load model {model_type}: {e}")
        raise

def preprocess_image(image_pil, target_size=320):
    """Preprocess image for U²-Net inference"""
    # Convert to RGB if needed
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
    
    # Get original size
    original_size = image_pil.size
    
    # Resize image
    image_resized = image_pil.resize((target_size, target_size), Image.LANCZOS)
    
    # Convert to numpy array and normalize
    image_np = np.array(image_resized, dtype=np.float32)
    image_np = image_np / 255.0
    
    # Normalize with ImageNet stats
    transform = transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
    
    # Convert to tensor
    image_tensor = torch.from_numpy(image_np.transpose(2, 0, 1)).float()
    image_tensor = transform(image_tensor)
    image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
    
    return image_tensor, original_size

def postprocess_mask(mask_tensor, original_size):
    """Postprocess the output mask"""
    # Remove batch dimension and convert to numpy
    mask = mask_tensor.squeeze().cpu().data.numpy()
    
    # Resize back to original size
    mask_resized = transform.resize(mask, original_size[::-1], mode='constant')
    
    # Threshold and convert to 0-255 range
    mask_binary = (mask_resized > 0.5).astype(np.uint8) * 255
    
    return mask_binary

def apply_edge_smoothing(mask, smoothing_level=3):
    """Apply edge smoothing to the mask"""
    if smoothing_level > 0:
        # Apply Gaussian blur for edge smoothing
        kernel_size = smoothing_level * 2 + 1
        mask = cv2.GaussianBlur(mask, (kernel_size, kernel_size), 0)
    return mask

def remove_background_u2net(image_pil, model_type='general', precision='precise', edge_smoothing=3):
    """Main function to remove background using U²-Net"""
    start_time = time.time()
    
    try:
        # Load model
        net = load_model(model_type)
        
        # Get target size based on precision
        target_size = {
            'fast': 256,
            'balanced': 320, 
            'precise': 512
        }.get(precision, 320)
        
        # Preprocess image
        input_tensor, original_size = preprocess_image(image_pil, target_size)
        input_tensor = input_tensor.to(device)
        
        # Run inference
        with torch.no_grad():
            d1, d2, d3, d4, d5, d6, d7 = net(input_tensor)
            pred = F.sigmoid(d1)  # Use the first output (d1) as main prediction
        
        # Postprocess mask
        mask = postprocess_mask(pred, original_size)
        
        # Apply edge smoothing
        if edge_smoothing > 0:
            mask = apply_edge_smoothing(mask, edge_smoothing)
        
        # Apply mask to original image
        image_np = np.array(image_pil)
        
        # Create 4-channel image with alpha
        if len(image_np.shape) == 3:
            result = np.zeros((image_np.shape[0], image_np.shape[1], 4), dtype=np.uint8)
            result[:, :, :3] = image_np
            result[:, :, 3] = mask
        else:
            result = image_np.copy()
            result[:, :, 3] = mask
        
        # Convert back to PIL Image
        result_pil = Image.fromarray(result, 'RGBA')
        
        processing_time = time.time() - start_time
        
        # Calculate confidence score (simplified)
        confidence = np.mean(mask / 255.0)
        edge_quality = np.std(mask / 255.0)  # Higher std indicates better edge definition
        
        metadata = {
            'model': f"U²-Net-{model_type}",
            'processing_time': processing_time,
            'confidence': float(confidence),
            'edge_quality': float(edge_quality),
            'precision': precision,
            'target_size': target_size,
            'original_size': original_size
        }
        
        return result_pil, metadata
        
    except Exception as e:
        logger.error(f"U²-Net processing error: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_available': list(MODEL_CONFIG.keys()),
        'device': str(device),
        'cuda_available': torch.cuda.is_available()
    })

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    return jsonify({
        'models': [
            {
                'id': model_id,
                'name': f"U²-Net {model_id.title()}",
                'description': config['description'],
                'input_size': config['input_size']
            }
            for model_id, config in MODEL_CONFIG.items()
        ]
    })

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    """Main endpoint for background removal"""
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Parse options
        model_type = request.form.get('model', 'general')
        precision = request.form.get('precision', 'precise')
        edge_smoothing = int(request.form.get('edge_smoothing', 3))
        output_format = request.form.get('output_format', 'png')
        
        # Validate model type
        if model_type not in MODEL_CONFIG:
            return jsonify({'error': f'Invalid model type: {model_type}'}), 400
        
        # Load and process image
        image_pil = Image.open(file.stream)
        
        logger.info(f"Processing image: {file.filename}, Model: {model_type}, Precision: {precision}")
        
        # Remove background using U²-Net
        result_image, metadata = remove_background_u2net(
            image_pil, model_type, precision, edge_smoothing
        )
        
        # Save to memory buffer
        img_buffer = io.BytesIO()
        if output_format.lower() == 'webp':
            result_image.save(img_buffer, format='WEBP', quality=95)
            mimetype = 'image/webp'
        else:
            result_image.save(img_buffer, format='PNG', optimize=True)
            mimetype = 'image/png'
        
        img_buffer.seek(0)
        
        # Add metadata headers
        response = send_file(
            img_buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=f"removed_bg_{file.filename}"
        )
        
        # Add custom headers with metadata
        response.headers['X-Processing-Time'] = str(metadata['processing_time'])
        response.headers['X-Confidence'] = str(metadata['confidence'])
        response.headers['X-Edge-Quality'] = str(metadata['edge_quality'])
        response.headers['X-Model-Used'] = metadata['model']
        response.headers['X-Precision'] = metadata['precision']
        
        logger.info(f"Successfully processed {file.filename} in {metadata['processing_time']:.2f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/remove-bg-batch', methods=['POST'])
def remove_background_batch():
    """Batch processing endpoint"""
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No image files provided'}), 400
        
        model_type = request.form.get('model', 'general')
        precision = request.form.get('precision', 'balanced')  # Use balanced for batch
        edge_smoothing = int(request.form.get('edge_smoothing', 2))
        
        results = []
        
        for i, file in enumerate(files):
            try:
                logger.info(f"Processing batch image {i+1}/{len(files)}: {file.filename}")
                
                image_pil = Image.open(file.stream)
                result_image, metadata = remove_background_u2net(
                    image_pil, model_type, precision, edge_smoothing
                )
                
                # Convert to base64 for JSON response
                img_buffer = io.BytesIO()
                result_image.save(img_buffer, format='PNG', optimize=True)
                img_buffer.seek(0)
                
                import base64
                img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
                
                results.append({
                    'filename': file.filename,
                    'success': True,
                    'data': f"data:image/png;base64,{img_base64}",
                    'metadata': metadata
                })
                
            except Exception as e:
                logger.error(f"Failed to process {file.filename}: {e}")
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': str(e)
                })
        
        success_count = sum(1 for r in results if r['success'])
        
        return jsonify({
            'success': True,
            'processed': success_count,
            'total': len(files),
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure model directory exists
    os.makedirs('saved_models', exist_ok=True)
    
    # Check if models are available
    for model_type, config in MODEL_CONFIG.items():
        model_path = f"saved_models/{config['model_name']}"
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found: {model_path}")
            logger.info(f"Please download the model from: https://github.com/xuebinqin/U-2-Net/releases")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
