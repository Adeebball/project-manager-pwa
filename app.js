// ======= بيانات المشاريع =======
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = null;

// إعدادات عامة للتطبيق (مخزنة في localStorage)
let appSettings = JSON.parse(localStorage.getItem("appSettings") || `{
  "defaultCurrency": "USD",
  "username": "مستخدم",
  "features": {
    "enableNotes": true,
    "enableGoals": true
  }
}`);

const defaultCurrencyRates = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.82,
  JPY: 145.7,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.9,
};

// ======= العناصر DOM =======
const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const btnSettings = document.getElementById("btnSettings");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

// ======= بدء التشغيل =======
renderProjectsList();
selectProject(projects.length ? projects[0].id : null);
setupTabs();
setupEventListeners();

// ======= دوال التفاعل =======

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
  if (!currentProjectId) {
    tabContent.innerHTML = "<p>لا يوجد مشروع محدد.</p>";
    return;
  }
  const project = projects.find((p) => p.id === currentProjectId);
  if (!project) {
    tabContent.innerHTML = "<p>المشروع غير موجود.</p>";
    return;
  }
  const activeTab = document.querySelector(".tab.active").dataset.tab;

  switch (activeTab) {
    case "summary":
      renderSummary(project);
      break;
    case "tasks":
      renderTasks(project);
      break;
    case "todo":
      renderTodo(project);
      break;
    case "team":
      renderTeam(project);
      break;
    case "goals":
      if (!appSettings.features.enableGoals) {
        tabContent.innerHTML = "<p>ميزة الأهداف غير مفعلة.</p>";
        return;
      }
      renderGoals(project);
      break;
    case "notes":
      if (!appSettings.features.enableNotes) {
        tabContent.innerHTML = "<p>ميزة الملاحظات غير مفعلة.</p>";
        return;
      }
      renderNotes(project);
      break;
    case "finance":
      renderFinance(project);
      break;
    default:
      tabContent.innerHTML = "<p>التبويب غير موجود.</p>";
  }
}

// ====== تبويب ملخص المشروع =======
function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p>الوصف: ${project.description || "لا يوجد وصف"}</p>
    <p>تاريخ البداية: ${project.startDate || "-"}</p>
    <p>تاريخ النهاية المتوقع: ${project.endDate || "-"}</p>
  `;
}

// ====== تبويب المهام مع To-Do داخل كل مهمة =======
function renderTasks(project) {
  tabContent.innerHTML = `
    <h3>المهام</h3>
    <button id="btnAddTask" class="btn glass-btn">+ إضافة مهمة جديدة</button>
    <ul id="tasksList"></ul>
  `;

  document.getElementById("btnAddTask").addEventListener("click", () => openModal("task"));

  renderTasksList(project);
}

function renderTasksList(project) {
  const tasksList = document.getElementById("tasksList");
  tasksList.innerHTML = "";

  if (!project.tasks) project.tasks = [];

  project.tasks.forEach((task, taskIndex) => {
    const li = document.createElement("li");
    li.style.marginBottom = "12px";
    li.innerHTML = `
      <strong>${task.title}</strong> - الحالة: ${task.status || "معلقة"} 
      <button class="btn glass-btn btnAddTodo" data-task-index="${taskIndex}" style="margin-right:10px;">+ To-Do</button>
      <ul class="todoList" style="margin-top:6px; list-style-type: disc; padding-left: 20px;"></ul>
    `;

    tasksList.appendChild(li);

    // عرض قائمة الـ To-Do لكل مهمة
    const todoUl = li.querySelector(".todoList");
    if (task.todos && task.todos.length) {
      task.todos.forEach((todo, todoIndex) => {
        const todoLi = document.createElement("li");
        todoLi.textContent = todo.title;
        todoLi.style.textDecoration = todo.done ? "line-through" : "none";
        todoLi.style.cursor = "pointer";
        todoLi.title = "اضغط لتغيير الحالة";

        todoLi.addEventListener("click", () => {
          todo.done = !todo.done;
          saveProjects();
          renderTasksList(project);
        });
        todoUl.appendChild(todoLi);
      });
    }
  });

  // أزرار إضافة To-Do لكل مهمة
  tasksList.querySelectorAll(".btnAddTodo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskIndex = parseInt(btn.dataset.taskIndex);
      openModal("todo", { taskIndex, project });
    });
  });
}

// ====== تبويب To-Do مركزي (جميع To-Dos بكل المهام) =======
function renderTodo(project) {
  tabContent.innerHTML = `
    <h3>قائمة To-Do لجميع المهام</h3>
    <ul id="allTodoList"></ul>
  `;

  const allTodoList = document.getElementById("allTodoList");
  allTodoList.innerHTML = "";

  if (!project.tasks) project.tasks = [];

  project.tasks.forEach((task, taskIndex) => {
    if (task.todos && task.todos.length) {
      const taskTitleLi = document.createElement("li");
      taskTitleLi.innerHTML = `<strong>المهمة: ${task.title}</strong>`;
      allTodoList.appendChild(taskTitleLi);

      task.todos.forEach((todo, todoIndex) => {
        const todoLi = document.createElement("li");
        todoLi.textContent = todo.title;
        todoLi.style.textDecoration = todo.done ? "line-through" : "none";
        todoLi.style.cursor = "pointer";
        todoLi.title = `اضغط لتغيير حالة To-Do (المهمة: ${task.title})`;

        todoLi.addEventListener("click", () => {
          todo.done = !todo.done;
          saveProjects();
          renderTodo(project);
        });

        allTodoList.appendChild(todoLi);
      });
    }
  });
}

// ====== تبويب الفريق =======
function renderTeam(project) {
  tabContent.innerHTML = `
    <h3>إدارة الفريق</h3>
    <button id="btnAddMember" class="btn glass-btn">+ إضافة عضو جديد</button>
    <ul id="teamList"></ul>
  `;
  document.getElementById("btnAddMember").addEventListener("click", () => openModal("member"));
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

// ====== تبويب الأهداف =======
function renderGoals(project) {
  tabContent.innerHTML = `
    <h3>الأهداف</h3>
    <button id="btnAddGoal" class="btn glass-btn">+ إضافة هدف جديد</button>
    <ul id="goalsList"></ul>
  `;
  document.getElementById("btnAddGoal").addEventListener("click", () => openModal("goal"));
  renderGoalsList(project);
}

function renderGoalsList(project) {
  const goalsList = document.getElementById("goalsList");
  goalsList.innerHTML = "";
  if (!project.goals) project.goals = [];
  project.goals.forEach((goal, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${goal.title} - ${goal.progress || 0}% 
      <button class="btn glass-btn btnEditGoal" data-goal-index="${index}" style="margin-left:10px;">تعديل</button>
      <progress value="${goal.progress || 0}" max="100"></progress>
    `;
    goalsList.appendChild(li);
  });

  // أزرار تعديل الأهداف
  goalsList.querySelectorAll(".btnEditGoal").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.goalIndex);
      openModal("goalEdit", { goalIndex: index, project });
    });
  });
}

// ====== تبويب الملاحظات (الملصقات) =======
function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>الملاحظات العامة</h3>
    <button id="btnAddNote" class="btn glass-btn">+ إضافة ملاحظة جديدة</button>
    <ul id="notesList"></ul>
  `;
  document.getElementById("btnAddNote").addEventListener("click", () => openModal("note"));
  renderNotesList(project);
}

function renderNotesList(project) {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";
  if (!project.notes) project.notes = [];
  project.notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = note;
    li.style.cursor = "pointer";
    li.title = "اضغط للحذف";
    li.addEventListener("click", () => {
      if (confirm("هل تريد حذف هذه الملاحظة؟")) {
        project.notes.splice(index, 1);
        saveProjects();
        renderNotesList(project);
      }
    });
    notesList.appendChild(li);
  });
}

// ====== تبويب المحاسبة =======
function renderFinance(project) {
  tabContent.innerHTML = `
    <h3>المحاسبة</h3>
    <button id="btnAddTransaction" class="btn glass-btn">+ إضافة معاملة جديدة</button>
    <div style="margin-bottom:10px;">
      <label for="currencySelect">اختيار العملة:</label>
      <select id="currencySelect" style="margin-left:10px; padding:5px; border-radius:5px;">
        ${Object.keys(project.currencyRates || defaultCurrencyRates)
          .map(
            (c) =>
              `<option value="${c}" ${
                c === (project.selectedCurrency || appSettings.defaultCurrency)
                  ? "selected"
                  : ""
              }>${c}</option>`
          )
          .join("")}
      </select>
    </div>
    <ul id="transactionsList"></ul>
    <p>الرصيد الحالي: <span id="currentBalance">0</span> ${project.selectedCurrency || appSettings.defaultCurrency}</p>
  `;

  document.getElementById("btnAddTransaction").addEventListener("click", () => openModal("transaction"));

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
    if (!rate || rate <= 0) rate = 1; // افتراضياً 1 لو ما تم تعيين سعر
    const amountInSelected = t.amount * rate;
    balance += t.type === "إيراد" ? amountInSelected : -amountInSelected;
    const li = document.createElement("li");
    li.textContent = `[${t.type}] ${t.description || ""} : ${amountInSelected.toFixed(2)} ${project.selectedCurrency || appSettings.defaultCurrency}`;
    list.appendChild(li);
  });
  document.getElementById("currentBalance").textContent = balance.toFixed(2);
}

// ====== فتح المودال حسب نوع العملية =======
function openModal(type, options = {}) {
  modalOverlay.classList.remove("hidden");
  modalForm.innerHTML = "";
  modalTitle.textContent = "";

  const project = projects.find((p) => p.id === currentProjectId);

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
          goals: [],
          notes: [],
          transactions: [],
          selectedCurrency: appSettings.defaultCurrency,
          currencyRates: { ...defaultCurrencyRates },
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
        if (!project.tasks) project.tasks = [];
        project.tasks.push({ title, status, todos: [] });
        saveProjects();
        renderTasksList(project);
        closeModal();
      };
      break;

    case "todo":
      modalTitle.textContent = "إضافة To-Do جديد";
      modalForm.innerHTML = `
        <label for="todoTitle">عنوان To-Do *</label>
        <input id="todoTitle" name="todoTitle" type="text" required />

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.todoTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان To-Do");
        const { taskIndex, project } = options;
        if (!project.tasks[taskIndex].todos) project.tasks[taskIndex].todos = [];
        project.tasks[taskIndex].todos.push({ title, done: false });
        saveProjects();
        renderTasksList(project);
        closeModal();
      };
      break;

    case "member":
      modalTitle.textContent = "إضافة عضو جديد للفريق";
      modalForm.innerHTML = `
        <label for="memberName">اسم العضو *</label>
        <input id="memberName" name="memberName" type="text" required />

        <label for="memberRole">الدور</label>
        <select id="memberRole" name="memberRole">
          <option value="مدير">مدير</option>
          <option value="عضو فريق">عضو فريق</option>
          <option value="مشاهد">مشاهد</option>
        </select>

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const name = modalForm.memberName.value.trim();
        if (!name) return alert("يجب إدخال اسم العضو");
        const role = modalForm.memberRole.value;
        if (!project.team) project.team = [];
        project.team.push({ name, role });
        saveProjects();
        renderTeamList(project);
        closeModal();
      };
      break;

    case "goal":
      modalTitle.textContent = "إضافة هدف جديد";
      modalForm.innerHTML = `
        <label for="goalTitle">عنوان الهدف *</label>
        <input id="goalTitle" name="goalTitle" type="text" required />

        <label for="goalProgress">النسبة المئوية للإنجاز</label>
        <input id="goalProgress" name="goalProgress" type="number" min="0" max="100" value="0" />

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.goalTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان الهدف");
        let progress = parseInt(modalForm.goalProgress.value);
        if (isNaN(progress) || progress < 0) progress = 0;
        if (progress > 100) progress = 100;
        if (!project.goals) project.goals = [];
        project.goals.push({ title, progress });
        saveProjects();
        renderGoalsList(project);
        closeModal();
      };
      break;

    case "goalEdit":
      modalTitle.textContent = "تعديل هدف";
      const goal = project.goals[options.goalIndex];
      modalForm.innerHTML = `
        <label for="goalTitle">عنوان الهدف *</label>
        <input id="goalTitle" name="goalTitle" type="text" required value="${goal.title}" />

        <label for="goalProgress">النسبة المئوية للإنجاز</label>
        <input id="goalProgress" name="goalProgress" type="number" min="0" max="100" value="${goal.progress || 0}" />

        <button type="submit" class="btn glass-btn">حفظ</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.goalTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان الهدف");
        let progress = parseInt(modalForm.goalProgress.value);
        if (isNaN(progress) || progress < 0) progress = 0;
        if (progress > 100) progress = 100;
        project.goals[options.goalIndex] = { title, progress };
        saveProjects();
        renderGoalsList(project);
        closeModal();
      };
      break;

    case "note":
      modalTitle.textContent = "إضافة ملاحظة جديدة";
      modalForm.innerHTML = `
        <label for="noteText">الملاحظة *</label>
        <textarea id="noteText" name="noteText" rows="4" required></textarea>

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const text = modalForm.noteText.value.trim();
        if (!text) return alert("يجب إدخال نص الملاحظة");
        if (!project.notes) project.notes = [];
        project.notes.push(text);
        saveProjects();
        renderNotesList(project);
        closeModal();
      };
      break;

    case "transaction":
      modalTitle.textContent = "إضافة معاملة مالية جديدة";
      modalForm.innerHTML = `
        <label for="transactionType">نوع المعاملة *</label>
        <select id="transactionType" name="transactionType" required>
          <option value="">اختر النوع</option>
          <option value="إيراد">إيراد</option>
          <option value="مصاريف">مصاريف</option>
        </select>

        <label for="transactionDesc">الوصف</label>
        <input id="transactionDesc" name="transactionDesc" type="text" />

        <label for="transactionAmount">المبلغ *</label>
        <input id="transactionAmount" name="transactionAmount" type="number" step="0.01" min="0" required />

        <label for="transactionCurrency">العملة</label>
        <select id="transactionCurrency" name="transactionCurrency">
          ${Object.keys(defaultCurrencyRates)
            .map(
              (c) =>
                `<option value="${c}" ${
                  c === (project.selectedCurrency || appSettings.defaultCurrency) ? "selected" : ""
                }>${c}</option>`
            )
            .join("")}
        </select>

        <label for="exchangeRate">سعر التحويل إلى العملة المختارة *</label>
        <input id="exchangeRate" name="exchangeRate" type="number" step="0.0001" min="0" value="1" required />

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const type = modalForm.transactionType.value;
        const desc = modalForm.transactionDesc.value.trim();
        const amount = parseFloat(modalForm.transactionAmount.value);
        const currency = modalForm.transactionCurrency.value;
        const exchangeRate = parseFloat(modalForm.exchangeRate.value);

        if (!type || isNaN(amount) || amount <= 0 || !exchangeRate || exchangeRate <= 0) {
          return alert("يرجى تعبئة الحقول المطلوبة بشكل صحيح");
        }
        if (!project.transactions) project.transactions = [];
        project.transactions.push({ type, description: desc, amount, currency, exchangeRate });
        saveProjects();
        renderFinance(project);
        closeModal();
      };
      break;

    case "settings":
      modalTitle.textContent = "إعدادات التطبيق";
      modalForm.innerHTML = `
        <label for="username">اسم المستخدم</label>
        <input id="username" name="username" type="text" value="${appSettings.username}" />

        <label for="defaultCurrency">العملة الافتراضية</label>
        <select id="defaultCurrency" name="defaultCurrency">
          ${Object.keys(defaultCurrencyRates)
            .map(
              (c) =>
                `<option value="${c}" ${
                  c === appSettings.defaultCurrency ? "selected" : ""
                }>${c}</option>`
            )
            .join("")}
        </select>

        <fieldset style="margin-top:15px;">
          <legend>الميزات:</legend>
          <label><input type="checkbox" name="enableNotes" ${appSettings.features.enableNotes ? "checked" : ""}> تفعيل الملاحظات</label><br/>
          <label><input type="checkbox" name="enableGoals" ${appSettings.features.enableGoals ? "checked" : ""}> تفعيل الأهداف</label>
        </fieldset>

        <button type="submit" class="btn glass-btn" style="margin-top:15px;">حفظ الإعدادات</button>
      `;

      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const username = modalForm.username.value.trim() || "مستخدم";
        const defaultCurrency = modalForm.defaultCurrency.value;
        const enableNotes = modalForm.enableNotes.checked;
        const enableGoals = modalForm.enableGoals.checked;

        appSettings = {
          username,
          defaultCurrency,
          features: {
            enableNotes,
            enableGoals,
          },
        };
        localStorage.setItem("appSettings", JSON.stringify(appSettings));
        saveProjects();
        closeModal();
        renderTabContent();
      };
      break;
  }
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalForm.innerHTML = "";
}

modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function setupEventListeners() {
  projectSearchInput.addEventListener("input", () => {
    renderProjectsList(projectSearchInput.value);
  });

  btnNewProject.addEventListener("click", () => {
    openModal("project");
  });

  btnSettings.addEventListener("click", () => {
    openModal("settings");
  });
}
