// ====== بيانات المشاريع وأوضاع التطبيق ======
let projects = JSON.parse(localStorage.getItem("projects") || "[]");
let currentProjectId = projects.length ? projects[0].id : null;
const defaultCurrencyRates = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.82,
  JPY: 145.7,
  SAR: 3.75,
  AED: 3.67,
  EGP: 30.9,
};

// ====== عناصر DOM ======
const projectsListEl = document.getElementById("projectsList");
const btnNewProject = document.getElementById("btnNewProject");
const projectSearchInput = document.getElementById("projectSearch");
const tabButtons = document.querySelectorAll(".tab");
const tabContent = document.getElementById("tabContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");

// ====== دوال رئيسية ======

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function renderProjectsList(filter = "") {
  projectsListEl.innerHTML = "";
  let filtered = projects.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  if (filtered.length === 0) {
    projectsListEl.innerHTML = `<li style="color:#888; text-align:center;">لا يوجد مشاريع</li>`;
    return;
  }
  filtered.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name;
    li.dataset.id = p.id;
    if (p.id === currentProjectId) li.classList.add("active");
    li.addEventListener("click", () => selectProject(p.id));
    projectsListEl.appendChild(li);
  });
}

function selectProject(id) {
  currentProjectId = id;
  updateActiveProjectInList();
  renderTabContent();
}

function updateActiveProjectInList() {
  document.querySelectorAll("#projectsList li").forEach(li => {
    li.classList.toggle("active", li.dataset.id === currentProjectId);
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
  if (!project) {
    tabContent.innerHTML = "<p style='text-align:center; color:#aaa;'>لا يوجد مشروع محدد.</p>";
    return;
  }
  const activeTab = document.querySelector(".tab.active").dataset.tab;
  switch (activeTab) {
    case "summary": renderSummary(project); break;
    case "tasks": renderTasks(project); break;
    case "team": renderTeam(project); break;
    case "finance": renderFinance(project); break;
    default:
      tabContent.innerHTML = "<p>تاب غير معروف</p>";
  }
}

// --- عرض ملخص المشروع ---
function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع: ${project.name}</h3>
    <p><strong>الوصف:</strong> ${project.description || "لا يوجد وصف"}</p>
    <p><strong>تاريخ البداية:</strong> ${project.startDate || "-"}</p>
    <p><strong>تاريخ النهاية المتوقع:</strong> ${project.endDate || "-"}</p>
  `;
}

// --- عرض المهام ---
function renderTasks(project) {
  tabContent.innerHTML = `
    <h3>المهام</h3>
    <button id="btnAddTask" class="btn">+ إضافة مهمة جديدة</button>
    <ul id="tasksList"></ul>
  `;
  document.getElementById("btnAddTask").addEventListener("click", () => openModal("task"));
  renderTasksList(project);
}

function renderTasksList(project) {
  const list = document.getElementById("tasksList");
  list.innerHTML = "";
  if (!project.tasks) project.tasks = [];
  if (project.tasks.length === 0) {
    list.innerHTML = "<li style='color:#aaa;'>لا توجد مهام بعد</li>";
    return;
  }
  project.tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.textContent = `${task.title} - الحالة: ${task.status || "معلقة"}`;
    list.appendChild(li);
  });
}

// --- عرض الفريق ---
function renderTeam(project) {
  tabContent.innerHTML = `
    <h3>الفريق</h3>
    <button id="btnAddMember" class="btn">+ إضافة عضو جديد</button>
    <ul id="teamList"></ul>
  `;
  document.getElementById("btnAddMember").addEventListener("click", () => openModal("member"));
  renderTeamList(project);
}

function renderTeamList(project) {
  const list = document.getElementById("teamList");
  list.innerHTML = "";
  if (!project.team) project.team = [];
  if (project.team.length === 0) {
    list.innerHTML = "<li style='color:#aaa;'>لا يوجد أعضاء بعد</li>";
    return;
  }
  project.team.forEach(member => {
    const li = document.createElement("li");
    li.textContent = `${member.name} - الدور: ${member.role}`;
    list.appendChild(li);
  });
}

// --- عرض المحاسبة ---
function renderFinance(project) {
  tabContent.innerHTML = `
    <h3>المحاسبة</h3>
    <button id="btnAddTransaction" class="btn">+ إضافة معاملة جديدة</button>
    <div style="margin-bottom: 15px;">
      <label for="currencySelect">اختيار العملة:</label>
      <select id="currencySelect" style="margin-left: 15px; padding: 5px; border-radius: 8px;">
        ${Object.keys(defaultCurrencyRates)
          .map(c => `<option value="${c}" ${c === (project.selectedCurrency || "USD") ? "selected" : ""}>${c}</option>`)
          .join("")}
      </select>
    </div>
    <ul id="transactionsList"></ul>
    <p><strong>الرصيد الحالي:</strong> <span id="currentBalance">0</span> ${project.selectedCurrency || "USD"}</p>
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

  project.transactions.forEach(t => {
    let rate = parseFloat(t.exchangeRate);
    if (!rate || rate <= 0) rate = 1;
    const amountInSelected = t.amount * rate;
    balance += t.type === "إيراد" ? amountInSelected : -amountInSelected;
    const li = document.createElement("li");
    li.textContent = `[${t.type}] ${t.description || ""} : ${amountInSelected.toFixed(2)} ${project.selectedCurrency || "USD"}`;
    list.appendChild(li);
  });

  document.getElementById("currentBalance").textContent = balance.toFixed(2);
}

// --- فتح النماذج ---
function openModal(type) {
  modalOverlay.classList.add("visible");
  modalTitle.textContent = "";
  modalForm.innerHTML = "";

  const project = projects.find(p => p.id === currentProjectId);

  switch(type) {
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
        <button type="submit" class="btn">إنشاء</button>
      `;
      modalForm.onsubmit = e => {
        e.preventDefault();
        const name = modalForm.projectName.value.trim();
        if (!name) return alert("يجب إدخال اسم المشروع");
        const newProject = {
          id: Date.now().toString(),
          name,
          description: modalForm.projectDescription.value.trim(),
          startDate: modalForm.projectStart.value,
          endDate: modalForm.projectEnd.value,
          tasks: [],
          team: [],
          transactions: [],
          selectedCurrency: "USD",
          currencyRates: {...defaultCurrencyRates},
        };
        projects.push(newProject);
        saveProjects();
        renderProjectsList();
        selectProject(newProject.id);
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
        <button type="submit" class="btn">إضافة</button>
      `;
      modalForm.onsubmit = e => {
        e.preventDefault();
        const title = modalForm.taskTitle.value.trim();
        if (!title) return alert("يجب إدخال عنوان المهمة");
        project.tasks.push({title, status: modalForm.taskStatus.value});
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
        <button type="submit" class="btn">إضافة</button>
      `;
      modalForm.onsubmit = e => {
        e.preventDefault();
        const name = modalForm.memberName.value.trim();
        if (!name) return alert("يجب إدخال اسم العضو");
        project.team.push({name, role: modalForm.memberRole.value});
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
          ${Object.keys(defaultCurrencyRates).map(c =>
            `<option value="${c}" ${c === (project.selectedCurrency || "USD") ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        <label for="exchangeRate">سعر التحويل إلى العملة المختارة *</label>
        <input id="exchangeRate" name="exchangeRate" type="number" step="0.0001" min="0" value="1" required />
        <button type="submit" class="btn">إضافة</button>
      `;
      modalForm.onsubmit = e => {
        e.preventDefault();
        const type = modalForm.transactionType.value;
        const desc = modalForm.transactionDesc.value.trim();
        const amount = parseFloat(modalForm.transactionAmount.value);
        const currency = modalForm.transactionCurrency.value;
        const exchangeRate = parseFloat(modalForm.exchangeRate.value);
        if (!type || isNaN(amount) || amount <= 0 || !exchangeRate || exchangeRate <= 0) {
          return alert("يرجى تعبئة الحقول المطلوبة بشكل صحيح");
        }
        project.transactions.push({type, description: desc, amount, currency, exchangeRate});
        saveProjects();
        renderFinance(project);
        closeModal();
      };
      break;
  }
}

function closeModal() {
  modalOverlay.classList.remove("visible");
  modalForm.innerHTML = "";
}

// ====== إعدادات الأحداث ======

modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

projectSearchInput.addEventListener("input", () => renderProjectsList(projectSearchInput.value));
btnNewProject.addEventListener("click", () => openModal("project"));

setupTabs();
renderProjectsList();
selectProject(currentProjectId);
