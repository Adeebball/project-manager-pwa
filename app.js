// قاعدة بيانات IndexedDB
let db;
let currentProjectId = null;
let currentTab = 'summary';

// فتح قاعدة البيانات
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProjectManagerDB', 1);

    request.onerror = () => reject('فشل فتح قاعدة البيانات');
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
        projectStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
      }

      if (!db.objectStoreNames.contains('members')) {
        const memberStore = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
        memberStore.createIndex('projectId', 'projectId', { unique: false });
      }

      if (!db.objectStoreNames.contains('attendance')) {
        const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
        attendanceStore.createIndex('employeeId', 'employeeId', { unique: false });
        attendanceStore.createIndex('projectId', 'projectId', { unique: false });
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transactionStore.createIndex('projectId', 'projectId', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// ==== عمليات CRUD ====

// إضافة مشروع
function addProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.add(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل إضافة المشروع');
  });
}

// جلب جميع المشاريع
function getAllProjects() {
  return new Promise((resolve) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// جلب مشروع بالمعرف
function getProjectById(id) {
  return new Promise((resolve) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
}

// إضافة مهمة
function addTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.add(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل إضافة المهمة');
  });
}

// جلب المهام حسب المشروع
function getTasksByProject(projectId) {
  return new Promise((resolve) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
  });
}

// إضافة عضو (موظف)
function addMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.add(member);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل إضافة الموظف');
  });
}

// جلب الموظفين حسب المشروع
function getMembersByProject(projectId) {
  return new Promise((resolve) => {
    const tx = db.transaction('members', 'readonly');
    const store = tx.objectStore('members');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
  });
}

// إضافة دوام
function addAttendance(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readwrite');
    const store = tx.objectStore('attendance');
    const req = store.add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل تسجيل الدوام');
  });
}

// جلب سجلات الدوام حسب المشروع
function getAttendanceByProject(projectId) {
  return new Promise((resolve) => {
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
  });
}

// جلب سجلات دوام موظف معين
function getAttendanceByEmployee(employeeId) {
  return new Promise((resolve) => {
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('employeeId');
    const req = index.getAll(IDBKeyRange.only(employeeId));
    req.onsuccess = () => resolve(req.result);
  });
}

// إضافة معاملة مالية
function addTransaction(tr) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.add(tr);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل إضافة المعاملة');
  });
}

// جلب المعاملات حسب المشروع
function getTransactionsByProject(projectId) {
  return new Promise((resolve) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
  });
}

// ===== حساب الراتب حسب دوام الموظف =====
async function calculateSalary(employeeId, year, month) {
  const attendanceRecords = await getAttendanceByEmployee(employeeId);
  const members = await getMembersByProject(currentProjectId);
  const employee = members.find(m => m.id === employeeId);
  if (!employee) return { daysWorked: 0, salary: 0 };

  const filteredRecords = attendanceRecords.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });

  const daysWorked = filteredRecords.length;
  const salary = daysWorked * (employee.dailySalary || 0);
  return { daysWorked, salary };
}

// ===== DOM وعناصر الصفحة =====

const projectsList = document.getElementById('projectsList');
const btnNewProject = document.getElementById('btnNewProject');
const btnAddTask = document.getElementById('btnAddTask');
const btnAddMember = document.getElementById('btnAddMember');
const btnAddAttendance = document.getElementById('btnAddAttendance');
const btnAddTransaction = document.getElementById('btnAddTransaction');

const currentProjectName = document.getElementById('currentProjectName');
const projectDetailsSection = document.querySelector('.project-details');

const tabs = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tabContent');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const modalCancel = document.getElementById('modalCancel');

function initEvents() {
  btnNewProject.addEventListener('click', () => openModal('project'));
  btnAddTask.addEventListener('click', () => {
    if (!currentProjectId) return alert('اختر مشروع أولا');
    openModal('task');
  });
  btnAddMember.addEventListener('click', () => {
    if (!currentProjectId) return alert('اختر مشروع أولا');
    openModal('member');
  });
  btnAddAttendance.addEventListener('click', () => {
    if (!currentProjectId) return alert('اختر مشروع أولا');
    openModal('attendance');
  });
  btnAddTransaction.addEventListener('click', () => {
    if (!currentProjectId) return alert('اختر مشروع أولا');
    openModal('transaction');
  });

  modalCancel.addEventListener('click', closeModal);
  modalForm.addEventListener('submit', onModalSubmit);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderCurrentTab();
    });
  });
}

async function loadProjects() {
  const projects = await getAllProjects();
  projectsList.innerHTML = '';
  if (projects.length === 0) {
    projectsList.innerHTML = '<li>لا توجد مشاريع</li>';
    projectDetailsSection.classList.add('hidden');
    return;
  }
  projectDetailsSection.classList.remove('hidden');
  projects.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.addEventListener('click', () => {
      openProject(p.id);
    });
    projectsList.appendChild(li);
  });
}

async function openProject(id) {
  currentProjectId = id;
  const project = await getProjectById(id);
  currentProjectName.textContent = project.name;
  btnAddTask.disabled = false;
  btnAddMember.disabled = false;
  btnAddAttendance.disabled = false;
  btnAddTransaction.disabled = false;

  tabs.forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="summary"]').classList.add('active');
  currentTab = 'summary';
  renderCurrentTab();
}

function openModal(type) {
  modalForm.innerHTML = '';
  modalTitle.textContent = '';
  switch(type) {
    case 'project':
      modalTitle.textContent = 'إضافة مشروع جديد';
      modalForm.innerHTML = `
        <label>اسم المشروع (مطلوب):</label>
        <input name="name" required />
        <label>الوصف:</label>
        <input name="description" />
        <label>تاريخ البداية:</label>
        <input type="date" name="startDate" />
        <label>تاريخ النهاية:</label>
        <input type="date" name="endDate" />
        <button type="submit">إضافة</button>
      `;
      break;
    case 'task':
      modalTitle.textContent = 'إضافة مهمة جديدة';
      modalForm.innerHTML = `
        <label>عنوان المهمة (مطلوب):</label>
        <input name="title" required />
        <label>الوصف:</label>
        <input name="description" />
        <label>الحالة:</label>
        <select name="status">
          <option value="معلقة">معلقة</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مكتملة">مكتملة</option>
        </select>
        <button type="submit">إضافة</button>
      `;
      break;
    case 'member':
      modalTitle.textContent = 'إضافة موظف جديد';
      modalForm.innerHTML = `
        <label>اسم الموظف (مطلوب):</label>
        <input name="name" required />
        <label>الدور:</label>
        <input name="role" />
        <label>الراتب اليومي:</label>
        <input name="dailySalary" type="number" min="0" step="0.01" />
        <button type="submit">إضافة</button>
      `;
      break;
    case 'attendance':
      modalTitle.textContent = 'تسجيل دوام';
      modalForm.innerHTML = `
        <label>الموظف (ID):</label>
        <input name="employeeId" type="number" required />
        <label>التاريخ:</label>
        <input type="date" name="date" required />
        <label>وقت الحضور:</label>
        <input type="time" name="checkIn" required />
        <label>وقت الانصراف:</label>
        <input type="time" name="checkOut" />
        <button type="submit">تسجيل</button>
      `;
      break;
    case 'transaction':
      modalTitle.textContent = 'إضافة معاملة مالية';
      modalForm.innerHTML = `
        <label>التاريخ:</label>
        <input type="date" name="date" required />
        <label>النوع:</label>
        <select name="type" required>
          <option value="راتب">راتب</option>
          <option value="مشتريات">مشتريات</option>
          <option value="مبيعات">مبيعات</option>
          <option value="نفقات">نفقات</option>
        </select>
        <label>المبلغ:</label>
        <input type="number" step="0.01" name="amount" required />
        <label>الوصف:</label>
        <input name="description" />
        <label>نوع الخدمة (للمبيعات فقط):</label>
        <input name="serviceType" />
        <label>موظف (ID) (لرواتب فقط):</label>
        <input name="employeeId" type="number" />
        <button type="submit">إضافة</button>
      `;
      break;
  }
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

// معالجة نموذج الإضافة
async function onModalSubmit(e) {
  e.preventDefault();
  const formData = new FormData(modalForm);
  const data = Object.fromEntries(formData.entries());

  try {
    switch(modalTitle.textContent) {
      case 'إضافة مشروع جديد':
        if (!data.name.trim()) throw 'اسم المشروع مطلوب';
        await addProject({
          name: data.name.trim(),
          description: data.description || '',
          startDate: data.startDate || '',
          endDate: data.endDate || ''
        });
        await loadProjects();
        break;

      case 'إضافة مهمة جديدة':
        if (!data.title.trim()) throw 'عنوان المهمة مطلوب';
        await addTask({
          projectId: currentProjectId,
          title: data.title.trim(),
          description: data.description || '',
          status: data.status || 'معلقة'
        });
        renderCurrentTab();
        break;

      case 'إضافة موظف جديد':
        if (!data.name.trim()) throw 'اسم الموظف مطلوب';
        await addMember({
          projectId: currentProjectId,
          name: data.name.trim(),
          role: data.role || '',
          dailySalary: parseFloat(data.dailySalary) || 0
        });
        renderCurrentTab();
        break;

      case 'تسجيل دوام':
        if (!data.employeeId) throw 'رقم الموظف مطلوب';
        await addAttendance({
          projectId: currentProjectId,
          employeeId: parseInt(data.employeeId),
          date: data.date,
          checkIn: data.checkIn,
          checkOut: data.checkOut || ''
        });
        renderCurrentTab();
        break;

      case 'إضافة معاملة مالية':
        if (!data.date || !data.type || !data.amount) throw 'الحقول المطلوبة غير مكتملة';
        await addTransaction({
          projectId: currentProjectId,
          date: data.date,
          type: data.type,
          amount: parseFloat(data.amount),
          description: data.description || '',
          serviceType: data.serviceType || '',
          employeeId: data.employeeId ? parseInt(data.employeeId) : null
        });
        renderCurrentTab();
        break;
    }
  } catch(err) {
    alert(err);
  }
  closeModal();
}

// عرض محتوى التبويب الحالي
async function renderCurrentTab() {
  if (!currentProjectId) {
    tabContent.innerHTML = '<p>اختر مشروعاً للعرض</p>';
    return;
  }

  switch(currentTab) {
    case 'summary':
      await renderSummary();
      break;
    case 'tasks':
      await renderTasks();
      break;
    case 'employees':
      await renderEmployees();
      break;
    case 'attendance':
      await renderAttendance();
      break;
    case 'finance':
      await renderFinance();
      break;
    case 'reports':
      await renderReports();
      break;
  }
}

async function renderSummary() {
  const project = await getProjectById(currentProjectId);
  const tasks = await getTasksByProject(currentProjectId);

  let completedTasks = tasks.filter(t => t.status === 'مكتملة').length;
  let progress = tasks.length ? ((completedTasks / tasks.length) * 100).toFixed(1) : 0;

  tabContent.innerHTML = `
    <p><strong>الوصف:</strong> ${project.description || '-'}</p>
    <p><strong>تاريخ البداية:</strong> ${project.startDate || '-'}</p>
    <p><strong>تاريخ النهاية:</strong> ${project.endDate || '-'}</p>
    <p><strong>عدد المهام:</strong> ${tasks.length}</p>
    <p><strong>نسبة الإنجاز:</strong> ${progress}%</p>
  `;
}

async function renderTasks() {
  const tasks = await getTasksByProject(currentProjectId);
  if (tasks.length === 0) {
    tabContent.innerHTML = '<p>لا توجد مهام حالياً.</p>';
    return;
  }

  let html = `<table><thead><tr><th>عنوان المهمة</th><th>الحالة</th></tr></thead><tbody>`;
  tasks.forEach(t => {
    html += `<tr><td>${t.title}</td><td>${t.status}</td></tr>`;
  });
  html += `</tbody></table>`;
  tabContent.innerHTML = html;
}

async function renderEmployees() {
  const members = await getMembersByProject(currentProjectId);
  if (members.length === 0) {
    tabContent.innerHTML = '<p>لا يوجد موظفين.</p>';
    return;
  }
  let html = `<table><thead><tr><th>الاسم</th><th>الدور</th><th>الراتب اليومي</th></tr></thead><tbody>`;
  members.forEach(m => {
    html += `<tr><td>${m.name}</td><td>${m.role || '-'}</td><td>${m.dailySalary.toFixed(2)}</td></tr>`;
  });
  html += `</tbody></table>`;
  tabContent.innerHTML = html;
}

async function renderAttendance() {
  const attendanceRecords = await getAttendanceByProject(currentProjectId);
  if (attendanceRecords.length === 0) {
    tabContent.innerHTML = '<p>لا توجد سجلات دوام.</p>';
    return;
  }
  let html = `<table><thead><tr><th>الموظف</th><th>التاريخ</th><th>حضور</th><th>انصراف</th></tr></thead><tbody>`;
  const members = await getMembersByProject(currentProjectId);
  attendanceRecords.forEach(r => {
    let emp = members.find(m => m.id === r.employeeId);
    html += `<tr>
      <td>${emp ? emp.name : 'غير معروف'}</td>
      <td>${r.date}</td>
      <td>${r.checkIn}</td>
      <td>${r.checkOut || '-'}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  tabContent.innerHTML = html;
}

async function renderFinance() {
  const transactions = await getTransactionsByProject(currentProjectId);
  if (transactions.length === 0) {
    tabContent.innerHTML = '<p>لا توجد معاملات مالية.</p>';
    return;
  }

  let html = `<table><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th></tr></thead><tbody>`;
  transactions.forEach(t => {
    let desc = t.description || '-';
    if (t.type === 'مبيعات' && t.serviceType) {
      desc += ` (الخدمة: ${t.serviceType})`;
    }
    if (t.type === 'راتب' && t.employeeId) {
      desc += ` (موظف ID: ${t.employeeId})`;
    }
    html += `<tr>
      <td>${t.date}</td>
      <td>${t.type}</td>
      <td>${t.amount.toFixed(2)}</td>
      <td>${desc}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  tabContent.innerHTML = html;
}

async function renderReports() {
  tabContent.innerHTML = '<p>ميزة التقارير قيد التطوير...</p>';
}

// بدء التطبيق
(async function init() {
  await openDB();
  initEvents();
  await loadProjects();
})();
