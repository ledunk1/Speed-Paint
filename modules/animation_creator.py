"""
Animation Creator Module
Membuat speed drawing dan paint reveal animation
Berdasarkan script b.py - EXACT SAME METHODS
"""

import cv2
import numpy as np
from moviepy.editor import ImageSequenceClip
import tempfile
import os
import logging
import sys
from skimage.morphology import skeletonize
import random

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Paint styles configuration (EXACT SAME dari script asli)
PAINT_STYLES = {
    1: {
        "name": "classic_stroke",
        "description": "Sapuan kuas panjang dan berkelanjutan.",
        "best_for": "konten biografi, edukasi, sejarah",
        "emoji": "🖌️"
    },
    2: {
        "name": "chaotic_scribble", 
        "description": "Coretan pendek dan energik di seluruh kanvas.",
        "best_for": "konten energi tinggi, seni modern",
        "emoji": "🎭"
    },
    3: {
        "name": "textured_brush",
        "description": "Simulasi kuas nyata dengan tekstur.",
        "best_for": "konten seni rupa, high-production",
        "emoji": "🖍️"
    },
    4: {
        "name": "random_line_following",
        "description": "Mengikuti jalur line art secara random.",
        "best_for": "efek natural, organic reveal",
        "emoji": "🎲"
    },
    5: {
        "name": "line_art_following",
        "description": "Mengikuti jalur line art dengan urutan yang sama seperti speed drawing.",
        "best_for": "efek natural yang mengikuti alur gambar asli",
        "emoji": "🎨"
    }
}

class AnimationCreator:
    def __init__(self):
        self.current_phase = ""
        self.total_phases = 6
        self.phase_progress = 0
    
    def log_progress(self, message, emoji="ℹ️"):
        """Log with emoji and formatting"""
        print(f"{emoji} {message}")
        logger.info(message)
    
    def log_phase_progress(self, phase_name, current, total, emoji="📊"):
        """Log phase progress with percentage"""
        if total > 0:
            percentage = (current / total) * 100
            print(f"\r   {phase_name} Progress: {percentage:.1f}% ({current}/{total})", end="", flush=True)
        else:
            print(f"\r   {phase_name} Progress: 0.0% (0/0)", end="", flush=True)
    
    def log_phase_complete(self, message, emoji="✅"):
        """Log phase completion"""
        print()  # New line after progress
        self.log_progress(message, emoji)
    
    # === SPEED DRAWING FUNCTIONS (EXACT SAME dari script b.py) ===
    def load_and_preprocess(self, image_path):
        """Load dan preprocess gambar line art"""
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Cannot load image")
            
            # Handle transparent background - convert to white background
            # Load original image with alpha channel to check for transparency
            img_with_alpha = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if img_with_alpha.shape[2] == 4:  # Has alpha channel
                # Create white background
                white_bg = np.full((img_with_alpha.shape[0], img_with_alpha.shape[1], 3), 255, dtype=np.uint8)
                
                # Extract alpha channel
                alpha = img_with_alpha[:, :, 3] / 255.0
                
                # Blend with white background
                for c in range(3):
                    white_bg[:, :, c] = (img_with_alpha[:, :, c] * alpha + 255 * (1 - alpha)).astype(np.uint8)
                
                # Convert blended image to grayscale
                img = cv2.cvtColor(white_bg, cv2.COLOR_BGR2GRAY)
            
            img = cv2.bitwise_not(img)  # Balik warna: garis jadi putih
            _, binary = cv2.threshold(img, 50, 255, cv2.THRESH_BINARY)

            # Bersihkan noise
            kernel = np.ones((2,2), np.uint8)
            binary = cv2.dilate(binary, kernel, iterations=1)
            binary = cv2.erode(binary, kernel, iterations=1)
            return binary
            
        except Exception as e:
            logger.error(f"Error in load_and_preprocess: {e}")
            raise

    def skeletonize_image(self, binary_image):
        """Skeletonize gambar"""
        try:
            bool_img = binary_image > 0
            skeleton = skeletonize(bool_img).astype(np.uint8) * 255
            return skeleton
        except Exception as e:
            logger.error(f"Error in skeletonize_image: {e}")
            raise

    def extract_drawing_path(self, skeleton_image):
        """Ekstrak jalur gambar dari skeleton - EXACT SAME dari script asli"""
        try:
            contours, _ = cv2.findContours(skeleton_image, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
            paths = []

            for contour in contours:
                contour = contour.squeeze()
                if len(contour.shape) == 2:
                    paths.append(contour)

            # Sort kontur dari kiri atas ke kanan bawah - EXACT SAME
            paths.sort(key=lambda c: (np.min(c[:,1]), np.min(c[:,0])))
            return paths
            
        except Exception as e:
            logger.error(f"Error in extract_drawing_path: {e}")
            raise

    # === PAINT REVEAL FUNCTIONS (EXACT SAME dari script b.py) ===
    def classic_stroke(self, width, height, step_size, num_frames):
        """Generate classic stroke path"""
        try:
            def generate_path(steps):
                path = [(width // 2, height // 2)]
                angle = np.random.uniform(0, 2 * np.pi)
                for _ in range(steps):
                    angle += np.random.normal(0, 0.4)
                    dx = int(step_size * np.cos(angle))
                    dy = int(step_size * np.sin(angle))
                    x = np.clip(path[-1][0] + dx, 0, width - 1)
                    y = np.clip(path[-1][1] + dy, 0, height - 1)
                    path.append((x, y))
                return path
            
            path = generate_path(4000)
            per_frame = max(1, len(path) // num_frames if num_frames > 0 else len(path))
            return path, per_frame
        except Exception as e:
            logger.error(f"Error in classic_stroke: {e}")
            raise

    def chaotic_scribble(self, width, height, step_size, num_frames):
        """Generate chaotic scribble paths"""
        try:
            paths = []
            for _ in range(200):
                start_x, start_y = np.random.randint(0, width), np.random.randint(0, height)
                path = [(start_x, start_y)]
                angle = np.random.uniform(0, 2 * np.pi)
                for _ in range(np.random.randint(5, 25)):
                    angle += np.random.normal(0, 1.5)
                    dx = int(step_size * 0.5 * np.cos(angle))
                    dy = int(step_size * 0.5 * np.sin(angle))
                    x = np.clip(path[-1][0] + dx, 0, width - 1)
                    y = np.clip(path[-1][1] + dy, 0, height - 1)
                    path.append((x, y))
                paths.extend(path)
            
            per_frame = max(1, len(paths) // num_frames if num_frames > 0 else len(paths))
            return paths, per_frame
        except Exception as e:
            logger.error(f"Error in chaotic_scribble: {e}")
            raise

    def textured_brush(self, width, height, step_size, stroke_thickness, num_frames):
        """Generate textured brush path"""
        try:
            path, per_frame = self.classic_stroke(width, height, step_size, num_frames)
            brush_size = stroke_thickness * 2
            brush_texture = np.zeros((brush_size, brush_size), dtype=np.uint8)
            center = brush_size // 2
            y, x = np.ogrid[:brush_size, :brush_size]
            mask = (x - center)**2 + (y - center)**2 <= center**2
            brush_texture[mask] = 255
            return path, per_frame, brush_texture
        except Exception as e:
            logger.error(f"Error in textured_brush: {e}")
            raise

    def random_line_following(self, all_drawing_points, width, height, step_size, num_frames):
        """Generate random line following path - mengikuti jalur speed drawing secara random"""
        try:
            if not all_drawing_points:
                # Fallback to classic stroke if no drawing points
                return self.classic_stroke(width, height, step_size, num_frames)
            
            # OPTIMIZATION: Smart sampling to limit base points (Option 2)
            max_base_points = 5000  # Limit to max 5000 base points for performance
            if len(all_drawing_points) > max_base_points:
                # Sample every Nth point to reduce base points
                sample_step = max(1, len(all_drawing_points) // max_base_points)
                sampled_points = all_drawing_points[::sample_step]
                logger.info(f"Sampled {len(sampled_points)} points from {len(all_drawing_points)} original points")
            else:
                sampled_points = all_drawing_points
            
            # OPTIMIZATION: Reduced expansion range (Option 1)
            # Original: step_size//4 (~37 range) = 38x38 = 1444 points per base point
            # New: step_size//10 (~15 range) = 8x8 = 64 points per base point
            # Reduction: ~96% less points!
            expanded_points = []
            expansion_range = max(2, step_size//10)  # Much smaller expansion
            expansion_step = max(2, step_size//20)   # Larger step for fewer points
            
            for pt in sampled_points:
                # Add points around each line art point with optimized thickness
                for dx in range(-expansion_range, expansion_range + 1, expansion_step):
                    for dy in range(-expansion_range, expansion_range + 1, expansion_step):
                        new_x = np.clip(pt[0] + dx, 0, width - 1)
                        new_y = np.clip(pt[1] + dy, 0, height - 1)
                        expanded_points.append((new_x, new_y))
            
            logger.info(f"Generated {len(expanded_points)} expanded points for random line following")
            
            # Remove duplicates while preserving order
            seen = set()
            unique_points = []
            for pt in expanded_points:
                if pt not in seen:
                    seen.add(pt)
                    unique_points.append(pt)
            
            # Shuffle points for random reveal
            import random
            random.shuffle(unique_points)
            
            per_frame = max(1, len(unique_points) // num_frames if num_frames > 0 else len(unique_points))
            return unique_points, per_frame
            
        except Exception as e:
            logger.error(f"Error in random_line_following: {e}")
            raise

    def line_art_following(self, all_drawing_points, width, height, step_size, num_frames):
        """Generate line art following path - mengikuti jalur speed drawing dengan urutan yang sama"""
        try:
            if not all_drawing_points:
                # Fallback to classic stroke if no drawing points
                return self.classic_stroke(width, height, step_size, num_frames)
            
            # OPTIMIZATION: Smart sampling to limit base points (Option 2)
            max_base_points = 5000  # Limit to max 5000 base points for performance
            if len(all_drawing_points) > max_base_points:
                # Sample every Nth point to reduce base points, but maintain order
                sample_step = max(1, len(all_drawing_points) // max_base_points)
                sampled_points = all_drawing_points[::sample_step]
                logger.info(f"Sampled {len(sampled_points)} points from {len(all_drawing_points)} original points (maintaining order)")
            else:
                sampled_points = all_drawing_points
            
            # OPTIMIZATION: Reduced expansion range (Option 1)
            # Original: step_size//3 (~50 range) = 50x50 = 2500 points per base point
            # New: step_size//10 (~15 range) = 8x8 = 64 points per base point
            # Reduction: ~97% less points!
            expanded_points = []
            expansion_range = max(2, step_size//10)  # Much smaller expansion
            expansion_step = max(2, step_size//20)   # Larger step for fewer points
            
            for pt in sampled_points:  # Mengikuti urutan yang sama dengan speed drawing (sampled)
                # Add points around each line art point with optimized thickness
                for dx in range(-expansion_range, expansion_range + 1, expansion_step):
                    for dy in range(-expansion_range, expansion_range + 1, expansion_step):
                        new_x = np.clip(pt[0] + dx, 0, width - 1)
                        new_y = np.clip(pt[1] + dy, 0, height - 1)
                        expanded_points.append((new_x, new_y))
            
            logger.info(f"Generated {len(expanded_points)} expanded points for line art following")
            
            # TIDAK shuffle - tetap mengikuti urutan speed drawing
            per_frame = max(1, len(expanded_points) // num_frames if num_frames > 0 else len(expanded_points))
            return expanded_points, per_frame
            
        except Exception as e:
            logger.error(f"Error in line_art_following: {e}")
            raise

    def _hex_to_bgr(self, hex_color):
        """Convert hex color to BGR tuple for OpenCV"""
        try:
            # Remove # if present
            hex_color = hex_color.lstrip('#')
            # Convert hex to RGB
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            # Convert RGB to BGR for OpenCV
            bgr = (rgb[2], rgb[1], rgb[0])
            return bgr
        except Exception as e:
            logger.error(f"Error converting hex color {hex_color}: {e}")
            return (60, 60, 60)  # Default dark gray

    # === MAIN ANIMATION FUNCTION - EXACT SAME LOGIC ===
    def create_combined_animation(self, line_art_path, color_image_path, output_path, style_choice, 
                                drawing_duration, reveal_duration, fps, reveal_area_multiplier=1.0, animation_mode='full',
                                line_color=None, background_color=None):
        """Buat animasi gabungan speed drawing + paint reveal - EXACT SAME dari script asli"""
        
        try:
            logger.info("=== STARTING ANIMATION CREATION ===")
            self.log_progress("MEMULAI PROSES ANIMASI...", "🚀")
            
            # === FASE 1: PERSIAPAN DATA SPEED DRAWING ===
            logger.info("=== PHASE 1: SPEED DRAWING PREPARATION ===")
            self.log_progress("Memproses line art untuk speed drawing...", "📐")
            binary = self.load_and_preprocess(line_art_path)
            skeleton = self.skeletonize_image(binary)
            paths = self.extract_drawing_path(skeleton)
            
            # Gabungkan semua titik ke dalam list tunggal - EXACT SAME
            all_drawing_points = []
            for path in paths:
                for pt in path:
                    all_drawing_points.append(tuple(pt))
            
            self.log_progress(f"Ditemukan {len(all_drawing_points)} titik untuk speed drawing", "✅")
            
            # === FASE 2: LOAD GAMBAR ===
            logger.info("=== PHASE 2: LOADING IMAGES ===")
            self.log_progress("Loading gambar...", "📂")
            line_art = cv2.imread(line_art_path)
            color_img = cv2.imread(color_image_path)
            
            if line_art is None or color_img is None:
                raise ValueError("Failed to load images")
            
            # Resize color image to match line art
            color_img = cv2.resize(color_img, (line_art.shape[1], line_art.shape[0]))
            height, width = line_art.shape[:2]
            
            self.log_progress(f"Resolusi: {width}x{height}", "📐")
            
            # === FASE 3: SETUP PARAMETER ===
            logger.info("=== PHASE 3: PARAMETER SETUP ===")
            scale = (width * height) / (1920 * 1080)
            base_stroke_thickness = max(10, int(150 * scale))
            base_step_size = max(10, int(150 * scale))
            
            # Apply reveal area multiplier
            stroke_thickness = max(10, int(base_stroke_thickness * reveal_area_multiplier))
            step_size = max(10, int(base_step_size * reveal_area_multiplier))
            
            drawing_frames = int(drawing_duration * fps)
            reveal_frames = int(reveal_duration * fps)
            
            total_frames = drawing_frames + reveal_frames
            
            self.log_progress(f"Stroke thickness: {stroke_thickness}", "🖌️")
            self.log_progress(f"Reveal area multiplier: {reveal_area_multiplier}x", "📏")
            self.log_progress(f"Speed drawing frames: {drawing_frames}", "🎬")
            self.log_progress(f"Paint reveal frames: {reveal_frames}", "🎨")
            self.log_progress(f"Total frames: {total_frames}", "📊")
            
            # === PARSE COLOR SETTINGS FOR DRAWING ONLY MODE ===
            if animation_mode == 'drawing_only' and line_color and background_color:
                # Convert hex colors to BGR for OpenCV
                line_color_bgr = self._hex_to_bgr(line_color)
                background_color_bgr = self._hex_to_bgr(background_color)
                self.log_progress(f"Line color: {line_color} -> BGR{line_color_bgr}", "🎨")
                self.log_progress(f"Background color: {background_color} -> BGR{background_color_bgr}", "🖼️")
            else:
                line_color_bgr = (60, 60, 60)  # Default dark gray
                background_color_bgr = (255, 255, 255)  # Default white
            
            # === FASE 4: PERSIAPAN DATA PAINT REVEAL ===
            # Skip paint reveal preparation if drawing only mode
            if animation_mode == 'full':
                logger.info("=== PHASE 4: PAINT REVEAL PREPARATION ===")
                self.log_progress("Mempersiapkan data paint reveal...", "🎨")
                selected_style = PAINT_STYLES[style_choice]
                
                if style_choice == 1:
                    paint_data, per_frame = self.classic_stroke(width, height, step_size, reveal_frames)
                elif style_choice == 2:
                    paint_data, per_frame = self.chaotic_scribble(width, height, step_size, reveal_frames)
                elif style_choice == 3:
                    paint_data, per_frame, brush_texture = self.textured_brush(width, height, step_size, stroke_thickness, reveal_frames)
                elif style_choice == 4:
                    paint_data, per_frame = self.random_line_following(all_drawing_points, width, height, step_size, reveal_frames)
                elif style_choice == 5:
                    paint_data, per_frame = self.line_art_following(all_drawing_points, width, height, step_size, reveal_frames)
                
                self.log_progress(f"Data paint reveal siap: {len(paint_data)} titik", "✅")
            else:
                logger.info("=== PHASE 4: SKIPPING PAINT REVEAL (DRAWING ONLY MODE) ===")
                self.log_progress("Mode: Speed Drawing Only - skipping paint reveal preparation", "✏️")
                selected_style = {"name": "drawing_only"}
            
            # === FASE 5: GENERATE FRAMES ===
            logger.info("=== PHASE 5: FRAME GENERATION ===")
            self.log_progress("Generating frames...", "🎬")
            temp_dir = tempfile.mkdtemp()
            frame_paths = []
            
            # FASE 5A: SPEED DRAWING FRAMES - EXACT SAME LOGIC
            logger.info("=== PHASE 5A: SPEED DRAWING FRAMES ===")
            self.log_progress("Generating speed drawing frames...", "✏️")
            drawing_step = max(1, len(all_drawing_points) // drawing_frames)
            
            for i in range(drawing_frames):
                progress = (i + 1) / drawing_frames * 50  # 50% untuk speed drawing
                print(f"\r   Speed Drawing Progress: {progress:.1f}% ({i+1}/{drawing_frames})", end="")
                
                # Canvas putih
                canvas = np.full((height, width, 3), background_color_bgr, dtype=np.uint8)
                
                # Gambar titik-titik yang sudah dilalui dengan style pensil natural (TIDAK TERPENGARUH area multiplier)
                points_to_draw = all_drawing_points[:i * drawing_step]
                for pt in points_to_draw:
                    # Thin pencil dengan anti-aliasing untuk smooth line (ukuran tetap)
                    cv2.circle(canvas, pt, radius=1, color=line_color_bgr, thickness=0, lineType=cv2.LINE_AA)
                
                frame_path = os.path.join(temp_dir, f"frame_{i:05d}.png")
                cv2.imwrite(frame_path, canvas)
                frame_paths.append(frame_path)
            
            # Frame terakhir speed drawing (garis lengkap) dengan style pensil natural (TIDAK TERPENGARUH area multiplier)
            final_drawing_canvas = np.full((height, width, 3), background_color_bgr, dtype=np.uint8)
            for pt in all_drawing_points:
                # Thin pencil dengan anti-aliasing untuk smooth line (ukuran tetap)
                cv2.circle(final_drawing_canvas, pt, radius=1, color=line_color_bgr, thickness=0, lineType=cv2.LINE_AA)
            
            # Tahan frame terakhir speed drawing sebentar - EXACT SAME
            pause_frames = fps // 2 if animation_mode == 'full' else fps * 2  # 0.5s for full mode, 2s for drawing only
            
            # Untuk drawing only mode, hitung pause frames supaya total durasi sesuai user input
            if animation_mode == 'drawing_only':
                target_total_frames = int(drawing_duration * fps)
                remaining_frames = max(0, target_total_frames - drawing_frames)
                pause_frames = remaining_frames
            
            for j in range(pause_frames):
                frame_path = os.path.join(temp_dir, f"frame_{drawing_frames + j:05d}.png")
                cv2.imwrite(frame_path, final_drawing_canvas)
                frame_paths.append(frame_path)
            
            # FASE 5B: PAINT REVEAL FRAMES - Only if full mode
            if animation_mode == 'full':
                # FASE 5B: PAINT REVEAL FRAMES - EXACT SAME LOGIC
                print(f"\n🎨 Generating paint reveal frames ({selected_style['name']})...")
                mask = np.zeros((height, width), dtype=np.uint8)
                
                for i in range(reveal_frames):
                    progress = 50 + (i + 1) / reveal_frames * 50  # 50-100% untuk paint reveal
                    print(f"\r   Paint Reveal Progress: {progress:.1f}% ({i+1}/{reveal_frames})", end="")
                    
                    start_index = i * per_frame
                    end_index = min(start_index + per_frame, len(paint_data))
                    points_to_draw = paint_data[start_index:end_index]
                    
                    if points_to_draw:
                        if style_choice == 3:  # Textured Brush
                            for pt in points_to_draw:
                                brush_h, brush_w = brush_texture.shape
                                y1, y2 = max(0, pt[1] - brush_h//2), min(height, pt[1] + brush_h//2)
                                x1, x2 = max(0, pt[0] - brush_w//2), min(width, pt[0] + brush_w//2)
                                if y2 > y1 and x2 > x1:
                                    mask_roi = mask[y1:y2, x1:x2]
                                    brush_resized = cv2.resize(brush_texture, (mask_roi.shape[1], mask_roi.shape[0]))
                                    np.maximum(mask_roi, brush_resized, out=mask_roi)
                        elif style_choice == 1:  # Classic Stroke
                            for j in range(len(points_to_draw) - 1):
                                pt1 = points_to_draw[j]
                                pt2 = points_to_draw[j+1]
                                cv2.line(mask, pt1, pt2, 255, stroke_thickness, lineType=cv2.LINE_AA)
                        elif style_choice == 2:  # Chaotic Scribble
                            for pt in points_to_draw:
                                cv2.circle(mask, pt, stroke_thickness // 2, 255, -1)
                        elif style_choice == 4:  # Random Line Following
                            for pt in points_to_draw:
                                cv2.circle(mask, pt, stroke_thickness // 3, 255, -1)
                        elif style_choice == 5:  # Line Art Following
                            for pt in points_to_draw:
                                cv2.circle(mask, pt, stroke_thickness // 3, 255, -1)
                    
                    # Blend dengan color image - EXACT SAME
                    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
                    blended = np.where(mask_3ch == 255, color_img, final_drawing_canvas)
                    
                    frame_path = os.path.join(temp_dir, f"frame_{drawing_frames + pause_frames + i:05d}.png")
                    cv2.imwrite(frame_path, blended)
                    frame_paths.append(frame_path)
                
                # Frame terakhir (gambar warna penuh) - EXACT SAME
                for j in range(fps):  # Tahan 1 detik
                    frame_path = os.path.join(temp_dir, f"frame_{drawing_frames + pause_frames + reveal_frames + j:05d}.png")
                    cv2.imwrite(frame_path, color_img)
                    frame_paths.append(frame_path)
            else:
                # Drawing only mode - no paint reveal, just hold the final drawing
                print(f"\n✏️ Drawing only mode - holding final frame...")
                # Tidak perlu hold tambahan karena sudah dihitung di pause_frames
                pass
            
            # === FASE 6: CREATE VIDEO ===
            logger.info("=== PHASE 6: CREATING VIDEO ===")
            logger.info(f"Total frames to process: {len(frame_paths)}")
            self.log_progress(f"Creating video: {os.path.basename(output_path)}", "🎥")
            
            try:
                logger.info("Creating ImageSequenceClip...")
                clip = ImageSequenceClip(frame_paths, fps=fps)
                logger.info(f"Clip duration: {clip.duration} seconds")
                logger.info("Starting video encoding...")
                self.log_progress("Encoding video dengan H.264...", "⚙️")
                clip.write_videofile(output_path, codec="libx264", verbose=False, logger=None)
                logger.info("Video encoding completed successfully")
                self.log_progress("Video berhasil dibuat!", "🎉")
                return True
            finally:
                # Cleanup temporary files
                logger.info("Cleaning up temporary files...")
                self.log_progress("Cleaning up temporary files...", "🧹")
                for path in frame_paths:
                    try:
                        os.remove(path)
                    except OSError:
                        logger.warning(f"Failed to remove temp file: {path}")
                try:
                    os.rmdir(temp_dir)
                except OSError:
                    logger.warning(f"Failed to remove temp directory: {temp_dir}")
                
                logger.info("Animation creation process completed")
                self.log_progress("Proses selesai!", "✅")
            
        except Exception as e:
            logger.error("=== ANIMATION CREATION ERROR ===")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error("Full traceback:")
            import traceback
            logger.error(traceback.format_exc())
            self.log_progress(f"TERJADI ERROR: {e}", "❌")
            return False