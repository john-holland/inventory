// Global state
let currentUser = null;
let inventoryItems = [];
let holds = [];
let pendingOffers = [];
let myOffers = [];

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeApp();
});

// Check if user is authenticated
async function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                updateUserDisplay();
            } else {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        } else {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Update user display
function updateUserDisplay() {
    if (currentUser) {
        const userNameElement = document.getElementById('user-name');
        const userBalanceElement = document.getElementById('user-balance');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.username || currentUser.email;
        }
        
        if (userBalanceElement) {
            const totalBalance = (currentUser.availableBalance || 0) + (currentUser.heldBalance || 0);
            userBalanceElement.textContent = `$${totalBalance.toFixed(2)}`;
        }
    }
}

// Show user menu
function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-item" onclick="showUserProfile()">
            <i class="fas fa-user"></i>
            Profile
        </div>
        <div class="user-menu-item" onclick="showUserSettings()">
            <i class="fas fa-cog"></i>
            Settings
        </div>
        <div class="user-menu-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
        </div>
    `;
    
    // Remove existing menu
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Add new menu
    document.body.appendChild(menu);
    
    // Position menu
    const userAvatar = document.querySelector('.user-avatar');
    const rect = userAvatar.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = '20px';
    menu.style.zIndex = '1000';
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !userAvatar.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// User profile function
function showUserProfile() {
    showNotification('User profile coming soon!', 'info');
}

// User settings function
function showUserSettings() {
    showNotification('User settings coming soon!', 'info');
}

function initializeApp() {
    setupTabNavigation();
    setupImageUpload();
    setupAccordion();
    initializeUnitPreferences();
    loadInventory();
    loadHolds();
    loadOffers();
    setupSearch();
}

// Tab Navigation
function setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Image Upload Functionality
function setupImageUpload() {
    const uploadArea = document.getElementById('image-upload');
    const fileInput = document.getElementById('item-images');
    const previewArea = document.getElementById('image-preview');

    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-accent-primary)';
        uploadArea.style.backgroundColor = 'var(--color-bg-secondary)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-border)';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-border)';
        uploadArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        handleImageFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleImageFiles(e.target.files);
    });
}

function handleImageFiles(files) {
    const previewArea = document.getElementById('image-preview');
    previewArea.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-btn" onclick="removeImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewArea.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    const previewItems = document.querySelectorAll('.image-preview-item');
    if (previewItems[index]) {
        previewItems[index].remove();
    }
}

// Accordion Functionality
function setupAccordion() {
    // Auto-open the first section when the Add Item tab is clicked
    const addItemTab = document.querySelector('[data-tab="add-item"]');
    if (addItemTab) {
        addItemTab.addEventListener('click', () => {
            setTimeout(() => {
                const firstSection = document.querySelector('.accordion-section');
                if (firstSection && !firstSection.classList.contains('active')) {
                    toggleAccordion('basic');
                }
            }, 100);
        });
    }
}

function toggleAccordion(sectionName) {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    const allSections = document.querySelectorAll('.accordion-section');
    
    if (!section) return;
    
    // Close all other sections
    allSections.forEach(s => {
        if (s !== section) {
            s.classList.remove('active');
        }
    });
    
    // Toggle current section
    section.classList.toggle('active');
    
    // Auto-open next section if current is closed and there's a next section
    if (!section.classList.contains('active')) {
        const nextSection = section.nextElementSibling;
        if (nextSection && nextSection.classList.contains('accordion-section')) {
            setTimeout(() => {
                toggleAccordion(nextSection.dataset.section);
            }, 300);
        }
    }
}

// Inventory Management
async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE}/inventory/items`);
        const data = await response.json();
        
        if (data.success) {
            inventoryItems = data.data;
            renderInventory();
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Error loading inventory', 'error');
    }
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    if (inventoryItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No items in inventory</h3>
                <p>Add your first item to get started</p>
                <button class="btn btn-primary" onclick="showAddItemModal()">
                    <i class="fas fa-plus"></i>
                    Add Item
                </button>
            </div>
        `;
        return;
    }
    
    inventoryItems.forEach(item => {
        const itemElement = createInventoryItemElement(item);
        grid.appendChild(itemElement);
    });
}

function createInventoryItemElement(item) {
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.innerHTML = `
        <div class="item-image">
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : '<i class="fas fa-image"></i>'}
        </div>
        <div class="item-content">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-description">${item.description}</p>
            <div class="item-meta">
                <span class="item-price">$${item.price.toFixed(2)}</span>
                <span class="item-condition">${item.condition}</span>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewItem(${item.id})">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
    return div;
}

// Add Item Functionality
async function saveItem() {
    const formData = getFormData();
    
    if (!validateForm(formData)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/inventory/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Item saved successfully', 'success');
            resetForm();
            loadInventory();
        } else {
            showNotification(data.message || 'Error saving item', 'error');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
}

// Unit Conversion Functions
const UNIT_CONVERSIONS = {
    // Weight conversions
    kgToLbs: (kg) => kg * 2.20462,
    lbsToKg: (lbs) => lbs / 2.20462,
    
    // Length conversions
    mToInches: (m) => m * 39.3701,
    inchesToM: (inches) => inches / 39.3701,
    
    // Volume conversions (for shipping calculations)
    m3ToFt3: (m3) => m3 * 35.3147,
    ft3ToM3: (ft3) => ft3 / 35.3147
};

// Initialize unit preferences
function initializeUnitPreferences() {
    const metricCheckbox = document.getElementById('use-metric-units');
    if (metricCheckbox) {
        // Load user preference
        loadUserUnitPreference();
        
        // Add event listener for preference changes
        metricCheckbox.addEventListener('change', function() {
            updateUnitLabels();
            saveUserUnitPreference();
        });
    }
}

// Load user's unit preference
async function loadUserUnitPreference() {
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const metricCheckbox = document.getElementById('use-metric-units');
                metricCheckbox.checked = data.user.useMetricUnits;
                updateUnitLabels();
            }
        }
    } catch (error) {
        console.error('Error loading user unit preference:', error);
    }
}

// Save user's unit preference
async function saveUserUnitPreference() {
    const metricCheckbox = document.getElementById('use-metric-units');
    const useMetric = metricCheckbox.checked;
    
    try {
        const response = await fetch(`${API_BASE}/users/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                useMetricUnits: useMetric
            })
        });
        
        if (response.ok) {
            showNotification('Unit preference saved', 'success');
        }
    } catch (error) {
        console.error('Error saving user unit preference:', error);
        showNotification('Error saving unit preference', 'error');
    }
}

// Update form labels based on unit preference
function updateUnitLabels() {
    const metricCheckbox = document.getElementById('use-metric-units');
    const useMetric = metricCheckbox.checked;
    
    // Update weight label
    const weightLabel = document.querySelector('label[for="item-weight"]');
    if (weightLabel) {
        weightLabel.textContent = useMetric ? 'Weight (kg)' : 'Weight (lbs)';
    }
    
    // Update weight input placeholder
    const weightInput = document.getElementById('item-weight');
    if (weightInput) {
        weightInput.placeholder = useMetric ? '0.0' : '0.0';
    }
    
    // Update dimensions label
    const dimensionsLabel = document.querySelector('label[for="item-dimensions"]');
    if (dimensionsLabel) {
        dimensionsLabel.textContent = useMetric ? 'Dimensions (m)' : 'Dimensions (inches)';
    }
    
    // Update dimensions input placeholder
    const dimensionsInput = document.getElementById('item-dimensions');
    if (dimensionsInput) {
        dimensionsInput.placeholder = useMetric ? 'L x W x H meters' : 'L x W x H inches';
    }
}

// Convert form data to imperial units before sending to server
function convertFormDataToImperial(formData) {
    const metricCheckbox = document.getElementById('use-metric-units');
    const useMetric = metricCheckbox.checked;
    
    if (!useMetric) {
        return formData; // Already in imperial units
    }
    
    const convertedData = { ...formData };
    
    // Convert weight from kg to lbs
    if (formData.weight) {
        convertedData.weight = UNIT_CONVERSIONS.kgToLbs(parseFloat(formData.weight));
    }
    
    // Convert dimensions from meters to inches
    if (formData.dimensions) {
        const dimensions = formData.dimensions.split('x').map(d => d.trim());
        if (dimensions.length === 3) {
            const convertedDimensions = dimensions.map(d => 
                UNIT_CONVERSIONS.mToInches(parseFloat(d))
            );
            convertedData.dimensions = convertedDimensions.join(' x ');
        }
    }
    
    return convertedData;
}

// Convert display data from imperial to metric for user display
function convertDisplayDataToMetric(displayData) {
    const metricCheckbox = document.getElementById('use-metric-units');
    const useMetric = metricCheckbox.checked;
    
    if (!useMetric) {
        return displayData; // Keep imperial units
    }
    
    const convertedData = { ...displayData };
    
    // Convert weight from lbs to kg
    if (displayData.weight) {
        convertedData.weight = UNIT_CONVERSIONS.lbsToKg(parseFloat(displayData.weight));
    }
    
    // Convert dimensions from inches to meters
    if (displayData.dimensions) {
        const dimensions = displayData.dimensions.split('x').map(d => d.trim());
        if (dimensions.length === 3) {
            const convertedDimensions = dimensions.map(d => 
                UNIT_CONVERSIONS.inchesToM(parseFloat(d))
            );
            convertedData.dimensions = convertedDimensions.join(' x ');
        }
    }
    
    return convertedData;
}

// Update the getFormData function to handle unit conversion
function getFormData() {
    const formData = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value,
        category: document.getElementById('item-category').value,
        price: parseFloat(document.getElementById('item-price').value) || 0,
        condition: document.getElementById('item-condition').value,
        quantity: parseInt(document.getElementById('item-quantity').value) || 1,
        weight: parseFloat(document.getElementById('item-weight').value) || 0,
        dimensions: document.getElementById('item-dimensions').value,
        shippingCost: parseFloat(document.getElementById('item-shipping').value) || 0,
        images: getImageFiles()
    };
    
    // Convert to imperial units before sending to server
    return convertFormDataToImperial(formData);
}

function getImageFiles() {
    const fileInput = document.getElementById('item-images');
    return Array.from(fileInput.files);
}

function validateForm(data) {
    if (!data.title.trim()) {
        showNotification('Title is required', 'error');
        return false;
    }
    
    if (!data.description.trim()) {
        showNotification('Description is required', 'error');
        return false;
    }
    
    if (!data.category) {
        showNotification('Category is required', 'error');
        return false;
    }
    
    if (data.price <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return false;
    }
    
    if (!data.condition) {
        showNotification('Condition is required', 'error');
        return false;
    }
    
    return true;
}

function resetForm() {
    document.getElementById('item-title').value = '';
    document.getElementById('item-description').value = '';
    document.getElementById('item-category').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-condition').value = '';
    document.getElementById('item-quantity').value = '1';
    document.getElementById('item-weight').value = '';
    document.getElementById('item-dimensions').value = '';
    document.getElementById('item-shipping').value = '';
    document.getElementById('item-images').value = '';
    document.getElementById('image-preview').innerHTML = '';
}

// Holds Management
async function loadHolds() {
    try {
        const response = await fetch(`${API_BASE}/holds`);
        const data = await response.json();
        
        if (data.success) {
            holds = data.data;
            renderHolds();
        }
    } catch (error) {
        console.error('Error loading holds:', error);
        showNotification('Error loading holds', 'error');
    }
}

function renderHolds() {
    const holdsList = document.getElementById('holds-list');
    holdsList.innerHTML = '';
    
    if (holds.length === 0) {
        holdsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hand-holding"></i>
                <h3>No holds found</h3>
                <p>You don't have any items on hold</p>
            </div>
        `;
        return;
    }
    
    holds.forEach(hold => {
        const holdElement = createHoldElement(hold);
        holdsList.appendChild(holdElement);
    });
}

function createHoldElement(hold) {
    const div = document.createElement('div');
    div.className = 'hold-item';
    div.innerHTML = `
        <div class="hold-item-image">
            ${hold.item.imageUrl ? `<img src="${hold.item.imageUrl}" alt="${hold.item.title}">` : '<i class="fas fa-image"></i>'}
        </div>
        <div class="hold-item-content">
            <h3 class="hold-item-title">${hold.item.title}</h3>
            <div class="hold-item-details">
                <span>Amount: $${hold.amount.toFixed(2)}</span>
                <span>Status: ${hold.status}</span>
                <span>Hold Date: ${new Date(hold.holdDate).toLocaleDateString()}</span>
            </div>
        </div>
        <div class="hold-item-actions">
            <button class="btn btn-sm btn-primary" onclick="purchaseItem(${hold.itemId})">
                <i class="fas fa-shopping-cart"></i>
                Purchase
            </button>
            <button class="btn btn-sm btn-secondary" onclick="releaseHold(${hold.id})">
                <i class="fas fa-undo"></i>
                Release
            </button>
        </div>
    `;
    return div;
}

// Purchase Functionality
async function purchaseItem(itemId) {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Populate purchase modal
    document.getElementById('purchase-item-image').src = item.imageUrl || '';
    document.getElementById('purchase-item-title').textContent = item.title;
    document.getElementById('purchase-item-description').textContent = item.description;
    document.getElementById('purchase-item-price').textContent = `$${item.price.toFixed(2)}`;
    document.getElementById('purchase-item-condition').textContent = item.condition;
    document.getElementById('purchase-price').value = item.price;
    
    // Show modal
    showModal('purchase-modal');
}

async function submitPurchase() {
    const price = parseFloat(document.getElementById('purchase-price').value);
    const message = document.getElementById('purchase-message').value;
    const agreement = document.getElementById('purchase-agreement').checked;
    
    if (!agreement) {
        showNotification('You must agree to the terms and conditions', 'error');
        return;
    }
    
    if (price <= 0) {
        showNotification('Please enter a valid offer price', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/purchases/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: currentItemId,
                offerPrice: price,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Purchase offer submitted successfully', 'success');
            closeModal('purchase-modal');
            loadOffers();
        } else {
            showNotification(data.message || 'Error submitting offer', 'error');
        }
    } catch (error) {
        console.error('Error submitting purchase:', error);
        showNotification('Error submitting purchase offer', 'error');
    }
}

// Offers Management
async function loadOffers() {
    try {
        const [pendingResponse, myResponse] = await Promise.all([
            fetch(`${API_BASE}/purchases/pending`),
            fetch(`${API_BASE}/purchases/my-offers`)
        ]);
        
        const pendingData = await pendingResponse.json();
        const myData = await myResponse.json();
        
        if (pendingData.success) {
            pendingOffers = pendingData.data;
            renderPendingOffers();
        }
        
        if (myData.success) {
            myOffers = myData.data;
            renderMyOffers();
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        showNotification('Error loading offers', 'error');
    }
}

function renderPendingOffers() {
    const pendingList = document.getElementById('pending-offers');
    pendingList.innerHTML = '';
    
    if (pendingOffers.length === 0) {
        pendingList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>No pending offers</h3>
                <p>You don't have any pending purchase offers</p>
            </div>
        `;
        return;
    }
    
    pendingOffers.forEach(offer => {
        const offerElement = createOfferElement(offer, 'pending');
        pendingList.appendChild(offerElement);
    });
}

function renderMyOffers() {
    const myList = document.getElementById('my-offers');
    myList.innerHTML = '';
    
    if (myOffers.length === 0) {
        myList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>No offers made</h3>
                <p>You haven't made any purchase offers yet</p>
            </div>
        `;
        return;
    }
    
    myOffers.forEach(offer => {
        const offerElement = createOfferElement(offer, 'my');
        myList.appendChild(offerElement);
    });
}

function createOfferElement(offer, type) {
    const div = document.createElement('div');
    div.className = 'offer-item';
    div.innerHTML = `
        <div class="offer-header">
            <span class="offer-price">$${offer.offerPrice.toFixed(2)}</span>
            <span class="offer-status ${offer.status}">${offer.status}</span>
        </div>
        <div class="offer-details">
            <p><strong>${offer.item.title}</strong></p>
            <p>${offer.message || 'No message'}</p>
            <p><small>Offered on ${new Date(offer.createdAt).toLocaleDateString()}</small></p>
        </div>
        ${type === 'pending' ? `
            <div class="offer-actions">
                <button class="btn btn-sm btn-success" onclick="respondToOffer(${offer.id}, 'accept')">
                    <i class="fas fa-check"></i>
                    Accept
                </button>
                <button class="btn btn-sm btn-danger" onclick="respondToOffer(${offer.id}, 'reject')">
                    <i class="fas fa-times"></i>
                    Reject
                </button>
                <button class="btn btn-sm btn-secondary" onclick="counterOffer(${offer.id})">
                    <i class="fas fa-exchange-alt"></i>
                    Counter
                </button>
            </div>
        ` : ''}
    `;
    return div;
}

async function respondToOffer(offerId, response) {
    try {
        const res = await fetch(`${API_BASE}/purchases/offers/${offerId}/${response}`, {
            method: 'POST'
        });
        
        const data = await res.json();
        
        if (data.success) {
            showNotification(`Offer ${response}ed successfully`, 'success');
            loadOffers();
        } else {
            showNotification(data.message || `Error ${response}ing offer`, 'error');
        }
    } catch (error) {
        console.error(`Error ${response}ing offer:`, error);
        showNotification(`Error ${response}ing offer`, 'error');
    }
}

// Search Functionality
function setupSearch() {
    const searchInput = document.getElementById('inventory-search');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filteredItems = inventoryItems.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    renderFilteredInventory(filteredItems);
}

function renderFilteredInventory(items) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search terms</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemElement = createInventoryItemElement(item);
        grid.appendChild(itemElement);
    });
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function switchToAddItemTab() {
    // Remove 'active' from all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Remove 'active' from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Activate the Add Item tab and nav button
    document.getElementById('add-item').classList.add('active');
    document.querySelector('.nav-btn[data-tab="add-item"]').classList.add('active');
    // Optionally, open the first accordion section
    setTimeout(() => {
        const firstSection = document.querySelector('#add-item .accordion-section');
        if (firstSection && !firstSection.classList.contains('active')) {
            toggleAccordion('basic');
        }
    }, 100);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Investment Pool Functions
async function loadInvestmentPools() {
    try {
        const response = await fetch(`${API_BASE}/investment-pools/users/${currentUser.id}/pools`);
        const data = await response.json();
        
        if (data.success) {
            renderInvestmentPools(data.data);
        }
    } catch (error) {
        console.error('Error loading investment pools:', error);
        showNotification('Error loading investment pools', 'error');
    }
}

function renderInvestmentPools(pools) {
    // This would update the investment cards with real data
    console.log('Investment pools:', pools);
}

// Initialize investment pools when investment tab is shown
document.querySelector('[data-tab="investment"]').addEventListener('click', loadInvestmentPools);

// Near Me Functionality
async function findNearMe() {
    const nearMeBtn = document.getElementById('near-me-btn');
    
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by your browser', 'error');
        return;
    }
    
    // Show loading state
    nearMeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
    nearMeBtn.disabled = true;
    
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Search for items near the user's location
        await searchNearbyItems(latitude, longitude);
        
        // Update button state
        nearMeBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Near Me';
        nearMeBtn.classList.add('active');
        
        showNotification('Found items near your location!', 'success');
        
    } catch (error) {
        console.error('Error getting location:', error);
        showNotification('Unable to get your location. Please check your browser settings.', 'error');
        
        // Reset button state
        nearMeBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Near Me';
        nearMeBtn.disabled = false;
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        });
    });
}

async function searchNearbyItems(latitude, longitude) {
    try {
        const response = await fetch(`${API_BASE}/inventory/items/nearby`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude,
                longitude,
                radius: 50 // 50 mile radius
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Filter inventory to show only nearby items
            inventoryItems = data.data;
            renderInventory();
            
            // Update search input to show it's filtered
            const searchInput = document.getElementById('inventory-search');
            const clearFilterBtn = document.getElementById('clear-filter-btn');
            searchInput.value = 'Nearby items';
            searchInput.disabled = true;
            clearFilterBtn.style.display = 'inline-flex';
            
        } else {
            throw new Error(data.error || 'Failed to find nearby items');
        }
        
    } catch (error) {
        console.error('Error searching nearby items:', error);
        showNotification('Error finding nearby items', 'error');
    }
}

// Clear Near Me filter
function clearNearMeFilter() {
    const nearMeBtn = document.getElementById('near-me-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const searchInput = document.getElementById('inventory-search');
    
    nearMeBtn.classList.remove('active');
    clearFilterBtn.style.display = 'none';
    searchInput.value = '';
    searchInput.disabled = false;
    
    // Reload all inventory
    loadInventory();
    
    showNotification('Filter cleared', 'info');
} 