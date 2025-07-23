// File handling and upload functionality

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 1) {
        // Single file mode
        selectedFile = files[0];
        selectedFiles = [];
        displayFilePreview(selectedFile);
        document.getElementById('create-animation-btn').disabled = false;
        document.getElementById('multi-file-preview').classList.add('hidden');
        document.getElementById('batch-results').classList.add('hidden');
        
        // Show global animation settings for single image and restore visibility
        document.getElementById('step3').classList.remove('hidden');
        
        // Restore global settings visibility
        const globalSettings = document.querySelector('#step3 .grid');
        const paintRevealSettings = document.getElementById('paint-reveal-settings');
        const speedDrawingColorSettings = document.getElementById('speed-drawing-color-settings');
        const featureExplanations = document.getElementById('feature-explanations');
        const animationHeader = document.querySelector('#step3 .flex.items-center.mb-4');
        const animationDescription = document.querySelector('#step3 p.text-gray-600.mb-6');
        
        if (globalSettings) globalSettings.style.display = '';
        if (paintRevealSettings) paintRevealSettings.style.display = '';
        if (speedDrawingColorSettings) speedDrawingColorSettings.style.display = '';
        if (featureExplanations) featureExplanations.style.display = '';
        if (animationHeader) animationHeader.style.display = '';
        if (animationDescription) animationDescription.style.display = '';
        
        // Restore button text for single image
        const createBtn = document.getElementById('create-animation-btn');
        const btnText = document.getElementById('animation-btn-text');
        const singleImageInfo = document.querySelector('#step3 .mt-2.text-center');
        const multipleImagesInfo = document.getElementById('multiple-images-info');
        
        if (createBtn && btnText) {
            btnText.textContent = '🚀 Create Animation (Auto-Process All)';
        }
        
        // Show single image info, hide multiple images info
        if (singleImageInfo) singleImageInfo.style.display = '';
        if (multipleImagesInfo) multipleImagesInfo.classList.add('hidden');
    } else if (files.length > 1) {
        // Multiple files mode
        selectedFiles = files;
        selectedFile = null;
        displayMultiFilePreview(selectedFiles);
        document.getElementById('create-animation-btn').disabled = false;
        document.getElementById('upload-preview').classList.add('hidden');
        document.getElementById('processing-status-card').classList.add('hidden');
        document.getElementById('animation-result').classList.add('hidden');
        
        // Show animation settings for multiple images but hide global settings
        document.getElementById('step3').classList.remove('hidden');
        
        // Hide animation settings header and description for multiple images
        const animationHeader = document.querySelector('#step3 .flex.items-center.mb-4');
        const animationDescription = document.querySelector('#step3 p.text-gray-600.mb-6');
        if (animationHeader) animationHeader.style.display = 'none';
        if (animationDescription) animationDescription.style.display = 'none';
        
        // Hide global animation settings section but keep the create button visible
        const globalSettings = document.querySelector('#step3 .grid');
        const paintRevealSettings = document.getElementById('paint-reveal-settings');
        const speedDrawingColorSettings = document.getElementById('speed-drawing-color-settings');
        const featureExplanations = document.getElementById('feature-explanations');
        
        if (globalSettings) globalSettings.style.display = 'none';
        if (paintRevealSettings) paintRevealSettings.style.display = 'none';
        if (speedDrawingColorSettings) speedDrawingColorSettings.style.display = 'none';
        if (featureExplanations) featureExplanations.style.display = 'none';
        
        // Update button text for multiple images
        const createBtn = document.getElementById('create-animation-btn');
        const btnText = document.getElementById('animation-btn-text');
        const singleImageInfo = document.querySelector('#step3 .mt-2.text-center');
        const multipleImagesInfo = document.getElementById('multiple-images-info');
        
        if (createBtn && btnText) {
            btnText.textContent = '🚀 Create Animations for All Images';
        }
        
        // Show multiple images info, hide single image info
        if (singleImageInfo) singleImageInfo.style.display = 'none';
        if (multipleImagesInfo) multipleImagesInfo.classList.remove('hidden');
    }
}

function displayFilePreview(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-image').src = e.target.result;
        document.getElementById('file-info').textContent = `${file.name} (${formatFileSize(file.size)})`;
        document.getElementById('upload-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function displayMultiFilePreview(files) {
    const fileGrid = document.getElementById('file-grid');
    fileGrid.innerHTML = '';
    
    files.forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileCard = document.createElement('div');
            fileCard.className = 'bg-white rounded-lg shadow-md overflow-hidden';
            fileCard.innerHTML = `
                <img src="${e.target.result}" class="w-full h-32 object-cover" alt="Preview ${index + 1}">
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">${file.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(file.size)}</p>
                    
                    <!-- Individual Duration Settings -->
                    <div class="mt-3 individual-settings" id="individual-settings-${index}">
                        <div class="space-y-2">
                            <!-- Animation Mode Selection (per image) -->
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Animation Mode</label>
                                <select id="individual-animation-mode-${index}" 
                                        class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="full">🎨 Speed Drawing + Paint Reveal</option>
                                    <option value="drawing_only">✏️ Speed Drawing Only</option>
                                </select>
                            </div>
                            
                            <!-- Drawing Duration (always visible) -->
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Drawing Duration (s)</label>
                                <input type="number" 
                                       id="individual-drawing-duration-${index}" 
                                       value="8" 
                                       min="1" 
                                       max="30" 
                                       class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            
                            <!-- Paint Reveal Settings (only for full mode) -->
                            <div class="paint-reveal-settings-${index}">
                                <!-- Style Selection -->
                                <div class="mb-2">
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Paint Style</label>
                                    <select id="individual-style-${index}" 
                                            class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="1">🖌️ Classic Stroke</option>
                                        <option value="2">🎭 Chaotic Scribble</option>
                                        <option value="3">🖍️ Textured Brush</option>
                                        <option value="4">🎲 Random Line Reveal</option>
                                        <option value="5">🎨 Line Art Reveal</option>
                                    </select>
                                </div>
                                
                                <!-- Reveal Duration -->
                                <label class="block text-xs font-medium text-gray-600 mb-1">Reveal Duration (s)</label>
                                <input type="number" 
                                       id="individual-reveal-duration-${index}" 
                                       value="10" 
                                       min="1" 
                                       max="30" 
                                       class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                
                                <!-- Reveal Area Size -->
                                <div class="mt-2">
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Reveal Area Size</label>
                                    <select id="individual-reveal-area-${index}" 
                                            class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="0.5">📏 Small (0.5x)</option>
                                        <option value="1.0" selected>📏 Normal (1.0x)</option>
                                        <option value="1.5">📏 Large (1.5x)</option>
                                        <option value="2.0">📏 Extra Large (2.0x)</option>
                                        <option value="3.0">📏 Huge (3.0x)</option>
                                        <option value="4.0">📏 Extra Huge (4.0x)</option>
                                        <option value="5.0">📏 Super Huge (5.0x)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Speed Drawing Settings (only for drawing only mode) -->
                            <div class="speed-drawing-settings-${index} hidden">
                                <div class="mb-2">
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Line Color</label>
                                    <input type="color" 
                                           id="individual-line-color-${index}" 
                                           value="#3c3c3c" 
                                           class="w-full h-6 border border-gray-300 rounded cursor-pointer">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                                    <input type="color" 
                                           id="individual-background-color-${index}" 
                                           value="#ffffff" 
                                           class="w-full h-6 border border-gray-300 rounded cursor-pointer">
                                </div>
                            </div>
                            
                            <!-- FPS Setting (always visible) -->
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">FPS</label>
                                <select id="individual-fps-${index}" 
                                        class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="24">24 FPS</option>
                                    <option value="30" selected>30 FPS</option>
                                    <option value="60">60 FPS</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <div class="w-full bg-gray-200 rounded-full h-1">
                            <div class="bg-blue-600 h-1 rounded-full transition-all duration-300" style="width: 0%" id="progress-${index}"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1" id="status-${index}">Ready</p>
                    </div>
                </div>
            `;
            fileGrid.appendChild(fileCard);
        };
        reader.readAsDataURL(file);
    });
    
    document.getElementById('multi-file-preview').classList.remove('hidden');
    
    // Setup event listeners for individual settings
    setupIndividualSettingsListeners();
    
    // Setup individual animation mode listeners after DOM is ready
    setTimeout(() => {
        setupIndividualAnimationModeListeners();
    }, 100);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('upload-area').classList.add('border-blue-400');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('upload-area').classList.remove('border-blue-400');
    
    const files = Array.from(e.dataTransfer.files);
    
    // Simulate file input change
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    document.getElementById('file-upload').files = dt.files;
    
    // Trigger the same logic as file select
    handleFileSelect({ target: { files: dt.files } });
}

async function uploadFile(file) {
    updateProcessStatus(0, 'processing');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
        currentFileId = result.file_id;
        updateProcessStatus(0, 'completed');
        return true;
    } else {
        updateProcessStatus(0, 'error');
        throw new Error(result.error || 'Upload failed');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleDownloadAll() {
    if (!window.batchFileIds || window.batchFileIds.length === 0) {
        showToast('No animations available for download', 'error');
        return;
    }
    
    const fileIds = window.batchFileIds.join(',');
    const downloadUrl = `/download_batch_zip?file_ids=${fileIds}`;
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `speed_drawing_animations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Downloading all animations as ZIP file...', 'success');
}