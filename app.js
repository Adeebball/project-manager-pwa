// بيانات المشاريع مخزنة أوفلاين
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
    <ul id="transactionsList" class="list"></ul>
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
  project.transactions = project.transactions || [];
  let balance = 0;

  project.transactions.forEach((t, index) => {
    let rate = parseFloat(t.exchangeRate);
    if (!rate || rate <= 0) rate = 1;
    const amountInSelected = t.amount * rate;
    balance += t.type === "إيراد" ? amountInSelected : -amountInSelected;

    const li = document.createElement("li");
    li.classList.add("list-item");
    li.textContent = `[${t.type}] ${t.description || ""} : ${amountInSelected.toFixed(
      2
    )} ${project.selectedCurrency || "USD"}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.classList.add("list-action-btn");
    delBtn.addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
        project.transactions.splice(index, 1);
        saveProjects();
        renderTransactionsList(project);
      }
    });

    li.appendChild(delBtn);
    list.appendChild(li);
  });

  document.getElementById("currentBalance").textContent = balance.toFixed(2);
}

// --- فتح نافذة المودال ---
function openModal(type) {
  if (!currentProjectId) {
    alert("يرجى اختيار مشروع أولاً");
    return;
  }

  if (!modalOverlay.classList.contains("hidden")) return; // منع فتح مودال مكرر

  modalOverlay.classList.remove("hidden");
  modalTitle.textContent = "";
  modalForm.innerHTML = "";

  const project = projects.find((p) => p.id === currentProjectId);

  switch (type) {
    case "project":
      modalTitle.textContent = "إنشاء مشروع جديد";
      modalForm.innerHTML = `
        <label for="projectName">اسم المشروع *</label>
        <input id="projectName" name="projectName" type="text" required autofocus />
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
        <input id="taskTitle" name="taskTitle" type="text" required autofocus />
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
        <input id="todoTitle" name="todoTitle" type="text" required autofocus />
        <label for="todoDueDate">تاريخ الإنجاز (اختياري)</label>
        <input id="todoDueDate" name="todoDueDate" type="date" />
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = modalForm.todoTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان العنصر");
        const dueDate = modalForm.todoDueDate.value;
        project.todo = project.todo || [];
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
        <input id="memberName" name="memberName" type="text" required autofocus />
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
        <textarea id="noteText" name="noteText" required autofocus></textarea>
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const text = modalForm.noteText.value.trim();
        if (!text) return alert("يجب إدخال نص الملاحظة");
        project.notes = project.notes || [];
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
        <select id="transactionType" name="transactionType" required autofocus>
          <option value="إيراد">إيراد</option>
          <option value="مصروف">مصروف</option>
        </select>
        <label for="transactionAmount">المبلغ *</label>
        <input id="transactionAmount" name="transactionAmount" type="number" min="0" step="0.01" required />
        <label for="transactionCurrency">العملة *</label>
        <select id="transactionCurrency" name="transactionCurrency" required>
          ${Object.keys(project.currencyRates || defaultCurrencyRates)
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("")}
        </select>
        <label for="exchangeRate">سعر الصرف (بالنسبة للعملة المختارة)</label>
        <input id="exchangeRate" name="exchangeRate" type="number" min="0" step="0.0001" value="1" />
        <label for="transactionDesc">الوصف</label>
        <textarea id="transactionDesc" name="transactionDesc"></textarea>
        <button type="submit" class="btn glass-btn">إضافة</button>
      `;
      modalForm.onsubmit = (e) => {
        e.preventDefault();
        const type = modalForm.transactionType.value;
        const amount = parseFloat(modalForm.transactionAmount.value);
        if (isNaN(amount) || amount <= 0) return alert("يرجى إدخال مبلغ صحيح أكبر من صفر");
        const currency = modalForm.transactionCurrency.value;
        const exchangeRate = parseFloat(modalForm.exchangeRate.value) || 1;
        const description = modalForm.transactionDesc.value.trim();

        project.transactions = project.transactions || [];
        project.transactions.push({
          type,
          amount,
          currency,
          exchangeRate,
          description,
          date: new Date().toISOString(),
        });

        // تحديث العملة المحددة إلى عملة المعاملة الجديدة (اختياري)
        project.selectedCurrency = currency;
        saveProjects();
        renderFinance(project);
        closeModal();
      };
      break;

    default:
      modalTitle.textContent = "نافذة غير معروفة";
      modalForm.innerHTML = `<p>نوع النافذة غير معروف.</p>`;
  }
}

// --- إغلاق المودال ---
function closeModal() {
  modalOverlay.classList.add("hidden");
  modalTitle.textContent = "";
  modalForm.innerHTML = "";
  modalForm.onsubmit = null;
}

// --- حدث زر إلغاء داخل المودال ---
modalCancel.addEventListener("click", closeModal);

// --- إغلاق المودال عند الضغط على خلفية المودال ---
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// --- البحث في المشاريع ---
projectSearchInput.addEventListener("input", () => {
  renderProjectsList(projectSearchInput.value);
});

// --- زر إنشاء مشروع جديد ---
btnNewProject.addEventListener("click", () => openModal("project"));

// --- بداية التطبيق ---
init();
