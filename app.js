// بيانات المشاريع
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let selectedProjectIndex = null;
let currentTab = "summary";

// عناصر DOM
const projectsList = document.getElementById("projectsList");
const tabContent = document.getElementById("tabContent");
const tabs = document.querySelectorAll(".tab");
const btnNewProject = document.getElementById("btnNewProject");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");
const projectSearch = document.getElementById("projectSearch");

// عرض المشاريع
function renderProjects() {
  const filter = projectSearch.value.trim().toLowerCase();
  projectsList.innerHTML = "";

  projects.forEach((proj, idx) => {
    if (!proj.name.toLowerCase().includes(filter)) return;

    const li = document.createElement("li");
    li.textContent = proj.name;
    li.classList.toggle("active", idx === selectedProjectIndex);
    li.addEventListener("click", () => selectProject(idx));
    projectsList.appendChild(li);
  });

  if (!projectsList.children.length) {
    const p = document.createElement("p");
    p.textContent = "لا توجد مشاريع تطابق البحث.";
    p.style.textAlign = "center";
    p.style.marginTop = "10px";
    projectsList.appendChild(p);
  }
}

// اختيار مشروع
function selectProject(index) {
  selectedProjectIndex = index;
  renderProjects();
  showProjectDetails();
  renderTabContent();
}

// عرض معلومات المشروع والتابات
function showProjectDetails() {
  tabs.forEach((tab) => tab.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${currentTab}"]`)?.classList.add("active");
  tabContent.classList.remove("show");
}

// التحكم بالتبويبات
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentTab = tab.dataset.tab;
    showProjectDetails();
    setTimeout(renderTabContent, 50);
  });
});

// عرض محتوى التبويب الحالي
function renderTabContent() {
  if (selectedProjectIndex === null) {
    tabContent.innerHTML = "<p>اختر مشروعًا من القائمة لبدء الإدارة.</p>";
    tabContent.classList.add("show");
    return;
  }

  const project = projects[selectedProjectIndex];
  switch (currentTab) {
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
    default:
      tabContent.innerHTML = "<p>المحتوى غير متوفر.</p>";
      tabContent.classList.add("show");
  }
}

// ملخص المشروع
function renderSummary(project) {
  tabContent.innerHTML = `
    <h3>ملخص المشروع</h3>
    <p><strong>الوصف:</strong> ${project.description || "—"}</p>
    <p><strong>البداية:</strong> ${project.startDate || "—"}</p>
    <p><strong>النهاية:</strong> ${project.endDate || "—"}</p>
    <p><strong>الحالة:</strong> ${project.status || "نشط"}</p>
  `;
  tabContent.classList.add("show");
}

// إدارة المهام
function renderTasks(project) {
  let html = `
    <button class="btn" onclick="openAddTaskModal()">+ إضافة مهمة جديدة</button>
    <ul>
  `;

  project.tasks.forEach((task, idx) => {
    html += `
      <li>
        <strong>${task.name}</strong> - الحالة: ${task.status || "معلقة"}
        <button onclick="editTask(${idx})">تعديل</button>
        <button onclick="deleteTask(${idx})">حذف</button>
      </li>
    `;
  });

  html += "</ul>";
  tabContent.innerHTML = html;
  tabContent.classList.add("show");
}

function openAddTaskModal() {
  openModal("إضافة مهمة جديدة", [
    { label: "اسم المهمة", name: "name", type: "text", required: true },
    {
      label: "الحالة",
      name: "status",
      type: "select",
      options: ["معلقة", "قيد التنفيذ", "مكتملة"],
      required: true,
    }
  ], (formData) => {
    projects[selectedProjectIndex].tasks.push({
      name: formData.name,
      status: formData.status,
    });
    saveProjects();
    renderTabContent();
    closeModal();
  });
}

function editTask(idx) {
  const task = projects[selectedProjectIndex].tasks[idx];
  openModal("تعديل مهمة", [
    { label: "اسم المهمة", name: "name", type: "text", required: true, value: task.name },
    {
      label: "الحالة",
      name: "status",
      type: "select",
      options: ["معلقة", "قيد التنفيذ", "مكتملة"],
      required: true,
      value: task.status,
    }
  ], (formData) => {
    projects[selectedProjectIndex].tasks[idx] = {
      name: formData.name,
      status: formData.status,
    };
    saveProjects();
    renderTabContent();
    closeModal();
  });
}

function deleteTask(idx) {
  if (confirm("هل أنت متأكد من حذف المهمة؟")) {
    projects[selectedProjectIndex].tasks.splice(idx, 1);
    saveProjects();
    renderTabContent();
  }
}

// إدارة الفريق
function renderTeam(project) {
  let html = `
    <button class="btn" onclick="openAddMemberModal()">+ إضافة عضو جديد</button>
    <ul>
  `;

  project.employees.forEach((member, idx) => {
    html += `
      <li>
        <strong>${member.name}</strong> - الدور: ${member.role || "عضو فريق"}
        <button onclick="deleteMember(${idx})">حذف</button>
      </li>
    `;
  });

  html += "</ul>";
  tabContent.innerHTML = html;
  tabContent.classList.add("show");
}

function openAddMemberModal() {
  openModal("إضافة عضو جديد", [
    { label: "اسم العضو", name: "name", type: "text", required: true },
    {
      label: "الدور",
      name: "role",
      type: "select",
      options: ["مدير", "عضو فريق", "مشاهد"],
      required: true,
    }
  ], (formData) => {
    projects[selectedProjectIndex].employees.push({
      name: formData.name,
      role: formData.role,
    });
    saveProjects();
    renderTabContent();
    closeModal();
  });
}

function deleteMember(idx) {
  if (confirm("هل أنت متأكد من حذف العضو؟")) {
    projects[selectedProjectIndex].employees.splice(idx, 1);
    saveProjects();
    renderTabContent();
  }
}

// المحاسبة المالية
function renderFinance(project) {
  const f = project.finance;
  const s = project.currencySymbol || "$";

  const calcTotal = (arr) => arr.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSales = calcTotal(f.sales);
  const totalPurchases = calcTotal(f.purchases);
  const totalSalaries = calcTotal(f.salaries);
  const totalExpenses = calcTotal(f.expenses);

  const currentBalance =
    (f.previousBalance || 0) + totalSales - totalPurchases - totalSalaries - totalExpenses;

  let html = `
    <h3>البيانات المالية (${project.currency || "العملة غير محددة"})</h3>
    <p><strong>الرصيد السابق:</strong> ${s}${f.previousBalance}</p>
    <p><strong>المبيعات:</strong> ${s}${totalSales}</p>
    <p><strong>المشتريات:</strong> ${s}${totalPurchases}</p>
    <p><strong>الرواتب:</strong> ${s}${totalSalaries}</p>
    <p><strong>النفقات:</strong> ${s}${totalExpenses}</p>
    <hr>
    <h4>💰 الرصيد الحالي: ${s}${currentBalance}</h4>
    <hr>
    <div style="margin-top: 20px">
      <button class="btn" onclick="addTransaction('sales')">+ إضافة مبيع</button>
      <button class="btn" onclick="addTransaction('purchases')">+ إضافة شراء</button>
      <button class="btn" onclick="addTransaction('expenses')">+ إضافة نفقة</button>
      <button class="btn" onclick="addTransaction('salaries')">+ دفع راتب</button>
    </div>
  `;
  tabContent.innerHTML = html;
  tabContent.classList.add("show");
}

// إضافة حركة مالية
function addTransaction(type) {
  const labels = {
    sales: "مبيع",
    purchases: "شراء",
    expenses: "نفقة",
    salaries: "راتب",
  };

  openModal(`إضافة ${labels[type]}`, [
    { label: "الوصف", name: "description", type: "text", required: true },
    { label: "المبلغ", name: "amount", type: "number", required: true },
    { label: "التاريخ", name: "date", type: "date", required: true },
  ], (formData) => {
    const entry = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
    };
    projects[selectedProjectIndex].finance[type].push(entry);
    saveProjects();
    renderTabContent();
    closeModal();
  });
}

// مودال عام
function openModal(title, fields, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = "";

  fields.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", field.name);
    modalForm.appendChild(label);

    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if(field.value && field.value === opt) option.selected = true;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
      if(field.value) input.value = field.value;
    }

    input.name = field.name;
    input.id = field.name;
    if (field.required) input.required = true;
    modalForm.appendChild(input);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.classList.add("btn");
  submitBtn.textContent = "حفظ";
  modalForm.appendChild(submitBtn);

  modalOverlay.classList.remove("hidden");
  modalForm.onsubmit = (e) => {
    e.preventDefault();
    const formData = {};
    fields.forEach((f) => {
      formData[f.name] = modalForm.elements[f.name].value;
    });
    onSubmit(formData);
  };
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalForm.innerHTML = "";
}
modalCancel.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// حفظ المشاريع في LocalStorage
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// البحث ضمن المشاريع
projectSearch.addEventListener("input", renderProjects);

// بدء التطبيق
function init() {
  renderProjects();
  showProjectDetails();
  renderTabContent();
}
init();
