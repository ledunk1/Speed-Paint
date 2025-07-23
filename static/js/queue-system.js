// Queue system for batch processing

function showQueueStatus() {
    const queueStatus = document.getElementById('queue-status');
    const queueItems = document.getElementById('queue-items');
    
    // Clear previous items
    queueItems.innerHTML = '';
    
    // Create queue items
    selectedFiles.forEach((file, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        queueItem.innerHTML = `
            <div class="flex items-center">
                <div id="queue-icon-${index}" class="w-4 h-4 rounded-full bg-gray-400 mr-3"></div>
                <span class="text-sm font-medium text-gray-900">${file.name}</span>
            </div>
            <span id="queue-status-${index}" class="text-xs text-gray-500">Waiting...</span>
        `;
        queueItems.appendChild(queueItem);
    });
    
    // Show queue status card
    queueStatus.classList.remove('hidden');
    
    // Initialize progress
    updateQueueProgress(0, selectedFiles.length);
    updateQueueStatus('Preparing to process files...');
}

function updateQueueProgress(current, total) {
    const progressBar = document.getElementById('queue-progress-bar');
    const progressText = document.getElementById('queue-progress-text');
    
    const percentage = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${current} / ${total}`;
}

function updateQueueItemStatus(index, status, message) {
    const icon = document.getElementById(`queue-icon-${index}`);
    const statusText = document.getElementById(`queue-status-${index}`);
    
    if (status === 'processing') {
        icon.className = 'w-4 h-4 rounded-full bg-yellow-500 mr-3';
        statusText.textContent = 'Processing...';
        statusText.className = 'text-xs text-yellow-600';
    } else if (status === 'success') {
        icon.className = 'w-4 h-4 rounded-full bg-green-500 mr-3';
        statusText.textContent = message;
        statusText.className = 'text-xs text-green-600';
    } else if (status === 'error') {
        icon.className = 'w-4 h-4 rounded-full bg-red-500 mr-3';
        statusText.textContent = message;
        statusText.className = 'text-xs text-red-600';
    }
}

function updateQueueStatus(message) {
    const currentQueueStatus = document.getElementById('current-queue-status');
    if (currentQueueStatus) {
        currentQueueStatus.textContent = message;
    }
}