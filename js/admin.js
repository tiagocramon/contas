document.addEventListener('DOMContentLoaded', () => {
    let profiles = getProfiles();
    let pairA   = profiles[0] || '';
    let pairB   = profiles[1] || '';
    let categories = getPairCategories(pairA, pairB);
  
    /* ---------- DOM refs ---------- */
    const profilesList     = document.getElementById('profiles-list');
    const newProfileInput  = document.getElementById('new-profile-name');
    const addProfileBtn    = document.getElementById('add-profile-btn');
  
    const categoriesList   = document.getElementById('categories-list');
    const newCategoryInput = document.getElementById('new-category-name');
    const addCategoryBtn   = document.getElementById('add-category-btn');
  
    const categorySettingsSection = document.getElementById('category-settings');
    const categoryTitle   = document.getElementById('category-title');
    const percentInputs   = document.getElementById('percent-inputs');
    const saveCategoryBtn = document.getElementById('save-category-btn');
  
    /* seletor de par */
    const pairContainer = document.getElementById('pair-container');
    const selA = document.getElementById('pair-a');
    const selB = document.getElementById('pair-b');
  
    /* modal rename (mesmo padrão da Home) */
    const renameModal   = document.getElementById('rename-modal');   // overlay (.modal)
    const renameInput   = document.getElementById('rename-input');
    const renameCancel  = document.getElementById('rename-cancel');
    const renameConfirm = document.getElementById('rename-confirm');
    let   renameTarget  = null;
  
    renameCancel.onclick = () => renameModal.style.display = 'none';
    renameConfirm.onclick = () => {
      const novo = renameInput.value.trim();
      if (!novo) return;
      if (novo !== renameTarget && categories[novo]) {
        alert('Já existe categoria com esse nome.');
        return;
      }
      categories[novo] = categories[renameTarget];
      delete categories[renameTarget];
      savePairCategories(pairA, pairB, categories);
      renameModal.style.display = 'none';
      renderCategories();
    };
  
    /* -------- helpers de par -------- */
    function updateSelBOptions() {
      selB.innerHTML = profiles
        .filter(p => p !== selA.value)
        .map(p => `<option>${p}</option>`)
        .join('');
      if (![...selB.options].some(o => o.value === pairB)) {
        pairB = selB.options[0]?.value || '';
      }
      selB.value = pairB;
    }
  
    function populatePairSelects() {
      selA.innerHTML = profiles.map(p => `<option>${p}</option>`).join('');
      selA.value = pairA;
      updateSelBOptions();
    }
  
    function onPairChange() {
      pairA = selA.value;
      pairB = selB.value;
      if (pairA === pairB) {
        categoriesList.innerHTML = '<em>Escolha perfis diferentes.</em>';
        categories = {};
        return;
      }
      categories = getPairCategories(pairA, pairB);
      renderCategories();
    }
  
    /* inicializa seletor de par */
    pairContainer.style.display = 'block';
    populatePairSelects();
    selA.addEventListener('change', () => { pairA = selA.value; updateSelBOptions(); onPairChange(); });
    selB.addEventListener('change', () => { pairB = selB.value; onPairChange(); });
  
    /* -------- render perfis -------- */
    function renderProfiles() {
      profilesList.innerHTML = '';
      profiles.slice().sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(name => {
        const div = document.createElement('div');
        div.textContent = name;
  
        const del = document.createElement('button');
        del.textContent = '✖';
        del.style.marginLeft = '8px';
        del.onclick = () => {
          if (!confirm(`Remover o perfil “${name}”?\nIsso apagará as porcentagens dele neste par.`)) return;
          profiles = profiles.filter(p => p !== name);
          saveProfiles(profiles);
          Object.keys(categories).forEach(cat => delete categories[cat][name]);
          savePairCategories(pairA, pairB, categories);
          renderProfiles();
          renderCategories();
          populatePairSelects();
          updateSelBOptions();
        };
  
        div.appendChild(del);
        profilesList.appendChild(div);
      });
    }
  
    function addProfile() {
      const name = newProfileInput.value.trim();
      if (!name || profiles.includes(name)) return;
      profiles.push(name);
      profiles.sort((a,b)=>a.localeCompare(b,'pt-BR'));
      saveProfiles(profiles);
      newProfileInput.value = '';
      renderProfiles();
      renderCategories();
      populatePairSelects();
    }
  
    /* -------- render categorias -------- */
    function renderCategories() {
      categoriesList.innerHTML = '';
      if (pairA === pairB) {
        categoriesList.innerHTML = '<em>Escolha perfis diferentes no topo.</em>';
        return;
      }
      Object.keys(categories).sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(catName => {
        const div = document.createElement('div');
        div.textContent = catName;
  
        const cfg = document.createElement('button');
        cfg.textContent = 'Configurar %';
        cfg.style.marginLeft = '8px';
        cfg.onclick = () => openCategorySettings(catName);
  
        const edt = document.createElement('button');
        edt.textContent = '✎';
        edt.style.marginLeft = '4px';
        edt.onclick = () => {
          renameTarget = catName;
          renameInput.value = catName;
          renameModal.style.display = 'flex';           // abre modal
        };
  
        const del = document.createElement('button');
        del.textContent = '✖';
        del.style.marginLeft = '4px';
        del.onclick = () => {
          if (!confirm(`Excluir a categoria “${catName}” deste par?`)) return;
          delete categories[catName];
          savePairCategories(pairA, pairB, categories);
          renderCategories();
        };
  
        div.appendChild(cfg);
        div.appendChild(edt);
        div.appendChild(del);
        categoriesList.appendChild(div);
      });
    }
  
    function addCategory() {
      const name = newCategoryInput.value.trim();
      if (!name || categories[name]) return;
      categories[name] = {};
      [pairA, pairB].forEach(p => { if (p) categories[name][p] = 0; });
      savePairCategories(pairA, pairB, categories);
      newCategoryInput.value = '';
      renderCategories();
    }
  
    function openCategorySettings(catName) {
      categorySettingsSection.style.display = '';
      categoryTitle.textContent = `Configurar % - ${catName}`;
      percentInputs.innerHTML = '';
      [pairA, pairB].forEach(p => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.textContent = p;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0; input.max = 100;
        input.value = categories[catName][p] || 0;
        input.dataset.profile = p;
        label.appendChild(input);
        percentInputs.appendChild(label);
      });
      saveCategoryBtn.onclick = () => {
        const inputs = percentInputs.querySelectorAll('input');
        categories[catName] = {};
        inputs.forEach(inp => categories[catName][inp.dataset.profile] = Number(inp.value));
        savePairCategories(pairA, pairB, categories);
        categorySettingsSection.style.display = 'none';
        renderCategories();
      };
    }
  
    /* -------- eventos globais -------- */
    addProfileBtn.addEventListener('click', addProfile);
    addCategoryBtn.addEventListener('click', addCategory);
  
    /* ---------- inicial ---------- */
    onPairChange();      // carrega categorias do par
    renderProfiles();
    renderCategories();
  });