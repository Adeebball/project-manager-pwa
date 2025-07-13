// app.js بدون مودال - كل الميزات مفعّلة

let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = projects.length ? projects[0].id : null;

const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

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
  renderProjectsList();
  renderTabContent();
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
  if (!project) {
    tabContent.innerHTML = "<p>لا يوجد مشروع محدد.</p>";
    return;
  }
  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "summary";
  const renderers = {
    summary: renderSummary,
    tasks: renderTasks,
    todo: renderToDo,
    team: renderTeam,
    notes: renderNotes,
    finance: renderFinance,
  };
  renderers[activeTab]?.(project);
}

function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p><strong>الوصف:</strong> ${project.description || "لا يوجد وصف"}</p>
    <p><strong>تاريخ البداية:</strong> ${project.startDate || "-"}</p>
    <p><strong>تاريخ النهاية المتوقع:</strong> ${project.endDate || "-"}</p>
  `;
}

function renderTasks(project) {
  tabContent.innerHTML = `
    <h3>المهام</h3>
    <input id="taskTitle" placeholder="عنوان المهمة" />
    <select id="taskStatus">
      <option value="معلقة">معلقة</option>
      <option value="قيد التنفيذ">قيد التنفيذ</option>
      <option value="مكتملة">مكتملة</option>
    </select>
    <button id="addTaskBtn" class="glass-btn">إضافة</button>
    <ul id="tasksList" class="list"></ul>
  `;
  document.getElementById("addTaskBtn").onclick = () => {
    const title = document.getElementById("taskTitle").value.trim();
    const status = document.getElementById("taskStatus").value;
    if (!title) return;
    project.tasks = project.tasks || [];
    project.tasks.push({ title, status });
    saveProjects();
    renderTasks(project);
  };
  const list = document.getElementById("tasksList");
  (project.tasks || []).forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `${t.title} - ${t.status} <button class="list-action-btn">حذف</button>`;
    li.querySelector("button").onclick = () => {
      project.tasks.splice(i, 1);
      saveProjects();
      renderTasks(project);
    };
    list.appendChild(li);
  });
}

function renderToDo(project) {
  tabContent.innerHTML = `
    <h3>To-Do</h3>
    <input id="todoTitle" placeholder="عنوان To-Do" />
    <input id="todoDue" type="date" />
    <button id="addToDoBtn" class="glass-btn">إضافة</button>
    <ul id="todoList" class="list"></ul>
  `;
  document.getElementById("addToDoBtn").onclick = () => {
    const title = document.getElementById("todoTitle").value.trim();
    const dueDate = document.getElementById("todoDue").value;
    if (!title) return;
    project.todo = project.todo || [];
    project.todo.push({ title, dueDate, completed: false });
    saveProjects();
    renderToDo(project);
  };
  const list = document.getElementById("todoList");
  (project.todo || []).forEach((item, i) => {
    const li = document.createElement("li");
    li.className = `list-item ${item.completed ? "completed" : ""}`;
    li.innerHTML = `
      <label><input type="checkbox" ${item.completed ? "checked" : ""}/> ${item.title} - ${item.dueDate}</label>
      <button class="list-action-btn">حذف</button>
    `;
    li.querySelector("input").onchange = (e) => {
      item.completed = e.target.checked;
      saveProjects();
      renderToDo(project);
    };
    li.querySelector("button").onclick = () => {
      project.todo.splice(i, 1);
      saveProjects();
      renderToDo(project);
    };
    list.appendChild(li);
  });
}

function renderTeam(project) {
  tabContent.innerHTML = `
    <h3>الفريق</h3>
    <input id="memberName" placeholder="اسم العضو" />
    <select id="memberRole">
      <option value="مدير">مدير</option>
      <option value="عضو فريق">عضو فريق</option>
    </select>
    <button id="addMemberBtn" class="glass-btn">إضافة</button>
    <ul id="teamList" class="list"></ul>
  `;
  document.getElementById("addMemberBtn").onclick = () => {
    const name = document.getElementById("memberName").value.trim();
    const role = document.getElementById("memberRole").value;
    if (!name) return;
    project.team = project.team || [];
    project.team.push({ name, role });
    saveProjects();
    renderTeam(project);
  };
  const list = document.getElementById("teamList");
  (project.team || []).forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `${m.name} - ${m.role} <button class="list-action-btn">حذف</button>`;
    li.querySelector("button").onclick = () => {
      project.team.splice(i, 1);
      saveProjects();
      renderTeam(project);
    };
    list.appendChild(li);
  });
}

function renderNotes(project) {
  tabContent.innerHTML = `
    <h3>الملاحظات</h3>
    <textarea id="noteText" placeholder="ملاحظة"></textarea>
    <button id="addNoteBtn" class="glass-btn">إضافة</button>
    <ul id="notesList" class="list"></ul>
  `;
  document.getElementById("addNoteBtn").onclick = () => {
    const text = document.getElementById("noteText").value.trim();
    if (!text) return;
    project.notes = project.notes || [];
    project.notes.push({ text });
    saveProjects();
    renderNotes(project);
  };
  const list = document.getElementById("notesList");
  (project.notes || []).forEach((n, i) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `${n.text} <button class="list-action-btn">حذف</button>`;
    li.querySelector("button").onclick = () => {
      project.notes.splice(i, 1);
      saveProjects();
      renderNotes(project);
    };
    list.appendChild(li);
  });
}

function renderFinance(project) {
  tabContent.innerHTML = `
    <h3>المحاسبة</h3>
    <input id="amount" type="number" placeholder="المبلغ" />
    <select id="type">
      <option value="إيراد">إيراد</option>
      <option value="مصروف">مصروف</option>
    </select>
    <input id="desc" placeholder="الوصف" />
    <button id="addTxnBtn" class="glass-btn">إضافة</button>
    <ul id="txnList" class="list"></ul>
    <p>الرصيد: <span id="balance">0</span></p>
  `;
  document.getElementById("addTxnBtn").onclick = () => {
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const desc = document.getElementById("desc").value;
    if (isNaN(amount)) return;
    project.transactions = project.transactions || [];
    project.transactions.push({ amount, type, desc });
    saveProjects();
    renderFinance(project);
  };
  const list = document.getElementById("txnList");
  let balance = 0;
  (project.transactions || []).forEach((t, i) => {
    balance += t.type === "إيراد" ? t.amount : -t.amount;
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `${t.type}: ${t.amount} - ${t.desc} <button class="list-action-btn">حذف</button>`;
    li.querySelector("button").onclick = () => {
      project.transactions.splice(i, 1);
      saveProjects();
      renderFinance(project);
    };
    list.appendChild(li);
  });
  document.getElementById("balance").textContent = balance.toFixed(2);
}

btnNewProject.onclick = () => {
  const name = prompt("اسم المشروع:");
  if (!name) return;
  const id = Date.now().toString();
  projects.push({
    id,
    name,
    description: "",
    startDate: "",
    endDate: "",
    tasks: [],
    todo: [],
    team: [],
    notes: [],
    transactions: []
  });
  saveProjects();
  renderProjectsList();
  selectProject(id);
};

projectSearchInput.oninput = () => {
  renderProjectsList(projectSearchInput.value);
};

function init() {
  renderProjectsList();
  setupTabs();
  renderTabContent();
}

init();
