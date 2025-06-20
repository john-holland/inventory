// Global state
let currentUser = {
    id: 1,
    name: 'John Doe',
    balance: 1250.00
};

let inventoryItems = [];
let holds = [];
let pendingOffers = [];
let myOffers = [];

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabNavigation();
    setupImageUpload();
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

function getFormData() {
    return {
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

function showAddItemModal() {
    showModal('add-item-modal');
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