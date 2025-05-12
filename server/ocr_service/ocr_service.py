# server/ocr_service/ocr_service.py
import pytesseract
import cv2
import numpy as np
import re
import json
import os
import sys
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Set Tesseract path
if sys.platform.startswith('win'):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    logger.info(f"Preprocessing image: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image at {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Resize for better OCR
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    # Adaptive thresholding
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return thresh

def split_receipts(image_path):
    logger.info(f"Splitting receipts from image: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image at {image_path}")
    height, width = img.shape[:2]
    
    # Check if the image is wide enough to split
    if width > height:
        left_half = img[:, :width//2]
        right_half = img[:, width//2:]
        left_path = os.path.join(app.config['UPLOAD_FOLDER'], 'left_receipt.jpg')
        right_path = os.path.join(app.config['UPLOAD_FOLDER'], 'right_receipt.jpg')
        cv2.imwrite(left_path, left_half)
        cv2.imwrite(right_path, right_half)
        return [left_path, right_path]
    else:
        # Image is taller than wide, don't split
        return [image_path]

def extract_fields_from_text(text):
    logger.info("Extracting fields from OCR text")
    # Clean up text and split into lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    data = {
        "PRINT DATE": "",
        "PUMP SERIAL NUMBER": "",
        "NOZZLES": []
    }
    nozzle = None
    for line in lines:
        # PRINT DATE
        m = re.search(r'PRINT\s*DATE\s*[:\-]?\s*([0-9A-Z\-]+)', line, re.I)
        if m:
            data["PRINT DATE"] = m.group(1)
        # PUMP SERIAL NUMBER
        m = re.search(r'PUMP\s*SERIAL\s*NUMBER\s*[:\-]?\s*([A-Z0-9]+)', line, re.I)
        if m:
            data["PUMP SERIAL NUMBER"] = m.group(1)
        # NOZZLE
        m = re.search(r'NOZZLE\s*[:\-]?\s*(\d+)', line, re.I)
        if m:
            if nozzle:
                data["NOZZLES"].append(nozzle)
            nozzle = {"NOZZLE": m.group(1), "A": "", "V": "", "TOT SALES": ""}
        # A:
        m = re.search(r'A\s*[:\-]?\s*([0-9.]+)', line, re.I)
        if m and nozzle:
            nozzle["A"] = m.group(1)
        # V:
        m = re.search(r'V\s*[:\-]?\s*([0-9.]+)', line, re.I)
        if m and nozzle:
            nozzle["V"] = m.group(1)
        # TOT SALES:
        m = re.search(r'TOT\s*SALES\s*[:\-]?\s*([0-9]+)', line, re.I)
        if m and nozzle:
            nozzle["TOT SALES"] = m.group(1)
    if nozzle:
        data["NOZZLES"].append(nozzle)
    return data

def process_receipt(image_path):
    logger.info(f"Processing receipt: {image_path}")
    try:
        preprocessed = preprocess_image(image_path)
        # OCR
        ocr_text = pytesseract.image_to_string(preprocessed, config='--oem 3 --psm 6')
        logger.info("OCR completed successfully")
        logger.debug(f"OCR Text: {ocr_text}")
        data = extract_fields_from_text(ocr_text)
        return {'success': True, 'data': data, 'ocr_text': ocr_text}
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        return {'success': False, 'error': str(e)}

@app.route('/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No image selected'}), 400
    
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Check if we should attempt to split the receipt
        split_option = request.form.get('split', 'true').lower() == 'true'
        
        if split_option:
            receipt_paths = split_receipts(file_path)
        else:
            receipt_paths = [file_path]
        
        results = []
        for i, path in enumerate(receipt_paths):
            result = process_receipt(path)
            if result['success']:
                results.append({
                    'receipt_index': i,
                    'data': result['data'],
                    'ocr_text': result['ocr_text']
                })
        
        return jsonify({
            'success': True, 
            'results': results,
            'receipts_processed': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)