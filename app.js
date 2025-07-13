// بيانات المشاريع مخزنة أوفلاين
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = projects.length ? projects[0].id : null;

// العناصر الرئيسية
const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const btnDeleteProject = document.getElementById("btnDeleteProject");
const btnExportProjects = document.getElementById("btnExportProjects");
const btnImportProjects = document.getElementById("btnImportProjects");
const importFileInput = document.getElementById("importFileInput");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");

// حفظ المشاريع في localStorage
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// تحديث تمييز المشروع المحدد بالقائمة
function updateActiveProjectInList() {
  document.querySelectorAll("#projectsList li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === currentProjectId);
  });
}

// عمل رندر لقائمة المشاريع مع فلترة الاسم
function renderProjectsList(filter = "") {
  projectsListEl.innerHTML = "";
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );
  filtered.forEach((project) => {
    const li = document.createElement("li");
    li.textContent = project.name;
    li.dataset.id = project.id;
    if (project.id === currentProjectId) li.classList.add("active");
    li.addEventListener("click", () => selectProject(project.id));
    projectsListEl.appendChild(li);
  });
}

// اختيار مشروع
function selectProject(id) {
  currentProjectId = id;
  updateActiveProjectInList();
  renderTabContent();
}

// إعداد التبويبات
function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTabContent();
    });
  });
}

// بدء التطبيق
function init() {
  if (!currentProjectId && projects.length > 0) currentProjectId = projects[0].id;
  renderProjectsList();
  setupTabs();
  renderTabContent();
}

// --- عرض محتوى التبويب النشط ---
function renderTabContent() {
  const project = projects.find((p) => p.id === currentProjectId);
  if (!project) {
    tabContent.innerHTML = "<p>لا يوجد مشروع محدد.</p>";
    return;
  }

  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "summary";

  switch (activeTab) {
    case "summary":
      renderSummary(project);
      break;
    case "tasks":
      renderTasks(project);
      break;
    case "todo":
      renderToDo(project);
      break;
    case "team":
      renderTeam(project);
      break;
    case "notes":
      renderNotes(project);
      break;
    case "finance":
      renderFinance(project);
      break;
    default:
      tabContent.innerHTML = "<p>تبويب غير معروف.</p>";
  }
}

// -- تبويب الملخص --
function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p><strong>الوصف:</strong> ${project.description || "لا يوجد وصف"}</p>
    <p><strong>تاريخ البداية:</strong> ${project.startDate || "-"}</p>
    <p><strong>تاريخ النهاية المتوقع:</strong> ${project.endDate || "-"}</p>
    <p><strong>ميزانية المشروع:</strong> ${project.budget ? project.budget + " $": "-"}</p>
  `;
}

// -- تبويب المهام --
function renderTasks(project) {
  tabContent.innerHTML = `
    <h3>المهام</h3>
    <button id="btnAddTask" class="btn glass-btn">+ إضافة مهمة جديدة</button>
    <ul id="tasksList" class="list"></ul>
  `;

  document.getElementById("btnAddTask").addEventListener("click", () =>
    openModal("task")
  );

  renderTasksList(project);
}

function renderTasksList(project) {
  const tasksList = document.getElementById("tasksList");
  tasksList.innerHTML = "";
  project.tasks = project.tasks || [];

  project.tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");
    li.innerHTML = `
      <span>${task.title} - الحالة: ${task.status || "معلقة"}</span>
      <button class="list-action-btn" aria-label="حذف مهمة">حذف</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
        project.tasks.splice(index, 1);
        saveProjects();
        renderTasksList(project);
      }
    });
    tasksList.appendChild(li);
  });
}

// -- تبويب To-Do --
function renderToDo(project) {
  tabContent.innerHTML = `
    <h3>قائمة To-Do</h3>
    <button id="btnAddToDo" class="btn glass-btn">+ إضافة عنصر جديد</button>
    <ul id="todoList" class="list"></ul>
  `;

  document.getElementById("btnAddToDo").addEventListener("click", () =>
    openModal("todo")
  );

  renderToDoList(project);
}

function renderToDoList(project) {
  const todoList = document.getElementById("todoList");
  todoList.innerHTML = "";
  project.todo = project.todo || [];

  project.todo.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");
    if (item.completed) li.classList.add("completed");

    li.innerHTML = `
      <label>
        <input type="checkbox" data-index="${index}" ${item.completed ? "checked" : ""} />
        ${item.title} ${item.dueDate ? `- تاريخ الإنجاز: ${item.dueDate}` : ""}
      </label>
      <button class="list-action-btn" aria-label="حذف عنصر To-Do">حذف</button>
    `;

    // تحديث حالة الإنجاز
    li.querySelector("input[type='checkbox']").addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      project.todo[idx].completed = e.target.checked;
      saveProjects();
      renderToDoList(project);
    });

    // حذف عنصر To-Do
    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
        project.todo.splice(index, 1);
        saveProjects();
        renderToDoList(project);
      }
    });

    todoList.appendChild(li);
  });
}

// -- تبويب الفريق --
function renderTeam(project) {
  tabContent.innerHTML = `
    <h3>إدارة الفريق</h3>
    <button id="btnAddMember" class="btn glass-btn">+ إضافة عضو جديد</button>
    <ul id="teamList" class="list"></ul>
  `;

  document.getElementById("btnAddMember").addEventListener("click", () =>
    openModal("member")
  );

  renderTeamList(project);
}

function renderTeamList(project) {
  const teamList = document.getElementById("teamList");
  teamList.innerHTML = "";
  project.team = project.team || [];

  project.team.forEach((member, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");
    li.innerHTML = `
      <span>${member.name} - الدور: ${member.role}</span>
      <button class="list-action-btn" aria-label="حذف عضو الفريق">حذف</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذا العضو؟")) {
        project.team.splice(index, 1);
        saveProjects();
        renderTeamList(project);
      }
    });

    teamList.appendChild(li);
  });
}

// -- تبويب الملاحظات --
function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>الملاحظات العامة</h3>
    <button id="btnAddNote" class="btn glass-btn">+ إضافة ملاحظة جديدة</button>
    <ul id="notesList" class="list"></ul>
  `;

  document.getElementById("btnAddNote").addEventListener("click", () =>
    openModal("note")
  );

  renderNotesList(project);
}

function renderNotesList(project) {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";
  project.notes = project.notes || [];

  project.notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");
    li.innerHTML = `
      <span>${note.text}</span>
      <button class="list-action-btn" aria-label="حذف ملاحظة">حذف</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) {
        project.notes.splice(index, 1);
        saveProjects();
        renderNotesList(project);
      }
    });

    notesList.appendChild(li);
  });
}

// -- تبويب المحاسبة --
const defaultCurrencyRates = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.82,
  JPY: 145.7,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.9,
};

function renderFinance(project) {
  tabContent.innerHTML = `
    <h3>المحاسبة</h3>
    <button id="btnAddTransaction" class="btn glass-btn">+ إضافة معاملة جديدة</button>
    <ul id="transactionsList" class="list"></ul>
  `;

  document.getElementById("btnAddTransaction").addEventListener("click", () =>
    openModal("transaction")
  );

  renderTransactionsList(project);
}

function renderTransactionsList(project) {
  const list = document.getElementById("transactionsList");
  list.innerHTML = "";
  project.transactions = project.transactions || [];

  project.transactions.forEach((t, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");

    li.innerHTML = `
      <span>
        [${t.type}] ${t.amount} $
        - ${t.description || "-"}
        - سعر الصرف: ${t.exchangeRate || 1}
      </span>
      <button class="list-action-btn" aria-label="حذف معاملة">حذف</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
        project.transactions.splice(index, 1);
        saveProjects();
        renderTransactionsList(project);
      }
    });

    list.appendChild(li);
  });
}

// -- مودال الإدخال --
function openModal(type) {
  let html = "";
  switch (type) {
    case "task":
      html = `
        <h3>إضافة مهمة جديدة</h3>
        <input type="text" id="inputTaskTitle" placeholder="عنوان المهمة" />
        <select id="inputTaskStatus">
          <option value="معلقة">معلقة</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مكتملة">مكتملة</option>
        </select>
        <button id="btnSaveTask" class="save-btn">حفظ المهمة</button>
      `;
      break;
    case "todo":
      html = `
        <h3>إضافة عنصر To-Do جديد</h3>
        <input type="text" id="inputToDoTitle" placeholder="العنوان" />
        <input type="date" id="inputToDoDueDate" />
        <button id="btnSaveToDo" class="save-btn">حفظ</button>
      `;
      break;
    case "member":
      html = `
        <h3>إضافة عضو فريق جديد</h3>
        <input type="text" id="inputMemberName" placeholder="الاسم" />
        <input type="text" id="inputMemberRole" placeholder="الدور" />
        <button id="btnSaveMember" class="save-btn">حفظ العضو</button>
      `;
      break;
    case "note":
      html = `
        <h3>إضافة ملاحظة جديدة</h3>
        <textarea id="inputNoteText" placeholder="النص"></textarea>
        <button id="btnSaveNote" class="save-btn">حفظ الملاحظة</button>
      `;
      break;
    case "transaction":
      html = `
        <h3>إضافة معاملة جديدة</h3>
        <select id="inputTransactionType">
          <option value="إيراد">إيراد</option>
          <option value="مصروف">مصروف</option>
        </select>
        <input type="number" id="inputTransactionAmount" placeholder="المبلغ" />
        <input type="text" id="inputTransactionDescription" placeholder="الوصف" />
        <input type="number" id="inputTransactionExchangeRate" placeholder="سعر الصرف" value="1" step="0.0001" />
        <button id="btnSaveTransaction" class="save-btn">حفظ المعاملة</button>
      `;
      break;
  }

  // بناء المودال
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.innerHTML = html;

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.title = "إغلاق";
  closeBtn.addEventListener("click", closeModal);

  modalContent.appendChild(closeBtn);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // أحداث الحفظ
  switch (type) {
    case "task":
      modalContent.querySelector("#btnSaveTask").addEventListener("click", () => {
        saveTask();
        closeModal();
      });
      break;
    case "todo":
      modalContent.querySelector("#btnSaveToDo").addEventListener("click", () => {
        saveToDo();
        closeModal();
      });
      break;
    case "member":
      modalContent.querySelector("#btnSaveMember").addEventListener("click", () => {
        saveMember();
        closeModal();
      });
      break;
    case "note":
      modalContent.querySelector("#btnSaveNote").addEventListener("click", () => {
        saveNote();
        closeModal();
      });
      break;
    case "transaction":
      modalContent.querySelector("#btnSaveTransaction").addEventListener("click", () => {
        saveTransaction();
        closeModal();
      });
      break;
  }
}

function closeModal() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) {
    modal.remove();
    renderTabContent();
  }
}

// --- دوال حفظ بيانات المودال ---
function saveTask() {
  const title = document.getElementById("inputTaskTitle").value.trim();
  const status = document.getElementById("inputTaskStatus").value;
  if (!title) {
    alert("يرجى إدخال عنوان المهمة");
    return;
  }
  const project = projects.find((p) => p.id === currentProjectId);
  project.tasks = project.tasks || [];
  project.tasks.push({ title, status });
  saveProjects();
  renderTasksList(project);
}

function saveToDo() {
  const title = document.getElementById("inputToDoTitle").value.trim();
  const dueDate = document.getElementById("inputToDoDueDate").value;
  if (!title) {
    alert("يرجى إدخال عنوان To-Do");
    return;
  }
  const project = projects.find((p) => p.id === currentProjectId);
  project.todo = project.todo || [];
  project.todo.push({ title, dueDate, completed: false });
  saveProjects();
  renderToDoList(project);
}

function saveMember() {
  const name = document.getElementById("inputMemberName").value.trim();
  const role = document.getElementById("inputMemberRole").value.trim();
  if (!name || !role) {
    alert("يرجى إدخال اسم ودور العضو");
    return;
  }
  const project = projects.find((p) => p.id === currentProjectId);
  project.team = project.team || [];
  project.team.push({ name, role });
  saveProjects();
  renderTeamList(project);
}

function saveNote() {
  const text = document.getElementById("inputNoteText").value.trim();
  if (!text) {
    alert("يرجى إدخال نص الملاحظة");
    return;
  }
  const project = projects.find((p) => p.id === currentProjectId);
  project.notes = project.notes || [];
  project.notes.push({ text });
  saveProjects();
  renderNotesList(project);
}

function saveTransaction() {
  const type = document.getElementById("inputTransactionType").value;
  const amount = parseFloat(document.getElementById("inputTransactionAmount").value);
  const description = document.getElementById("inputTransactionDescription").value.trim();
  let exchangeRate = parseFloat(document.getElementById("inputTransactionExchangeRate").value);
  if (isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  if (isNaN(exchangeRate) || exchangeRate <= 0) exchangeRate = 1;

  const project = projects.find((p) => p.id === currentProjectId);
  project.transactions = project.transactions || [];
  project.transactions.push({ type, amount, description, exchangeRate });
  saveProjects();
  renderTransactionsList(project);
}

// --- إضافة مشروع جديد ---
btnNewProject.addEventListener("click", () => {
  const name = prompt("أدخل اسم المشروع الجديد:");
  if (name && name.trim()) {
    const id = Date.now().toString();
    projects.push({
      id,
      name: name.trim(),
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      tasks: [],
      todo: [],
      team: [],
      notes: [],
      transactions: [],
    });
    saveProjects();
    currentProjectId = id;
    renderProjectsList();
    updateActiveProjectInList();
    renderTabContent();
  }
});

// --- حذف المشروع المحدد ---
btnDeleteProject.addEventListener("click", () => {
  if (!currentProjectId) return alert("لا يوجد مشروع محدد للحذف");
  const idx = projects.findIndex((p) => p.id === currentProjectId);
  if (idx === -1) return;
  if (confirm("هل أنت متأكد من حذف المشروع المحدد؟ ستفقد كل بياناته!")) {
    projects.splice(idx, 1);
    saveProjects();
    if (projects.length) currentProjectId = projects[0].id;
    else currentProjectId = null;
    renderProjectsList();
    updateActiveProjectInList();
    renderTabContent();
  }
});

// --- تصدير المشاريع ---
btnExportProjects.addEventListener("click", () => {
  const dataStr = JSON.stringify(projects, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "projects-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

// --- استيراد المشاريع ---
btnImportProjects.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        projects = imported;
        if (projects.length) currentProjectId = projects[0].id;
        else currentProjectId = null;
        saveProjects();
        renderProjectsList();
        updateActiveProjectInList();
        renderTabContent();
        alert("تم استيراد المشاريع بنجاح!");
      } else alert("الملف غير صالح");
    } catch {
      alert("خطأ في قراءة الملف");
    }
  };
  reader.readAsText(file);
  importFileInput.value = "";
});

// --- البحث في المشاريع ---
projectSearchInput.addEventListener("input", (e) => {
  renderProjectsList(e.target.value);
});

// --- تعديل بيانات الملخص عند تغيّرها ---
tabContent.addEventListener("change", (e) => {
  if (!currentProjectId) return;
  const project = projects.find((p) => p.id === currentProjectId);
  if (!project) return;

  if (["description", "startDate", "endDate", "budget"].includes(e.target.id)) {
    project[e.target.id] = e.target.value;
    saveProjects();
  }
});

// --- عرض حقل تعديل الملخص قابل للكتابة ---
function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <label>الوصف:
      <textarea id="description" placeholder="أدخل وصف المشروع">${project.description || ""}</textarea>
    </label>
    <label>تاريخ البداية:
      <input type="date" id="startDate" value="${project.startDate || ""}" />
    </label>
    <label>تاريخ النهاية المتوقع:
      <input type="date" id="endDate" value="${project.endDate || ""}" />
    </label>
    <label>ميزانية المشروع (بالدولار):
      <input type="number" id="budget" min="0" step="0.01" value="${project.budget || ""}" />
    </label>
  `;
}

// بدء
init();
