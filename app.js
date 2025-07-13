// بيانات المشاريع مخزنة في localStorage
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = projects.length ? projects[0].id : null;

// العناصر الرئيسية
const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

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

// أضفت وصف + خيرات + فريق + ميزانية بشكل مبسط في الملخص
function renderSummary(project) {
  const budget = project.budget ? project.budget.toLocaleString() + " USD" : "-";
  const teamCount = project.team ? project.team.length : 0;
  const resources = project.resources || "-";

  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p><strong>الوصف:</strong> ${project.description || "لا يوجد وصف"}</p>
    <p><strong>تاريخ البداية:</strong> ${project.startDate || "-"}</p>
    <p><strong>تاريخ النهاية المتوقع:</strong> ${project.endDate || "-"}</p>
    <p><strong>الموارد / الخيرات:</strong> ${resources}</p>
    <p><strong>عدد أعضاء الفريق:</strong> ${teamCount}</p>
    <p><strong>الميزانية:</strong> ${budget}</p>
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
    <h3>المحاسبة المالية</h3>
    <p><strong>الميزانية الكلية:</strong> ${project.budget ? project.budget.toLocaleString() + " USD" : "-"}</p>
    <button id="btnAddFinance" class="btn glass-btn">+ إضافة عملية مالية</button>
    <ul id="financeList" class="list"></ul>
  `;

  document.getElementById("btnAddFinance").addEventListener("click", () =>
    openModal("finance")
  );

  renderFinanceList(project);
}

function renderFinanceList(project) {
  const financeList = document.getElementById("financeList");
  financeList.innerHTML = "";
  project.finance = project.finance || [];

  project.finance.forEach((entry, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");
    li.innerHTML = `
      <span>${entry.type} - المبلغ: ${entry.amount.toLocaleString()} ${entry.currency} - التاريخ: ${entry.date}</span>
      <button class="list-action-btn" aria-label="حذف عملية مالية">حذف</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذه العملية؟")) {
        project.finance.splice(index, 1);
        saveProjects();
        renderFinanceList(project);
      }
    });

    financeList.appendChild(li);
  });
}

// -- فتح المودال لإضافة عناصر --
function openModal(type) {
  modalForm.innerHTML = "";
  modalTitle.textContent = "";

  const project = projects.find((p) => p.id === currentProjectId);

  if (!project) return;

  switch (type) {
    case "project":
      modalTitle.textContent = "إضافة مشروع جديد";
      modalForm.innerHTML = `
        <label>اسم المشروع:</label>
        <input type="text" id="inputName" required />
        <label>الوصف:</label>
        <textarea id="inputDescription" rows="3"></textarea>
        <label>تاريخ البداية:</label>
        <input type="date" id="inputStartDate" />
        <label>تاريخ النهاية المتوقع:</label>
        <input type="date" id="inputEndDate" />
        <label>الموارد / الخيرات:</label>
        <input type="text" id="inputResources" placeholder="مثل: معدات، موظفين،..." />
        <label>الميزانية (USD):</label>
        <input type="number" id="inputBudget" min="0" step="0.01" />
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById("inputName").value.trim();
        if (!name) return alert("الرجاء إدخال اسم المشروع.");
        const newProject = {
          id: generateId(),
          name,
          description: document.getElementById("inputDescription").value.trim(),
          startDate: document.getElementById("inputStartDate").value || null,
          endDate: document.getElementById("inputEndDate").value || null,
          resources: document.getElementById("inputResources").value.trim(),
          budget: parseFloat(document.getElementById("inputBudget").value) || 0,
          tasks: [],
          todo: [],
          team: [],
          notes: [],
          finance: [],
        };
        projects.push(newProject);
        saveProjects();
        currentProjectId = newProject.id;
        closeModal();
        renderProjectsList();
        updateActiveProjectInList();
        renderTabContent();
      };
      break;

    case "task":
      modalTitle.textContent = "إضافة مهمة جديدة";
      modalForm.innerHTML = `
        <label>عنوان المهمة:</label>
        <input type="text" id="inputTaskTitle" required />
        <label>الحالة:</label>
        <select id="inputTaskStatus">
          <option value="معلقة">معلقة</option>
          <option value="جارية">جارية</option>
          <option value="مكتملة">مكتملة</option>
        </select>
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById("inputTaskTitle").value.trim();
        if (!title) return alert("الرجاء إدخال عنوان المهمة.");
        project.tasks.push({
          title,
          status: document.getElementById("inputTaskStatus").value,
        });
        saveProjects();
        closeModal();
        renderTasks(project);
      };
      break;

    case "todo":
      modalTitle.textContent = "إضافة عنصر To-Do";
      modalForm.innerHTML = `
        <label>العنوان:</label>
        <input type="text" id="inputToDoTitle" required />
        <label>تاريخ الاستحقاق:</label>
        <input type="date" id="inputToDoDueDate" />
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById("inputToDoTitle").value.trim();
        if (!title) return alert("الرجاء إدخال العنوان.");
        project.todo.push({
          title,
          dueDate: document.getElementById("inputToDoDueDate").value || null,
          completed: false,
        });
        saveProjects();
        closeModal();
        renderToDo(project);
      };
      break;

    case "member":
      modalTitle.textContent = "إضافة عضو فريق جديد";
      modalForm.innerHTML = `
        <label>اسم العضو:</label>
        <input type="text" id="inputMemberName" required />
        <label>الدور الوظيفي:</label>
        <input type="text" id="inputMemberRole" />
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById("inputMemberName").value.trim();
        if (!name) return alert("الرجاء إدخال اسم العضو.");
        project.team.push({
          name,
          role: document.getElementById("inputMemberRole").value.trim(),
        });
        saveProjects();
        closeModal();
        renderTeam(project);
      };
      break;

    case "note":
      modalTitle.textContent = "إضافة ملاحظة جديدة";
      modalForm.innerHTML = `
        <label>الملاحظة:</label>
        <textarea id="inputNoteText" rows="3" required></textarea>
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const text = document.getElementById("inputNoteText").value.trim();
        if (!text) return alert("الرجاء إدخال نص الملاحظة.");
        project.notes.push({ text });
        saveProjects();
        closeModal();
        renderNotes(project);
      };
      break;

    case "finance":
      modalTitle.textContent = "إضافة عملية مالية";
      modalForm.innerHTML = `
        <label>نوع العملية:</label>
        <select id="inputFinanceType" required>
          <option value="" disabled selected>اختر نوع العملية</option>
          <option value="دخل">دخل</option>
          <option value="مصروف">مصروف</option>
        </select>
        <label>المبلغ:</label>
        <input type="number" id="inputFinanceAmount" min="0" step="0.01" required />
        <label>العملة:</label>
        <select id="inputFinanceCurrency" required>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
          <option value="SAR">SAR</option>
          <option value="AED">AED</option>
          <option value="EGP">EGP</option>
        </select>
        <label>التاريخ:</label>
        <input type="date" id="inputFinanceDate" required />
        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const type = document.getElementById("inputFinanceType").value;
        const amount = parseFloat(document.getElementById("inputFinanceAmount").value);
        const currency = document.getElementById("inputFinanceCurrency").value;
        const date = document.getElementById("inputFinanceDate").value;

        if (!type) return alert("اختر نوع العملية.");
        if (!amount || amount <= 0) return alert("أدخل مبلغًا صالحًا.");
        if (!date) return alert("حدد التاريخ.");

        project.finance.push({ type, amount, currency, date });
        saveProjects();
        closeModal();
        renderFinance(project);
      };
      break;
  }

  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalForm.innerHTML = "";
}

// توليد معرف فريد عشوائي
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// أحداث
btnNewProject.addEventListener("click", () => openModal("project"));

modalCancel.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

projectSearchInput.addEventListener("input", () => {
  renderProjectsList(projectSearchInput.value);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
    closeModal();
  }
});

// بداية التطبيق
init();
