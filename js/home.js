// js/home.js
document.addEventListener('DOMContentLoaded', () => {
  // referências de storage
  const storage = {
    profiles: getProfiles(),
    categories: {}, // será carregado por par em onDateChange
    keyFor(year, month, p1, p2) {
      const m = String(month).padStart(2, '0');
      return `${STORAGE_KEYS.EXPENSES}${year}-${m}_${p1}_${p2}`;
    },
    getExpenses(year, month, p1, p2) {
      return getExpenses(this.keyFor(year, month, p1, p2));
    },
    saveExpenses(year, month, p1, p2, expenses) {
      saveExpenses(this.keyFor(year, month, p1, p2), expenses);
    }
  };

  // elementos
  const app = document.getElementById('app');
  const modal = createModal();
  document.body.appendChild(modal.overlay);

  // estado
  let currentYear, currentMonth;
  let pair; // [perfil1, perfil2]
  let expenses = [];
  let editIndex = null; // índice da despesa sendo editada (ou null)

  // referências dos selects de perfis (definidas em buildHeader)
  let selP1, selP2;

  // util para somar meses e devolver novo ano/mês
  function addMonths(year, month, add) {
    month = month - 1 + add;        // zero‑based interno
    year += Math.floor(month / 12);
    month = (month % 12 + 12) % 12; // garante positivo
    return { y: year, m: month + 1 }; // devolve 1‑based mês
  }

  function init() {
    buildHeader();        // monta controles de mês/ano e navegação
    pickDateAndPair();    // define valores iniciais e carrega despesas
    updateCurrentMonthDisplay();
    render();             // desenha colunas e totais
  }

  // garante que o segundo dropdown não mostre o perfil já escolhido no primeiro
  function updateSelP2Options() {
    if (!selP1 || !selP2) return;
    const selectedA = selP1.value;
    selP2.innerHTML = storage.profiles
      .filter(p => p !== selectedA)
      .map(p => `<option>${p}</option>`)
      .join('');
    // se o valor atual ficou inválido, escolhe o primeiro disponível
    if (![...selP2.options].some(o => o.value === selP2.value)) {
      selP2.value = selP2.options[0]?.value || '';
    }
  }

  function buildHeader() {
    const header = document.createElement('div');
    header.className = 'home-header';
    header.style.marginBottom = '16px';

    header.innerHTML = `
      <div class="month-nav" style="display:flex; align-items:center; margin-bottom:8px;">
        <button id="prev-month">❮</button>
        <h2 id="current-month" style="margin:0 12px;">—</h2>
        <button id="next-month">❯</button>
      </div>
      <div class="controls" style="display:flex; align-items:center; gap:8px;">
        <label>Ano:<input type="number" id="sel-year" min="2000" style="width:70px"></label>
        <label>Mês:
          <select id="sel-month">
            ${[...Array(12)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
        </label>
        <label>De
          <select id="sel-p1">${storage.profiles.map(p=>`<option>${p}</option>`).join('')}</select>
        </label>
        <label>a
          <select id="sel-p2">${storage.profiles.map(p=>`<option>${p}</option>`).join('')}</select>
        </label>
        <button id="btn-load">Carregar</button>
      </div>
    `;

    app.appendChild(header);

    // guarda referências globais
    selP1 = document.getElementById('sel-p1');
    selP2 = document.getElementById('sel-p2');

    // popula B sem o valor A e atualiza quando A mudar
    updateSelP2Options();
    selP1.addEventListener('change', updateSelP2Options);

    // eventos de navegação
    document.getElementById('prev-month').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
      onDateChange();
    });
    document.getElementById('next-month').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
      onDateChange();
    });
  }

  function updateCurrentMonthDisplay() {
    const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('current-month').innerText =
      `${names[currentMonth-1]} de ${currentYear}`;
    document.getElementById('sel-year').value = currentYear;
    document.getElementById('sel-month').value = currentMonth;
  }

  // --- CARREGA MÊS/ANO E PAR DE PERFIS ---
  function pickDateAndPair() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1;
    // Par padrão: Tiago × Carol, se ambos existirem; caso contrário, usa os dois primeiros perfis salvos
    if (storage.profiles.includes('Tiago') && storage.profiles.includes('Carol')) {
      pair = ['Tiago', 'Carol'];
    } else {
      pair = [storage.profiles[0], storage.profiles[1] || storage.profiles[0]];
    }

    document.getElementById('sel-year').value = currentYear;
    document.getElementById('sel-month').value = currentMonth;
    document.getElementById('sel-p1').value = pair[0];
    updateSelP2Options();
    document.getElementById('sel-p2').value = pair[1];

    document.getElementById('btn-load').addEventListener('click', () => {
      const y = Number(document.getElementById('sel-year').value);
      const m = Number(document.getElementById('sel-month').value);
      const p1 = document.getElementById('sel-p1').value;
      const p2 = document.getElementById('sel-p2').value;
      if (p1 === p2) return alert('Escolha perfis diferentes');
      currentYear = y;
      currentMonth = m;
      pair = [p1, p2];
      onDateChange();
    });

    onDateChange();
  }

  function onDateChange() {
    loadExpenses();
    storage.categories = getPairCategories(pair[0], pair[1]);
    updateCurrentMonthDisplay();
    render();
  }

  // --- RENDER PRINCIPAL ---
  function render() {
    // remove tudo que não é o cabeçalho principal, mas mantém seus elementos internos
    Array.from(app.children).forEach(child => {
      if (!child.classList.contains('home-header')) {
        child.remove();
      }
    });
    if (!pair) return;

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '16px';

    pair.forEach((p, idx) => {
      const col = document.createElement('div');
      col.style.flex = '1';
      col.innerHTML = `<h3>${p}</h3><div id="list-${idx}"></div>`;
      const btn = document.createElement('button');
      btn.textContent = '[ + ]';
      btn.onclick = () => openAddModal(p);
      col.appendChild(btn);
      container.appendChild(col);
    });

    const footer = document.createElement('div');
    footer.style.marginTop = '24px';
    container.appendChild(footer);
    app.appendChild(container);

    updateLists();
    updateFooter(footer);
  }

  function updateLists() {
    pair.forEach((p, idxCol) => {
      const list = document.getElementById(`list-${idxCol}`);
      list.innerHTML = '';
      expenses.forEach((e, iExp) => {
        if (e.quemPagou !== p) return;
        const catObj = storage.categories[e.categoria] || {};
        const perc = (catObj[p] ?? 0) / 100;
        const valor = (e.valorTotal * perc).toFixed(2);

        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        const spanText = document.createElement('span');
        spanText.textContent = `${e.categoria}: R$ ${valor}`;
        div.appendChild(spanText);

        const actions = document.createElement('span');

        // editar
        const btnEdit = document.createElement('button');
        btnEdit.textContent = '✏️';
        btnEdit.style.marginRight = '4px';
        btnEdit.onclick = () => openEditModal(iExp);
        actions.appendChild(btnEdit);

        // excluir
        const btnDel = document.createElement('button');
        btnDel.textContent = '🗑️';
        btnDel.onclick = () => deleteExpense(iExp);
        actions.appendChild(btnDel);

        div.appendChild(actions);
        list.appendChild(div);
      });
    });
  }
  function openEditModal(idx) {
    editIndex = idx;
    const exp = expenses[idx];
    modal.currentPayer = exp.quemPagou;
    // Desativa campo de parcelas durante edição
    const parcInput = modal.overlay.querySelector('#modal-parc');
    parcInput.disabled = true;
    parcInput.value = 1;
    modal.overlay.querySelector('#modal-prev').textContent = ''; // limpa preview

    const sel = modal.overlay.querySelector('#modal-cat');
    sel.innerHTML = Object.keys(storage.categories).map(c=>`<option>${c}</option>`).join('');
    sel.value = exp.categoria;

    modal.overlay.querySelector('#modal-val').value = exp.valorTotal;
    modal.overlay.style.display = 'flex';
  }

  function deleteExpense(idx) {
    if (!confirm('Excluir esta despesa?')) return;
    expenses.splice(idx, 1);
    storage.saveExpenses(currentYear, currentMonth, pair[0], pair[1], expenses);
    render();
  }

  // --- MODAL DE INCLUSÃO ---
  function createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.display = 'none';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const form = document.createElement('form');
    form.innerHTML = `
      <h4>Nova despesa</h4>
      <label>Categoria:
        <select id="modal-cat">
          ${Object.keys(storage.categories).map(c => `<option>${c}</option>`).join('')}
        </select>
      </label>
      <label style="display:block; margin-top:8px">
        Valor total: R$ <input type="number" id="modal-val" step="0.01" required>
      </label>
      <label style="display:block; margin-top:8px">
        Parcelas: <input type="number" id="modal-parc" min="1" value="1" style="width:60px">
        <span id="modal-prev" style="font-size:0.85em; margin-left:4px;"></span>
      </label>
      <div style="margin-top:12px; text-align:right">
        <button type="button" id="modal-cancel">Cancelar</button>
        <button type="submit">OK</button>
      </div>
    `;

    // atualiza preview de parcela
    function updatePreview() {
      const total = parseFloat(document.getElementById('modal-val').value) || 0;
      const parc  = parseInt(document.getElementById('modal-parc').value) || 1;
      const each  = parc ? (total / parc).toFixed(2) : '0.00';
      document.getElementById('modal-prev').textContent =
        parc > 1 ? `≈ R$ ${each} / mês` : '';
    }
    form.addEventListener('input', updatePreview);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const categoria = document.getElementById('modal-cat').value;
      const valorTotal = parseFloat(document.getElementById('modal-val').value);
      const quemPagou = modal.currentPayer;
      const parcelas = parseInt(document.getElementById('modal-parc').value) || 1;

      if (editIndex !== null || parcelas === 1) {
        // caso edição ou sem parcelas, mantém lógica antiga
        if (editIndex !== null) {
          expenses[editIndex] = { quemPagou, categoria, valorTotal };
          editIndex = null;
        } else {
          expenses.push({ quemPagou, categoria, valorTotal });
        }
        storage.saveExpenses(currentYear, currentMonth, pair[0], pair[1], expenses);
      } else {
        // lançar em vários meses
        const base = Math.round((valorTotal / parcelas) * 100) / 100;
        let acumulado = 0;
        for (let i = 0; i < parcelas; i++) {
          let val = base;
          if (i === parcelas - 1) { // ajusta centavos da última
            val = Math.round((valorTotal - acumulado) * 100) / 100;
          }
          const { y, m } = addMonths(currentYear, currentMonth, i);
          const arr = storage.getExpenses(y, m, pair[0], pair[1]);
          arr.push({ quemPagou, categoria, valorTotal: val });
          storage.saveExpenses(y, m, pair[0], pair[1], arr);
          acumulado += val;
        }
      }
      closeModal();
      onDateChange(); // recarrega mês atual
    });
    content.appendChild(form);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
    updatePreview(); // agora que o overlay está no DOM, ids existem
    overlay.querySelector('#modal-cancel').onclick = closeModal;

    return { overlay, currentPayer: null };
  }

  function openAddModal(payer) {
    modal.currentPayer = payer;
    const sel = modal.overlay.querySelector('#modal-cat');
    sel.innerHTML = Object.keys(storage.categories).map(c=>`<option>${c}</option>`).join('');
    // garante que campo parcelas esteja habilitado para nova inclusão
    const parcInput = modal.overlay.querySelector('#modal-parc');
    parcInput.disabled = false;
    modal.overlay.querySelector('#modal-prev').textContent = '';
    modal.overlay.style.display = 'flex';
  }
  function closeModal() {
    modal.overlay.style.display = 'none';
    const form = modal.overlay.querySelector('form');
    if (form) form.reset();
    // reabilita campo parcelas
    const parcInput = modal.overlay.querySelector('#modal-parc');
    parcInput.disabled = false;
    modal.overlay.querySelector('#modal-prev').textContent = '';
    editIndex = null;
  }

  function addExpense(exp) {
    expenses.push(exp);
    storage.saveExpenses(currentYear, currentMonth, pair[0], pair[1], expenses);
    render();
  }

  function loadExpenses() {
    expenses = storage.getExpenses(currentYear, currentMonth, pair[0], pair[1]);
  }

  function updateFooter(footerEl) {
    const totals = {};
    pair.forEach(p => {
      totals[p] = expenses
        .filter(e => e.quemPagou === p)
        .reduce((sum, e) => {
          const catObj = storage.categories[e.categoria] || {};
          const percent = (catObj[p] ?? 0) / 100;
          return sum + e.valorTotal * percent;
        }, 0);
    });
    const [p1, p2] = pair;
    const diff = totals[p2] - totals[p1];
    let txt;
    if (diff > 0) txt = `${p2} deve pagar R$ ${diff.toFixed(2)} para ${p1}`;
    else if (diff < 0) txt = `${p1} deve pagar R$ ${Math.abs(diff).toFixed(2)} para ${p2}`;
    else txt = `Valores iguais — sem pagamentos pendentes.`;
    footerEl.innerHTML = `
      <div><strong>Total ${p1}:</strong> R$ ${totals[p1].toFixed(2)}</div>
      <div><strong>Total ${p2}:</strong> R$ ${totals[p2].toFixed(2)}</div>
      <div style="margin-top:8px"><em>${txt}</em></div>
    `;
  }
  init(); // dispara a interface
});