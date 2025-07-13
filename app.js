// ==== قاعدة البيانات IndexedDB ====
const DB_NAME = 'ProjectManagerDB';
const DB_VERSION = 1;
let db;
let currentProjectId = null;

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        const store = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('members')) {
        const store = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    request.onerror = (e) => {
      reject('خطأ بفتح قاعدة البيانات');
    };
  });
}

// ==== وظائف المشاريع ====
function addProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.add(project);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المشروع');
  });
}

function updateProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المشروع');
  });
}

async function deleteProject(id) {
  await deleteTasksByProject(id);
  await deleteMembersByProject(id);
  await deleteTransactionsByProject(id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المشروع');
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المشاريع');
  });
}

// ==== مهام المشاريع ====
function addTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.add(task);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المهمة');
  });
}

function getTasksByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('projectId');
    const req = index.getAll(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المهام');
  });
}

function deleteTask(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المهمة');
  });
}

function deleteTasksByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const index = store.index('projectId');
    const req = index.openCursor(projectId);

    req.onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };

    req.onerror = () => reject('فشل بحذف مهام المشروع');
  });
}

// ==== أعضاء الفريق ====
function addMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.add(member);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة العضو');
  });
}

function getMembersByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readonly');
    const store = tx.objectStore('members');
    const index = store.index('projectId');
    const req = index.getAll(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب الأعضاء');
  });
}

function deleteMember(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف العضو');
  });
}

function deleteMembersByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const index = store.index('projectId');
    const req = index.openCursor(projectId);

    req.onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };

    req.onerror = () => reject('فشل بحذف أعضاء المشروع');
  });
}

// ==== المعاملات المالية ====
function addTransaction(transaction) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.add(transaction);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المعاملة');
  });
}

function getTransactionsByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const index = store.index('projectId');
    const req = index.getAll(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المعاملات المالية');
  });
}

function deleteTransaction(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المعاملة');
  });
}

function deleteTransactionsByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const index = store.index('projectId');
    const req = index.openCursor(projectId);

    req.onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };

    req.onerror = () => reject('فشل بحذف معاملات المشروع');
  });
}

// ==== DOM عناصر ====
const btnNewProject = document.getElementById('btnNewProject');
const projectsList = document.getElementById('projectsList');
const searchInput = document.getElementById('searchInput');

const projectDetails = document.getElementById('projectDetails');
const projName = document.getElementById('projName');
const projDesc = document.getElementById('projDesc');
const projStart = document.getElementById('projStart');
const projEnd = document.getElementById('projEnd');
const projStatus = document.getElementById('projStatus');
const projProgress = document.getElementById('projProgress');

const btnCloseProject = document.getElementById('btnCloseProject');

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const btnAddTask = document.getElementById('btnAddTask');
const tasksList = document.getElementById('tasksList');

const btnAddMember = document.getElementById('btnAddMember');
const teamList = document.getElementById('teamList');

const btnAddTransaction = document.getElementById('btnAddTransaction');
const transactionsList = document.getElementById('transactionsList');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const modalCancel = document.getElementById('modalCancel');
const modalSubmit = document.getElementById('modalSubmit');

// ==== التهيئة ====
async function init() {
  await openDB();
  await renderProjectsList();
  bindEvents();
  hideProjectDetails();
}

function bindEvents() {
  btnNewProject.addEventListener('click', () => openModal('project'));
  btnCloseProject.addEventListener('click', () => {
    currentProjectId = null;
    hideProjectDetails();
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(tab.dataset.tab);
    });
  });

  btnAddTask.addEventListener('click', () => openModal('task'));
  btnAddMember.addEventListener('click', () => openModal('member'));
  btnAddTransaction.addEventListener('click', () => openModal('transaction'));

  modalCancel.addEventListener('click', () => closeModal());
  modalForm.addEventListener('submit', onModalSubmit);
}

// ==== عرض المشاريع ====
async function renderProjectsList(filter = '') {
  let projects = await getAllProjects();
  if (filter) {
    const term = filter.trim().toLowerCase();
    projects = projects.filter(p => p.name.toLowerCase().includes(term));
  }

  projectsList.innerHTML = '';
  if (projects.length === 0) {
    projectsList.innerHTML = '<li>لا توجد مشاريع</li>';
    return;
  }

  projects.forEach(project => {
    const li = document.createElement('li');
    li.textContent = project.name;
    li.classList.add('project-item');
    li.onclick = () => openProject(project.id);
    projectsList.appendChild(li);
  });
}

searchInput.addEventListener('input', () => renderProjectsList(searchInput.value));

// ==== فتح مشروع ====
async function openProject(id) {
  currentProjectId = id;
  const projects = await getAllProjects();
  const project = projects.find(p => p.id === id);
  if (!project) return alert('المشروع غير موجود');

  projName.textContent = project.name;
  projDesc.textContent = project.description || '-';
  projStart.textContent = project.startDate || '-';
  projEnd.textContent = project.endDate || '-';
  projStatus.textContent = project.status || '-';
  projProgress.textContent = project.progress || 0;

  projectDetails.classList.remove('hidden');
  switchTab('overview');

  await renderTasksList(id);
  await renderTeamList(id);
  await renderTransactionsList(id);
  await renderReports(id);
}

function hideProjectDetails() {
  projectDetails.classList.add('hidden');
  clearProjectFields();
}

function clearProjectFields() {
  projName.textContent = '';
  projDesc.textContent = '';
  projStart.textContent = '';
  projEnd.textContent = '';
  projStatus.textContent = '';
  projProgress.textContent = '';
  tasksList.innerHTML = '';
  teamList.innerHTML = '';
  transactionsList.innerHTML = '';
  reportsContent.innerHTML = 'لا توجد تقارير حالياً.';
}

// ==== التبديل بين التبويبات ====
function switchTab(tabName) {
  tabs.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(section => section.classList.remove('active'));

  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');

  // تحميل المحتوى الخاص بالتبويب عند الحاجة
  if (currentProjectId) {
    if (tabName === 'tasks') renderTasksList(currentProjectId);
    else if (tabName === 'team') renderTeamList(currentProjectId);
    else if (tabName === 'finance') renderTransactionsList(currentProjectId);
    else if (tabName === 'reports') renderReports(currentProjectId);
  }
}

// ==== المودال - فتح النماذج ====
function openModal(type, data = {}) {
  modalForm.dataset.type = type;
  modalForm.dataset.editingId = data.id || '';
  modalTitle.textContent = {
    project: data.id ? 'تعديل مشروع' : 'إضافة مشروع جديد',
    task: data.id ? 'تعديل مهمة' : 'إضافة مهمة جديدة',
    member: data.id ? 'تعديل عضو' : 'إضافة عضو جديد',
    transaction: data.id ? 'تعديل معاملة مالية' : 'إضافة معاملة مالية',
  }[type];

  if (type === 'project') {
    modalForm.innerHTML = `
      <label>اسم المشروع<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required placeholder="اسم المشروع" value="${data.name || ''}" />
      <label>الوصف</label>
      <textarea name="description" placeholder="وصف مختصر">${data.description || ''}</textarea>
      <label>تاريخ البداية</label>
      <input type="date" name="startDate" value="${data.startDate || ''}" />
      <label>تاريخ النهاية المتوقع</label>
      <input type="date" name="endDate" value="${data.endDate || ''}" />
      <label>الحالة</label>
      <select name="status">
        <option value="نشط" ${data.status === 'نشط' ? 'selected' : ''}>نشط</option>
        <option value="مؤجل" ${data.status === 'مؤجل' ? 'selected' : ''}>مؤجل</option>
        <option value="مكتمل" ${data.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
      </select>
      <label>نسبة الإنجاز %</label>
      <input type="number" name="progress" min="0" max="100" value="${data.progress || 0}" />
    `;
  } else if (type === 'task') {
    modalForm.innerHTML = `
      <label>عنوان المهمة<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="title" required placeholder="عنوان المهمة" value="${data.title || ''}" />
      <label>الوصف</label>
      <textarea name="description" placeholder="وصف المهمة">${data.description || ''}</textarea>
      <label>الحالة</label>
      <select name="status">
        <option value="معلقة" ${data.status === 'معلقة' ? 'selected' : ''}>معلقة</option>
        <option value="قيد التنفيذ" ${data.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
        <option value="مكتملة" ${data.status === 'مكتملة' ? 'selected' : ''}>مكتملة</option>
      </select>
      <label>تاريخ الاستحقاق</label>
      <input type="date" name="dueDate" value="${data.dueDate || ''}" />
    `;
  } else if (type === 'member') {
    modalForm.innerHTML = `
      <label>اسم العضو<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required placeholder="اسم العضو" value="${data.name || ''}" />
      <label>الدور</label>
      <select name="role">
        <option value="مدير" ${data.role === 'مدير' ? 'selected' : ''}>مدير</option>
        <option value="عضو فريق" ${data.role === 'عضو فريق' ? 'selected' : ''}>عضو فريق</option>
        <option value="مشاهد" ${data.role === 'مشاهد' ? 'selected' : ''}>مشاهد</option>
      </select>
      <label>البريد الإلكتروني</label>
      <input type="email" name="email" placeholder="email@example.com" value="${data.email || ''}" />
    `;
  } else if (type === 'transaction') {
    modalForm.innerHTML = `
      <label>نوع المعاملة</label>
      <select name="type">
        <option value="إيراد" ${data.type === 'إيراد' ? 'selected' : ''}>إيراد</option>
        <option value="مصروف" ${data.type === 'مصروف' ? 'selected' : ''}>مصروف</option>
      </select>
      <label>المبلغ</label>
      <input type="number" name="amount" min="0" step="0.01" value="${data.amount || ''}" required />
      <label>الوصف</label>
      <textarea name="description" rows="2" placeholder="وصف المعاملة">${data.description || ''}</textarea>
      <label>التاريخ</label>
      <input type="date" name="date" value="${data.date || new Date().toISOString().split('T')[0]}" />
    `;
  }

  modalOverlay.classList.remove('hidden');
}

// ==== إغلاق المودال ====
function closeModal() {
  modalOverlay.classList.add('hidden');
  modalForm.reset();
  modalForm.dataset.type = '';
  modalForm.dataset.editingId = '';
}

// ==== حفظ بيانات النماذج ====
async function onModalSubmit(e) {
  e.preventDefault();
  const type = modalForm.dataset.type;
  const editingId = modalForm.dataset.editingId;
  const formData = new FormData(modalForm);

  if (type === 'project') {
    const projectData = {
      name: formData.get('name').trim(),
      description: formData.get('description').trim(),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0,
    };

    if (!projectData.name) {
      alert('اسم المشروع مطلوب');
      return;
    }

    if (editingId) {
      projectData.id = Number(editingId);
      await updateProject(projectData);
    } else {
      await addProject(projectData);
    }

    await renderProjectsList();
    closeModal();

  } else if (type === 'task') {
    if (!currentProjectId) return alert('لا يوجد مشروع مفتوح');
    const taskData = {
      projectId: currentProjectId,
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      status: formData.get('status'),
      dueDate: formData.get('dueDate'),
    };

    if (!taskData.title) {
      alert('عنوان المهمة مطلوب');
      return;
    }

    if (editingId) {
      taskData.id = Number(editingId);
      await updateTask(taskData);
    } else {
      await addTask(taskData);
    }

    await renderTasksList(currentProjectId);
    closeModal();

  } else if (type === 'member') {
    if (!currentProjectId) return alert('لا يوجد مشروع مفتوح');
    const memberData = {
      projectId: currentProjectId,
      name: formData.get('name').trim(),
      role: formData.get('role'),
      email: formData.get('email').trim(),
    };

    if (!memberData.name) {
      alert('اسم العضو مطلوب');
      return;
    }

    if (editingId) {
      memberData.id = Number(editingId);
      await updateMember(memberData);
    } else {
      await addMember(memberData);
    }

    await renderTeamList(currentProjectId);
    closeModal();

  } else if (type === 'transaction') {
    if (!currentProjectId) return alert('لا يوجد مشروع مفتوح');

    const transactionData = {
      projectId: currentProjectId,
      type: formData.get('type'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description').trim(),
      date: formData.get('date'),
    };

    if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (editingId) {
      transactionData.id = Number(editingId);
      await updateTransaction(transactionData);
    } else {
      await addTransaction(transactionData);
    }

    await renderTransactionsList(currentProjectId);
    closeModal();
  }
}

// ==== تحديث بيانات المهام ====
function updateTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المهمة');
  });
}

// ==== تحديث بيانات الأعضاء ====
function updateMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.put(member);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث العضو');
  });
}

// ==== تحديث بيانات المعاملات ====
function updateTransaction(transaction) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.put(transaction);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المعاملة');
  });
}

// ==== عرض المهام ====
async function renderTasksList(projectId) {
  const tasks = await getTasksByProject(projectId);
  tasksList.innerHTML = '';
  if (tasks.length === 0) {
    tasksList.innerHTML = '<li>لا توجد مهام</li>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} [${task.status}] - استحقاق: ${task.dueDate || '-'}`;

    // زر حذف المهمة
    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('هل تريد حذف هذه المهمة؟')) {
        await deleteTask(task.id);
        await renderTasksList(projectId);
      }
    };

    // تعديل المهمة عند النقر على العنصر
    li.onclick = () => openModal('task', task);

    li.appendChild(delBtn);
    tasksList.appendChild(li);
  });

  // تحديث نسبة الإنجاز تلقائياً
  updateProjectProgress(projectId, tasks);
}

// ==== حساب نسبة الإنجاز ====
async function updateProjectProgress(projectId, tasks) {
  if (!tasks.length) return;

  const doneTasks = tasks.filter(t => t.status === 'مكتملة').length;
  const progress = Math.round((doneTasks / tasks.length) * 100);

  const projects = await getAllProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  if (project.progress !== progress) {
    project.progress = progress;
    await updateProject(project);
    projProgress.textContent = progress;
    await renderProjectsList(searchInput.value);
  }
}

// ==== عرض أعضاء الفريق ====
async function renderTeamList(projectId) {
  const members = await getMembersByProject(projectId);
  teamList.innerHTML = '';
  if (members.length === 0) {
    teamList.innerHTML = '<li>لا يوجد أعضاء</li>';
    return;
  }

  members.forEach(member => {
    const li = document.createElement('li');
    li.textContent = `${member.name} - ${member.role}`;

    // زر حذف العضو
    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('هل تريد حذف هذا العضو؟')) {
        await deleteMember(member.id);
        await renderTeamList(projectId);
      }
    };

    // تعديل العضو عند النقر
    li.onclick = () => openModal('member', member);

    li.appendChild(delBtn);
    teamList.appendChild(li);
  });
}

// ==== عرض المعاملات المالية ====
async function renderTransactionsList(projectId) {
  const transactions = await getTransactionsByProject(projectId);
  transactionsList.innerHTML = '';
  if (transactions.length === 0) {
    transactionsList.innerHTML = '<li>لا توجد معاملات مالية</li>';
    return;
  }

  transactions.forEach(tr => {
    const li = document.createElement('li');
    li.textContent = `${tr.type}: ${tr.amount.toFixed(2)} - ${tr.description || '-'} (${tr.date || '-'})`;

    // زر حذف المعاملة
    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('هل تريد حذف هذه المعاملة؟')) {
        await deleteTransaction(tr.id);
        await renderTransactionsList(projectId);
      }
    };

    // تعديل المعاملة عند النقر
    li.onclick = () => openModal('transaction', tr);

    li.appendChild(delBtn);
    transactionsList.appendChild(li);
  });
}

// ==== عرض التقارير ====
const reportsContent = document.getElementById('reportsContent');

async function renderReports(projectId) {
  const tasks = await getTasksByProject(projectId);
  const transactions = await getTransactionsByProject(projectId);

  // حساب الوقت المنقضي (مثال مبسط: عدد المهام المكتملة)
  const completedTasks = tasks.filter(t => t.status === 'مكتملة').length;

  // حساب الإيرادات والمصروفات
  let income = 0, expenses = 0;
  transactions.forEach(tr => {
    if (tr.type === 'إيراد') income += tr.amount;
    else if (tr.type === 'مصروف') expenses += tr.amount;
  });
  const profit = income - expenses;

  reportsContent.innerHTML = `
    <p>عدد المهام الكلية: ${tasks.length}</p>
    <p>عدد المهام المكتملة: ${completedTasks}</p>
    <p>إجمالي الإيرادات: ${income.toFixed(2)}</p>
    <p>إجمالي المصروفات: ${expenses.toFixed(2)}</p>
    <p>صافي الأرباح: ${profit.toFixed(2)}</p>
  `;
}

init();
