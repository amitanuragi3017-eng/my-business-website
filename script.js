// Payment Dashboard Application
class PaymentDashboard {
    constructor() {
        this.payments = this.loadPayments();
        this.currentPaymentId = null;
        this.initializeCharts();
        this.initializeEventListeners();
        this.renderPayments();
        this.updateStats();
        this.updateVendorFilter();
    }

    // Load payments from localStorage
    loadPayments() {
        const saved = localStorage.getItem('payments');
        if (!saved) {
            // Sample data
            return [
                {
                    id: '1',
                    vendorName: 'Amazon Web Services',
                    amount: 1250.50,
                    paymentDate: '2024-01-15',
                    dueDate: '2024-01-20',
                    status: 'Completed',
                    paymentMethod: 'Credit Card',
                    invoiceNumber: 'INV-001',
                    description: 'Monthly cloud hosting fee'
                },
                {
                    id: '2',
                    vendorName: 'Digital Ocean',
                    amount: 500.00,
                    paymentDate: '2024-01-10',
                    dueDate: '2024-01-25',
                    status: 'Pending',
                    paymentMethod: 'Bank Transfer',
                    invoiceNumber: 'INV-002',
                    description: 'Droplet hosting'
                },
                {
                    id: '3',
                    vendorName: 'Google Workspace',
                    amount: 300.00,
                    paymentDate: '2024-01-05',
                    dueDate: '2024-01-15',
                    status: 'Processing',
                    paymentMethod: 'PayPal',
                    invoiceNumber: 'INV-003',
                    description: 'Business email subscription'
                }
            ];
        }
        return JSON.parse(saved);
    }

    // Save payments to localStorage
    savePayments() {
        localStorage.setItem('payments', JSON.stringify(this.payments));
    }

    // Initialize charts
    initializeCharts() {
        this.statusChart = new Chart(
            document.getElementById('statusChart'),
            {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Completed', 'Failed', 'Processing'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#ffc107',
                            '#28a745',
                            '#dc3545',
                            '#007bff'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            }
        );

        this.monthlyChart = new Chart(
            document.getElementById('monthlyChart'),
            {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Payments ($)',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: '#4361ee',
                        borderColor: '#3a56d4',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value;
                                }
                            }
                        }
                    }
                }
            }
        );
        this.updateCharts();
    }

    // Update charts with current data
    updateCharts() {
        // Status distribution
        const statusCount = {
            'Pending': 0,
            'Completed': 0,
            'Failed': 0,
            'Processing': 0
        };

        // Monthly totals
        const monthlyTotals = {
            '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0,
            '07': 0, '08': 0, '09': 0, '10': 0, '11': 0, '12': 0
        };

        this.payments.forEach(payment => {
            statusCount[payment.status]++;
            
            const month = payment.paymentDate.split('-')[1];
            if (monthlyTotals.hasOwnProperty(month)) {
                monthlyTotals[month] += payment.amount;
            }
        });

        // Update status chart
        this.statusChart.data.datasets[0].data = [
            statusCount.Pending,
            statusCount.Completed,
            statusCount.Failed,
            statusCount.Processing
        ];
        this.statusChart.update();

        // Update monthly chart (first 6 months)
        this.monthlyChart.data.datasets[0].data = [
            monthlyTotals['01'] || 0,
            monthlyTotals['02'] || 0,
            monthlyTotals['03'] || 0,
            monthlyTotals['04'] || 0,
            monthlyTotals['05'] || 0,
            monthlyTotals['06'] || 0
        ];
        this.monthlyChart.update();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Add payment button
        document.getElementById('addPaymentBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal buttons
        document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Payment form submission
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePayment();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderPayments(e.target.value);
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.renderPayments();
        });

        // Vendor filter
        document.getElementById('vendorFilter').addEventListener('change', (e) => {
            this.renderPayments();
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('vendorFilter').value = '';
            this.renderPayments();
        });

        // Confirmation modal
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deletePayment();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('paymentModal');
            const confirmModal = document.getElementById('confirmModal');
            
            if (e.target === modal) {
                this.closeModal();
            }
            if (e.target === confirmModal) {
                this.closeConfirmModal();
            }
        });
    }

    // Open modal for adding/editing payment
    openModal(paymentId = null) {
        const modal = document.getElementById('paymentModal');
        const form = document.getElementById('paymentForm');
        
        if (paymentId) {
            // Edit mode
            document.getElementById('modalTitle').textContent = 'Edit Payment';
            const payment = this.payments.find(p => p.id === paymentId);
            if (payment) {
                this.currentPaymentId = paymentId;
                document.getElementById('vendorName').value = payment.vendorName;
                document.getElementById('amount').value = payment.amount;
                document.getElementById('paymentDate').value = payment.paymentDate;
                document.getElementById('dueDate').value = payment.dueDate || '';
                document.getElementById('status').value = payment.status;
                document.getElementById('paymentMethod').value = payment.paymentMethod;
                document.getElementById('invoiceNumber').value = payment.invoiceNumber || '';
                document.getElementById('description').value = payment.description || '';
            }
        } else {
            // Add mode
            document.getElementById('modalTitle').textContent = 'Add Payment';
            this.currentPaymentId = null;
            form.reset();
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }

    // Close payment modal
    closeModal() {
        document.getElementById('paymentModal').classList.remove('active');
        document.getElementById('paymentForm').reset();
        this.currentPaymentId = null;
    }

    // Save payment (add or update)
    savePayment() {
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const paymentData = {
            id: this.currentPaymentId || Date.now().toString(),
            vendorName: document.getElementById('vendorName').value.trim(),
            amount: parseFloat(document.getElementById('amount').value),
            paymentDate: document.getElementById('paymentDate').value,
            dueDate: document.getElementById('dueDate').value || null,
            status: document.getElementById('status').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            invoiceNumber: document.getElementById('invoiceNumber').value.trim() || null,
            description: document.getElementById('description').value.trim() || ''
        };

        if (this.currentPaymentId) {
            // Update existing payment
            const index = this.payments.findIndex(p => p.id === this.currentPaymentId);
            if (index !== -1) {
                this.payments[index] = paymentData;
            }
        } else {
            // Add new payment
            this.payments.push(paymentData);
        }

        this.savePayments();
        this.renderPayments();
        this.updateStats();
        this.updateVendorFilter();
        this.updateCharts();
        this.closeModal();
        
        // Show success message
        this.showNotification(
            `Payment ${this.currentPaymentId ? 'updated' : 'added'} successfully!`,
            'success'
        );
    }

    // Open confirmation modal for deletion
    openConfirmModal(paymentId) {
        this.currentPaymentId = paymentId;
        document.getElementById('confirmModal').classList.add('active');
    }

    // Close confirmation modal
    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
        this.currentPaymentId = null;
    }

    // Delete payment
    deletePayment() {
        this.payments = this.payments.filter(p => p.id !== this.currentPaymentId);
        this.savePayments();
        this.renderPayments();
        this.updateStats();
        this.updateVendorFilter();
        this.updateCharts();
        this.closeConfirmModal();
        
        this.showNotification('Payment deleted successfully!', 'success');
    }

    // Render payments table with filtering
    renderPayments(searchTerm = '') {
        const tbody = document.getElementById('paymentsBody');
        const statusFilter = document.getElementById('statusFilter').value;
        const vendorFilter = document.getElementById('vendorFilter').value;
        
        // Filter payments
        let filteredPayments = this.payments.filter(payment => {
            const matchesSearch = searchTerm === '' || 
                payment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (payment.invoiceNumber && payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === '' || payment.status === statusFilter;
            const matchesVendor = vendorFilter === '' || payment.vendorName === vendorFilter;
            
            return matchesSearch && matchesStatus && matchesVendor;
        });

        // Sort by date (newest first)
        filteredPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

        // Clear table
        tbody.innerHTML = '';

        // Populate table
        filteredPayments.forEach(payment => {
            const row = document.createElement('tr');
            
            // Format date
            const formatDate = (dateString) => {
                if (!dateString) return '-';
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            // Format currency
            const formatCurrency = (amount) => {
                return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            };

            row.innerHTML = `
                <td>${payment.vendorName}</td>
                <td><strong>${formatCurrency(payment.amount)}</strong></td>
                <td>${formatDate(payment.paymentDate)}</td>
                <td>${formatDate(payment.dueDate)}</td>
                <td><span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span></td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.invoiceNumber || '-'}</td>
                <td class="actions">
                    <button onclick="dashboard.editPayment('${payment.id}')" class="btn btn-sm btn-secondary">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="dashboard.openConfirmModal('${payment.id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Edit payment
    editPayment(paymentId) {
        this.openModal(paymentId);
    }

    // Update statistics
    updateStats() {
        const totalPayments = this.payments.length;
        const pendingPayments = this.payments.filter(p => p.status === 'Pending').length;
        const completedPayments = this.payments.filter(p => p.status === 'Completed').length;
        const totalAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);

        document.getElementById('totalPayments').textContent = totalPayments;
        document.getElementById('pendingPayments').textContent = pendingPayments;
        document.getElementById('completedPayments').textContent = completedPayments;
        document.getElementById('totalAmount').textContent = '$' + totalAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Update vendor filter dropdown
    updateVendorFilter() {
        const vendorFilter = document.getElementById('vendorFilter');
        const vendors = [...new Set(this.payments.map(p => p.vendorName))];
        
        // Keep current value
        const currentValue = vendorFilter.value;
        
        // Clear options except first
        vendorFilter.innerHTML = '<option value="">All Vendors</option>';
        
        // Add vendor options
        vendors.forEach(vendor => {
            const option = document.createElement('option');
            option.value = vendor;
            option.textContent = vendor;
            vendorFilter.appendChild(option);
        });
        
        // Restore current value if it still exists
        if (vendors.includes(currentValue)) {
            vendorFilter.value = currentValue;
        }
    }

    // Export to CSV
    exportToCSV() {
        const headers = ['Vendor Name', 'Amount', 'Date', 'Due Date', 'Status', 'Payment Method', 'Invoice #', 'Description'];
        const csvData = [
            headers.join(','),
            ...this.payments.map(p => [
                `"${p.vendorName}"`,
                p.amount,
                p.paymentDate,
                p.dueDate || '',
                p.status,
                p.paymentMethod,
                p.invoiceNumber || '',
                `"${p.description || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Data exported to CSV!', 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new PaymentDashboard();
});

// Make dashboard globally accessible
window.dashboard = dashboard;
