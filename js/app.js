(function () {
    'use strict';

    // ----- DATOS DEMO (más de 12 remesas) -----
    const companies = ['Western Union', 'MoneyGram', 'Ria', 'Xoom', 'PayPal', 'Transferwise', 'Remitly', 'WorldRemit', 'Azimo', 'Small World'];

    function randomDate(start, end) {
        const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return d.toISOString().slice(0, 10).replace(/-/g, '');
    }

    let remesas = [];
    for (let i = 1; i <= 15; i++) {
        const id = '0' + String(i).padStart(3, '0') + String(Math.floor(Math.random() * 1000)).padStart(4, '0');
        const company = companies[Math.floor(Math.random() * companies.length)];
        const amount = Math.floor(Math.random() * 5000) + 1000;
        const status = i <= 10 ? 'COBRADO' : (i <= 12 ? 'NO_COBRADO' : (Math.random() > 0.5 ? 'COBRADO' : 'NO_COBRADO'));
        const created_at = randomDate(new Date(2024, 0, 1), new Date(2025, 5, 1));
        let charged_at = '';
        if (status === 'COBRADO') {
            charged_at = randomDate(new Date(2025, 0, 1), new Date(2026, 7, 1));
        }
        remesas.push({ id, company, amount, status, created_at, charged_at });
    }
    let cobradosCount = remesas.filter(remesa => remesa.status === 'COBRADO').length;
    if (cobradosCount < 10) {
        for (let i = 0; i < remesas.length && cobradosCount < 10; i++) {
            if (remesas[i].status === 'NO_COBRADO') {
                remesas[i].status = 'COBRADO';
                remesas[i].charged_at = randomDate(new Date(2025, 0, 1), new Date(2026, 7, 1));
                cobradosCount++;
            }
        }
    }

    // ----- ESTADO DE LA APP -----
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredRemesas = [...remesas];

    // ----- DOM REFS -----
    const tbody = document.getElementById('remesasBody');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const topCobradosList = document.getElementById('topCobradosList');
    const errorContainer = document.getElementById('errorContainer');
    const calcDisplay = document.getElementById('calcDisplay');
    const montoDisplay = document.getElementById('montoDisplay');
    const clearBtn = document.getElementById('clearBtn');
    const cobrarBtn = document.getElementById('cobrarBtn');
    const numButtons = document.querySelectorAll('.num');
    const todaySpan = document.getElementById('todayDate');

    // Fecha actual
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    todaySpan.textContent = now.toLocaleDateString('es-ES', options);

    // ----- FUNCIONES AUXILIARES -----
    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorContainer.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
    }

    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.borderLeftColor = '#22c55e';
        toast.style.color = '#166534';
        toast.style.background = '#dcfce7';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color:#22c55e;"></i> ${message}`;
        errorContainer.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
    }

    function getTopCobrados(lista) {
        const cobrados = lista.filter(remesa => remesa.status === 'COBRADO' && remesa.charged_at);
        cobrados.sort((a, b) => b.charged_at.localeCompare(a.charged_at));
        return cobrados.slice(0, 10);
    }

    function renderTopCobrados() {
        const top = getTopCobrados(filteredRemesas);
        if (top.length === 0) {
            topCobradosList.innerHTML = '<p style="color:#64748b; padding: 8px 0;">No hay remesas cobradas que coincidan.</p>';
            return;
        }
        let html = '';
        top.forEach(remesa => {
            html += `
        <div class="top-item">
          <span>#${remesa.id} ${remesa.company}: $${remesa.amount.toFixed(2)}</span>
        </div>
      `;
        });
        topCobradosList.innerHTML = html;
    }

    function renderTable() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, filteredRemesas.length);
        const pageData = filteredRemesas.slice(start, end);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">No hay remesas que coincidan.</td></tr>`;
        } else {
            let html = '';
            pageData.forEach(remesa => {
                const statusClass = remesa.status === 'COBRADO' ? 'status-cobrado' : 'status-no-cobrado';
                html += `
          <tr>
            <td><strong>${remesa.id}</strong></td>
            <td>${remesa.company}</td>
            <td>$${remesa.amount.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${remesa.status}</span></td>
            <td>${remesa.created_at}</td>
            <td>${remesa.charged_at || '-'}</td>
          </tr>
        `;
            });
            tbody.innerHTML = html;
        }

        const totalPages = Math.ceil(filteredRemesas.length / itemsPerPage) || 1;
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function applySearch() {
        const term = searchInput.value.trim().toLowerCase();
        if (term === '') {
            filteredRemesas = [...remesas];
        } else {
            filteredRemesas = remesas.filter(remesa =>
                remesa.id.toLowerCase().includes(term) ||
                remesa.company.toLowerCase().includes(term) ||
                remesa.amount.toString().includes(term)
            );
        }
        currentPage = 1;
        renderTable();
        renderTopCobrados();
    }

    function changePage(delta) {
        const totalPages = Math.ceil(filteredRemesas.length / itemsPerPage) || 1;
        const newPage = currentPage + delta;
        if (newPage < 1 || newPage > totalPages) return;
        currentPage = newPage;
        renderTable();
    }

    // ----- LÓGICA DE COBRAR (calculadora) -----
    function handleCobrar() {
        const id = calcDisplay.value.trim();
        const montoStr = montoDisplay.value.trim();

        if (!id) {
            showError('Debe ingresar un ID.');
            return;
        }
        if (id.length > 8) {
            showError('El ID no puede tener más de 8 caracteres.');
            return;
        }

        let montoNum = null;
        if (montoStr !== '') {
            let cleaned = montoStr.replace(/,/g, '').replace(/\s/g, '');
            if (!/^-?\d*\.?\d+$/.test(cleaned) && !/^-?\d+$/.test(cleaned)) {
                showError('El monto debe ser un número válido (ej: 12000.50 o 12,000.50).');
                return;
            }
            montoNum = parseFloat(cleaned);
            if (isNaN(montoNum) || montoNum < 0) {
                showError('El monto debe ser un número positivo.');
                return;
            }
        }

        const remesa = remesas.find(remesa => remesa.id === id);
        if (!remesa) {
            showError(`No existe ninguna remesa con ID "${id}".`);
            return;
        }
        if (remesa.status === 'COBRADO') {
            showError(`La remesa ${id} ya fue cobrada el ${remesa.charged_at}.`);
            return;
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        remesa.status = 'COBRADO';
        remesa.charged_at = today;
        if (montoNum !== null) {
            remesa.amount = montoNum;
        }

        calcDisplay.value = '';
        montoDisplay.value = '';

        applySearch();
        showSuccess(`✅ Remesa ${id} cobrada exitosamente.`);
    }

    // ----- EVENTOS -----
    searchBtn.addEventListener('click', applySearch);
    searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') applySearch(); });

    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));

    // ----- CALCULADORA: TECLADO Y BOTONES -----
    function updateDisplay(value) {
        let cleaned = value.replace(/\D/g, '');
        if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
        calcDisplay.value = cleaned;
    }

    calcDisplay.addEventListener('input', function (e) {
        updateDisplay(this.value);
    });

    calcDisplay.addEventListener('keydown', function (e) {
        const key = e.key;
        if (key === 'Backspace' || key === 'Delete' || key === 'Tab' || key === 'Escape' || key === 'Enter') {
            return;
        }
        if (!/^[0-9]$/.test(key)) {
            e.preventDefault();
        }
    });

    numButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const current = calcDisplay.value;
            if (current.length < 8) {
                calcDisplay.value = current + this.dataset.value;
            } else {
                showError('Máximo 8 caracteres.');
            }
        });
    });

    clearBtn.addEventListener('click', function () {
        calcDisplay.value = calcDisplay.value.slice(0, -1);
    });

    cobrarBtn.addEventListener('click', handleCobrar);

    // Inicialización
    function init() {
        renderTable();
        renderTopCobrados();
    }
    init();

})();