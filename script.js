// Hello Clever API Configuration
const HELLO_CLEVER_CONFIG = {
    BWP: {
        apiUrl: 'https://api-merchant.rc.cleverhub.co/api/v3/payin_links',
        appId: 'app-64f1f27bf1b4ec22924fd0acb550c235',
        secretKey: 'AK_RC_0af02e8dc4089280bb7defa574d35c2b77f9beb413f09255e9d7adb19c533f50'
    },
    JPY: {
        apiUrl: 'https://api.cleverhub.co/api/v3/payin_links',
        appId: 'app-ebb71045453f38676c40deb9864f811d',
        secretKey: 'AK_SANDBOX_7ca82727d0aa264cd913415f01034e7d0f7bc2e147390fe369aa37bd03603f2e'
    },
    KRW: {
        apiUrl: 'https://api.cleverhub.co/api/v3/payin_links',
        appId: 'app-1cd3882394520876dc88d1472aa2a93f',
        secretKey: 'AK_SANDBOX_7ca82727d0aa264cd913415f01034e7d0f7bc2e147390fe369aa37bd03603f2e'
    }
};

// Mock data for each currency
const MOCK_DATA = {
    BWP: {
        description: "Testing payin flow pgv3",
        sender_info: {
            email: "ryan.nguyen@gmail.com",
            first_name: "Ryan",
            last_name: "Nguyen",
            dob: "1990-01-01",
            reg_no: "A1234567",
            phone: "+26774567890",
            country_code: "BW",
            address: "Plot 1245, Independence Avenue, Gaborone, Botswana",
            account_number: "+26774567890",
            document_type: "Passport",
            document_number: "B1234567"
        }
    },
    JPY: {
        description: "Demo multi-currency gateway",
        redirect_url: {
            success: "https://testing-minimoo.cleverpay.store/success"
        },
        sender_info: {
            email: "luyx@getkollo.com",
            first_name: "ニエン",
            last_name: "チュオン"
        }
    },
    KRW: {
        description: "Demo multi-currency gateway",
        redirect_url: {
            success: "https://testing-minimoo.cleverpay.store/success"
        },
        sender_info: {
            email: "luyx@helloclever.co",
            first_name: "John",
            last_name: "Doe"
        }
    }
};

// DOM Elements
const modal = document.getElementById('paymentModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalMessage = document.getElementById('modalMessage');
const currencyBoxes = document.querySelectorAll('.currency-box');

// Hello Clever Payment Gateway API - Real implementation
async function callHelloCleverPayment(currency, paymentData) {
    const config = HELLO_CLEVER_CONFIG[currency];
    
    const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
            'app-id': config.appId,
            'secret-key': config.secretKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Mock Hello Clever Payment Gateway API (for currencies without real API)
async function mockHelloCleverPayment(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: `HC-${Date.now()}`,
                message: 'Payment processed successfully',
                timestamp: new Date().toISOString()
            });
        }, 2000);
    });
}

// Validate deposit amount for a specific input
function validateAmount(inputElement, errorElement, currency) {
    const amount = parseFloat(inputElement.value);
    
    if (!inputElement.value || inputElement.value.trim() === '') {
        showAmountError(inputElement, errorElement, 'Please enter amount');
        return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showAmountError(inputElement, errorElement, 'Amount must be > 0');
        return false;
    }
    
    // Currency-specific validation
    if (currency === 'KRW') {
        if (amount < 10000) {
            showAmountError(inputElement, errorElement, 'Min: 10,000 KRW');
            return false;
        }
        if (amount > 50000000) {
            showAmountError(inputElement, errorElement, 'Max: 50,000,000 KRW');
            return false;
        }
    } else {
        if (amount > 1000000) {
            showAmountError(inputElement, errorElement, 'Max: 1,000,000');
            return false;
        }
    }
    
    clearAmountError(inputElement, errorElement);
    return true;
}

function showAmountError(inputElement, errorElement, message) {
    inputElement.classList.add('error');
    errorElement.textContent = message;
}

function clearAmountError(inputElement, errorElement) {
    inputElement.classList.remove('error');
    errorElement.textContent = '';
}

// Add event listeners to all amount inputs to clear errors on input
document.querySelectorAll('.deposit-amount-input').forEach(input => {
    const errorElement = input.closest('.amount-input-section').querySelector('.error-message');
    input.addEventListener('input', () => {
        if (input.value) {
            clearAmountError(input, errorElement);
        }
    });
});

// Handle currency box clicks
currencyBoxes.forEach(box => {
    const button = box.querySelector('.btn-currency');
    
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const currency = box.getAttribute('data-currency');
        await processCurrencyPayment(currency, button);
    });
    
    // Also allow clicking the entire box
    box.addEventListener('click', async () => {
        const button = box.querySelector('.btn-currency');
        const currency = box.getAttribute('data-currency');
        await processCurrencyPayment(currency, button);
    });
});

async function processCurrencyPayment(currency, button) {
    // Get the input field from this specific currency box
    const currencyBox = button.closest('.currency-box');
    const amountInput = currencyBox.querySelector('.deposit-amount-input');
    const errorElement = currencyBox.querySelector('.error-message');
    
    // Validate amount first with currency-specific rules
    if (!validateAmount(amountInput, errorElement, currency)) {
        // Focus on amount input
        amountInput.focus();
        return;
    }

    // Get the customer's input amount
    const customerAmount = parseFloat(amountInput.value);

    // Disable button to prevent double clicks
    button.disabled = true;
    button.textContent = 'Processing...';

    // Get mock data for the selected currency and update the amount
    const paymentData = { ...MOCK_DATA[currency] };
    paymentData.amount = customerAmount;
    paymentData.description = `Forex Account Deposit - Sandra Lin - ${customerAmount} ${currency}`;

    // Show modal with initial message
    showModal(`Processing your ${currency} ${customerAmount.toFixed(2)} deposit...<br>Please wait while we connect to the payment gateway.`);

    try {
        let response;
        
        // Use real API for all currencies
        response = await callHelloCleverPayment(currency, paymentData);
        
        // Log the response to see its structure
        console.log(`${currency} Hello Clever API Response:`, response);
        
        // Try to find the payment link in different possible field names
        const paymentLink = response.payment_link || 
                           response.link || 
                           response.url || 
                           response.checkout_url ||
                           response.payment_url ||
                           response.redirect_url ||
                           (response.data && response.data.payment_link) ||
                           (response.data && response.data.link) ||
                           (response.data && response.data.url);
        
        // If payment link is available, open it in a new tab
        if (paymentLink) {
            // Open payment link in new tab
            window.open(paymentLink, '_blank');
            
            // Show success message
            showModal(`✓ Payment link created successfully!<br><br>Opening ${currency} payment page in a new tab...<br><br>Amount: ${customerAmount.toFixed(2)} ${currency}`, true);
        } else {
            showModal(`${currency} payment link created successfully!<br><br>However, no payment URL was found in the response. Check the browser console for details.`, true);
        }
    } catch (error) {
        // Handle error
        console.error('Payment error:', error);
        showModal(`An error occurred with ${currency} payment:<br><br>${error.message || 'Please try again.'}`, false);
    } finally {
        // Re-enable button
        button.disabled = false;
        button.textContent = 'Deposit Now';
    }
}

// Modal functions
function showModal(message, isSuccess = false) {
    // Check if message contains HTML tags
    const isHtml = /<[a-z][\s\S]*>/i.test(message);
    if (isHtml) {
        modalMessage.innerHTML = `<div class="${isSuccess ? 'success-message' : ''}">${message}</div>`;
    } else {
        modalMessage.innerHTML = `<p class="${isSuccess ? 'success-message' : ''}">${message}</p>`;
    }
    modal.classList.add('show');
}

function hideModal() {
    modal.classList.remove('show');
}

// Close modal when clicking the close button
closeModalBtn.addEventListener('click', hideModal);

// Close modal when clicking outside of it
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});

// ==================== HOLDINGS CHART ====================

// Generate mock portfolio data for the past 30 days
function generatePortfolioData() {
    const data = [];
    const days = 30;
    let value = 100000; // Starting value
    
    for (let i = 0; i < days; i++) {
        // Random walk with slight upward trend
        const change = (Math.random() - 0.45) * 3000;
        value += change;
        data.push(value);
    }
    
    return data;
}

// Draw the futuristic chart
function drawHoldingsChart() {
    const canvas = document.getElementById('holdingsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size accounting for device pixel ratio
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Generate data
    const data = generatePortfolioData();
    const minValue = Math.min(...data) * 0.98;
    const maxValue = Math.max(...data) * 1.02;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }
    
    // Draw Y-axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = maxValue - (maxValue - minValue) * (i / 5);
        const y = padding.top + (chartHeight / 5) * i;
        ctx.fillText('$' + (value / 1000).toFixed(0) + 'K', padding.left - 10, y + 4);
    }
    
    // Create gradient for area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(0, 99, 226, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 99, 226, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 99, 226, 0)');
    
    // Draw area under the line
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw the main line (futuristic blue)
    ctx.beginPath();
    ctx.strokeStyle = '#0063E2';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    data.forEach((value, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw data points (last few)
    const pointsToShow = 5;
    for (let i = data.length - pointsToShow; i < data.length; i++) {
        const value = data[i];
        const x = padding.left + (chartWidth / (data.length - 1)) * i;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 99, 226, 0.2)';
        ctx.fill();
        
        // Inner dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#0063E2';
        ctx.fill();
    }
    
    // Draw X-axis labels (dates)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const dateLabels = ['30d ago', '20d', '10d', 'Today'];
    dateLabels.forEach((label, index) => {
        const x = padding.left + (chartWidth / (dateLabels.length - 1)) * index;
        ctx.fillText(label, x, height - padding.bottom + 20);
    });
}

// Initialize chart when page loads
window.addEventListener('load', () => {
    drawHoldingsChart();
});

// Redraw chart on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        drawHoldingsChart();
    }, 250);
});

// ==================== CODE SAMPLES TABS ====================

// Tab switching functionality
const codeTabs = document.querySelectorAll('.code-tab');
const codeBlocks = document.querySelectorAll('.code-block');

codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const currency = tab.getAttribute('data-currency');
        
        // Update active tab
        codeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update visible code block
        codeBlocks.forEach(block => {
            if (block.id === `code-${currency}`) {
                block.classList.add('active');
            } else {
                block.classList.remove('active');
            }
        });
    });
});

// Copy to clipboard functionality
const copyButtons = document.querySelectorAll('.copy-btn');

copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const currency = button.getAttribute('data-currency');
        const codeBlock = document.querySelector(`#code-${currency} code`);
        const code = codeBlock.textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            
            // Visual feedback
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Copied!
            `;
            button.style.background = 'rgba(16, 185, 129, 0.2)';
            button.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                button.style.borderColor = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
            
            // Fallback feedback
            const originalText = button.innerHTML;
            button.innerHTML = '❌ Failed';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }
    });
});
