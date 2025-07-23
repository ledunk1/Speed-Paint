// ONNX processing and line art generation

async function generateLineArt(file) {
    updateProcessStatus(1, 'processing');
    const currentProcessStatus = document.getElementById('current-process-status');
    if (currentProcessStatus) {
        currentProcessStatus.textContent = 'Converting to RGB array...';
    }
    
    // Convert image to line art using ONNX
    let {data, width, height} = await blobToLinearRGBArray(file);
    
    if (currentProcessStatus) {
        currentProcessStatus.textContent = 'Running AI inference...';
    }
    const feeds = {'input': new ort.Tensor('float32', data, [1, 3, height, width])};
    
    console.log("Running ONNX inference...");
    let t = Date.now();
    const results = await onnxSession.run(feeds);
    console.log(`Finished in ${Date.now()-t}ms`);
    
    const out = results["output"];
    console.log(`Results:`, out);
    
    if (currentProcessStatus) {
        currentProcessStatus.textContent = 'Converting to image...';
    }
    lineArtBlob = await linearGreyscaleArrayToBlob(out.data, {width:out.dims[3], height:out.dims[2]});
    let blobUrl = URL.createObjectURL(lineArtBlob);
    
    // Save line art to server
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
        img.onload = async function() {
            try {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const lineArtDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                const saveResponse = await fetch('/save_line_art', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        file_id: currentFileId,
                        line_art_data: lineArtDataUrl
                    })
                });
                
                const saveResult = await saveResponse.json();
                if (saveResult.success) {
                    updateProcessStatus(1, 'completed');
                    resolve();
                } else {
                    updateProcessStatus(1, 'error');
                    reject(new Error(saveResult.error || 'Failed to save line art'));
                }
            } catch (error) {
                updateProcessStatus(1, 'error');
                reject(error);
            }
        };
        img.src = blobUrl;
    });
}

// ONNX Processing Functions (from original script)
async function blobToLinearRGBArray(blob) {
    let img = await createImageBitmap(blob);
    
    // Create canvas with white background to handle transparency
    let canvas = new OffscreenCanvas(img.width, img.height);
    let ctx = canvas.getContext("2d");
    
    // Fill with white background first to handle transparent images
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Then draw the image on top
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let rgbData = [[], [], []]; // [r, g, b]
    // Remove alpha channel and put into correct shape with white background handling:
    let d = imageData.data;
    for(let i = 0; i < d.length; i += 4) { 
        let x = (i/4) % canvas.width;
        let y = Math.floor((i/4) / canvas.width)
        if(!rgbData[0][y]) rgbData[0][y] = [];
        if(!rgbData[1][y]) rgbData[1][y] = [];
        if(!rgbData[2][y]) rgbData[2][y] = [];
        
        // Handle transparency by blending with white background
        let alpha = d[i+3] / 255;
        rgbData[0][y][x] = (d[i+0] * alpha + 255 * (1 - alpha)) / 255; // Red
        rgbData[1][y][x] = (d[i+1] * alpha + 255 * (1 - alpha)) / 255; // Green  
        rgbData[2][y][x] = (d[i+2] * alpha + 255 * (1 - alpha)) / 255; // Blue
    }
    rgbData = Float32Array.from(rgbData.flat().flat());
    return {data:rgbData, width:img.width, height:img.height};
}

async function linearGreyscaleArrayToBlob(linearArr, dims) {
    let dataArray = [];
    for(let i = 0; i < linearArr.length; i++) {
        // Convert to natural pencil gray color instead of pure black/white
        let grayValue = linearArr[i] * 180 + 75; // Scale to 75-255 range for softer gray
        dataArray.push(grayValue); // R
        dataArray.push(grayValue); // G
        dataArray.push(grayValue); // B
        dataArray.push(1*255);            // A
    }
    let imageData = new ImageData(new Uint8ClampedArray(dataArray), dims.width, dims.height);
    let canvas = new OffscreenCanvas(dims.width, dims.height);
    let ctx = canvas.getContext("2d");
    ctx.putImageData(imageData, 0, 0);
    return canvas.convertToBlob({type:"image/jpg"});
}