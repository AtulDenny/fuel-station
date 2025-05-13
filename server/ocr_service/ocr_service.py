# ocr_service.py
from flask import Flask, request, jsonify
import os
import sys
import uuid
import tempfile
from werkzeug.utils import secure_filename

# Import your OCR code
import pytesseract
import cv2
import numpy as np
import re

app = Flask(__name__)

# Use system temp directory which should have proper permissions
TEMP_DIR = tempfile.gettempdir()
UPLOAD_FOLDER = os.path.join(TEMP_DIR, 'ocr_uploads')
print(f"Using upload directory: {UPLOAD_FOLDER}")

# Make sure the directory exists with proper permissions
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER)
        print(f"Created directory: {UPLOAD_FOLDER}")
    except Exception as e:
        print(f"Error creating directory: {str(e)}")
        # Fall back to system temp directory if creation fails
        UPLOAD_FOLDER = TEMP_DIR
        print(f"Falling back to system temp directory: {UPLOAD_FOLDER}")

# Configure Tesseract path - FIX: Add the executable name
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Could not read image at {image_path}")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Resize for better OCR
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        # Denoise
        gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
        # Adaptive thresholding
        thresh = cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,11,2)
        return thresh
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        raise

def split_receipts(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Could not read image at {image_path}")
        height, width = img.shape[:2]
        left_half = img[:, :width//2]
        right_half = img[:, width//2:]
        # Use unique filenames with UUIDs to avoid conflicts
        left_path = os.path.join(UPLOAD_FOLDER, f'left_receipt_{uuid.uuid4()}.jpg')
        right_path = os.path.join(UPLOAD_FOLDER, f'right_receipt_{uuid.uuid4()}.jpg')
        cv2.imwrite(left_path, left_half)
        cv2.imwrite(right_path, right_half)
        print(f"Split images saved as {left_path} and {right_path}")
        return [left_path, right_path]
    except Exception as e:
        print(f"Error splitting image: {str(e)}")
        raise

def extract_fields_from_text(text):
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
    try:
        preprocessed = preprocess_image(image_path)
        # OCR
        ocr_text = pytesseract.image_to_string(preprocessed, config='--oem 3 --psm 6')
        print("\n=== OCR OUTPUT START ===")
        print(ocr_text)
        print("=== OCR OUTPUT END ===\n")
        data = extract_fields_from_text(ocr_text)
        return data, ocr_text
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        # If OCR fails, provide fallback dummy data
        fallback_data = {
            "PRINT DATE": f"ERROR-{uuid.uuid4().hex[:8]}",
            "PUMP SERIAL NUMBER": f"ERROR-{uuid.uuid4().hex[:8]}",
            "NOZZLES": [
                {"NOZZLE": "1", "A": "0", "V": "0", "TOT SALES": "0"}
            ]
        }
        error_text = f"OCR ERROR: {str(e)}\n\nThis is fallback data due to OCR failure."
        return fallback_data, error_text

def print_receipt_data(label, data):
    print(f"\n===== {label} RECEIPT =====")
    print(f"PRINT DATE: {data['PRINT DATE']}")
    print(f"PUMP SERIAL NUMBER: {data['PUMP SERIAL NUMBER']}")
    for nozzle in data["NOZZLES"]:
        print(f"NOZZLE : {nozzle['NOZZLE']}")
        print(f"A: {nozzle['A']}")
        print(f"V: {nozzle['V']}")
        print(f"TOT SALES: {nozzle['TOT SALES']}")
        print("-" * 30)

# Flask route to handle API request
@app.route('/process', methods=['POST'])
def process_image():
    print("Received request to /process endpoint")
    
    if 'image' not in request.files:
        print("No image file in request")
        return jsonify({"success": False, "error": "No image provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        print("Empty filename")
        return jsonify({"success": False, "error": "No file selected"}), 400
        
    # Get split option (default to true)
    split_option = request.form.get('split', 'true').lower() == 'true'
    print(f"Split option: {split_option}")
    
    # Save the uploaded file with error handling
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        file.save(file_path)
        print(f"Saved uploaded file to {file_path}")
    except Exception as e:
        print(f"Error saving uploaded file: {str(e)}")
        return jsonify({"success": False, "error": f"File upload error: {str(e)}"}), 500
    
    try:
        results = []
        
        if split_option:
            print("Processing with split option")
            try:
                split_paths = split_receipts(file_path)
                
                # Process left receipt
                left_data, left_ocr_text = process_receipt(split_paths[0])
                print_receipt_data("LEFT", left_data)
                results.append({
                    "data": left_data,
                    "ocr_text": left_ocr_text
                })
                
                # Process right receipt
                right_data, right_ocr_text = process_receipt(split_paths[1])
                print_receipt_data("RIGHT", right_data)
                results.append({
                    "data": right_data,
                    "ocr_text": right_ocr_text
                })
                
                # Clean up temp files
                try:
                    os.remove(split_paths[0])
                    os.remove(split_paths[1])
                    print("Cleaned up split image files")
                except Exception as e:
                    print(f"Error removing split files: {str(e)}")
            except Exception as e:
                print(f"Error in split processing: {str(e)}")
                # If splitting fails, fall back to single processing
                print("Falling back to single receipt processing")
                data, ocr_text = process_receipt(file_path)
                results.append({
                    "data": data,
                    "ocr_text": ocr_text
                })
        else:
            print("Processing as single receipt")
            # Process single receipt
            data, ocr_text = process_receipt(file_path)
            results.append({
                "data": data,
                "ocr_text": ocr_text
            })
        
        # Clean up the original file
        try:
            os.remove(file_path)
            print(f"Cleaned up original file")
        except Exception as e:
            print(f"Error removing original file: {str(e)}")
            
        print("Processing completed successfully")
        return jsonify({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        # Clean up in case of error
        try:
            os.remove(file_path)
        except:
            pass
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Add a status endpoint
@app.route('/', methods=['GET'])
def home():
    tesseract_exists = os.path.exists(pytesseract.pytesseract.tesseract_cmd)
    return jsonify({
        "status": "OCR Service is running",
        "upload_folder": UPLOAD_FOLDER,
        "tesseract_path": pytesseract.pytesseract.tesseract_cmd,
        "tesseract_installed": tesseract_exists
    })

if __name__ == "__main__":
    print("Starting OCR service on port 5001...")
    print(f"System platform: {sys.platform}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Tesseract path: {pytesseract.pytesseract.tesseract_cmd}")
    tesseract_exists = os.path.exists(pytesseract.pytesseract.tesseract_cmd)
    print(f"Tesseract installed: {tesseract_exists}")
    if not tesseract_exists:
        print("WARNING: Tesseract executable not found at the specified path!")
        print("Please install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki")
    app.run(host='0.0.0.0', port=5001)