from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import io
import time
import cv2
import numpy as np
from PIL import Image
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_available': ['general', 'person', 'product'],
        'device': 'cpu',
        'cuda_available': False,
        'mode': 'simple_fallback'
    })

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    return jsonify({
        'models': [
            {
                'id': 'general',
                'name': 'Simple Background Removal',
                'description': 'Basic background removal using OpenCV',
                'input_size': 512
            }
        ]
    })

def simple_background_removal(image_pil, options):
    """Simple background removal using OpenCV (for testing)"""
    start_time = time.time()
    
    # Convert PIL to OpenCV
    image_np = np.array(image_pil)
    if len(image_np.shape) == 3 and image_np.shape[2] == 3:
        image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    else:
        image_cv = image_np
    
    # Simple edge-based mask creation
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    
    # Apply GaussianBlur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Simple thresholding for demonstration
    _, mask = cv2.threshold(blurred, 120, 255, cv2.THRESH_BINARY)
    
    # Apply some morphological operations
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Apply edge smoothing if requested
    edge_smoothing = options.get('edge_smoothing', 0)
    if edge_smoothing > 0:
        kernel_size = edge_smoothing * 2 + 1
        mask = cv2.GaussianBlur(mask, (kernel_size, kernel_size), 0)
    
    # Create RGBA image
    result = np.zeros((image_np.shape[0], image_np.shape[1], 4), dtype=np.uint8)
    result[:, :, :3] = image_np
    result[:, :, 3] = mask
    
    # Convert back to PIL
    result_pil = Image.fromarray(result, 'RGBA')
    
    processing_time = time.time() - start_time
    
    metadata = {
        'model': 'Simple OpenCV',
        'processing_time': processing_time,
        'confidence': 0.8,  # Fixed confidence for demo
        'edge_quality': 0.7,
        'precision': options.get('precision', 'balanced'),
        'original_size': image_pil.size
    }
    
    return result_pil, metadata

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    """Background removal endpoint with simple OpenCV processing"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Parse options
        model_type = request.form.get('model', 'general')
        precision = request.form.get('precision', 'balanced')
        edge_smoothing = int(request.form.get('edge_smoothing', 2))
        output_format = request.form.get('output_format', 'png')
        
        logger.info(f"Processing image: {file.filename}, Model: {model_type}")
        
        # Load image
        image_pil = Image.open(file.stream)
        if image_pil.mode != 'RGB':
            image_pil = image_pil.convert('RGB')
        
        # Process with simple method
        options = {
            'precision': precision,
            'edge_smoothing': edge_smoothing,
            'output_format': output_format
        }
        
        result_image, metadata = simple_background_removal(image_pil, options)
        
        # Save to buffer
        img_buffer = io.BytesIO()
        if output_format.lower() == 'webp':
            result_image.save(img_buffer, format='WEBP', quality=95)
            mimetype = 'image/webp'
        else:
            result_image.save(img_buffer, format='PNG', optimize=True)
            mimetype = 'image/png'
        
        img_buffer.seek(0)
        
        # Create response
        response = send_file(
            img_buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=f"removed_bg_{file.filename}"
        )
        
        # Add metadata headers
        response.headers['X-Processing-Time'] = str(int(metadata['processing_time'] * 1000))
        response.headers['X-Confidence'] = str(metadata['confidence'])
        response.headers['X-Edge-Quality'] = str(metadata['edge_quality'])
        response.headers['X-Model-Used'] = metadata['model']
        response.headers['X-Precision'] = metadata['precision']
        response.headers['X-Engine'] = 'Simple OpenCV (Demo)'
        
        logger.info(f"Successfully processed {file.filename} in {metadata['processing_time']:.2f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Simple Background Removal Service (Demo Mode)")
    logger.info("This is a basic OpenCV implementation for testing")
    logger.info("For production, use the full U²-Net implementation")
    app.run(host='0.0.0.0', port=5000, debug=False)
