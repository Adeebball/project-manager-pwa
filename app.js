let db;
let currentProjectId = null;

// ==== فتح قاعدة البيانات ====
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProjectManagerDB', 1);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        const store = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
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

    request.onerror = () => reject('فشل بفتح قاعدة البيانات');
  });
}

// ==== دوال CRUD للمشاريع ====
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

// دوال CRUD لباقي الكيانات (مهام، أعضاء، معاملات) مشابهة ويمكن إضافتها عند الطلب...

// ==== عناصر DOM ====
const btnNewProject = document.getElementById('btnNewProject');
const btnAddTask = document.getElementById('btnAddTask');
const btnAddMember = document.getElementById('btnAddMember');
const btnAddTransaction = document.getElementById('btnAddTransaction');

const modalOverlay = document.getElementById('modalOverlay');
const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
const modalCancel = document.getElementById('modalCancel');

const projectsList = document.getElementById('projectsList');

// ==== التهيئة ====
async function init() {
  await openDB();
  await renderProjectsList();
  bindEvents();
  hideProjectDetails();
}

function bindEvents() {
  // فتح مودال إضافة مشروع جديد
  btnNewProject.addEventListener('click', () => openModal('project'));

  // فتح مودال إضافة مهمة جديدة - فقط إذا يوجد مشروع مفتوح
  btnAddTask.addEventListener('click', () => {
    if (!currentProjectId) return alert('يرجى فتح مشروع أولاً');
    openModal('task');
  });

  // فتح مودال إضافة عضو جديد
  btnAddMember.addEventListener('click', () => {
    if (!currentProjectId) return alert('يرجى فتح مشروع أولاً');
    openModal('member');
  });

  // فتح مودال إضافة معاملة مالية
  btnAddTransaction.addEventListener('click', () => {
    if (!currentProjectId) return alert('يرجى فتح مشروع أولاً');
    openModal('transaction');
  });

  // إغلاق المودال
  modalCancel.addEventListener('click', () => closeModal());

  // حفظ بيانات النماذج عند الإرسال
  modalForm.addEventListener('submit', onModalSubmit);
}

function openModal(type, data = {}) {
  modalForm.dataset.type = type;
  modalForm.dataset.editingId = data.id || '';
  modalTitle.textContent = {
    project: data.id ? 'تعديل مشروع' : 'إضافة مشروع جديد',
    task: data.id ? 'تعديل مهمة' : 'إضافة مهمة جديدة',
    member: data.id ? 'تعديل عضو' : 'إضافة عضو جديد',
    transaction: data.id ? 'تعديل معاملة مالية' : 'إضافة معاملة مالية',
  }[type];

  // بناء نموذج المودال حسب النوع (مثال مبسط فقط)
  if (type === 'project') {
    modalForm.innerHTML = `
      <label>اسم المشروع<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required placeholder="اسم المشروع" value="${data.name || ''}" />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'task') {
    modalForm.innerHTML = `
      <label>عنوان المهمة<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="title" required placeholder="عنوان المهمة" value="${data.title || ''}" />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'member') {
    modalForm.innerHTML = `
      <label>اسم العضو<span style="color:#ff6b6b;">*</span></label>
      <input type="text" name="name" required placeholder="اسم العضو" value="${data.name || ''}" />
      <button type="submit">حفظ</button>
    `;
  } else if (type === 'transaction') {
    modalForm.innerHTML = `
      <label>المبلغ<span style="color:#ff6b6b;">*</span></label>
      <input type="number" name="amount" required placeholder="المبلغ" value="${data.amount || ''}" />
      <button type="submit">حفظ</button>
    `;
  }

  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalForm.reset();
  modalForm.dataset.type = '';
  modalForm.dataset.editingId = '';
}

async function onModalSubmit(e) {
  e.preventDefault();
  const type = modalForm.dataset.type;
  const editingId = modalForm.dataset.editingId;
  const formData = new FormData(modalForm);

  try {
    if (type === 'project') {
      const projectData = {
        name: formData.get('name').trim(),
      };
      if (!projectData.name) throw new Error('اسم المشروع مطلوب');

      if (editingId) {
        projectData.id = Number(editingId);
        await updateProject(projectData);
      } else {
        await addProject(projectData);
      }
      await renderProjectsList();

    } else if (type === 'task') {
      if (!currentProjectId) throw new Error('لا يوجد مشروع مفتوح');
      const taskData = {
        projectId: currentProjectId,
        title: formData.get('title').trim(),
      };
      if (!taskData.title) throw new Error('عنوان المهمة مطلوب');
      if (editingId) {
        taskData.id = Number(editingId);
        await updateTask(taskData);
      } else {
        await addTask(taskData);
      }
      await renderTasksList(currentProjectId);

    } else if (type === 'member') {
      if (!currentProjectId) throw new Error('لا يوجد مشروع مفتوح');
      const memberData = {
        projectId: currentProjectId,
        name: formData.get('name').trim(),
      };
      if (!memberData.name) throw new Error('اسم العضو مطلوب');
      if (editingId) {
        memberData.id = Number(editingId);
        await updateMember(memberData);
      } else {
        await addMember(memberData);
      }
      await renderTeamList(currentProjectId);

    } else if (type === 'transaction') {
      if (!currentProjectId) throw new Error('لا يوجد مشروع مفتوح');
      const transactionData = {
        projectId: currentProjectId,
        amount: parseFloat(formData.get('amount')),
      };
      if (isNaN(transactionData.amount) || transactionData.amount <= 0) throw new Error('يرجى إدخال مبلغ صحيح');
      if (editingId) {
        transactionData.id = Number(editingId);
        await updateTransaction(transactionData);
      } else {
        await addTransaction(transactionData);
      }
      await renderTransactionsList(currentProjectId);
    }

    closeModal();
  } catch (err) {
    alert(err.message);
  }
}

// ==== عرض المشاريع ====
async function renderProjectsList() {
  const projects = await getAllProjects();
  projectsList.innerHTML = '';
  if (projects.length === 0) {
    projectsList.innerHTML = '<li>لا توجد مشاريع</li>';
    return;
  }
  projects.forEach(proj => {
    const li = document.createElement('li');
    li.textContent = proj.name;
    li.onclick = () => openProject(proj.id);
    projectsList.appendChild(li);
  });
}

// ==== فتح مشروع ====
async function openProject(id) {
  currentProjectId = id;
  // هنا أكمل تحميل بيانات المشروع ومحتوياته (مهام، أعضاء، معاملات، تقارير)
  alert(`تم فتح المشروع رقم ${id} - عليك تكملة الوظائف اللازمة`);
}

// ==== باقي الدوال (updateTask, addTask, updateMember, addMember, updateTransaction, addTransaction, renderTasksList, renderTeamList, renderTransactionsList) يجب إضافتها أو استكمالها بناء على المشروع السابق ====

// استدعاء التهيئة
init();
