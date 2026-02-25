// App State & Configuration
const CONFIG = {
    DAY_PRICE: 59000,
    OVERTIME_PRICE: 5500,
    CURRENCY: 'COP',
    STANDARD_ENTRY: '07:00',
    STANDARD_EXIT: '16:00'
};

let state = {
    currentView: 'dashboard',
    records: JSON.parse(localStorage.getItem('vfinance_records')) || [],
    settings: JSON.parse(localStorage.getItem('vfinance_settings')) || { ...CONFIG }
};

// Selectors
const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');
const navItems = document.querySelectorAll('.nav-item');
const modalOverlay = document.getElementById('modal-container');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    renderView(state.currentView);
    setupEventListeners();
});

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('es-CO', options);
}

function setupEventListeners() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });
}

function switchView(view) {
    state.currentView = view;
    navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === view);
    });
    renderView(view);
}

// Global functions for inline event handlers
window.handleDeleteRecord = (id) => {
    state.records = state.records.filter(r => r.id !== id);
    saveState();
    renderView(state.currentView);
};

window.openAddRecord = (type) => {
    modalOverlay.classList.remove('hidden');
    modalTitle.innerText = type === 'attendance' ? 'Registrar Jornada' : 'Nuevo Movimiento';

    if (type === 'attendance') {
        modalBody.innerHTML = `
            <form id="record-form">
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="form-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Salida Real</label>
                    <input type="time" id="form-exit" value="17:00" required>
                </div>
                <div class="form-group">
                    <label>Horas Extras Manuales (opcional)</label>
                    <input type="number" id="form-manual-extra" placeholder="Autocalculo si dejas 0" value="0">
                </div>
                <button type="submit" class="btn-primary" style="width: 100%">Guardar Día</button>
            </form>
        `;
    } else {
        modalBody.innerHTML = `
            <form id="record-form">
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="form-type">
                        <option value="income">Ingreso Extra</option>
                        <option value="expense">Gasto / Salida</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Concepto</label>
                    <input type="text" id="form-label" placeholder="Ej: Pasajes, Almuerzo" required>
                </div>
                <div class="form-group">
                    <label>Valor (COP)</label>
                    <input type="number" id="form-amount" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%">Guardar Movimiento</button>
            </form>
        `;
    }

    document.getElementById('record-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewRecord(type);
    });
};

function saveNewRecord(type) {
    let record = {
        id: Date.now(),
        date: type === 'attendance' ? document.getElementById('form-date').value : new Date().toISOString().split('T')[0],
        type: type
    };

    if (type === 'attendance') {
        const exitTime = document.getElementById('form-exit').value;
        const manualExtra = parseInt(document.getElementById('form-manual-extra').value) || 0;

        // Logic: Standard is 16:00 (4 PM). If 17:00 (5 PM), it's 1 extra.
        let calculatedExtras = 0;
        if (manualExtra > 0) {
            calculatedExtras = manualExtra;
        } else {
            const [hours, minutes] = exitTime.split(':').map(Number);
            if (hours >= 17) {
                calculatedExtras = hours - 16;
            }
        }

        record.label = 'Jornada Laboral';
        record.income = state.settings.DAY_PRICE;
        record.extras = calculatedExtras;
        record.extraValue = calculatedExtras * state.settings.OVERTIME_PRICE;
        record.amount = record.income + record.extraValue;
        record.category = 'work';
    } else {
        const transType = document.getElementById('form-type').value;
        record.category = transType;
        record.label = document.getElementById('form-label').value;
        record.amount = parseFloat(document.getElementById('form-amount').value);
        if (transType === 'expense') record.amount *= -1;
    }

    state.records.push(record);
    saveState();
    modalOverlay.classList.add('hidden');
    renderView(state.currentView);
}

function saveState() {
    localStorage.setItem('vfinance_records', JSON.stringify(state.records));
    localStorage.setItem('vfinance_settings', JSON.stringify(state.settings));
}

function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}

// View Renders
function renderView(view) {
    viewTitle.innerText = view.charAt(0).toUpperCase() + view.slice(1);

    switch (view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'attendance':
            renderAttendance();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'admin':
            renderAdmin();
            break;
    }
}

function renderDashboard() {
    const totalIncome = state.records.filter(r => r.amount > 0).reduce((acc, r) => acc + r.amount, 0);
    const totalExpense = Math.abs(state.records.filter(r => r.amount < 0).reduce((acc, r) => acc + r.amount, 0));
    const totalExtras = state.records.reduce((acc, r) => acc + (r.extraValue || 0), 0);
    const balance = totalIncome - totalExpense;

    viewContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card income">
                <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
                <div class="stat-value">${formatCurrency(totalIncome)}</div>
                <div class="stat-label">Ingresos Totales</div>
            </div>
            <div class="stat-card overtime">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-value">${formatCurrency(totalExtras)}</div>
                <div class="stat-label">Ganancia Extras</div>
            </div>
            <div class="stat-card expense">
                <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
                <div class="stat-value">${formatCurrency(totalExpense)}</div>
                <div class="stat-label">Salidas / Gastos</div>
            </div>
        </div>

        <div class="table-container">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center;">
                <h3>Resumen Reciente</h3>
                <button class="btn-primary" onclick="openAddRecord('attendance')">Agregar Jornada</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Concepto</th>
                        <th>Extras</th>
                        <th>Valor</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.records.slice(-5).reverse().map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${r.label}</td>
                            <td>${r.extras || 0}h</td>
                            <td style="color: ${r.amount >= 0 ? 'var(--accent-color)' : 'var(--error-color)'}">
                                ${formatCurrency(r.amount)}
                            </td>
                            <td><button onclick="handleDeleteRecord(${r.id})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    `).join('')}
                    ${state.records.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No hay registros aún</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

function renderAttendance() {
    const workRecords = state.records.filter(r => r.type === 'attendance');
    viewContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <p>Control de horas extras según tarifa de ${formatCurrency(state.settings.OVERTIME_PRICE)}/h</p>
            <button class="btn-primary" onclick="openAddRecord('attendance')">+ Registrar Día</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Pago Base</th>
                        <th>Horas Ext.</th>
                        <th>Valor Ext.</th>
                        <th>Total</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${workRecords.reverse().map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${formatCurrency(r.income)}</td>
                            <td>${r.extras}h</td>
                            <td>${formatCurrency(r.extraValue)}</td>
                            <td>${formatCurrency(r.amount)}</td>
                            <td><button onclick="handleDeleteRecord(${r.id})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTransactions() {
    viewContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <p>Historial de todos los movimientos de dinero</p>
            <button class="btn-primary" onclick="openAddRecord('transaction')">+ Nuevo Movimiento</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Concepto</th>
                        <th>Categoría</th>
                        <th>Valor</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.records.slice().reverse().map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${r.label}</td>
                            <td><span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${r.category}</span></td>
                            <td style="color: ${r.amount >= 0 ? 'var(--accent-color)' : 'var(--error-color)'}">
                                ${formatCurrency(r.amount)}
                            </td>
                            <td><button onclick="handleDeleteRecord(${r.id})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdmin() {
    viewContainer.innerHTML = `
        <div class="stat-card" style="max-width: 500px;">
            <h3>Configuración de Tarifas</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Ajusta los precios base para los cálculos mensuales.</p>
            <div class="form-group">
                <label>Precio del Día (COP)</label>
                <input type="number" id="set-day-price" value="${state.settings.DAY_PRICE}">
            </div>
            <div class="form-group">
                <label>Precio Hora Extra (COP)</label>
                <input type="number" id="set-extra-price" value="${state.settings.OVERTIME_PRICE}">
            </div>
            <button class="btn-primary" id="save-settings" style="width: 100%">Guardar Cambios</button>
        </div>
    `;

    document.getElementById('save-settings').addEventListener('click', () => {
        state.settings.DAY_PRICE = parseFloat(document.getElementById('set-day-price').value);
        state.settings.OVERTIME_PRICE = parseFloat(document.getElementById('set-extra-price').value);
        saveState();
        alert('Configuración guardada correctamente');
        renderView('admin');
    });
}
