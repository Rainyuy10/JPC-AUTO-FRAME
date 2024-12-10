document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const frameSelect = document.getElementById('frame-select');
    const cropSquare = document.getElementById('crop-square');
    const previewCanvas = document.getElementById('preview-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const notification = document.getElementById('notification');
  
    let images = [];
    let frames = {};
  
    // Load the frames
    ['frame1', 'frame2', 'frame3'].forEach((frame) => {
      const img = new Image();
      img.src = `frames/${frame}.png`;
      frames[frame] = img;
    });
  
    // Display uploaded image immediately in preview
    imageUpload.addEventListener('change', (event) => {
      images = [];
      const files = event.target.files;
      for (let i = 0; i < files.length && i < 40; i++) {
        const img = new Image();
        img.src = URL.createObjectURL(files[i]);
        img.onload = function () {
          images.push(img);
          // Show the first image in preview immediately after it's loaded
          renderPreview();
        };
      }
    });
  
    frameSelect.addEventListener('change', renderPreview);
  
    cropSquare.addEventListener('click', () => {
      // Crop all images to fill a square and update their src
      images = images.map((img) => {
        return cropToFillSquare(img, 2500);
      });
  
      // Wait until all cropped images are loaded, then re-render the preview
      Promise.all(images.map(img => new Promise(resolve => {
        img.onload = resolve;  // Resolve when each image is fully loaded
      })))
      .then(() => {
        renderPreview();  // Re-render the preview after all images are loaded
        showNotification("Cropping is complete!");
      });
    });
  
    downloadBtn.addEventListener('click', () => {
      const zip = new JSZip();
      images.forEach((img, index) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.drawImage(frames[frameSelect.value], 0, 0, img.width, img.height);
        const dataUrl = canvas.toDataURL('image/png');
        zip.file(`framed_image_${index + 1}.png`, dataUrl.split(',')[1], { base64: true });
      });
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'framed_images.zip';
        link.click();
      });
    });
  
    function cropToFillSquare(img, size) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.height = size;
  
      // Determine scaling to completely fill the square
      const scale = Math.max(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
  
      // Calculate the offsets to center the image
      const xOffset = (size - scaledWidth) / 2;
      const yOffset = (size - scaledHeight) / 2;
  
      ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);
  
      // Create a new Image object with the cropped image
      const cropped = new Image();
      cropped.src = canvas.toDataURL();
      return cropped;
    }
  
    function renderPreview() {
      if (images.length === 0) return;
  
      // Use the first image for the preview
      const img = images[0];
      const ctx = previewCanvas.getContext('2d');
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.drawImage(frames[frameSelect.value], 0, 0, img.width, img.height);
    }
  
    // Show notification
    function showNotification(message) {
      notification.textContent = message;
      notification.style.display = 'block';
      setTimeout(() => {
        notification.style.display = 'none';
      }, 3000); // Hide after 3 seconds
    }
  });
  