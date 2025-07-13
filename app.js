// ========== إعداد قاعدة بيانات IndexedDB ==========
const DB_NAME = 'ProjectManagerDB';
const DB_VERSION = 1;
let db;
let currentProjectId = null;

// فتح أو إنشاء قاعدة البيانات
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (e) {
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
    };

    request.onsuccess = function (e) {
      db = e.target.result;
      resolve();
    };

    request.onerror = function (e) {
      reject('خطأ بفتح قاعدة البيانات');
    };
  });
}

// ========================== الوظائف الأساسية =========================

// إضافة مشروع جديد
function addProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.add(project);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المشروع');
  });
}

// تحديث مشروع
function updateProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.put(project);

    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المشروع');
  });
}

// حذف مشروع مع كل المهام والأعضاء المرتبطين
async function deleteProject(id) {
  await deleteTasksByProject(id);
  await deleteMembersByProject(id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المشروع');
  });
}

// جلب كل المشاريع
function getAllProjects() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المشاريع');
  });
}

// إضافة مهمة
function addTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.add(task);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المهمة');
  });
}

// جلب المهام حسب المشروع
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

// حذف مهمة
function deleteTask(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المهمة');
  });
}

// حذف مهام مشروع كامل
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

// إضافة عضو
function addMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.add(member);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة العضو');
  });
}

// جلب أعضاء حسب المشروع
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

// حذف عضو
function deleteMember(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف العضو');
  });
}

// حذف أعضاء مشروع كامل
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

// ================== DOM & تعامل الواجهة =================

const projectsList = document.getElementById('projectsList');
const btnNewProject = document.getElementById('btnNewProject');
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

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const modalCancel = document.getElementById('modalCancel');
const modalSubmit = document.getElementById('modalSubmit');

let currentTab = 'overview';

// تهيئة التطبيق
async function init() {
  await openDB();
  renderProjectsList();
  setupEventListeners();
}

function setupEventListeners() {
  btnNewProject.addEventListener('click', () => {
    openProjectModal('إضافة مشروع جديد', 'project');
  });

  searchInput.addEventListener('input', () => {
    renderProjectsList(searchInput.value.trim());
  });

  btnCloseProject.addEventListener('click', () => {
    currentProjectId = null;
    projectDetails.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  btnAddTask.addEventListener('click', () => {
    openTaskModal('إضافة مهمة جديدة');
  });

  btnAddMember.addEventListener('click', () => {
    openMemberModal('إضافة عضو جديد');
  });

  modalCancel.addEventListener('click', closeModal);

  modalSubmit.addEventListener('click', onModalSubmit);
}

// تبديل التبويبات
function switchTab(tabName) {
  currentTab = tabName;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  tabContents.forEach(tc => tc.classList.toggle('active', tc.id === tabName));
  if (tabName === 'tasks' && currentProjectId) {
    renderTasksList(currentProjectId);
  } else if (tabName === 'team' && currentProjectId) {
    renderTeamList(currentProjectId);
  } else if (tabName === 'reports' && currentProjectId) {
    renderReports(currentProjectId);
  }
}

// عرض قائمة المشاريع
async function renderProjectsList(filter = '') {
  const projects = await getAllProjects();
  projectsList.innerHTML = '';
  let filtered = projects;
  if (filter) {
    const f = filter.toLowerCase();
    filtered = projects.filter(p => p.name.toLowerCase().includes(f));
  }

  filtered.forEach(proj => {
    const li = document.createElement('li');
    li.textContent = proj.name;
    li.title = proj.description || '';
    li.onclick = () => openProject(proj.id);
    projectsList.appendChild(li);
  });
}

// فتح مشروع للعرض والتعديل
async function openProject(id) {
  currentProjectId = id;
  const tx = db.transaction('projects', 'readonly');
  const store = tx.objectStore('projects');
  const req = store.get(id);

  req.onsuccess = () => {
    const proj = req.result;
    projName.textContent = proj.name;
    projDesc.textContent = proj.description || '-';
    projStart.textContent = proj.startDate || '-';
    projEnd.textContent = proj.endDate || '-';
    projStatus.textContent = proj.status || 'نشط';
    projProgress.textContent = proj.progress || 0;

    projectDetails.classList.remove('hidden');
    switchTab('overview');
  };
  req.onerror = () => alert('فشل بفتح المشروع');
}

// فتح نموذج إضافة / تعديل
function openProjectModal(title, type, data = {}) {
  modalTitle.textContent = title;
  modalForm.innerHTML = '';

  if (type === 'project') {
    modalForm.innerHTML = `
      <label>اسم المشروع<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required value="${data.name || ''}" placeholder="ادخل اسم المشروع" />
      <label>الوصف</label>
      <textarea name="description" rows="3" placeholder="وصف مختصر">${data.description || ''}</textarea>
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
      <label>نسبة الإنجاز (%)</label>
      <input type="number" name="progress" min="0" max="100" value="${data.progress || 0}" />
    `;
  } else if (type === 'task') {
    modalForm.innerHTML = `
      <label>عنوان المهمة<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="title" required placeholder="عنوان المهمة" />
      <label>الوصف</label>
      <textarea name="description" rows="3" placeholder="وصف المهمة"></textarea>
      <label>الحالة</label>
      <select name="status">
        <option value="معلقة">معلقة</option>
        <option value="قيد التنفيذ">قيد التنفيذ</option>
        <option value="مكتملة">مكتملة</option>
      </select>
      <label>تاريخ الاستحقاق</label>
      <input type="date" name="dueDate" />
    `;
  } else if (type === 'member') {
    modalForm.innerHTML = `
      <label>اسم العضو<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required placeholder="اسم العضو" />
      <label>الدور</label>
      <select name="role">
        <option value="مدير">مدير</option>
        <option value="عضو فريق">عضو فريق</option>
        <option value="مشاهد">مشاهد</option>
      </select>
      <label>البريد الإلكتروني</label>
      <input type="email" name="email" placeholder="email@example.com" />
    `;
  }

  modalOverlay.classList.remove('hidden');
  modalForm.dataset.type = type;
  modalForm.dataset.editingId = data.id || '';
}

// إغلاق النموذج
function closeModal() {
  modalOverlay.classList.add('hidden');
  modalForm.reset();
  modalForm.dataset.type = '';
  modalForm.dataset.editingId = '';
}

// عند حفظ النموذج
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

    await addTask(taskData);
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

    await addMember(memberData);
    await renderTeamList(currentProjectId);
    closeModal();
  }
}

// عرض قائمة المهام
async function renderTasksList(projectId) {
  const tasks = await getTasksByProject(projectId);
  tasksList.innerHTML = '';
  if (tasks.length === 0) {
    tasksList.innerHTML = '<li>لا توجد مهام</li>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} [${task.status}] - موعد: ${task.dueDate || '-'}`;

    // زر حذف
    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.className = 'btn secondary';
    delBtn.style.marginLeft = '10px';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('هل أنت متأكد من حذف المهمة؟')) {
        await deleteTask(task.id);
        renderTasksList(projectId);
      }
    };

    li.appendChild(delBtn);
    tasksList.appendChild(li);
  });
}

// عرض قائمة الأعضاء
async function renderTeamList(projectId) {
  const members = await getMembersByProject(projectId);
  teamList.innerHTML = '';
  if (members.length === 0) {
    teamList.innerHTML = '<li>لا يوجد أعضاء</li>';
    return;
  }

  members.forEach(member => {
    const li = document.createElement('li');
    li.textContent = `${member.name} (${member.role}) - ${member.email || '-'}`;

    // زر حذف
    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.className = 'btn secondary';
    delBtn.style.marginLeft = '10px';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('هل أنت متأكد من حذف العضو؟')) {
        await deleteMember(member.id);
        renderTeamList(projectId);
      }
    };

    li.appendChild(delBtn);
    teamList.appendChild(li);
  });
}

// عرض تقارير المشروع (مؤقت)
function renderReports(projectId) {
  const reportsDiv = document.getElementById('reportsContent');
  reportsDiv.innerHTML = `
    <p>تقارير قيد التطوير...</p>
    <p>عدد المهام: غير متوفر حالياً</p>
    <p>عدد الأعضاء: غير متوفر حالياً</p>
  `;
}

// بدء التطبيق
init();
