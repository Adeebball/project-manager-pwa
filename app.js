// متغيرات تخزين البيانات
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = null;

// عناصر DOM
const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

// التهيئة
renderProjectsList();
selectProject(projects.length ? projects[0].id : null);
setupTabs();
setupEventListeners();

// عرض قائمة المشاريع مع فلترة
function renderProjectsList(filter = "") {
  projectsListEl.innerHTML = "";
  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );
  filtered.forEach(project => {
    const li = document.createElement("li");
    li.textContent = project.name;
    li.dataset.id = project.id;
    if (project.id === currentProjectId) li.classList.add("active");
    li.addEventListener("click", () => selectProject(project.id));
    projectsListEl.appendChild(li);
  });
}

// اختيار مشروع وتحديث المحتوى
function selectProject(id) {
  currentProjectId = id;
  updateActiveProjectInList();
  renderTabContent();
}

function updateActiveProjectInList() {
  document.querySelectorAll("#projectsList li").forEach(li => {
    li.classList.toggle("active", li.dataset.id == currentProjectId);
  });
}

function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTabContent();
    });
  });
}

function renderTabContent() {
  const project = projects.find(p => p.id === currentProjectId);
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
  const btnAddTask = document.getElementById("btnAddTask");
  btnAddTask.addEventListener("click", () => openModal("task"));
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
  const btnAddMember = document.getElementById("btnAddMember");
  btnAddMember.addEventListener("click", () => openModal("member"));
  renderTeamList(project);
}

function renderTeamList(project) {
  const teamList = document.getElementById("teamList");
  teamList.innerHTML = "";
  if (!project.team) project.team = [];
  project.team.forEach((member, i) => {
    const li = document.createElement("li");
    li.textContent = `${member.name} - الدور: ${member.role || "عضو"}`;
    teamList.appendChild(li);
  });
}

function renderFinance(project) {
  tabContent.innerHTML = `
    <h3>المحاسبة والمالية</h3>
    <p>المعلومات المالية لمشروع ${project.name} ستضاف هنا لاحقاً.</p>
  `;
}

// فتح المودال للإضافة
function openModal(type) {
  modalForm.innerHTML = "";
  modalOverlay.classList.remove("hidden");
  if (type === "project") {
    modalTitle.textContent = "إضافة مشروع جديد";
    modalForm.innerHTML = `
      <label for="projectName">اسم المشروع*</label>
      <input id="projectName" name="projectName" type="text" required />
      <label for="projectDesc">الوصف</label>
      <input id="projectDesc" name="projectDesc" type="text" />
      <label for="startDate">تاريخ البداية</label>
      <input id="startDate" name="startDate" type="date" />
      <label for="endDate">تاريخ النهاية</label>
      <input id="endDate" name="endDate" type="date" />
      <button type="submit" class="btn glass-btn">حفظ</button>
    `;
    modalForm.onsubmit = e => {
      e.preventDefault();
      addProject();
    };
  } else if (type === "task") {
    modalTitle.textContent = "إضافة مهمة جديدة";
    modalForm.innerHTML = `
      <label for="taskTitle">عنوان المهمة*</label>
      <input id="taskTitle" name="taskTitle" type="text" required />
      <label for="taskStatus">الحالة</label>
      <select id="taskStatus" name="taskStatus">
        <option value="معلقة">معلقة</option>
        <option value="قيد التنفيذ">قيد التنفيذ</option>
        <option value="مكتملة">مكتملة</option>
      </select>
      <button type="submit" class="btn glass-btn">حفظ</button>
    `;
    modalForm.onsubmit = e => {
      e.preventDefault();
      addTask();
    };
  } else if (type === "member") {
    modalTitle.textContent = "إضافة عضو جديد";
    modalForm.innerHTML = `
      <label for="memberName">اسم العضو*</label>
      <input id="memberName" name="memberName" type="text" required />
      <label for="memberRole">الدور</label>
      <select id="memberRole" name="memberRole">
        <option value="عضو">عضو</option>
        <option value="مدير">مدير</option>
        <option value="مشاهد">مشاهد</option>
      </select>
      <button type="submit" class="btn glass-btn">حفظ</button>
    `;
    modalForm.onsubmit = e => {
      e.preventDefault();
      addMember();
    };
  }
}

// إغلاق المودال
modalCancel.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

// إضافة مشروع جديد
function addProject() {
  const name = modalForm.projectName.value.trim();
  if (!name) {
    alert("اسم المشروع مطلوب");
    return;
  }
  const newProject = {
    id: Date.now().toString(),
    name,
    description: modalForm.projectDesc.value.trim(),
    startDate: modalForm.startDate.value,
    endDate: modalForm.endDate.value,
    tasks: [],
    team: [],
    finance: {},
  };
  projects.push(newProject);
  saveProjects();
  renderProjectsList();
  selectProject(newProject.id);
  modalOverlay.classList.add("hidden");
}

// إضافة مهمة جديدة
function addTask() {
  const title = modalForm.taskTitle.value.trim();
  if (!title) {
    alert("عنوان المهمة مطلوب");
    return;
  }
  const status = modalForm.taskStatus.value;
  const project = projects.find(p => p.id === currentProjectId);
  project.tasks.push({ title, status });
  saveProjects();
  renderTasksList(project);
  modalOverlay.classList.add("hidden");
}

// إضافة عضو جديد
function addMember() {
  const name = modalForm.memberName.value.trim();
  if (!name) {
    alert("اسم العضو مطلوب");
    return;
  }
  const role = modalForm.memberRole.value;
  const project = projects.find(p => p.id === currentProjectId);
  project.team.push({ name, role });
  saveProjects();
  renderTeamList(project);
  modalOverlay.classList.add("hidden");
}

// حفظ البيانات في LocalStorage
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

btnNewProject.addEventListener("click", () => openModal("project"));

projectSearchInput.addEventListener("input", () => {
  renderProjectsList(projectSearchInput.value);
});

function setupEventListeners() {
  // يمكن إضافة هنا مستقبلاً أحداث إضافية
}
