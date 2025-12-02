// Hello Clever API Configuration
const HELLO_CLEVER_CONFIG = {
    BWP: {
        apiUrl: 'https://api.cleverhub.co/api/v3/payin_links',
        appId: 'app-41a60377ba920919939d83326ebee5a1',
        secretKey: 'AK_SANDBOX_7ca82727d0aa264cd913415f01034e7d0f7bc2e147390fe369aa37bd03603f2e'
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
        description: "Forex Account Deposit - Sandra Lin",
        sender_info: {
            email: "sandra.lin@gmail.com",
            first_name: "Sandra",
            last_name: "Lin",
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
function validateAmount(inputElement, errorElement) {
    const amount = parseFloat(inputElement.value);
    
    if (!inputElement.value || inputElement.value.trim() === '') {
        showAmountError(inputElement, errorElement, 'Please enter amount');
        return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showAmountError(inputElement, errorElement, 'Amount must be > 0');
        return false;
    }
    
    if (amount > 1000000) {
        showAmountError(inputElement, errorElement, 'Max: 1,000,000');
        return false;
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
    
    // Validate amount first
    if (!validateAmount(amountInput, errorElement)) {
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
