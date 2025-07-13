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

// تحديث تمييز المشروع المحدد بالقائمة
function updateActiveProjectInList() {
  document.querySelectorAll("#projectsList li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id == currentProjectId);
  });
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

// رندر محتوى التبويب النشط
function renderTabContent() {
  const project = projects.find((p) => p.id === currentProjectId);
  if (!project) {
    tabContent.innerHTML = "<p>لا يوجد مشروع محدد.</p>";
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
  `;
}

// -- تبويب المهام --
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
  project.tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${task.title} - الحالة: ${task.status || "معلقة"}`;
    // زر حذف المهمة
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      project.tasks.splice(index, 1);
      saveProjects();
      renderTasksList(project);
    });
    li.appendChild(delBtn);
    tasksList.appendChild(li);
  });
}

// -- تبويب To-Do منفصل --
function renderToDo(project) {
  tabContent.innerHTML = `
    <h3>قائمة To-Do</h3>
    <button id="btnAddToDo" class="btn glass-btn">+ إضافة عنصر To-Do جديد</button>
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
  project.todo.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.toggle("completed", item.completed);
    li.innerHTML = `
      <span>
        <input type="checkbox" ${item.completed ? "checked" : ""} data-index="${index}" />
        ${item.title} ${item.dueDate ? `- تاريخ الإنجاز: ${item.dueDate}` : ""}
      </span>
    `;

    // زر حذف
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      project.todo.splice(index, 1);
      saveProjects();
      renderToDoList(project);
    });

    li.appendChild(delBtn);
    todoList.appendChild(li);
  });

  // حدث تغيير تشيك بوكس الإنجاز
  todoList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      project.todo[idx].completed = e.target.checked;
      saveProjects();
      renderToDoList(project);
    });
  });
}

// -- تبويب إدارة الفريق --
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
  project.team.forEach((member, index) => {
    const li = document.createElement("li");
    li.textContent = `${member.name} - الدور: ${member.role}`;
    // حذف عضو الفريق
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      project.team.splice(index, 1);
      saveProjects();
      renderTeamList(project);
    });
    li.appendChild(delBtn);
    teamList.appendChild(li);
  });
}

// -- تبويب الملاحظات العامة (ملصقات) --
function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>الملاحظات العامة</h3>
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
  project.notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = note.text;
    // حذف الملاحظة
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      project.notes.splice(index, 1);
      saveProjects();
      renderNotesList(project);
    });
    li.appendChild(delBtn);
    notesList.appendChild(li);
  });
}

// -- تبويب المحاسبة --
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
  project.transactions.forEach((t, index) => {
    let rate = parseFloat(t.exchangeRate);
    if (!rate || rate <= 0) rate = 1; // افتراضياً 1 لو ما تم تعيين سعر
    const amountInSelected = t.amount * rate;
    balance += t.type === "إيراد" ? amountInSelected : -amountInSelected;
    const li = document.createElement("li");
    li.textContent = `[${t.type}] ${t.description || ""} : ${amountInSelected.toFixed(
      2
    )} ${project.selectedCurrency || "USD"}`;
    // حذف المعاملة
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      project.transactions.splice(index, 1);
      saveProjects();
      renderTransactionsList(project);
    });
    li.appendChild(delBtn);
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

// --- فتح نافذة المودال ---

function openModal(type) {
  modalOverlay.classList.remove("hidden");
  modalForm.innerHTML = "";

  const project = projects.find((p) => p.id === currentProjectId);

  switch (type) {
    case "project":
      modalTitle.textContent = "إنشاء مشروع جديد";
      modalForm.innerHTML = `
        <label for="projectName">اسم المشروع *</label>
        <input id="projectName" name="projectName" type="text" required />
        <label for="projectDescription">الوصف</label>
        <textarea id="projectDescription" name="projectDescription"></textarea>
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
          todo: [],
          notes: [],
          transactions: [],
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
        project.tasks.push({ title, status });
        saveProjects();
        renderTasksList(project);
        closeModal();
      };
      break;

    case "todo":
      modalTitle.textContent = "إضافة عنصر To-Do جديد";
      modalForm.innerHTML = `
        <label for="todoTitle">عنوان العنصر *</label>
        <input id="todoTitle" name="todoTitle" type="text" required />
        <label for="todoDueDate">تاريخ الإنجاز (اختياري)</label>
        <input id="todoDueDate" name="todoDueDate" type="date" />
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.todoTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان العنصر");
        const dueDate = modalForm.todoDueDate.value;
        if (!project.todo) project.todo = [];
        project.todo.push({ title, dueDate, completed: false });
        saveProjects();
        renderToDoList(project);
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

    case "note":
      modalTitle.textContent = "إضافة ملاحظة جديدة";
      modalForm.innerHTML = `
        <label for="noteText">الملاحظة *</label>
        <textarea id="noteText" name="noteText" required></textarea>
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const text = modalForm.noteText.value.trim();
        if (!text) return alert("يجب إدخال نص الملاحظة");
        if (!project.notes) project.notes = [];
        project.notes.push({ text });
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
        <input id="transactionAmount" name="transactionAmount" type="number" min="0" step="0.01" required />
        <label for="exchangeRate">سعر الصرف (بالعملة المختارة)</label>
        <input id="exchangeRate" name="exchangeRate" type="number" min="0" step="0.0001" value="1" />
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const type = modalForm.transactionType.value;
        const description = modalForm.transactionDesc.value.trim();
        const amount = parseFloat(modalForm.transactionAmount.value);
        const exchangeRate = parseFloat(modalForm.exchangeRate.value) || 1;
        if (!type || isNaN(amount) || amount <= 0) {
          return alert("يرجى تعبئة الحقول المطلوبة بشكل صحيح");
        }
        if (!project.transactions) project.transactions = [];
        project.transactions.push({
          type,
          description,
          amount,
          exchangeRate,
        });
        saveProjects();
        renderTransactionsList(project);
        closeModal();
      };
      break;
  }
}

// إغلاق المودال
function closeModal() {
  modalOverlay.classList.add("hidden");
  modalForm.innerHTML = "";
}

// حفظ المشاريع باللوكل ستورج
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// حدث إغلاق المودال
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// حدث بحث المشاريع
projectSearchInput.addEventListener("input", (e) => {
  renderProjectsList(e.target.value);
});

// زر إضافة مشروع جديد
btnNewProject.addEventListener("click", () => openModal("project"));

// بدء التطبيق
function init() {
  if (!currentProjectId && projects.length > 0) currentProjectId = projects[0].id;
  renderProjectsList();
  setupTabs();
  renderTabContent();
}

init();
