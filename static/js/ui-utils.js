// UI utilities and helper functions

function updateProcessStatus(step, status) {
    const statusElements = [
        document.getElementById('upload-status'),
        document.getElementById('lineArt-status'),
        document.getElementById('animation-status')
    ];
    const messages = [
        'Uploading image...',
        'Generating Speed Drawing...',
        'Creating animation...'
    ];
    
    // Check if elements exist before updating
    if (statusElements[step] && document.getElementById('current-process-status')) {
        // Update current step
        if (status === 'processing') {
            statusElements[step].className = 'w-4 h-4 rounded-full bg-yellow-500 mr-3';
            document.getElementById('current-process-status').textContent = messages[step];
        } else if (status === 'completed') {
            statusElements[step].className = 'w-4 h-4 rounded-full bg-green-500 mr-3';
        } else if (status === 'error') {
            statusElements[step].className = 'w-4 h-4 rounded-full bg-red-500 mr-3';
        }
    }
}

function setButtonLoading(button, textElement, spinner, loadingText) {
    button.disabled = true;
    textElement.textContent = loadingText;
    spinner.classList.remove('hidden');
}

function setButtonNormal(button, textElement, spinner, normalText) {
    button.disabled = false;
    textElement.textContent = normalText;
    spinner.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `max-w-sm w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 mb-4 transform transition-all duration-300 ease-in-out`;
    
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    toast.innerHTML = `
        <div class="flex-1 w-0 p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-sm">${icon}</div>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900 leading-relaxed">${message}</p>
                </div>
            </div>
        </div>
        <div class="flex border-l border-gray-200 bg-gray-50 rounded-r-lg">
            <button class="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none transition-colors" onclick="this.parentElement.parentElement.remove()">
                ✕
            </button>
        </div>
    `;
    
    // Add entrance animation
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Trigger entrance animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            // Exit animation
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 6000);
}