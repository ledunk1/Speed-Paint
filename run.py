from flask import Flask, render_template, request, jsonify, send_file, url_for
import os
import uuid
from werkzeug.utils import secure_filename
import json
from datetime import datetime
import logging
import traceback
import sys
import zipfile
import io

# --- TAMBAHAN: Impor untuk GUI Launcher ---
import tkinter as tk
from tkinter import ttk
import webbrowser
import threading
# -----------------------------------------

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
os.makedirs('static/temp', exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================================================================
# SEMUA FUNGSI DAN ROUTE FLASK ANDA TETAP SAMA (TIDAK DIUBAH)
# ==================================================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            file_id = str(uuid.uuid4())
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower()
            
            # Save original file
            original_filename = f"{file_id}_original.{file_extension}"
            original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
            file.save(original_path)
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'original_filename': original_filename,
                'original_url': url_for('serve_upload', filename=original_filename),
                'message': 'File uploaded successfully'
            })
        else:
            return jsonify({'error': 'Invalid file type'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload_multiple', methods=['POST'])
def upload_multiple_files():
    """Upload multiple files for batch processing"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files selected'}), 400
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files selected'}), 400
        
        uploaded_files = []
        
        for file in files:
            if file and allowed_file(file.filename):
                # Generate unique filename
                file_id = str(uuid.uuid4())
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                
                # Save original file
                original_filename = f"{file_id}_original.{file_extension}"
                original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
                file.save(original_path)
                
                uploaded_files.append({
                    'file_id': file_id,
                    'original_filename': original_filename,
                    'original_name': filename,
                    'original_url': url_for('serve_upload', filename=original_filename)
                })
        
        return jsonify({
            'success': True,
            'files': uploaded_files,
            'count': len(uploaded_files),
            'message': f'{len(uploaded_files)} files uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process_batch', methods=['POST'])
def process_batch():
    """Process multiple images in batch"""
    try:
        data = request.get_json()
        file_ids = data.get('file_ids', [])
        settings = data.get('settings', {})
        
        if not file_ids:
            return jsonify({'error': 'No file IDs provided'}), 400
        
        results = []
        
        for file_id in file_ids:
            try:
                # Find files
                original_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) 
                                 if f.startswith(f"{file_id}_original")]
                line_art_files = [f for f in os.listdir(app.config['OUTPUT_FOLDER']) 
                                 if f.startswith(f"{file_id}_line_art")]
                
                if not original_files or not line_art_files:
                    results.append({
                        'file_id': file_id,
                        'success': False,
                        'error': 'Required files not found'
                    })
                    continue
                
                original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_files[0])
                line_art_path = os.path.join(app.config['OUTPUT_FOLDER'], line_art_files[0])
                
                # Create animation
                from modules.animation_creator import AnimationCreator
                creator = AnimationCreator()
                
                animation_filename = f"{file_id}_animation.mp4"
                animation_path = os.path.join(app.config['OUTPUT_FOLDER'], animation_filename)
                
                success = creator.create_combined_animation(
                    line_art_path=line_art_path,
                    color_image_path=original_path,
                    output_path=animation_path,
                    style_choice=settings.get('style_choice', 1),
                    drawing_duration=settings.get('drawing_duration', 8),
                    reveal_duration=settings.get('reveal_duration', 10),
                    fps=settings.get('fps', 30),
                    reveal_area_multiplier=settings.get('reveal_area_multiplier', 1.0)
                )
                
                if success:
                    results.append({
                        'file_id': file_id,
                        'success': True,
                        'animation_url': url_for('download_file', filename=animation_filename),
                        'animation_filename': animation_filename
                    })
                else:
                    results.append({
                        'file_id': file_id,
                        'success': False,
                        'error': 'Animation creation failed'
                    })
                    
            except Exception as e:
                results.append({
                    'file_id': file_id,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'total': len(file_ids),
            'successful': len([r for r in results if r['success']]),
            'failed': len([r for r in results if not r['success']])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_batch_zip')
def download_batch_zip():
    """Download all animations as ZIP file"""
    try:
        file_ids = request.args.get('file_ids', '').split(',')
        if not file_ids or file_ids == ['']:
            return jsonify({'error': 'No file IDs provided'}), 400
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_id in file_ids:
                animation_files = [f for f in os.listdir(app.config['OUTPUT_FOLDER']) 
                                 if f.startswith(f"{file_id}_animation")]
                
                for animation_file in animation_files:
                    animation_path = os.path.join(app.config['OUTPUT_FOLDER'], animation_file)
                    if os.path.exists(animation_path):
                        # Use original filename pattern for better naming
                        zip_file.write(animation_path, animation_file)
        
        zip_buffer.seek(0)
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'speed_drawing_animations_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save_line_art', methods=['POST'])
def save_line_art():
    """Save line art generated from frontend"""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        line_art_data = data.get('line_art_data')  # base64 data
        
        if not file_id or not line_art_data:
            return jsonify({'error': 'File ID and line art data required'}), 400
        
        # Remove data URL prefix if present
        if line_art_data.startswith('data:image'):
            line_art_data = line_art_data.split(',')[1]
        
        # Decode base64 and save
        import base64
        line_art_filename = f"{file_id}_line_art.jpg"
        line_art_path = os.path.join(app.config['OUTPUT_FOLDER'], line_art_filename)
        
        with open(line_art_path, 'wb') as f:
            f.write(base64.b64decode(line_art_data))
        
        return jsonify({
            'success': True,
            'line_art_url': url_for('download_file', filename=line_art_filename),
            'line_art_filename': line_art_filename,
            'message': 'Line art saved successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create_animation', methods=['POST'])
def create_animation():
    logger.info("=== CREATE ANIMATION REQUEST ===")
    try:
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        file_id = data.get('file_id')
        animation_mode = data.get('animation_mode', 'full')
        style_choice = data.get('style_choice', 1)
        drawing_duration = data.get('drawing_duration', 8)
        reveal_duration = data.get('reveal_duration', 10)
        fps = data.get('fps', 30)
        reveal_area_multiplier = data.get('reveal_area_multiplier', 1.0)
        enable_random_line_reveal = data.get('enable_random_line_reveal', False)
        line_color = data.get('line_color')
        background_color = data.get('background_color')
        
        logger.info(f"Parameters - file_id: {file_id}, mode: {animation_mode}, style: {style_choice}, drawing: {drawing_duration}s, reveal: {reveal_duration}s, fps: {fps}, area_multiplier: {reveal_area_multiplier}, random_line: {enable_random_line_reveal}, line_color: {line_color}, bg_color: {background_color}")
        
        if not file_id:
            logger.error("No file_id provided")
            return jsonify({'error': 'File ID required'}), 400
        
        # Import animation creator
        from modules.animation_creator import AnimationCreator
        logger.info("AnimationCreator imported successfully")
        
        creator = AnimationCreator()
        
        # Find files
        logger.info("Searching for required files...")
        original_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) 
                         if f.startswith(f"{file_id}_original")]
        line_art_files = [f for f in os.listdir(app.config['OUTPUT_FOLDER']) 
                         if f.startswith(f"{file_id}_line_art")]
        
        logger.info(f"Found original files: {original_files}")
        logger.info(f"Found line art files: {line_art_files}")
        
        if not original_files or not line_art_files:
            logger.error(f"Required files not found - original: {len(original_files)}, line_art: {len(line_art_files)}")
            return jsonify({'error': 'Required files not found'}), 404
        
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_files[0])
        line_art_path = os.path.join(app.config['OUTPUT_FOLDER'], line_art_files[0])
        
        logger.info(f"Original path: {original_path}")
        logger.info(f"Line art path: {line_art_path}")
        
        # Verify files exist
        if not os.path.exists(original_path):
            logger.error(f"Original file does not exist: {original_path}")
            return jsonify({'error': 'Original file not found'}), 404
            
        if not os.path.exists(line_art_path):
            logger.error(f"Line art file does not exist: {line_art_path}")
            return jsonify({'error': 'Line art file not found'}), 404
        
        # Create animation
        animation_filename = f"{file_id}_animation.mp4"
        animation_path = os.path.join(app.config['OUTPUT_FOLDER'], animation_filename)
        logger.info(f"Animation output path: {animation_path}")
        
        logger.info("Starting animation creation...")
        success = creator.create_combined_animation(
            line_art_path=line_art_path,
            color_image_path=original_path,
            output_path=animation_path,
            style_choice=style_choice,
            drawing_duration=drawing_duration,
            reveal_duration=reveal_duration,
            fps=fps,
            reveal_area_multiplier=reveal_area_multiplier,
            animation_mode=animation_mode,
            line_color=line_color,
            background_color=background_color
        )
        
        logger.info(f"Animation creation result: {success}")
        
        if success:
            logger.info("Animation created successfully")
            return jsonify({
                'success': True,
                'animation_url': url_for('download_file', filename=animation_filename),
                'animation_filename': animation_filename,
                'message': 'Animation created successfully'
            })
        else:
            logger.error("Animation creation failed")
            return jsonify({'error': 'Failed to create animation'}), 500
            
    except Exception as e:
        logger.error("=== FLASK CREATE ANIMATION ERROR ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error("Full traceback:")
        logger.error(traceback.format_exc())
        
        # Print to console as well
        print("=== FLASK CREATE ANIMATION ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    try:
        return send_file(
            os.path.join(app.config['UPLOAD_FOLDER'], filename),
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/download/<filename>')
def download_file(filename):
    try:
        return send_file(
            os.path.join(app.config['OUTPUT_FOLDER'], filename),
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/get_paint_styles')
def get_paint_styles():
    from modules.animation_creator import PAINT_STYLES
    return jsonify(PAINT_STYLES)

# File Management Routes
@app.route('/file_manager')
def file_manager():
    return render_template('file_manager.html')

@app.route('/api/file_stats')
def get_file_stats():
    try:
        uploads_dir = app.config['UPLOAD_FOLDER']
        outputs_dir = app.config['OUTPUT_FOLDER']
        
        uploads_count = 0
        outputs_count = 0
        total_size = 0
        
        # Count uploads
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                filepath = os.path.join(uploads_dir, filename)
                if os.path.isfile(filepath):
                    uploads_count += 1
                    total_size += os.path.getsize(filepath)
        
        # Count outputs
        if os.path.exists(outputs_dir):
            for filename in os.listdir(outputs_dir):
                filepath = os.path.join(outputs_dir, filename)
                if os.path.isfile(filepath):
                    outputs_count += 1
                    total_size += os.path.getsize(filepath)
        
        return jsonify({
            'success': True,
            'uploads_count': uploads_count,
            'outputs_count': outputs_count,
            'total_size': total_size
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/list_uploads')
def list_uploads():
    try:
        uploads_dir = app.config['UPLOAD_FOLDER']
        files = []
        
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                filepath = os.path.join(uploads_dir, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    files.append({
                        'name': filename,
                        'size': stat.st_size,
                        'modified': stat.st_mtime
                    })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/list_outputs')
def list_outputs():
    try:
        outputs_dir = app.config['OUTPUT_FOLDER']
        files = []
        
        if os.path.exists(outputs_dir):
            for filename in os.listdir(outputs_dir):
                filepath = os.path.join(outputs_dir, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    files.append({
                        'name': filename,
                        'size': stat.st_size,
                        'modified': stat.st_mtime
                    })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete_file', methods=['POST'])
def delete_file():
    try:
        data = request.get_json()
        filename = data.get('filename')
        file_type = data.get('type')
        
        if not filename or not file_type:
            return jsonify({'success': False, 'error': 'Filename and type required'}), 400
        
        if file_type == 'upload':
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        elif file_type == 'output':
            filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        else:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({
                'success': True,
                'message': f'File {filename} deleted successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'File not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete_all_uploads', methods=['POST'])
def delete_all_uploads():
    try:
        uploads_dir = app.config['UPLOAD_FOLDER']
        deleted_count = 0
        
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                filepath = os.path.join(uploads_dir, filename)
                if os.path.isfile(filepath):
                    os.remove(filepath)
                    deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted_count} uploaded files'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete_all_outputs', methods=['POST'])
def delete_all_outputs():
    try:
        outputs_dir = app.config['OUTPUT_FOLDER']
        deleted_count = 0
        
        if os.path.exists(outputs_dir):
            for filename in os.listdir(outputs_dir):
                filepath = os.path.join(outputs_dir, filename)
                if os.path.isfile(filepath):
                    os.remove(filepath)
                    deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted_count} output files'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete_all_files', methods=['POST'])
def delete_all_files():
    try:
        uploads_dir = app.config['UPLOAD_FOLDER']
        outputs_dir = app.config['OUTPUT_FOLDER']
        deleted_count = 0
        
        # Delete uploads
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                filepath = os.path.join(uploads_dir, filename)
                if os.path.isfile(filepath):
                    os.remove(filepath)
                    deleted_count += 1
        
        # Delete outputs
        if os.path.exists(outputs_dir):
            for filename in os.listdir(outputs_dir):
                filepath = os.path.join(outputs_dir, filename)
                if os.path.isfile(filepath):
                    os.remove(filepath)
                    deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted_count} files total'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete_old_files', methods=['POST'])
def delete_old_files():
    try:
        import time
        current_time = time.time()
        seven_days = 7 * 24 * 60 * 60  # 7 days in seconds
        deleted_count = 0
        
        # Check uploads
        uploads_dir = app.config['UPLOAD_FOLDER']
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                filepath = os.path.join(uploads_dir, filename)
                if os.path.isfile(filepath):
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > seven_days:
                        os.remove(filepath)
                        deleted_count += 1
        
        # Check outputs
        outputs_dir = app.config['OUTPUT_FOLDER']
        if os.path.exists(outputs_dir):
            for filename in os.listdir(outputs_dir):
                filepath = os.path.join(outputs_dir, filename)
                if os.path.isfile(filepath):
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > seven_days:
                        os.remove(filepath)
                        deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted_count} files older than 7 days'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/cleanup_temp', methods=['POST'])
def cleanup_temp():
    try:
        import tempfile
        import shutil
        
        temp_dir = 'static/temp'
        deleted_count = 0
        
        if os.path.exists(temp_dir):
            for filename in os.listdir(temp_dir):
                filepath = os.path.join(temp_dir, filename)
                try:
                    if os.path.isfile(filepath):
                        os.remove(filepath)
                        deleted_count += 1
                    elif os.path.isdir(filepath):
                        shutil.rmtree(filepath)
                        deleted_count += 1
                except:
                    pass
        
        return jsonify({
            'success': True,
            'message': f'Cleaned up {deleted_count} temporary items'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================================================================
# --- MODIFIKASI: Bagian untuk menjalankan Flask dan GUI Tkinter ---
# ==================================================================
def run_flask():
    """Fungsi untuk menjalankan server Flask."""
    # use_reloader=False penting saat menjalankan dalam thread
    # host='0.0.0.0' diganti menjadi '127.0.0.1' agar lebih cocok untuk akses lokal
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)

def open_browser():
    """Fungsi untuk membuka web browser ke URL aplikasi."""
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == '__main__':
    # Menjalankan server Flask di thread terpisah
    # Ini agar server tidak memblokir jendela GUI
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Membuat dan menjalankan GUI Tkinter di thread utama
    root = tk.Tk()
    root.title("App Launcher")
    root.geometry("350x150") # Atur ukuran jendela

    # Style untuk widget
    style = ttk.Style()
    style.configure("TLabel", font=("Helvetica", 12))
    style.configure("TButton", font=("Helvetica", 11, "bold"))

    # Frame utama
    main_frame = ttk.Frame(root, padding="20")
    main_frame.pack(expand=True, fill="both")

    # Label informasi
    label = ttk.Label(main_frame, text="Server sedang berjalan.\nKlik tombol untuk membuka aplikasi.", justify="center")
    label.pack(pady=(0, 15))

    # Tombol untuk membuka browser
    open_button = ttk.Button(main_frame, text="Buka Aplikasi di Browser", command=open_browser)
    open_button.pack(pady=5, ipady=5)

    # Menjalankan loop utama Tkinter
    root.mainloop()
