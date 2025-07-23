// File Manager JavaScript
let currentAction = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadFileStats();
    loadFileList();
});

// Load file statistics
async function loadFileStats() {
    try {
        const response = await fetch('/api/file_stats');
        const stats = await response.json();
        
        if (stats.success) {
            document.getElementById('uploaded-count').textContent = stats.uploads_count;
            document.getElementById('animations-count').textContent = stats.outputs_count;
            document.getElementById('total-size').textContent = formatFileSize(stats.total_size);
        }
    } catch (error) {
        console.error('Error loading file stats:', error);
        showToast('Failed to load file statistics', 'error');
    }
}

// Load file lists
async function loadFileList() {
    await Promise.all([
        loadUploads(),
        loadOutputs()
    ]);
}

// Load uploaded files
async function loadUploads() {
    const loadingEl = document.getElementById('uploads-loading');
    const listEl = document.getElementById('uploads-list');
    const emptyEl = document.getElementById('uploads-empty');
    
    try {
        loadingEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        emptyEl.classList.add('hidden');
        
        const response = await fetch('/api/list_uploads');
        const data = await response.json();
        
        loadingEl.classList.add('hidden');
        
        if (data.success && data.files.length > 0) {
            listEl.innerHTML = '';
            data.files.forEach(file => {
                const fileEl = createFileElement(file, 'upload');
                listEl.appendChild(fileEl);
            });
            listEl.classList.remove('hidden');
        } else {
            emptyEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading uploads:', error);
        loadingEl.classList.add('hidden');
        showToast('Failed to load uploaded files', 'error');
    }
}

// Load output files
async function loadOutputs() {
    const loadingEl = document.getElementById('outputs-loading');
    const listEl = document.getElementById('outputs-list');
    const emptyEl = document.getElementById('outputs-empty');
    
    try {
        loadingEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        emptyEl.classList.add('hidden');
        
        const response = await fetch('/api/list_outputs');
        const data = await response.json();
        
        loadingEl.classList.add('hidden');
        
        if (data.success && data.files.length > 0) {
            listEl.innerHTML = '';
            data.files.forEach(file => {
                const fileEl = createFileElement(file, 'output');
                listEl.appendChild(fileEl);
            });
            listEl.classList.remove('hidden');
        } else {
            emptyEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading outputs:', error);
        loadingEl.classList.add('hidden');
        showToast('Failed to load output files', 'error');
    }
}

// Create file element
function createFileElement(file, type) {
    const div = document.createElement('div');
    div.className = 'file-item bg-gray-50 rounded-lg p-4 border border-gray-200';
    
    const isImage = file.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const isVideo = file.name.match(/\.(mp4|avi|mov)$/i);
    
    let icon = '📄';
    let downloadUrl = '';
    
    if (type === 'upload') {
        icon = isImage ? '🖼️' : '📄';
        downloadUrl = `/uploads/${file.name}`;
    } else {
        icon = isVideo ? '🎬' : isImage ? '🖼️' : '📄';
        downloadUrl = `/download/${file.name}`;
    }
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center flex-1 min-w-0">
                <span class="text-2xl mr-3">${icon}</span>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${file.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(file.size)} • ${formatDate(file.modified)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <a href="${downloadUrl}" target="_blank" class="p-2 text-blue-600 hover:text-blue-800 transition-colors" title="Download">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </a>
                <button onclick="deleteFile('${file.name}', '${type}')" class="p-2 text-red-600 hover:text-red-800 transition-colors" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Quick Actions
async function refreshFileList() {
    showToast('Refreshing file list...', 'info');
    await loadFileStats();
    await loadFileList();
    showToast('File list refreshed successfully', 'success');
}

function deleteOldFiles() {
    showConfirmationModal(
        'Delete Old Files',
        'This will delete all files older than 7 days. This action cannot be undone.',
        () => performAction('/api/delete_old_files')
    );
}

function deleteAllUploads() {
    showConfirmationModal(
        'Delete All Uploads',
        'This will delete ALL uploaded images. This action cannot be undone.',
        () => performAction('/api/delete_all_uploads')
    );
}

function deleteAllOutputs() {
    showConfirmationModal(
        'Delete All Animations',
        'This will delete ALL generated animations and line art files. This action cannot be undone.',
        () => performAction('/api/delete_all_outputs')
    );
}

function deleteAllFiles() {
    showConfirmationModal(
        'Delete ALL Files',
        'This will delete EVERYTHING - all uploads, animations, and line art files. This action cannot be undone!',
        () => performAction('/api/delete_all_files')
    );
}

function cleanupTempFiles() {
    showConfirmationModal(
        'Cleanup Temporary Files',
        'This will clean up temporary files and empty directories.',
        () => performAction('/api/cleanup_temp')
    );
}

// Delete individual file
function deleteFile(filename, type) {
    showConfirmationModal(
        'Delete File',
        `Are you sure you want to delete "${filename}"?`,
        () => performAction(`/api/delete_file`, { filename, type })
    );
}

// Perform API action
async function performAction(endpoint, data = null) {
    try {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message || 'Action completed successfully', 'success');
            await loadFileStats();
            await loadFileList();
        } else {
            showToast(result.error || 'Action failed', 'error');
        }
    } catch (error) {
        console.error('Error performing action:', error);
        showToast('Failed to perform action', 'error');
    }
}

// Modal functions
function showConfirmationModal(title, message, action) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    currentAction = action;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    currentAction = null;
}

function confirmAction() {
    if (currentAction) {
        currentAction();
        closeModal();
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}