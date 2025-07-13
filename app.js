// بيانات المشاريع مخزنة أوفلاين
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = null;

const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

renderProjectsList();
selectProject(projects.length ? projects[0].id : null);
setupTabs();
setupEventListeners();

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

function selectProject(id) {
  currentProjectId = id;
  updateActiveProjectInList();
  renderTabContent();
}

function updateActiveProjectInList() {
  document.querySelectorAll("#projectsList li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id == currentProjectId);
  });
}

function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTabContent();
    });
  });
}

function renderTabContent() {
  const project = projects.find((p) => p.id === currentProjectId);
  const activeTab = document.querySelector(".tab.active").dataset.tab;
  if (!project) {
    tabContent.innerHTML = "<p>لا يوجد مشروع محدد.</p>";
    return;
  }
  switch (activeTab) {
    case "summary":
      renderSummary(project);
      break;
    case "tasks":
      renderTasks(project);
      break;
    case "team":
      renderTeam(project);
      break;
    case "finance":
      renderFinance(project);
      break;
    case "todo":
      renderTodo(project);
      break;
    case "notes":
      renderNotes(project);
      break;
  }
}

function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p>الوصف: ${project.description || "لا يوجد وصف"}</p>
    <p>تاريخ البداية: ${project.startDate || "-"}</p>
    <p>تاريخ النهاية المتوقع: ${project.endDate || "-"}</p>
  `;
}

function renderTasks(project) {
  tabContent.innerHTML = `
    <h3>المهام</h3>
    <button id="btnAddTask" class="btn glass-btn">+ إضافة مهمة جديدة</button>
    <ul id="tasksList"></ul>
  `;
  document.getElementById("btnAddTask").addEventListener("click", () =>
    openModal("task")
  );
  renderTasksList(project);
}

function renderTasksList(project) {
  const tasksList = document.getElementById("tasksList");
  tasksList.innerHTML = "";
  if (!project.tasks) project.tasks = [];
  project.tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.textContent = `${task.title} - الحالة: ${task.status || "معلقة"}`;
    tasksList.appendChild(li);
  });
}

function renderTeam(project) {
  tabContent.innerHTML = `
    <h3>إدارة الفريق</h3>
    <button id="btnAddMember" class="btn glass-btn">+ إضافة عضو جديد</button>
    <ul id="teamList"></ul>
  `;
  document.getElementById("btnAddMember").addEventListener("click", () =>
    openModal("member")
  );
  renderTeamList(project);
}

function renderTeamList(project) {
  const teamList = document.getElementById("teamList");
  teamList.innerHTML = "";
  if (!project.team) project.team = [];
  project.team.forEach((member) => {
    const li = document.createElement("li");
    li.textContent = `${member.name} - الدور: ${member.role}`;
    teamList.appendChild(li);
  });
}

function renderFinance(project) {
  const defaultCurrencyRates = {
    USD: 1,
    EUR: 0.95,
    GBP: 0.82,
    JPY: 145.7,
    SAR: 3.75,
    AED: 3.67,
    EGP: 30.9,
  };

  tabContent.innerHTML = `
    <h3>المحاسبة</h3>
    <button id="btnAddTransaction" class="btn glass-btn">+ إضافة معاملة جديدة</button>
    <div style="margin-bottom:10px;">
      <label for="currencySelect">اختيار العملة:</label>
      <select id="currencySelect" style="margin-left:10px; padding:5px; border-radius:5px;">
        ${Object.keys(defaultCurrencyRates)
          .map(
            (c) =>
              `<option value="${c}" ${
                c === (project.selectedCurrency || "USD") ? "selected" : ""
              }>${c}</option>`
          )
          .join("")}
      </select>
    </div>
    <ul id="transactionsList"></ul>
    <p>الرصيد الحالي: <span id="currentBalance">0</span> ${project.selectedCurrency || "USD"}</p>
  `;

  document
    .getElementById("btnAddTransaction")
    .addEventListener("click", () => openModal("transaction"));

  document.getElementById("currencySelect").addEventListener("change", (e) => {
    project.selectedCurrency = e.target.value;
    saveProjects();
    renderFinance(project);
  });

  renderTransactionsList(project);
}

function renderTransactionsList(project) {
  const list = document.getElementById("transactionsList");
  list.innerHTML = "";
  if (!project.transactions) project.transactions = [];
  let balance = 0;
  project.transactions.forEach((t) => {
    let rate = parseFloat(t.exchangeRate);
    if (!rate || rate <= 0) rate = 1;
    const amountInSelected = t.amount * rate;
    balance += t.type === "إيراد" ? amountInSelected : -amountInSelected;
    const li = document.createElement("li");
    li.textContent = `[${t.type}] ${t.description || ""} : ${amountInSelected.toFixed(
      2
    )} ${project.selectedCurrency || "USD"}`;
    list.appendChild(li);
  });
  document.getElementById("currentBalance").textContent = balance.toFixed(2);
}

function renderTodo(project) {
  tabContent.innerHTML = `
    <h3>قائمة To-Do</h3>
    <form id="todoForm">
      <input type="text" id="todoText" placeholder="أضف مهمة جديدة..." required />
      <input type="date" id="todoDate" />
      <button type="submit" class="btn glass-btn">إضافة</button>
    </form>
    <ul id="todoList"></ul>
  `;
  document.getElementById("todoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const textInput = document.getElementById("todoText");
    const dateInput = document.getElementById("todoDate");
    const text = textInput.value.trim();
    const dueDate = dateInput.value;
    if (!text) return alert("يجب إدخال نص المهمة");
    if (!project.todo) project.todo = [];
    project.todo.push({ text, dueDate, done: false });
    saveProjects();
    renderTodo(project);
  });
  renderTodoList(project);
}

function renderTodoList(project) {
  const list = document.getElementById("todoList");
  list.innerHTML = "";
  if (!project.todo) project.todo = [];
  project.todo.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
      <label>
        <input type="checkbox" data-index="${index}" ${item.done ? "checked" : ""} />
        <span>${item.text} ${item.dueDate ? `(تاريخ: ${item.dueDate})` : ""}</span>
      </label>
      <button data-index="${index}" class="btn cancel-btn btn-delete-todo">حذف</button>
    `;
    li.querySelector("input[type=checkbox]").addEventListener("change", (e) => {
      project.todo[e.target.dataset.index].done = e.target.checked;
      saveProjects();
      renderTodoList(project);
    });
    li.querySelector(".btn-delete-todo").addEventListener("click", (e) => {
      const idx = e.target.dataset.index;
      project.todo.splice(idx, 1);
      saveProjects();
      renderTodoList(project);
    });
    list.appendChild(li);
  });
}

function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>الملاحظات العامة</h3>
    <form id="notesForm">
      <input type="text" id="noteText" placeholder="أضف ملاحظة جديدة..." required />
      <button type="submit" class="btn glass-btn">إضافة</button>
    </form>
    <ul id="notesList"></ul>
  `;
  document.getElementById("notesForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const textInput = document.getElementById("noteText");
    const text = textInput.value.trim();
    if (!text) return alert("يجب إدخال نص الملاحظة");
    if (!project.notes) project.notes = [];
    project.notes.push({ text });
    saveProjects();
    renderNotes(project);
  });
  renderNotesList(project);
}

function renderNotesList(project) {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";
  if (!project.notes) project.notes = [];
  project.notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.className = "note-item";
    li.innerHTML = `
      <span>${note.text}</span>
      <button data-index="${index}" class="btn cancel-btn btn-delete-note">حذف</button>
    `;
    li.querySelector(".btn-delete-note").addEventListener("click", (e) => {
      const idx = e.target.dataset.index;
      project.notes.splice(idx, 1);
      saveProjects();
      renderNotesList(project);
    });
    notesList.appendChild(li);
  });
}

function openModal(type) {
  modalOverlay.classList.remove("hidden");
  modalForm.innerHTML = "";

  switch (type) {
    case "project":
      modalTitle.textContent = "إنشاء مشروع جديد";
      modalForm.innerHTML = `
        <label for="projectName">اسم المشروع *</label>
        <input id="projectName" name="projectName" type="text" required />

        <label for="projectDescription">الوصف</label>
        <input id="projectDescription" name="projectDescription" type="text" />

        <label for="projectStart">تاريخ البداية</label>
        <input id="projectStart" name="projectStart" type="date" />

        <label for="projectEnd">تاريخ النهاية</label>
        <input id="projectEnd" name="projectEnd" type="date" />

        <button type="submit" class="btn glass-btn">إنشاء</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const name = modalForm.projectName.value.trim();
        if (!name) return alert("يجب إدخال اسم المشروع");
        const description = modalForm.projectDescription.value.trim();
        const startDate = modalForm.projectStart.value;
        const endDate = modalForm.projectEnd.value;
        const id = Date.now().toString();
        projects.push({
          id,
          name,
          description,
          startDate,
          endDate,
          tasks: [],
          team: [],
          transactions: [],
          todo: [],
          notes: [],
          selectedCurrency: "USD",
        });
        saveProjects();
        renderProjectsList();
        selectProject(id);
        closeModal();
      };
      break;

    case "task":
      modalTitle.textContent = "إضافة مهمة جديدة";
      modalForm.innerHTML = `
        <label for="taskTitle">عنوان المهمة *</label>
        <input id="taskTitle" name="taskTitle" type="text" required />

        <label for="taskStatus">الحالة</label>
        <select id="taskStatus" name="taskStatus">
          <option value="معلقة">معلقة</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مكتملة">مكتملة</option>
        </select>

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.taskTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان المهمة");
        const status = modalForm.taskStatus.value;
        const project = projects.find((p) => p.id === currentProjectId);
        project.tasks.push({ title, status });
        saveProjects();
        renderTasksList(project);
        closeModal();
      };
      break;

    case "member":
      modalTitle

  
