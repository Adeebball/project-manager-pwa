const DB_NAME = 'SuperProjectManagerDB';
const DB_VERSION = 3;
let db;

const state = {
  activeTab: 'projects',
  editingItem: null,
};

const tabs = ['projects', 'clients', 'employees', 'budget'];

// فتح قاعدة البيانات وإنشاء objectStores إذا غير موجودة
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        tasksStore.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('clients')) {
        db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('employees')) {
        db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('accounts')) {
        const accountsStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
        accountsStore.createIndex('projectId', 'projectId', { unique: false });
        accountsStore.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };
    request.onerror = () => reject('فشل فتح قاعدة البيانات');
  });
}

// دوال CRUD عامة
function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(`خطأ في جلب البيانات من ${storeName}`);
  });
}

function addData(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(`خطأ في الإضافة إلى ${storeName}`);
  });
}

function updateData(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(`خطأ في التحديث في ${storeName}`);
  });
}

function deleteData(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(`خطأ في الحذف من ${storeName}`);
  });
}

// واجهة تبويبات
function switchTab(tab) {
  if (!tabs.includes(tab)) return;
  state.activeTab = tab;
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab${capitalize(t)}`);
    const tabContent = document.getElementById(`${t}Tab`);
    if (t === tab) {
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      tabContent.classList.add('active');
    } else {
      tabBtn.classList.remove('active');
      tabBtn.setAttribute('aria-selected', 'false');
      tabContent.classList.remove('active');
    }
  });
  refreshCurrentTab();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// عرض البيانات حسب التبويب
async function refreshCurrentTab() {
  switch(state.activeTab) {
    case 'projects':
      await loadProjects();
      break;
    case 'clients':
      await loadClients();
      break;
    case 'employees':
      await loadEmployees();
      break;
    case 'budget':
      await loadBudget();
      break;
  }
}

// مشاريع
async function loadProjects() {
  const projects = await getAll('projects');
  const list = document.getElementById('projectsList');
  list.innerHTML = '';
  if (projects.length === 0) {
    list.innerHTML = '<li>لا توجد مشاريع حتى الآن.</li>';
    return;
  }
  projects.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.tabIndex = 0;
    li.addEventListener('click', () => openProjectDetails(p));
    list.appendChild(li);
  });
}

// فتح تفاصيل المشروع - الآن مؤقتاً مجرد alert
function openProjectDetails(project) {
  alert(`فتح مشروع: ${project.name}\n\nميزة إدارة المشروع لم تُفعّل بعد.`);
  // يمكن تطوير صفحة داخلية أو نافذة منبثقة لإدارة المهام والحسابات لكل مشروع
}

// عملاء
async function loadClients() {
  const clients = await getAll('clients');
  const list = document.getElementById('clientsList');
  list.innerHTML = '';
  if (clients.length === 0) {
    list.innerHTML = '<li>لا يوجد عملاء حتى الآن.</li>';
    return;
  }
  clients.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.name} - ${c.contact || ''}`;
    li.tabIndex = 0;
    list.appendChild(li);
  });
}

// موظفين
async function loadEmployees() {
  const employees = await getAll('employees');
  const list = document.getElementById('employeesList');
  list.innerHTML = '';
  if (employees.length === 0) {
    list.innerHTML = '<li>لا يوجد موظفين حتى الآن.</li>';
    return;
  }
  employees.forEach(emp => {
    const li = document.createElement('li');
    li.textContent = `${emp.name} - ${emp.position || ''}`;
    li.tabIndex = 0;
    list.appendChild(li);
  });
}

// الميزانية والحسابات
async function loadBudget() {
  const budgets = await getAll('budgets');
  const accounts = await getAll('accounts');
  const summaryDiv = document.getElementById('budgetSummary');
  const accountsList = document.getElementById('accountsList');

  if (budgets.length === 0) {
    summaryDiv.textContent = 'لا توجد ميزانية محددة حالياً.';
  } else {
    const budget = budgets[budgets.length -1]; // آخر ميزانية
    summaryDiv.innerHTML = `
      <div>الميزانية: ${budget.amount.toFixed(2)} ريال</div>
      <div>الوصف: ${budget.description || 'بدون وصف'}</div>
    `;
  }

  if (accounts.length === 0) {
    accountsList.innerHTML = '<li>لا توجد حركات مالية مسجلة.</li>';
  } else {
    let totalIncome = 0;
    let totalExpense = 0;
    accountsList.innerHTML = '';
    accounts.forEach(acc => {
      const li = document.createElement('li');
      li.textContent = `${acc.type === 'income' ? 'إيراد' : 'مصروف'}: ${acc.amount.toFixed(2)} - التصنيف: ${acc.category || 'عام'} - التاريخ: ${acc.date}`;
      accountsList.appendChild(li);
      if (acc.type === 'income') totalIncome += acc.amount;
      else if (acc.type === 'expense') totalExpense += acc.amount;
    });
    const profit = totalIncome - totalExpense;
    summaryDiv.innerHTML += `
      <div>الإيرادات الكلية: ${totalIncome.toFixed(2)} ريال</div>
      <div>النفقات الكلية: ${totalExpense.toFixed(2)} ريال</div>
      <div>صافي الأرباح: ${profit.toFixed(2)} ريال</div>
    `;
  }
}

// فتح النموذج (مودال) حسب نوع البيانات
function openModal(title, fields, submitCallback, initialData = {}) {
  const modal = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  modalTitle.textContent = title;
  modalForm.innerHTML = '';

  fields.forEach(field => {
    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
    } else if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
    }
    input.id = field.id;
    input.name = field.id;
    input.placeholder = field.placeholder || '';
    input.required = !!field.required;
    input.value = initialData[field.id] || '';
    modalForm.appendChild(input);
  });

  modal.classList.remove('hidden');

  // التعامل مع إلغاء النموذج
  const cancelBtn = document.getElementById('modalCancel');
  const submitBtn = document.getElementById('modalSubmit');

  function closeModal() {
    modal.classList.add('hidden');
    modalForm.onsubmit = null;
    cancelBtn.removeEventListener('click', cancelHandler);
    submitBtn.removeEventListener('click', submitHandler);
  }

  function cancelHandler(e) {
    e.preventDefault();
    closeModal();
  }
  cancelBtn.addEventListener('click', cancelHandler);

  function submitHandler(e) {
    e.preventDefault();
    const formData = {};
    Array.from(modalForm.elements).forEach(el => {
      if (el.name) formData[el.name] = el.value.trim();
    });
    submitCallback(formData);
    closeModal();
  }
  submitBtn.addEventListener('click', submitHandler);

  modalForm.onsubmit = (e) => {
    e.preventDefault();
    submitHandler(e);
  };
}

// التعامل مع الأزرار لفتح النماذج حسب التبويب
document.getElementById('btnAddProject').addEventListener('click', () => {
  openModal('إنشاء مشروع جديد', [
    { id: 'name', placeholder: 'اسم المشروع', required: true },
    { id: 'description', placeholder: 'وصف المشروع', type: 'textarea' }
  ], async (data) => {
    if (!data.name) return alert('الاسم مطلوب');
    await addData('projects', {
      name: data.name,
      description: data.description,
      startDate: new Date().toISOString(),
      status: 'active'
    });
    await refreshCurrentTab();
  });
});

document.getElementById('btnAddClient').addEventListener('click', () => {
  openModal('إضافة عميل جديد', [
    { id: 'name', placeholder: 'اسم العميل', required: true },
    { id: 'contact', placeholder: 'معلومات التواصل' },
    { id: 'notes', placeholder: 'ملاحظات', type: 'textarea' }
  ], async (data) => {
    if (!data.name) return alert('الاسم مطلوب');
    await addData('clients', {
      name: data.name,
      contact: data.contact,
      notes: data.notes,
    });
    await refreshCurrentTab();
  });
});

document.getElementById('btnAddEmployee').addEventListener('click', () => {
  openModal('إضافة موظف جديد', [
    { id: 'name', placeholder: 'اسم الموظف', required: true },
    { id: 'position', placeholder: 'المسمى الوظيفي' },
    { id: 'contact', placeholder: 'معلومات التواصل' },
    { id: 'notes', placeholder: 'ملاحظات', type: 'textarea' }
  ], async (data) => {
    if (!data.name) return alert('الاسم مطلوب');
    await addData('employees', {
      name: data.name,
      position: data.position,
      contact: data.contact,
      notes: data.notes,
    });
    await refreshCurrentTab();
  });
});

document.getElementById('btnAddBudget').addEventListener('click', () => {
  openModal('تعيين ميزانية جديدة', [
    { id: 'amount', placeholder: 'المبلغ', required: true, type: 'number' },
    { id: 'description', placeholder: 'وصف الميزانية', type: 'textarea' }
  ], async (data) => {
    if (!data.amount || isNaN(data.amount)) return alert('المبلغ مطلوب ورقمي');
    await addData('budgets', {
      amount: parseFloat(data.amount),
      description: data.description,
      date: new Date().toISOString(),
    });
    await refreshCurrentTab();
  });
});

document.getElementById('btnAddAccount').addEventListener('click', () => {
  openModal('إضافة حركة مالية', [
    { id: 'type', placeholder: 'نوع الحركة', required: true, type: 'select', options: [
      { value: 'income', label: 'إيراد' },
      { value: 'expense', label: 'مصروف' },
    ]},
    { id: 'amount', placeholder: 'المبلغ', required: true, type: 'number' },
    { id: 'category', placeholder: 'التصنيف' },
    { id: 'date', placeholder: 'التاريخ', required: true, type: 'date' },
    { id: 'notes', placeholder: 'ملاحظات', type: 'textarea' },
  ], async (data) => {
    if (!data.amount || isNaN(data.amount)) return alert('المبلغ مطلوب ورقمي');
    if (!data.date) return alert('التاريخ مطلوب');
    await addData('accounts', {
      type: data.type,
      amount: parseFloat(data.amount),
      category: data.category,
      date: data.date,
      notes: data.notes,
    });
    await refreshCurrentTab();
  });
});

// تغيير التبويب عند الضغط
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    switchTab(e.target.id.replace('tab', '').toLowerCase());
  });
});

// بدء التطبيق
(async () => {
  await openDB();
  switchTab(state.activeTab);
})();
