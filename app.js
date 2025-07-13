// بيانات المشاريع
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let selectedProjectIndex = null;
let currentTab = "summary";

// العناصر
const projectsList = document.getElementById("projectsList");
const tabContent = document.getElementById("tabContent");
const tabs = document.querySelectorAll(".tab");
const btnNewProject = document.getElementById("btnNewProject");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalCancel = document.getElementById("modalCancel");
const projectSearch = document.getElementById("projectSearch");

// تحديث عرض المشاريع
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

// عرض معلومات أساسية
function showProjectDetails() {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${currentTab}"]`)?.classList.add("active");
  tabContent.classList.remove("show");
}

// تبويبات
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentTab = tab.dataset.tab;
    showProjectDetails();
    setTimeout(renderTabContent, 50); // تحريك سلس
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
  let html = "";

  switch (currentTab) {
    case "summary":
      html = `
        <h3>ملخص المشروع</h3>
        <p><strong>الوصف:</strong> ${project.description || "—"}</p>
        <p><strong>البداية:</strong> ${project.startDate || "—"}</p>
        <p><strong>النهاية:</strong> ${project.endDate || "—"}</p>
        <p><strong>الحالة:</strong> ${project.status || "نشط"}</p>
      `;
      break;

    case "tasks":
      html = `<h3>المهام</h3><p>لاحقاً سيتم إضافة المهام هنا.</p>`;
      break;

    case "team":
      html = `<h3>الفريق</h3><p>لاحقاً سيتم عرض الموظفين.</p>`;
      break;

    case "attendance":
      html = `<h3>الدوام</h3><p>لاحقاً سيتم إضافة إدارة الدوام.</p>`;
      break;

    case "finance":
      const f = project.finance;
      const s = project.currencySymbol || "$";

      const calcTotal = (arr) => arr.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalSales = calcTotal(f.sales);
      const totalPurchases = calcTotal(f.purchases);
      const totalSalaries = calcTotal(f.salaries);
      const totalExpenses = calcTotal(f.expenses);

      const currentBalance =
        (f.previousBalance || 0) + totalSales - totalPurchases - totalSalaries - totalExpenses;

      html = `
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
      break;
  }

  tabContent.innerHTML = html;
  tabContent.classList.add("show");
}

// زر إضافة مشروع جديد
btnNewProject.addEventListener("click", () => {
  openModal("إضافة مشروع جديد", [
    { label: "اسم المشروع", name: "name", type: "text", required: true },
    { label: "الوصف", name: "description", type: "text" },
    { label: "تاريخ البداية", name: "startDate", type: "date" },
    { label: "تاريخ النهاية", name: "endDate", type: "date" },
    {
      label: "حالة المشروع",
      name: "status",
      type: "select",
      options: ["نشط", "مؤجل", "مكتمل"],
      required: true,
    },
    { label: "العملة الرئيسية", name: "currency", type: "text", required: true },
    { label: "رمز العملة", name: "currencySymbol", type: "text", required: true },
    { label: "الرصيد السابق", name: "previousBalance", type: "number" },
  ], (formData) => {
    const newProject = {
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
      tasks: [],
      employees: [],
      attendance: [],
      finance: {
        previousBalance: parseFloat(formData.previousBalance || 0),
        salaries: [],
        purchases: [],
        sales: [],
        expenses: [],
      },
    };
    projects.push(newProject);
    saveProjects();
    renderProjects();
    selectProject(projects.length - 1);
    closeModal();
  });
});

// مودال
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
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
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

// حفظ البيانات
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
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

// البحث
projectSearch.addEventListener("input", renderProjects);

// بدء
function init() {
  renderProjects();
  showProjectDetails();
}
init();
