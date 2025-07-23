// Individual Settings Handler for Multiple Images
// Handles per-image duration and color settings

function setupIndividualColorPresets() {
    selectedFiles.forEach((file, index) => {
        // Line color preset handler
        const lineColorPreset = document.getElementById(`individual-line-color-preset-${index}`);
        const lineColorInput = document.getElementById(`individual-line-color-${index}`);
        
        if (lineColorPreset && lineColorInput) {
            lineColorPreset.addEventListener('change', function() {
                lineColorInput.value = this.value;
            });
            
            lineColorInput.addEventListener('change', function() {
                const matchingOption = Array.from(lineColorPreset.options).find(option => option.value === this.value);
                if (matchingOption) {
                    lineColorPreset.value = this.value;
                }
            });
        }
        
        // Background color preset handler
        const backgroundColorPreset = document.getElementById(`individual-background-color-preset-${index}`);
        const backgroundColorInput = document.getElementById(`individual-background-color-${index}`);
        
        if (backgroundColorPreset && backgroundColorInput) {
            backgroundColorPreset.addEventListener('change', function() {
                backgroundColorInput.value = this.value;
            });
            
            backgroundColorInput.addEventListener('change', function() {
                const matchingOption = Array.from(backgroundColorPreset.options).find(option => option.value === this.value);
                if (matchingOption) {
                    backgroundColorPreset.value = this.value;
                }
            });
        }
    });
}

function setupIndividualSettingsListeners() {
    // Apply Global to All button
    const applyGlobalBtn = document.getElementById('apply-global-to-all');
    if (applyGlobalBtn) {
        applyGlobalBtn.addEventListener('click', applyGlobalSettingsToAll);
    }
    
    // Individual settings toggle
    const useIndividualToggle = document.getElementById('use-individual-settings');
    if (useIndividualToggle) {
        useIndividualToggle.addEventListener('change', toggleIndividualSettings);
    }
    
    // Setup color presets for individual images
    setupIndividualColorPresets();
}

function setupIndividualAnimationModeListeners() {
    console.log('Setting up individual animation mode listeners for', selectedFiles.length, 'files');
    
    selectedFiles.forEach((file, index) => {
        const animationModeSelect = document.getElementById(`individual-animation-mode-${index}`);
        if (animationModeSelect) {
            console.log(`Setting up listener for image ${index}, current mode:`, animationModeSelect.value);
            
            // Remove existing listeners to prevent duplicates
            animationModeSelect.removeEventListener('change', animationModeSelect._changeHandler);
            
            // Create new change handler
            animationModeSelect._changeHandler = function() {
                console.log(`Animation mode changed for image ${index}:`, this.value);
                updateIndividualImageSettings(index, this.value);
            };
            
            // Add the event listener
            animationModeSelect.addEventListener('change', function() {
                console.log(`Animation mode changed for image ${index}:`, this.value);
                updateIndividualImageSettings(index, this.value);
            });
            
            // Initialize with default mode
            console.log(`Initializing image ${index} with mode:`, animationModeSelect.value);
            updateIndividualImageSettings(index, animationModeSelect.value);
        } else {
            console.error(`Animation mode select not found for image ${index}`);
        }
    });
}

function updateIndividualImageSettings(index, mode) {
    const paintRevealSettings = document.querySelector(`.paint-reveal-settings-${index}`);
    const speedDrawingSettings = document.querySelector(`.speed-drawing-settings-${index}`);
    
    if (paintRevealSettings && speedDrawingSettings) {
        if (mode === 'full') {
            // Show paint reveal settings, hide speed drawing color settings
            paintRevealSettings.classList.remove('hidden');
            speedDrawingSettings.classList.add('hidden');
        } else if (mode === 'drawing_only') {
            // Hide paint reveal settings, show speed drawing color settings
            paintRevealSettings.classList.add('hidden');
            speedDrawingSettings.classList.remove('hidden');
        }
    }
    
    // Update the enable/disable state of input fields
    updateIndividualSettingsVisibility(index, mode);
}

function updateIndividualSettingsVisibility(index, mode) {
    // Get all setting input elements for this image
    const styleSelect = document.getElementById(`individual-style-${index}`);
    const revealDurationInput = document.getElementById(`individual-reveal-duration-${index}`);
    const revealAreaSelect = document.getElementById(`individual-reveal-area-${index}`);
    const lineColorInput = document.getElementById(`individual-line-color-${index}`);
    const backgroundColorInput = document.getElementById(`individual-background-color-${index}`);
    
    if (mode === 'full') {
        // Enable paint reveal settings, disable speed drawing color settings
        if (styleSelect) styleSelect.disabled = false;
        if (revealDurationInput) revealDurationInput.disabled = false;
        if (revealAreaSelect) revealAreaSelect.disabled = false;
        
        if (lineColorInput) lineColorInput.disabled = true;
        if (backgroundColorInput) backgroundColorInput.disabled = true;
        
    } else if (mode === 'drawing_only') {
        // Disable paint reveal settings, enable speed drawing color settings
        if (styleSelect) styleSelect.disabled = true;
        if (revealDurationInput) revealDurationInput.disabled = true;
        if (revealAreaSelect) revealAreaSelect.disabled = true;
        
        if (lineColorInput) lineColorInput.disabled = false;
        if (backgroundColorInput) backgroundColorInput.disabled = false;
    }
}

function applyGlobalSettingsToAll() {
    // For multiple images, we don't have global settings anymore
    // This function can be used to apply first image settings to all others
    if (selectedFiles.length === 0) return;
    
    // Get settings from first image
    const firstImageMode = document.getElementById('individual-animation-mode-0').value;
    const firstDrawingDuration = document.getElementById('individual-drawing-duration-0').value;
    const firstFps = document.getElementById('individual-fps-0').value;
    
    let firstRevealDuration, firstStyle, firstRevealArea, firstLineColor, firstBackgroundColor;
    
    if (firstImageMode === 'full') {
        firstRevealDuration = document.getElementById('individual-reveal-duration-0').value;
        firstStyle = document.getElementById('individual-style-0').value;
        firstRevealArea = document.getElementById('individual-reveal-area-0').value;
    } else {
        firstLineColor = document.getElementById('individual-line-color-0').value;
        firstBackgroundColor = document.getElementById('individual-background-color-0').value;
    }
    
    // Apply to all other images (starting from index 1)
    selectedFiles.forEach((file, index) => {
        if (index === 0) return; // Skip first image
        
        // Apply animation mode
        const animationModeSelect = document.getElementById(`individual-animation-mode-${index}`);
        if (animationModeSelect) {
            animationModeSelect.value = firstImageMode;
            updateIndividualImageSettings(index, firstImageMode);
        }
        
        // Apply drawing duration and fps
        const drawingInput = document.getElementById(`individual-drawing-duration-${index}`);
        const fpsInput = document.getElementById(`individual-fps-${index}`);
        if (drawingInput) {
            drawingInput.value = firstDrawingDuration;
        }
        if (fpsInput) {
            fpsInput.value = firstFps;
        }
        
        if (firstImageMode === 'full') {
            const revealInput = document.getElementById(`individual-reveal-duration-${index}`);
            const styleInput = document.getElementById(`individual-style-${index}`);
            const revealAreaInput = document.getElementById(`individual-reveal-area-${index}`);
            if (revealInput) {
                revealInput.value = firstRevealDuration;
            }
            if (styleInput) {
                styleInput.value = firstStyle;
            }
            if (revealAreaInput) {
                revealAreaInput.value = firstRevealArea;
            }
        } else if (firstImageMode === 'drawing_only') {
            const lineColorInput = document.getElementById(`individual-line-color-${index}`);
            const backgroundColorInput = document.getElementById(`individual-background-color-${index}`);
            if (lineColorInput) lineColorInput.value = firstLineColor;
            if (backgroundColorInput) backgroundColorInput.value = firstBackgroundColor;
        }
    });
    
    showToast('First image settings applied to all images', 'success');
}

function toggleIndividualSettings() {
    const useIndividual = document.getElementById('use-individual-settings').checked;
    const individualSettings = document.querySelectorAll('.individual-settings');
    
    individualSettings.forEach(setting => {
        if (useIndividual) {
            setting.style.opacity = '1';
            setting.style.pointerEvents = 'auto';
            
            // Enable all inputs in this setting
            const inputs = setting.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.disabled = false;
            });
        } else {
            setting.style.opacity = '0.5';
            setting.style.pointerEvents = 'none';
            
            // Disable all inputs in this setting
            const inputs = setting.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.disabled = true;
            });
        }
    });
}


function getIndividualSettings() {
    const useIndividual = document.getElementById('use-individual-settings').checked;
    
    if (!useIndividual || selectedFiles.length <= 1) {
        return null; // Use global settings
    }
    
    const individualSettings = {};
    
    selectedFiles.forEach((file, index) => {
        const animationMode = document.getElementById(`individual-animation-mode-${index}`).value;
        const drawingDuration = document.getElementById(`individual-drawing-duration-${index}`);
        const fps = document.getElementById(`individual-fps-${index}`);
        
        if (drawingDuration && fps) {
            individualSettings[index] = {
                animation_mode: animationMode,
                drawing_duration: parseFloat(drawingDuration.value),
                fps: parseInt(fps.value)
            };
            
            if (animationMode === 'full') {
                const revealDuration = document.getElementById(`individual-reveal-duration-${index}`);
                const style = document.getElementById(`individual-style-${index}`);
                const revealArea = document.getElementById(`individual-reveal-area-${index}`);
                if (revealDuration && style && revealArea) {
                    individualSettings[index].reveal_duration = parseFloat(revealDuration.value);
                    individualSettings[index].style_choice = parseInt(style.value);
                    individualSettings[index].reveal_area_multiplier = parseFloat(revealArea.value);
                }
            } else if (animationMode === 'drawing_only') {
                const lineColor = document.getElementById(`individual-line-color-${index}`);
                const backgroundColor = document.getElementById(`individual-background-color-${index}`);
                if (lineColor && backgroundColor) {
                    individualSettings[index].line_color = lineColor.value;
                    individualSettings[index].background_color = backgroundColor.value;
                }
            }
        }
    });
    
    return individualSettings;
}

// Export functions for use in other modules
window.individualSettings = {
    setup: setupIndividualSettingsListeners,
    get: getIndividualSettings,
    applyGlobal: applyGlobalSettingsToAll
};