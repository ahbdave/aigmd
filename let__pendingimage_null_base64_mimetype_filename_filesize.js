let _pendingImage = null;  // { base64, mimeType, fileName, fileSize }

    const VISION_MODEL = 'google/gemini-2.0-flash-001';

    function handleImageSelected(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        event.target.value = '';
        return;
      }

      // 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        alert('Image too large. Please use an image under 20MB.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];

        _pendingImage = {
          base64,
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          dataUrl
        };

        // Show preview
        const strip = document.getElementById('imagePreviewStrip');
        document.getElementById('imagePreviewThumb').src = dataUrl;
        document.getElementById('imagePreviewName').textContent = file.name;
        document.getElementById('imagePreviewSize').textContent = formatFileSize(file.size);
        strip.classList.add('visible');

        // Update button state
        document.getElementById('imgUploadBtn').classList.add('has-image');

        // Focus back to input
        document.getElementById('messageInput').focus();
      };
      reader.readAsDataURL(file);
    }

    function removeAttachedImage() {
      _pendingImage = null;
      document.getElementById('imagePreviewStrip').classList.remove('visible');
      document.getElementById('imgUploadBtn').classList.remove('has-image');
      document.getElementById('imageFileInput').value = '';
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Support paste from clipboard (Ctrl+V / Cmd+V with image)
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          // Re-use the same handler via a synthetic event
          const dt = new DataTransfer();
          dt.items.add(file);
          const input = document.getElementById('imageFileInput');
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
          break;
        }
      }
    });

    // Support drag-and-drop onto the input area
    document.addEventListener('DOMContentLoaded', () => {
      const inputArea = document.querySelector('.input-area');
      if (!inputArea) return;

      inputArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        inputArea.style.borderColor = 'var(--primary)';
      });
      inputArea.addEventListener('dragleave', () => {
        inputArea.style.borderColor = '';
      });
      inputArea.addEventListener('drop', (e) => {
        e.preventDefault();
        inputArea.style.borderColor = '';
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const dt = new DataTransfer();
          dt.items.add(file);
          const input = document.getElementById('imageFileInput');
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
        }
      });
    });

    /**
     * Send image to Gemini Flash via OpenRouter for vision analysis.
     * Returns a text description that gets injected into the chat context.
     */
    async function processImageWithVision(imageData, userPrompt) {
      const visionMessages = [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageData.mimeType};base64,${imageData.base64}`
              }
            },
            {
              type: 'text',
              text: userPrompt
                ? `The user sent this image along with the message: "${userPrompt}"\n\nDescribe what you see in the image in detail, then respond to their message in the context of the image. Be thorough but concise.`
                : 'Describe this image in detail. Include all relevant visual information — objects, text, colors, layout, context, and any notable details.'
            }
          ]
        }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://godmod3.ai',
          'X-Title': 'GODMOD3.AI'
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: visionMessages,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Vision API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Could not analyze image.';
    }