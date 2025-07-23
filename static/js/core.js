// Core functionality and initialization
let currentFileId = null;
let onnxSession = null;
let lineArtBlob = null;
let selectedFile = null;
let selectedFiles = [];
let processedFiles = [];
let batchResults = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Clear any reload counters on fresh page load
    if(performance.navigation.type === performance.navigation.TYPE_NAVIGATE) {
        sessionStorage.removeItem('coi-sw-reload-attempted');
    }
    
    setupEventListeners();
    initializeONNX();
});

function setupEventListeners() {
    // File upload
    const fileUpload = document.getElementById('file-upload');
    const uploadArea = document.getElementById('upload-area');
    const createAnimationBtn = document.getElementById('create-animation-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    
    fileUpload.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Animation creation
    createAnimationBtn.addEventListener('click', handleCreateAnimation);
    downloadAllBtn.addEventListener('click', handleDownloadAll);
}

async function initializeONNX() {
    try {
        // Wait a bit for service worker to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Setup ONNX Runtime
        if(self.crossOriginIsolated) {
            ort.env.wasm.numThreads = navigator.hardwareConcurrency;
            console.log("Cross-origin isolated: WASM threads enabled");
        } else {
            console.log("Not cross-origin isolated: WASM threads disabled");
        }
        ort.env.wasm.proxy = true;
        
        if(!window.OffscreenCanvas) {
            showToast('Your browser doesn\'t support OffscreenCanvas. Please use a modern browser like Chrome, Edge or Brave.', 'error');
            return;
        }
        
        console.log("Downloading ONNX model...");
        onnxSession = await ort.InferenceSession.create(
            'https://huggingface.co/rocca/informative-drawings-line-art-onnx/resolve/main/model.onnx', 
            { executionProviders: ["wasm"] }
        );
        console.log("ONNX Model loaded successfully");
        
    } catch (error) {
        console.error("Failed to load ONNX model:", error);
        showToast('Failed to load AI model. Please refresh the page.', 'error');
    }
}