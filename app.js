let db;
let currentProjectId = null;
let currentTab = 'summary';

// ======= فتح قاعدة البيانات وتحديثها =======
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProjectManagerDB', 2);
    request.onupgradeneeded = (e) => {
      db = e.target.result;

      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('members')) {
        const store = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        const store = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
        store.createIndex('employeeId', 'employeeId', { unique: false });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    request.onerror = () => reject('فشل بفتح قاعدة البيانات');
  });
}

// ======= CRUD مشاريع =======
function addProject(project) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.add(project);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المشروع');
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

function getProjectById(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المشروع');
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

function deleteProject(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف المشروع');
  });
}

// ======= CRUD مهام =======
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
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المهام');
  });
}

function updateTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المهمة');
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

// ======= CRUD موظفين =======
function addMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.add(member);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة الموظف');
  });
}

function getMembersByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readonly');
    const store = tx.objectStore('members');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب الموظفين');
  });
}

function getMemberById(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readonly');
    const store = tx.objectStore('members');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب الموظف');
  });
}

function updateMember(member) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.put(member);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث الموظف');
  });
}

function deleteMember(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف الموظف');
  });
}

// ======= CRUD دوام الموظفين =======
function addAttendance(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readwrite');
    const store = tx.objectStore('attendance');
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة سجل الدوام');
  });
}

function getAttendanceByEmployee(employeeId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readonly');
    const store = tx.objectStore('attendance');
    const index = store.index('employeeId');
    const req = index.getAll(IDBKeyRange.only(employeeId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب سجلات الدوام');
  });
}

function getAttendanceByProject(projectId) {
  return new Promise(async (resolve, reject) => {
    try {
      const members = await getMembersByProject(projectId);
      let allRecords = [];
      for (const m of members) {
        const records = await getAttendanceByEmployee(m.id);
        allRecords = allRecords.concat(records.map(r => ({...r, employeeName: m.name})));
      }
      resolve(allRecords);
    } catch {
      reject('فشل بجلب سجلات الدوام للمشروع');
    }
  });
}

function deleteAttendance(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance', 'readwrite');
    const store = tx.objectStore('attendance');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بحذف سجل الدوام');
  });
}

// ======= CRUD معاملات مالية =======
function addTransaction(tr) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.add(tr);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بإضافة المعاملة');
  });
}

function getTransactionsByProject(projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const index = store.index('projectId');
    const req = index.getAll(IDBKeyRange.only(projectId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('فشل بجلب المعاملات');
  });
}

function updateTransaction(tr) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const req = store.put(tr);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('فشل بتحديث المعاملة');
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

// ======= حساب رواتب الموظفين =======
async function calculateSalary(employeeId, year, month) {
  const records = await getAttendanceByEmployee(employeeId);
  const employee = await getMemberById(employeeId);
  const filteredRecords = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });
  const daysWorked = filteredRecords.length;
  const salary = daysWorked * (employee.dailySalary || 0);
  return { daysWorked, salary };
}

// ======= DOM & أحداث =======

const projectsList = document.getElementById('projectsList');
const btnNewProject = document.getElementById('btnNewProject');
const btnAddTask = document.getElementById('btnAddTask');
const btnAddMember = document.getElementById('btnAddMember');
const btnAddAttendance = document.getElementById('btnAddAttendance');
const btnAddTransaction = document.getElementById('btnAddTransaction');

const currentProjectName = document.getElementById('currentProjectName');
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
    return;
  }
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
  modalForm.dataset.type = type;
  modalForm.innerHTML = '';
  modalTitle.textContent = {
    project: 'إضافة مشروع جديد',
    task: 'إضافة مهمة جديدة',
    member: 'إضافة موظف جديد',
    attendance: 'تسجيل دوام',
    transaction: 'إضافة معاملة مالية',
  }[type] || '';

  let html = '';
  if (type === 'project') {
    html = `
      <label>اسم المشروع<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'task') {
    html = `
      <label>عنوان المهمة<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="title" required />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'member') {
    html = `
      <label>اسم الموظف<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required />
      <label>الوظيفة</label>
      <input type="text" name="role" />
      <label>راتب يومي (مثلاً 50)</label>
      <input type="number" name="dailySalary" min="0" step="0.01" />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'attendance') {
    html = `
      <label>الموظف<span style="color:#ff6b6b;">*</span></label>
      <select name="employeeId" required></select>
      <label>تاريخ</label>
      <input type="date" name="date" required />
      <label>توقيت الحضور</label>
      <input type="time" name="checkIn" required />
      <label>توقيت الانصراف</label>
      <input type="time" name="checkOut" required />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'transaction') {
    html = `
      <label>نوع المعاملة<span style="color:#ff6b6b;">*</span></label>
      <select name="type" required>
        <option value="">اختر النوع</option>
        <option value="راتب">راتب</option>
        <option value="مشتريات">مشتريات</option>
        <option value="مبيعات">مبيعات</option>
        <option value="نفقات">نفقات</option>
      </select>
      <label>المبلغ<span style="color:#ff6b6b;">*</span></label>
      <input type="number" name="amount" min="0" step="0.01" required />
      <label>الوصف</label>
      <input type="text" name="description" />
      <label>التاريخ</label>
      <input type="date" name="date" required />
      <label id="serviceTypeLabel" style="display:none;">نوع الخدمة المباعة</label>
      <input type="text" name="serviceType" style="display:none;" />
      <label id="salaryEmployeeLabel" style="display:none;">الموظف</label>
      <select name="salaryEmployeeId" style="display:none;"></select>
      <button type="submit">حفظ</button>
    `;

    // بعد إضافة الفورم، نعبئ خيارات الموظفين داخل select
    setTimeout(async () => {
      const empSelect = modalForm.querySelector('select[name="salaryEmployeeId"]');
      const typeSelect = modalForm.querySelector('select[name="type"]');
      const serviceLabel = document.getElementById('serviceTypeLabel');
      const serviceInput = modalForm.querySelector('input[name="serviceType"]');
      const salaryEmpLabel = document.getElementById('salaryEmployeeLabel');

      // إظهار أو إخفاء الحقول حسب نوع المعاملة
      typeSelect.addEventListener('change', async () => {
        const val = typeSelect.value;
        if (val === 'مبيعات') {
          serviceLabel.style.display = 'block';
          serviceInput.style.display = 'block';
          salaryEmpLabel.style.display = 'none';
          empSelect.style.display = 'none';
        } else if (val === 'راتب') {
          salaryEmpLabel.style.display = 'block';
          empSelect.style.display = 'block';
          serviceLabel.style.display = 'none';
          serviceInput.style.display = 'none';

          // تعبئة الموظفين
          empSelect.innerHTML = '';
          const employees = await getMembersByProject(currentProjectId);
          employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            empSelect.appendChild(option);
          });
        } else {
          serviceLabel.style.display = 'none';
          serviceInput.style.display = 'none';
          salaryEmpLabel.style.display = 'none';
          empSelect.style.display = 'none';
        }
      });
    }, 100);
  }

  modalForm.innerHTML = html;

  if (type === 'attendance') {
    // تعبئة الموظفين في اختيار الدوام
    fillEmployeesInSelect(modalForm.querySelector('select[name="employeeId"]'));
  }

  modalOverlay.classList.remove('hidden');
}

async function fillEmployeesInSelect(selectElem) {
  const employees = await getMembersByProject(currentProjectId);
  selectElem.innerHTML = '';
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = emp.name;
    selectElem.appendChild(option);
  });
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalForm.reset();
  modalForm.innerHTML = '';
}

// حفظ بيانات النموذج
async function onModalSubmit(e) {
  e.preventDefault();
  const type = modalForm.dataset.type;
  const formData = new FormData(modalForm);

  try {
    if (type === 'project') {
      const name = formData.get('name').trim();
      if (!name) throw new Error('يرجى إدخال اسم المشروع');
      await addProject({ name });
      await loadProjects();
      closeModal();

    } else if (type === 'task') {
      if (!currentProjectId) throw new Error('اختر مشروع أولا');
      const title = formData.get('title').trim();
      if (!title) throw new Error('يرجى إدخال عنوان المهمة');
      await addTask({ projectId: currentProjectId, title });
      renderCurrentTab();
      closeModal();

    } else if (type === 'member') {
      if (!currentProjectId) throw new Error('اختر مشروع أولا');
      const name = formData.get('name').trim();
      const role = formData.get('role').trim();
      const dailySalary = parseFloat(formData.get('dailySalary')) || 0;
      if (!name) throw new Error('يرجى إدخال اسم الموظف');
      await addMember({ projectId: currentProjectId, name, role, dailySalary });
      renderCurrentTab();
      closeModal();

    } else if (type === 'attendance') {
      if (!currentProjectId) throw new Error('اختر مشروع أولا');
      const employeeId = Number(formData.get('employeeId'));
      const date = formData.get('date');
      const checkIn = formData.get('checkIn');
      const checkOut = formData.get('checkOut');
      if (!employeeId || !date || !checkIn || !checkOut) throw new Error('يرجى تعبئة كل الحقول');
      await addAttendance({ employeeId, date, checkIn, checkOut });
      renderCurrentTab();
      closeModal();

    } else if (type === 'transaction') {
      if (!currentProjectId) throw new Error('اختر مشروع أولا');
      const trType = formData.get('type');
      const amount = parseFloat(formData.get('amount'));
      const description = formData.get('description').trim();
      const date = formData.get('date');
      const serviceType = formData.get('serviceType').trim();
      const salaryEmployeeId = Number(formData.get('salaryEmployeeId'));
      if (!trType || !amount || amount <= 0 || !date) throw new Error('يرجى تعبئة الحقول المطلوبة');
      let transaction = {
        projectId: currentProjectId,
        type: trType,
        amount,
        description,
        date,
        serviceType: trType === 'مبيعات' ? serviceType : null,
        employeeId: trType === 'راتب' ? salaryEmployeeId : null,
      };
      await addTransaction(transaction);
      renderCurrentTab();
      closeModal();
    }
  } catch (error) {
    alert(error.message);
  }
}

// عرض التبويب الحالي
async function renderCurrentTab() {
  if (!currentProjectId) {
    tabContent.textContent = 'يرجى اختيار مشروع أولاً.';
    return;
  }

  if (currentTab === 'summary') {
    await renderSummary();
  } else if (currentTab === 'tasks') {
    await renderTasks();
  } else if (currentTab === 'employees') {
    await renderEmployees();
  } else if (currentTab === 'attendance') {
    await renderAttendance();
  } else if (currentTab === 'finance') {
    await renderFinance();
  } else if (currentTab === 'reports') {
    await renderReports();
  }
}

// ====== عرض البيانات ======

async function renderSummary() {
  const project = await getProjectById(currentProjectId);
  const tasks = await getTasksByProject(currentProjectId);
  const members = await getMembersByProject(currentProjectId);
  const transactions = await getTransactionsByProject(currentProjectId);

  let totalIncome = 0;
  let totalExpenses = 0;
  transactions.forEach(t => {
    if (t.type === 'مبيعات') totalIncome += t.amount;
    else totalExpenses += t.amount;
  });

  tabContent.innerHTML = `
    <h2>ملخص المشروع: ${project.name}</h2>
    <p>عدد المهام: ${tasks.length}</p>
    <p>عدد الموظفين: ${members.length}</p>
    <p>إجمالي الإيرادات: ${totalIncome.toFixed(2)}</p>
    <p>إجمالي المصروفات: ${totalExpenses.toFixed(2)}</p>
    <p>الرصيد الحالي: ${(totalIncome - totalExpenses).toFixed(2)}</p>
  `;
}

async function renderTasks() {
  const tasks = await getTasksByProject(currentProjectId);
  if (tasks.length === 0) {
    tabContent.innerHTML = '<p>لا توجد مهام.</p>';
    return;
  }
  let html = `<table><thead><tr><th>المهمة</th></tr></thead><tbody>`;
  tasks.forEach(t => {
    html += `<tr><td>${t.title}</td></tr>`;
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
  let html = `<table><thead><tr><th>الاسم</th><th>الوظيفة</th><th>الراتب اليومي</th></tr></thead><tbody>`;
  members.forEach(m => {
    html += `<tr><td>${m.name}</td><td>${m.role || '-'}</td><td>${m.dailySalary || 0}</td></tr>`;
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
  attendanceRecords.forEach(r => {
    html += `<tr>
      <td>${r.employeeName || '-'}</td>
      <td>${r.date}</td>
      <td>${r.checkIn}</td>
      <td>${r.checkOut}</td>
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
    const cls = `type-${t.type}`;
    let desc = t.description || '-';
    if(t.type === 'مبيعات' && t.serviceType){
      desc += ` (الخدمة: ${t.serviceType})`;
    }
    if(t.type === 'راتب' && t.employeeId){
      desc += ` (موظف: ${t.employeeId})`;
    }
    html += `<tr class="${cls}">
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

// ======= بدء التطبيق =======
(async function init() {
  await openDB();
  initEvents();
  await loadProjects();
})();
