const STORAGE_KEYS = {
  PROFILES: 'perfis',
  CATEGORIES: 'categorias',
  EXPENSES: 'despesas_' // prefix + mes_ano_perfil1_perfil2
};

// prefixo para categorias específicas de cada par de perfis
const CATEGORY_PREFIX = 'categorias_';
function buildCatKey(p1, p2) {
  return `${CATEGORY_PREFIX}${p1}_${p2}`;
}

function getProfiles() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
}
function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

function getCategories() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '{}');
}
function saveCategories(categories) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

// ---- Categorias por PAR de perfis ----
function getPairCategories(p1, p2) {
  return JSON.parse(localStorage.getItem(buildCatKey(p1, p2)) || '{}');
}
function savePairCategories(p1, p2, categories) {
  localStorage.setItem(buildCatKey(p1, p2), JSON.stringify(categories));
}

function getExpenses(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function saveExpenses(key, expenses) {
  localStorage.setItem(key, JSON.stringify(expenses));
}