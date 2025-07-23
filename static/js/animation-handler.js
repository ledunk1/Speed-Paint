// Animation creation and queue processing

async function createAnimation() {
    updateProcessStatus(2, 'processing');
    
    // Get animation mode to determine which settings to use
    const animationMode = document.getElementById('animation-mode').value;
    
    const settings = {
        file_id: currentFileId,
        animation_mode: animationMode,
        style_choice: parseInt(document.getElementById('style-select').value),
        drawing_duration: parseFloat(document.getElementById('drawing-duration').value),
        reveal_duration: parseFloat(document.getElementById('reveal-duration').value),
        fps: animationMode === 'drawing_only' ? 
             parseInt(document.getElementById('fps-select-drawing').value) : 
             parseInt(document.getElementById('fps-select').value),
        reveal_area_multiplier: parseFloat(document.getElementById('reveal-area-multiplier').value)
    };
    
    // Add color settings for drawing only mode
    if (animationMode === 'drawing_only') {
        settings.line_color = document.getElementById('line-color').value;
        settings.background_color = document.getElementById('background-color').value;
    }
    
    const response = await fetch('/create_animation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });
    
    const result = await response.json();
    
    if (result.success) {
        updateProcessStatus(2, 'completed');
        const currentProcessStatus = document.getElementById('current-process-status');
        if (currentProcessStatus) {
            currentProcessStatus.textContent = 'Animation created successfully! ✅';
        }
        
        const downloadAnimation = document.getElementById('download-animation');
        downloadAnimation.href = result.animation_url;
        downloadAnimation.download = result.animation_filename;
        
        // Setup video preview
        const videoPreview = document.getElementById('video-preview');
        videoPreview.src = result.animation_url;
        videoPreview.load(); // Reload video element
        
        document.getElementById('animation-result').classList.remove('hidden');
        return true;
    } else {
        updateProcessStatus(2, 'error');
        const currentProcessStatus = document.getElementById('current-process-status');
        if (currentProcessStatus) {
            currentProcessStatus.textContent = 'Animation creation failed ❌';
        }
        throw new Error(result.error || 'Animation creation failed');
    }
}

async function handleCreateAnimation() {
    if (!selectedFile && selectedFiles.length === 0) {
        showToast('Please select image(s) first', 'error');
        return;
    }
    
    if (!onnxSession) {
        showToast('Please wait for the AI model to load', 'error');
        return;
    }

    const createAnimationBtn = document.getElementById('create-animation-btn');
    const animationBtnText = document.getElementById('animation-btn-text');
    const animationSpinner = document.getElementById('animation-spinner');
    
    setButtonLoading(createAnimationBtn, animationBtnText, animationSpinner, 'Processing...');
    
    try {
        if (selectedFile) {
            // Single file processing
            document.getElementById('processing-status-card').classList.remove('hidden');
            
            await uploadFile(selectedFile);
            await generateLineArt(selectedFile);
            await createAnimation();
            
            const currentProcessStatus = document.getElementById('current-process-status');
            if (currentProcessStatus) {
                currentProcessStatus.textContent = '🎉 All processes completed successfully! Your animation is ready to download and preview.';
            }
            
            const processingHeader = document.querySelector('#processing-status-card h2');
            if (processingHeader) {
                processingHeader.innerHTML = '<span class="text-green-600">✅ Processing Complete!</span>';
            }
            
            const processingSpinner = document.querySelector('#processing-status-card .loading-spinner');
            if (processingSpinner) {
                processingSpinner.style.display = 'none';
                const processingIcon = processingSpinner.parentElement;
                if (processingIcon) {
                    processingIcon.innerHTML = '<div class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">✓</div>';
                }
            }
            
            showToast('🎉 Animation created successfully! Full process completed!', 'success');
            
        } else if (selectedFiles.length > 0) {
            // Multiple files processing
            await handleQueueProcess();
        }
        
    } catch (error) {
        console.error('Animation creation error:', error);
        
        if (selectedFile) {
            const currentProcessStatus = document.getElementById('current-process-status');
            if (currentProcessStatus) {
                currentProcessStatus.textContent = '❌ Process failed: ' + error.message;
            }
            
            const processingHeader = document.querySelector('#processing-status-card h2');
            if (processingHeader) {
                processingHeader.innerHTML = '<span class="text-red-600">❌ Processing Failed</span>';
            }
            
            const processingSpinner = document.querySelector('#processing-status-card .loading-spinner');
            if (processingSpinner) {
                processingSpinner.style.display = 'none';
                const processingIcon = processingSpinner.parentElement;
                if (processingIcon) {
                    processingIcon.innerHTML = '<div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">✗</div>';
                }
            }
        }
        
        showToast('Process failed: ' + error.message, 'error');
    } finally {
        setButtonNormal(createAnimationBtn, animationBtnText, animationSpinner, '🚀 Create Animation (Auto-Process All)');
    }
}

async function handleQueueProcess() {
    if (selectedFiles.length === 0) {
        showToast('Please select images first', 'error');
        return;
    }
    
    if (!onnxSession) {
        showToast('Please wait for the AI model to load', 'error');
        return;
    }

    // Show queue status
    showQueueStatus();
    
    // Process files one by one
    const createAnimationBtn = document.getElementById('create-animation-btn');
    const animationBtnText = document.getElementById('animation-btn-text');
    const animationSpinner = document.getElementById('animation-spinner');
    
    setButtonLoading(createAnimationBtn, animationBtnText, animationSpinner, 'Processing queue...');
    
    try {
        const queueResults = [];
        
        // Process each file sequentially
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const animationMode = document.getElementById('animation-mode').value;
            
            // Get individual settings if available
            const individualSettings = window.individualSettings ? window.individualSettings.get() : null;
            
            updateQueueProgress(i, selectedFiles.length);
            updateQueueItemStatus(i, 'processing', `Processing ${file.name}...`);
            
            try {
                // Step 1: Upload file
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadResponse = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const uploadResult = await uploadResponse.json();
                if (!uploadResult.success) {
                    throw new Error(uploadResult.error);
                }
                
                currentFileId = uploadResult.file_id;
                
                // Step 2: Generate line art
                await generateLineArt(file);
                
                // Step 3: Create animation
                let settings = {
                    file_id: currentFileId,
                    animation_mode: animationMode,
                    style_choice: parseInt(document.getElementById('style-select').value),
                    fps: animationMode === 'drawing_only' ? 
                         parseInt(document.getElementById('fps-select-drawing').value) : 
                         parseInt(document.getElementById('fps-select').value),
                    reveal_area_multiplier: parseFloat(document.getElementById('reveal-area-multiplier').value)
                };
                
                // Use individual settings if available, otherwise use global
                if (individualSettings && individualSettings[i]) {
                    // Individual settings for this image
                    const imageSettings = individualSettings[i];
                    settings.animation_mode = imageSettings.animation_mode;
                    settings.drawing_duration = imageSettings.drawing_duration;
                    settings.fps = imageSettings.fps;
                    
                    if (imageSettings.animation_mode === 'full') {
                        settings.reveal_duration = imageSettings.reveal_duration;
                        settings.style_choice = imageSettings.style_choice;
                        settings.reveal_area_multiplier = imageSettings.reveal_area_multiplier;
                    } else if (imageSettings.animation_mode === 'drawing_only') {
                        settings.line_color = imageSettings.line_color;
                        settings.background_color = imageSettings.background_color;
                    }
                } else {
                    // Fallback to global settings (shouldn't happen for multiple images)
                    settings.drawing_duration = parseFloat(document.getElementById('drawing-duration').value);
                    settings.reveal_duration = parseFloat(document.getElementById('reveal-duration').value);
                    
                    if (animationMode === 'drawing_only') {
                        settings.line_color = document.getElementById('line-color').value;
                        settings.background_color = document.getElementById('background-color').value;
                    }
                }
                
                const animationResponse = await fetch('/create_animation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(settings)
                });
                
                const animationResult = await animationResponse.json();
                if (!animationResult.success) {
                    throw new Error(animationResult.error);
                }
                
                // Success
                updateQueueItemStatus(i, 'success', 'Complete ✅');
                queueResults.push({
                    success: true,
                    file_id: currentFileId,
                    animation_url: animationResult.animation_url,
                    animation_filename: animationResult.animation_filename,
                    original_name: file.name
                });
                
            } catch (error) {
                console.error(`Error processing file ${i}:`, error);
                updateQueueItemStatus(i, 'error', `Failed: ${error.message}`);
                queueResults.push({
                    success: false,
                    error: error.message,
                    original_name: file.name
                });
            }
        }
        
        // Update final progress
        updateQueueProgress(selectedFiles.length, selectedFiles.length);
        updateQueueStatus('Queue processing complete!');
        
        // Display results
        displayQueueResults(queueResults);
        
        const successCount = queueResults.filter(r => r.success).length;
        showToast(`🎉 Queue processing complete! ${successCount}/${selectedFiles.length} animations created successfully.`, 'success');
        
    } catch (error) {
        console.error('Queue processing error:', error);
        showToast('Queue processing failed: ' + error.message, 'error');
    } finally {
        setButtonNormal(createAnimationBtn, animationBtnText, animationSpinner, '🚀 Create Animation (Auto-Process All)');
    }
}

function displayQueueResults(results) {
    const videoGrid = document.getElementById('video-grid');
    videoGrid.innerHTML = '';
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
        document.getElementById('batch-results').classList.add('hidden');
        return;
    }
    
    successfulResults.forEach((result, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'bg-white rounded-lg shadow-md overflow-hidden';
        videoCard.innerHTML = `
            <div class="aspect-video bg-gray-100">
                <video class="w-full h-full object-cover" controls>
                    <source src="${result.animation_url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
            <div class="p-4">
                <h4 class="font-medium text-gray-900 mb-2">${result.original_name}</h4>
                <a href="${result.animation_url}" download="${result.animation_filename}" 
                   class="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download
                </a>
            </div>
        `;
        videoGrid.appendChild(videoCard);
    });
    
    // Store successful file IDs for batch download
    window.batchFileIds = successfulResults.map(r => r.file_id);
    
    document.getElementById('batch-results').classList.remove('hidden');
    document.getElementById('download-all-btn').disabled = false;
}