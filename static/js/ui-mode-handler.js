// UI Mode Handler - Controls animation mode switching
document.addEventListener('DOMContentLoaded', function() {
    const animationModeSelect = document.getElementById('animation-mode');
    const styleSelect = document.getElementById('style-select');
    const revealDuration = document.getElementById('reveal-duration');
    const revealAreaMultiplier = document.getElementById('reveal-area-multiplier');
    const paintRevealSettings = document.getElementById('paint-reveal-settings');
    const speedDrawingColorSettings = document.getElementById('speed-drawing-color-settings');
    const featureExplanations = document.getElementById('feature-explanations');
    const lineColorInput = document.getElementById('line-color');
    const lineColorPreset = document.getElementById('line-color-preset');
    const backgroundColorInput = document.getElementById('background-color');
    const backgroundColorPreset = document.getElementById('background-color-preset');
    
    // Handle animation mode change
    animationModeSelect.addEventListener('change', function() {
        const mode = this.value;
        
        if (mode === 'drawing_only') {
            // Speed Drawing Only mode
            styleSelect.disabled = true;
            revealDuration.disabled = true;
            revealAreaMultiplier.disabled = true;
            paintRevealSettings.style.opacity = '0.5';
            paintRevealSettings.classList.add('hidden');
            speedDrawingColorSettings.classList.remove('hidden');
            
            // Update explanations for drawing only mode
            featureExplanations.innerHTML = `
                <h4 class="text-sm font-semibold text-blue-800 mb-2">🔧 Speed Drawing Only Mode:</h4>
                <ul class="text-xs text-blue-700 space-y-1">
                    <li><strong>✏️ Pure Speed Drawing:</strong> Shows only the drawing process with pencil strokes</li>
                    <li><strong>⏱️ Drawing Duration:</strong> Controls how long the drawing animation takes</li>
                    <li><strong>🎨 Line Color:</strong> Customize the drawing line color</li>
                    <li><strong>🖼️ Background Color:</strong> Customize the canvas background color</li>
                    <li><strong>🎬 FPS:</strong> Frame rate for smooth animation playback</li>
                    <li><strong>📝 Natural Pencil Effect:</strong> Realistic pencil drawing simulation</li>
                </ul>
            `;
            
        } else {
            // Speed Drawing + Paint Reveal mode
            styleSelect.disabled = false;
            revealDuration.disabled = false;
            revealAreaMultiplier.disabled = false;
            paintRevealSettings.style.opacity = '1';
            paintRevealSettings.classList.remove('hidden');
            speedDrawingColorSettings.classList.add('hidden');
            
            // Restore original explanations
            featureExplanations.innerHTML = `
                <h4 class="text-sm font-semibold text-blue-800 mb-2">🔧 Advanced Features:</h4>
                <ul class="text-xs text-blue-700 space-y-1">
                    <li><strong>✏️ Speed Drawing Only:</strong> Creates animation showing only the drawing process without paint reveal</li>
                    <li><strong>🎨 Speed Drawing + Paint Reveal:</strong> Full animation with drawing process followed by color reveal</li>
                    <li><strong>📏 Reveal Area Size:</strong> Controls how large the paint brush/reveal area is</li>
                    <li><strong>🎲 Random Line Reveal:</strong> Paint reveals randomly around line art paths</li>
                    <li><strong>🎨 Line Art Reveal:</strong> Paint reveals following exact same path as speed drawing</li>
                </ul>
            `;
        }
        
        // Update individual settings display if multiple files are selected
        if (selectedFiles.length > 0) {
            // Update all individual image settings to match the new mode
            selectedFiles.forEach((file, index) => {
                const individualModeSelect = document.getElementById(`individual-animation-mode-${index}`);
                if (individualModeSelect) {
                    // Don't change the individual mode, just update the visibility
                    updateIndividualImageSettings(index, individualModeSelect.value);
                }
            });
        }
    });
    
    // Handle color preset changes
    lineColorPreset.addEventListener('change', function() {
        lineColorInput.value = this.value;
    });
    
    backgroundColorPreset.addEventListener('change', function() {
        backgroundColorInput.value = this.value;
    });
    
    // Handle manual color input changes
    lineColorInput.addEventListener('change', function() {
        // Find matching preset or set to custom
        const matchingOption = Array.from(lineColorPreset.options).find(option => option.value === this.value);
        if (matchingOption) {
            lineColorPreset.value = this.value;
        }
    });
    
    backgroundColorInput.addEventListener('change', function() {
        // Find matching preset or set to custom
        const matchingOption = Array.from(backgroundColorPreset.options).find(option => option.value === this.value);
        if (matchingOption) {
            backgroundColorPreset.value = this.value;
        }
    });
    
    // Initialize with default mode
    animationModeSelect.dispatchEvent(new Event('change'));
});