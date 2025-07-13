// بيانات المشاريع مخزنة أوفلاين
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = projects.length ? projects[0].id : null;

const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

// زر لفتح مودال اختيار المشروع المنبثق
const btnOpenProjectsModal = document.createElement("button");
btnOpenProjectsModal.textContent = "اختر مشروع";
btnOpenProjectsModal.className = "btn glass-btn";
btnOpenProjectsModal.style.marginBottom = "10px";
btnOpenProjectsModal.addEventListener("click", () => openModal("selectProject"));
document.querySelector("aside").prepend(btnOpenProjectsModal);

renderProjectsList();
selectProject(currentProjectId);
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
      renderToDo(project);
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
  project.tasks.forEach((task, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" data-idx="${idx}" class="task-checkbox" ${
      task.completed ? "checked" : ""
    }/>
      <span style="margin-left:10px;">${task.title} - الحالة: ${task.status || "معلقة"}</span>
      <button data-idx="${idx}" class="btn glass-btn btn-delete-task" style="margin-left:10px; background:#b22222;">حذف</button>
    `;
    tasksList.appendChild(li);
  });

  // حدث تغيير حالة المهمة (تشيك بوكس)
  tasksList.querySelectorAll(".task-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const idx = e.target.dataset.idx;
      project.tasks[idx].completed = e.target.checked;
      saveProjects();
      renderTasksList(project);
    });
  });

  // حدث حذف مهمة
  tasksList.querySelectorAll(".btn-delete-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.idx;
      project.tasks.splice(idx, 1);
      saveProjects();
      renderTasksList(project);
    });
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
  project.team.forEach((member, idx) => {
    const li = document.createElement("li");
    li.textContent = `${member.name} - الدور: ${member.role}`;
    li.innerHTML += `<button data-idx="${idx}" class="btn glass-btn btn-delete-member" style="margin-left:10px; background:#b22222;">حذف</button>`;
    teamList.appendChild(li);
  });

  teamList.querySelectorAll(".btn-delete-member").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.idx;
      project.team.splice(idx, 1);
      saveProjects();
      renderTeamList(project);
    });
  });
}

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

const defaultCurrencyRates = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.82,
  JPY: 145.7,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.9,
};

function renderToDo(project) {
  tabContent.innerHTML = `
    <h3>قائمة To-Do</h3>
    <button id="btnAddToDo" class="btn glass-btn">+ إضافة مهمة To-Do</button>
    <ul id="todoList"></ul>
  `;
  document.getElementById("btnAddToDo").addEventListener("click", () =>
    openModal("todo")
  );
  renderToDoList(project);
}

function renderToDoList(project) {
  const todoList = document.getElementById("todoList");
  todoList.innerHTML = "";
  if (!project.todo) project.todo = [];
  project.todo.forEach((todo, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" data-idx="${idx}" class="todo-checkbox" ${
      todo.completed ? "checked" : ""
    }/>
      <span style="margin-left:10px;">${todo.title} - ${
      todo.dueDate ? "موعد: " + todo.dueDate : "بدون موعد"
    }</span>
      <button data-idx="${idx}" class="btn glass-btn btn-delete-todo" style="margin-left:10px; background:#b22222;">حذف</button>
    `;
    todoList.appendChild(li);
  });

  todoList.querySelectorAll(".todo-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const idx = e.target.dataset.idx;
      project.todo[idx].completed = e.target.checked;
      saveProjects();
      renderToDoList(project);
    });
  });

  todoList.querySelectorAll(".btn-delete-todo").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.idx;
      project.todo.splice(idx, 1);
      saveProjects();
      renderToDoList(project);
    });
  });
}

function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>ملاحظات عامة (ملصقات)</h3>
    <button id="btnAddNote" class="btn glass-btn">+ إضافة ملاحظة جديدة</button>
    <ul id="notesList"></ul>
  `;
  document.getElementById("btnAddNote").addEventListener("click", () =>
    openModal("note")
  );
  renderNotesList(project);
}

function renderNotesList(project) {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";
  if (!project.notes) project.notes = [];
  project.notes.forEach((note, idx) => {
    const li = document.createElement("li");
    li.textContent = note.text;
    li.innerHTML += `<button data-idx="${idx}" class="btn glass-btn btn-delete-note" style="margin-left:10px; background:#b22222;">حذف</button>`;
    notesList.appendChild(li);
  });

  notesList.querySelectorAll(".btn-delete-note").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.idx;
      project.notes.splice(idx, 1);
      saveProjects();
      renderNotesList(project);
    });
  });
}

function openModal(type) {
  modalOverlay.classList.remove("hidden");
  modalForm.innerHTML = "";

  const project = projects.find((p) => p.id === currentProjectId);

  switch (type) {
    case "selectProject":
      modalTitle.textContent = "اختر مشروعًا";
      modalForm.innerHTML = projects.length
        ? projects
            .map(
              (p) =>
                `<button type="button" class="btn glass-btn select-project-btn" data-id="${p.id}">${p.name}</button>`
            )
            .join("")
        : "<p>لا يوجد مشاريع حالياً</p>";
      modalForm.querySelectorAll(".select-project-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectProject(btn.dataset.id);
          closeModal();
        });
      });
      break;

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
        project.tasks.push({ title, status, completed: false });
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
        project.team.push({ name, role });
        saveProjects();
        renderTeamList(project);
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
                  c === (project.selectedCurrency || "USD") ? "selected" : ""
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
        if (!type) return alert("يجب اختيار نوع المعاملة");
        const description = modalForm.transactionDesc.value.trim();
        const amount = parseFloat(modalForm.transactionAmount.value);
        if (isNaN(amount) || amount <= 0)
          return alert("يجب إدخال مبلغ صحيح أكبر من صفر");
        const currency = modalForm.transactionCurrency.value;
        const exchangeRate = parseFloat(modalForm.exchangeRate.value);
        if (isNaN(exchangeRate) || exchangeRate <= 0)
          return alert("يجب إدخال سعر تحويل صحيح");
        project.transactions.push({
          type,
          description,
          amount,
          currency,
          exchangeRate,
        });
        saveProjects();
        renderFinance(project);
        closeModal();
      };
      break;

    case "todo":
      modalTitle.textContent = "إضافة مهمة To-Do جديدة";
      modalForm.innerHTML = `
        <label for="todoTitle">عنوان المهمة *</label>
        <input id="todoTitle" name="todoTitle" type="text" required />

        <label for="todoDueDate">تاريخ الاستحقاق</label>
        <input id="todoDueDate" name="todoDueDate" type="date" />

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.todoTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان المهمة");
        const dueDate = modalForm.todoDueDate.value;
        project.todo.push({ title, dueDate, completed: false });
        saveProjects();
        renderToDoList(project);
        closeModal();
      };
      break;

    case "note":
      modalTitle.textContent = "إضافة ملاحظة جديدة";
      modalForm.innerHTML = `
        <label for="noteText">النص *</label>
        <textarea id="noteText" name="noteText" required rows="4" style="width:100%; border-radius:8px; background:rgba(255 255 255 / 0.15); color:white; border:none; padding:8px;"></textarea>

        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const text = modalForm.noteText.value.trim();
        if (!text) return alert("يجب إدخال نص الملاحظة");
        project.notes.push({ text });
        saveProjects();
        renderNotesList(project);
        closeModal();
      };
      break;

    default:
      modalTitle.textContent = "";
      modalForm.innerHTML = "<p>نوع غير معروف</p>";
      break;
  }
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalForm.innerHTML = "";
  modalTitle.textContent = "";
}

modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// البحث في المشاريع
projectSearchInput.addEventListener("input", (e) => {
  renderProjectsList(e.target.value);
});

// زر إضافة مشروع جديد
btnNewProject.addEventListener("click", () => openModal("project"));

