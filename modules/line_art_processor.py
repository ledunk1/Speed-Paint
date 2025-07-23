"""
Line Art Processor Module
Menggunakan ONNX model untuk convert image ke line art
Berdasarkan script index.html
"""

import cv2
import numpy as np
import onnxruntime as ort
import os
from PIL import Image
import tempfile
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LineArtProcessor:
    def __init__(self):
        self.session = None
        self.model_path = "models/model.onnx"
        self.model_url = "https://huggingface.co/rocca/informative-drawings-line-art-onnx/resolve/main/model.onnx"
        self._load_model()
    
    def _load_model(self):
        """Load ONNX model"""
        try:
            # Create models directory if not exists
            os.makedirs("models", exist_ok=True)
            
            # Download model if not exists
            if not os.path.exists(self.model_path):
                logger.info("Downloading ONNX model...")
                self._download_model()
            
            # Load model
            logger.info("Loading ONNX model...")
            self.session = ort.InferenceSession(
                self.model_path, 
                providers=['CPUExecutionProvider']
            )
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.session = None
    
    def _download_model(self):
        """Download model from HuggingFace"""
        try:
            import urllib.request
            urllib.request.urlretrieve(self.model_url, self.model_path)
            logger.info("Model downloaded successfully")
        except Exception as e:
            logger.error(f"Failed to download model: {e}")
            raise
    
    def _blob_to_linear_rgb_array(self, image_path):
        """
        Convert image to linear RGB array
        Berdasarkan fungsi blobToLinearRGBArray dari script asli
        """
        try:
            # Load image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Cannot load image")
            
            # Convert BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            height, width = img.shape[:2]
            
            # Normalize to 0-1
            img_normalized = img.astype(np.float32) / 255.0
            
            # Reshape to [channels, height, width]
            rgb_data = img_normalized.transpose(2, 0, 1)  # HWC to CHW
            
            return {
                'data': rgb_data.flatten(),
                'width': width,
                'height': height
            }
            
        except Exception as e:
            logger.error(f"Error in blob_to_linear_rgb_array: {e}")
            raise
    
    def _linear_greyscale_array_to_image(self, linear_arr, dims):
        """
        Convert linear greyscale array to image
        Berdasarkan fungsi linearGreyscaleArrayToBlob dari script asli
        """
        try:
            # Convert to 0-255 range
            data_array = (linear_arr * 255).astype(np.uint8)
            
            # Reshape to image dimensions
            img_array = data_array.reshape(dims['height'], dims['width'])
            
            # Convert to RGB (duplicate greyscale to 3 channels)
            img_rgb = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
            
            return img_rgb
            
        except Exception as e:
            logger.error(f"Error in linear_greyscale_array_to_image: {e}")
            raise
    
    def convert_to_line_art(self, input_path, output_path):
        """
        Convert image to line art
        Main function berdasarkan script index.html
        """
        try:
            if self.session is None:
                logger.error("ONNX model not loaded")
                return False
            
            logger.info(f"Processing image: {input_path}")
            
            # Convert image to linear RGB array
            rgb_data = self._blob_to_linear_rgb_array(input_path)
            
            # Prepare input tensor
            input_tensor = ort.OrtValue.ortvalue_from_numpy(
                rgb_data['data'].reshape(1, 3, rgb_data['height'], rgb_data['width']).astype(np.float32)
            )
            
            # Run inference
            logger.info("Running ONNX inference...")
            feeds = {'input': input_tensor}
            results = self.session.run(['output'], feeds)
            
            # Get output
            output_data = results[0]  # greyscale data tensor
            logger.info(f"Inference completed. Output shape: {output_data.shape}")
            
            # Convert output to image
            dims = {
                'width': output_data.shape[3],
                'height': output_data.shape[2]
            }
            
            line_art_img = self._linear_greyscale_array_to_image(
                output_data.flatten(), dims
            )
            
            # Save result
            line_art_bgr = cv2.cvtColor(line_art_img, cv2.COLOR_RGB2BGR)
            success = cv2.imwrite(output_path, line_art_bgr)
            
            if success:
                logger.info(f"Line art saved to: {output_path}")
                return True
            else:
                logger.error("Failed to save line art")
                return False
                
        except Exception as e:
            logger.error(f"Error in convert_to_line_art: {e}")
            return False
    
    def is_model_ready(self):
        """Check if model is ready"""
        return self.session is not None