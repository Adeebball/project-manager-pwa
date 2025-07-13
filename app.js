// بيانات المشاريع مخزنة أوفلاين
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = null;
let selectedCurrency = localStorage.getItem("selectedCurrency") || "USD";

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
  project.tasks.forEach((task) => {
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
    const project = projects.find((p) => p.id === currentProjectId);
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
        const project = projects.find((p) => p.id === currentProjectId);
        project.tasks.push({ title, status });
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
        const project = projects.find((p) => p.id === currentProjectId);
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
                  c === (projects.find((p) => p.id === currentProjectId)?.selectedCurrency || "USD")
                    ? "selected"
                    : ""
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
        const project = projects.find((p) => p.id === currentProjectId);
        project.transactions.push({ type, description: desc, amount, currency, exchangeRate });
        saveProjects();
        renderFinance(project);
        closeModal();
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
}
