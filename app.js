const DB_NAME = 'ProjectManagerDB';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject('فشل فتح قاعدة البيانات');
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('projects')) {
                const projectsStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('tasks')) {
                const tasksStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                tasksStore.createIndex('projectId', 'projectId', { unique: false });
            }
            if (!db.objectStoreNames.contains('accounts')) {
                const accountsStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
                accountsStore.createIndex('projectId', 'projectId', { unique: false });
            }
        };
    });
}

function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('خطأ في الإضافة');
    });
}

function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('خطأ في جلب البيانات');
    });
}

function getDataByIndex(storeName, indexName, indexValue) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(indexValue);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('خطأ في جلب البيانات');
    });
}

function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('خطأ في الحذف');
    });
}

const projectForm = document.getElementById('projectForm');
const projectsList = document.getElementById('projectsList');
const tasksSection = document.getElementById('tasksSection');
const projectsSection = document.getElementById('projectsSection');
const currentProjectName = document.getElementById('currentProjectName');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const backToProjectsBtn = document.getElementById('backToProjects');
const accountForm = document.getElementById('accountForm');
const accountsList = document.getElementById('accountsList');
const accountProjectSelect = document.getElementById('accountProject');
const toggleThemeBtn = document.getElementById('toggleTheme');
const exportDataBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importData');

let selectedProjectId = null;

toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

async function loadProjects() {
    const projects = await getAllData('projects');
    projectsList.innerHTML = '';
    accountProjectSelect.innerHTML = '<option value="">عام</option>';
    projects.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name} - الحالة: ${p.status}`;
        li.style.cursor = 'pointer';
        li.onclick = () => openTasks(p.id, p.name);
        projectsList.appendChild(li);

        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        accountProjectSelect.appendChild(option);
    });
}

async function openTasks(projectId, projectName) {
    selectedProjectId = projectId;
    currentProjectName.textContent = projectName;
    projectsSection.hidden = true;
    tasksSection.hidden = false;
    await loadTasks(projectId);
}

async function loadTasks(projectId) {
    const tasks = await getDataByIndex('tasks', 'projectId', projectId);
    tasksList.innerHTML = '';
    tasks.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `${t.title} - الحالة: ${t.status} - الأولوية: ${t.priority}`;
        tasksList.appendChild(li);
    });
}

backToProjectsBtn.addEventListener('click', () => {
    tasksSection.hidden = true;
    projectsSection.hidden = false;
    selectedProjectId = null;
});

projectForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newProject = {
        name: projectForm.projectName.value.trim(),
        description: projectForm.projectDesc.value.trim(),
        startDate: projectForm.projectStart.value,
        endDate: projectForm.projectEnd.value,
        status: projectForm.projectStatus.value,
    };
    await addData('projects', newProject);
    projectForm.reset();
    await loadProjects();
});

taskForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!selectedProjectId) return alert('اختر مشروع أولاً');
    const newTask = {
        projectId: selectedProjectId,
        title: taskForm.taskTitle.value.trim(),
        description: taskForm.taskDesc.value.trim(),
        dueDate: taskForm.taskDue.value,
        priority: taskForm.taskPriority.value,
        status: taskForm.taskStatus.value,
    };
    await addData('tasks', newTask);
    taskForm.reset();
    await loadTasks(selectedProjectId);
});

async function loadAccounts() {
    const accounts = await getAllData('accounts');
    accountsList.innerHTML = '';
    accounts.forEach(acc => {
        const projectText = acc.projectId ? ` (مشروع: ${acc.projectName || acc.projectId})` : '';
        const li = document.createElement('li');
        li.textContent = `${acc.type === 'income' ? 'إيراد' : 'مصروف'}: ${acc.amount} - ${acc.category} - ${acc.date}${projectText}`;
        accountsList.appendChild(li);
    });
}

accountForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newAccount = {
        type: accountForm.accountType.value,
        amount: parseFloat(accountForm.accountAmount.value),
        date: accountForm.accountDate.value,
        category: accountForm.accountCategory.value.trim() || 'عام',
        projectId: accountForm.accountProject.value || null,
    };
    await addData('accounts', newAccount);
    accountForm.reset();
    await loadAccounts();
});

exportDataBtn.addEventListener('click', async () => {
    const projects = await getAllData('projects');
    const tasks = await getAllData('tasks');
    const accounts = await getAllData('accounts');
    const data = { projects, tasks, accounts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_manager_backup.json';
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const data = JSON.parse(reader.result);
            await importData(data);
            alert('تم استيراد البيانات بنجاح');
            await loadProjects();
            await loadAccounts();
            if (selectedProjectId) await loadTasks(selectedProjectId);
        } catch {
            alert('خطأ في استيراد البيانات');
        }
    };
    reader.readAsText(file);
});

async function importData(data) {
    if (!data) return;
    await clearStore('projects');
    await clearStore('tasks');
    await clearStore('accounts');

    for (const p of data.projects || []) {
        await addData('projects', p);
    }
    for (const t of data.tasks || []) {
        await addData('tasks', t);
    }
    for (const a of data.accounts || []) {
        await addData('accounts', a);
    }
}

function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject('خطأ في مسح البيانات');
    });
}

(async () => {
    await openDB();
    await loadProjects();
    await loadAccounts();
})();