// Submit Page Form Validation and Interactions

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('game-submit-form');
    
    if (!form) return;
    
    // Character counters for description fields
    setupCharacterCounters();
    
    // Image URL validation pattern
    const imageInput = document.getElementById('image_url');
    const downloadInput = document.getElementById('download_link');
    const secondaryDownloadInput = document.getElementById('secondary_download');
    
    if (imageInput) {
        imageInput.addEventListener('blur', validateImageURL);
        imageInput.addEventListener('input', validateImageURL);
    }
    
    if (downloadInput) {
        downloadInput.addEventListener('blur', validateDownloadURL);
        downloadInput.addEventListener('input', validateDownloadURL);
    }
    
    if (secondaryDownloadInput) {
        secondaryDownloadInput.addEventListener('blur', () => {}); // Optional, no validation needed yet
    }
    
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
});

// Character Counter Setup
function setupCharacterCounters() {
    const oneSentence = document.getElementById('one_sentence_desc');
    const gameDesc = document.getElementById('game_desc');
    const countDisplayOne = oneSentence?.parentElement?.querySelector('.form-hint');
    const countDisplayTwo = gameDesc?.parentElement?.querySelector('.form-hint');
    
    if (oneSentence && countDisplayOne) {
        oneSentence.addEventListener('input', () => {
            countDisplayOne.textContent = `${oneSentence.value.length}/400 characters`;
        });
        countDisplayOne.textContent = '0/400 characters';
    }
    
    if (gameDesc && countDisplayTwo) {
        gameDesc.addEventListener('input', () => {
            countDisplayTwo.textContent = `${gameDesc.value.length}/1000 characters`;
        });
        countDisplayTwo.textContent = '0/1000 characters';
    }
}

// Image URL Validation (must end in .jpg or .png)
function validateImageURL() {
    const input = document.getElementById('image_url');
    const value = input.value.trim();
    
    if (!value) return; // Let required validation handle empty fields
    
    const validPattern = /^(https?:\/\/[^\s]+)\.(jpg|jpeg|png)$/i;
    const urlPattern = /^https?:\/\/[^\s]+$/;
    
    if (!validPattern.test(value)) {
        if (!urlPattern.test(value)) {
            showFieldError(input, 'Please enter a valid URL (http or https)');
            return;
        }
        showFieldError(input, 'URL must end with .jpg or .png');
        input.reportValidity();
    } else {
        clearFieldError(input);
    }
}

// Download URL Validation (must be valid http/https URL)
function validateDownloadURL() {
    const input = document.getElementById('download_link');
    const value = input.value.trim();
    
    if (!value) return; // Let required validation handle empty fields
    
    const urlPattern = /^https?:\/\/[^\s]+$/;
    
    if (!urlPattern.test(value)) {
        showFieldError(input, 'Please enter a valid URL (http or https)');
        input.reportValidity();
    } else {
        clearFieldError(input);
    }
}

// Show field error message
function showFieldError(input, message) {
    const parent = input.parentElement;
    let errorElement = parent.querySelector('.field-error');
    
    if (!errorElement) {
        errorElement = document.createElement('small');
        errorElement.className = 'field-error';
        errorElement.style.color = '#e74c3c';
        errorElement.style.fontSize = '0.8rem';
        parent.insertBefore(errorElement, input.nextSibling);
    }
    
    errorElement.textContent = message;
    input.style.borderColor = '#e74c3c';
}

// Clear field error styling
function clearFieldError(input) {
    const parent = input.parentElement;
    const errorElement = parent.querySelector('.field-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    input.style.borderColor = '';
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate image URL first
    validateImageURL();
    
    // Check if form is valid
    if (!form.checkValidity()) {
        return;
    }
    
    // Show loading overlay
    showLoading(true);
    
    try {
        // Prepare form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Send to backend (adjust endpoint as needed)
        const response = await fetch('/api/submit-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('Game submitted successfully! You will receive a confirmation email.');
            form.reset();
            setupCharacterCounters(); // Reset counters
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Failed to submit game. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
        console.error('Submission error:', error);
    } finally {
        showLoading(false);
    }
}

// Show loading state
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    const submitBtn = form.querySelector('.submit-btn');
    
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
    
    if (submitBtn) {
        submitBtn.disabled = show;
        submitBtn.textContent = show ? 'Submitting...' : 'Submit Game';
    }
}

// Show success message
function showSuccess(message) {
    alert(message); // Could be replaced with a nicer notification/toast
}

// Show error message
function showError(message) {
    alert('Error: ' + message); // Could be replaced with a nicer notification/toast
}
