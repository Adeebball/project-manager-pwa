// عناصر DOM
const btnNewProject = document.getElementById('btnNewProject');
const projectsList = document.getElementById('projectsList');
const projectDetails = document.querySelector('.project-details');
const currentProjectName = document.getElementById('currentProjectName');

const tabs = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tabContent');

const btnAddTask = document.getElementById('btnAddTask');
const btnAddMember = document.getElementById('btnAddMember');
const btnAddAttendance = document.getElementById('btnAddAttendance');
const btnAddTransaction = document.getElementById('btnAddTransaction');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const modalCancel = document.getElementById('modalCancel');

let projects = JSON.parse(localStorage.getItem('projects')) || [];
let selectedProjectIndex = null;
let currentTab = 'summary';

// دوال تخزين واسترجاع
function saveProjects() {
  localStorage.setItem('projects', JSON.stringify(projects));
}

// عرض قائمة المشاريع
function renderProjects() {
  projectsList.innerHTML = '';
  projects.forEach((proj, idx) => {
    const li = document.createElement('li');
    li.textContent = proj.name;
    li.tabIndex = 0;
    li.classList.toggle('active', idx === selectedProjectIndex);
    li.addEventListener('click', () => selectProject(idx));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') selectProject(idx);
    });
    projectsList.appendChild(li);
  });
}

// اختيار مشروع
function selectProject(idx) {
  selectedProjectIndex = idx;
  renderProjects();
  showProjectDetails();
  enableActionButtons(true);
  renderTabContent();
}

// تفعيل/تعطيل أزرار الإضافة
function enableActionButtons(enable) {
  [btnAddTask, btnAddMember, btnAddAttendance, btnAddTransaction].forEach(btn => {
    btn.disabled = !enable;
    btn.setAttribute('aria-disabled', !enable);
  });
}

// إظهار تفاصيل المشروع
function showProjectDetails() {
  if (selectedProjectIndex === null) {
    projectDetails.classList.add('hidden');
    currentProjectName.textContent = '-- اختر مشروع لعرض التفاصيل --';
  } else {
    projectDetails.classList.remove('hidden');
    currentProjectName.textContent = projects[selectedProjectIndex].name;
  }
}

// تغيير التبويب
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (!tab.classList.contains('active')) {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentTab = tab.getAttribute('data-tab');
      renderTabContent();
    }
  });
});

// عرض محتوى التبويب حسب القسم المختار
function renderTabContent() {
  if (selectedProjectIndex === null) {
    tabContent.innerHTML = '<p>اختر مشروعًا من القائمة لبدء الإدارة.</p>';
    return;
  }

  const project = projects[selectedProjectIndex];

  switch (currentTab) {
    case 'summary':
      tabContent.innerHTML = `
        <h3>ملخص المشروع</h3>
        <p><strong>الوصف:</strong> ${project.description || 'لا يوجد وصف'}</p>
        <p><strong>تاريخ البداية:</strong> ${project.startDate || 'غير محدد'}</p>
        <p><strong>تاريخ النهاية:</strong> ${project.endDate || 'غير محدد'}</p>
        <p><strong>حالة المشروع:</strong> ${project.status || 'نشط'}</p>
      `;
      break;

    case 'tasks':
      renderTasks(project);
      break;

    case 'employees':
      renderEmployees(project);
      break;

    case 'attendance':
      renderAttendance(project);
      break;

    case 'finance':
      renderFinance(project);
      break;

    case 'reports':
      tabContent.innerHTML = `<p>قيد التطوير...</p>`;
      break;
  }
}

// مهام
function renderTasks(project) {
  const tasks = project.tasks || [];
  let html = `<h3>المهام</h3>`;
  if (tasks.length === 0) {
    html += '<p>لا توجد مهام حالياً.</p>';
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>المهمة</th>
            <th>الحالة</th>
            <th>تعديل</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (task, idx) => `
            <tr>
              <td>${task.name}</td>
              <td>${task.status}</td>
              <td><button onclick="editTask(${idx})">تعديل</button></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
  tabContent.innerHTML = html;
}

// موظفين
function renderEmployees(project) {
  const employees = project.employees || [];
  let html = `<h3>الموظفين</h3>`;
  if (employees.length === 0) {
    html += '<p>لا يوجد موظفين حالياً.</p>';
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>اسم الموظف</th>
            <th>الوظيفة</th>
            <th>تعديل</th>
          </tr>
        </thead>
        <tbody>
          ${employees
            .map(
              (emp, idx) => `
            <tr>
              <td>${emp.name}</td>
              <td>${emp.position}</td>
              <td><button onclick="editEmployee(${idx})">تعديل</button></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
  tabContent.innerHTML = html;
}

// دوام
function renderAttendance(project) {
  const attendance = project.attendance || [];
  let html = `<h3>سجل الدوام</h3>`;
  if (attendance.length === 0) {
    html += '<p>لا يوجد سجلات دوام حالياً.</p>';
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>اسم الموظف</th>
            <th>تاريخ</th>
            <th>ساعات العمل</th>
          </tr>
        </thead>
        <tbody>
          ${attendance
            .map(
              (att) => `
            <tr>
              <td>${att.employeeName}</td>
              <td>${att.date}</td>
              <td>${att.hours}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
  tabContent.innerHTML = html;
}

// المحاسبة
function renderFinance(project) {
  const finance = project.finance || {
    previousBalance: 0,
    salaries: [],
    purchases: [],
    sales: [],
    expenses: [],
  };

  let totalSalaries = finance.salaries.reduce((a, b) => a + (b.amount || 0), 0);
  let totalPurchases = finance.purchases.reduce((a, b) => a + (b.amount || 0), 0);
  let totalSales = finance.sales.reduce((a, b) => a + (b.amount || 0), 0);
  let totalExpenses = finance.expenses.reduce((a, b) => a + (b.amount || 0), 0);

  let currentBalance =
    finance.previousBalance + totalSales - totalPurchases - totalSalaries - totalExpenses;

  let html = `<h3>برنامج المحاسبة</h3>`;
  html += `
    <p><strong>الرصيد السابق:</strong> ${finance.previousBalance.toFixed(2)} د.ع</p>
    <p><strong>إجمالي الرواتب:</strong> ${totalSalaries.toFixed(2)} د.ع</p>
    <p><strong>إجمالي المشتريات:</strong> ${totalPurchases.toFixed(2)} د.ع</p>
    <p><strong>إجمالي المبيعات:</strong> ${totalSales.toFixed(2)} د.ع</p>
    <p><strong>إجمالي النفقات:</strong> ${totalExpenses.toFixed(2)} د.ع</p>
    <p><strong>الرصيد الحالي:</strong> ${currentBalance.toFixed(2)} د.ع</p>
  `;

  tabContent.innerHTML = html;
}

// فتح المودال لإضافة مشروع جديد
btnNewProject.addEventListener('click', () => {
  openModal('إضافة مشروع جديد', [
    { label: 'اسم المشروع', name: 'name', type: 'text', required: true },
    { label: 'الوصف', name: 'description', type: 'text' },
    { label: 'تاريخ البداية', name: 'startDate', type: 'date' },
    { label: 'تاريخ النهاية', name: 'endDate', type: 'date' },
    {
      label: 'حالة المشروع',
      name: 'status',
      type: 'select',
      options: ['نشط', 'مؤجل', 'مكتمل'],
      required: true,
    },
  ], (formData) => {
    const newProject = {
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      tasks: [],
      employees: [],
      attendance: [],
      finance: {
        previousBalance: 0,
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

// أزرار الإضافة لكل قسم

btnAddTask.addEventListener('click', () => {
  openModal('إضافة مهمة جديدة', [
    { label: 'اسم المهمة', name: 'name', type: 'text', required: true },
    {
      label: 'الحالة',
      name: 'status',
      type: 'select',
      options: ['معلقة', 'قيد التنفيذ', 'مكتملة'],
      required: true,
    },
  ], (formData) => {
    projects[selectedProjectIndex].tasks.push({
      name: formData.name,
      status: formData.status,
    });
    saveProjects();
    renderTabContent();
    closeModal();
  });
});

btnAddMember.addEventListener('click', () => {
  openModal('إضافة موظف جديد', [
    { label: 'اسم الموظف', name: 'name', type: 'text', required: true },
    { label: 'الوظيفة', name: 'position', type: 'text' },
  ], (formData) => {
    projects[selectedProjectIndex].employees.push({
      name: formData.name,
      position: formData.position,
    });
    saveProjects();
    renderTabContent();
    closeModal();
  });
});

btnAddAttendance.addEventListener('click', () => {
  openModal('تسجيل دوام', [
    {
      label: 'اسم الموظف',
      name: 'employeeName',
      type: 'select',
      options: projects[selectedProjectIndex].employees.map(e => e.name),
      required: true,
    },
    { label: 'التاريخ', name: 'date', type: 'date', required: true },
    { label: 'ساعات العمل', name: 'hours', type: 'number', min: 0, step: 0.1, required: true },
  ], (formData) => {
    projects[selectedProjectIndex].attendance.push({
      employeeName: formData.employeeName,
      date: formData.date,
      hours: parseFloat(formData.hours),
    });
    saveProjects();
    renderTabContent();
    closeModal();
  });
});

btnAddTransaction.addEventListener('click', () => {
  openModal('إضافة معاملة مالية', [
    {
      label: 'نوع المعاملة',
      name: 'type',
      type: 'select',
      options: ['راتب', 'مشتريات', 'مبيعات', 'نفقات'],
      required: true,
    },
    { label: 'الوصف', name: 'description', type: 'text' },
    { label: 'المبلغ', name: 'amount', type: 'number', min: 0, step: 0.01, required: true },
  ], (formData) => {
    const finance = projects[selectedProjectIndex].finance;
    const amount = parseFloat(formData.amount);
    switch (formData.type) {
      case 'راتب':
        finance.salaries.push({ description: formData.description, amount });
        break;
      case 'مشتريات':
        finance.purchases.push({ description: formData.description, amount });
        break;
      case 'مبيعات':
        finance.sales.push({ description: formData.description, amount });
        break;
      case 'نفقات':
        finance.expenses.push({ description: formData.description, amount });
        break;
    }
    saveProjects();
    renderTabContent();
    closeModal();
  });
});

// فتح المودال مع بناء النموذج
function openModal(title, fields, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = '';

  fields.forEach(field => {
    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', field.name);
    modalForm.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.name = field.name;
      input.id = field.name;
      if (field.required) input.required = true;

      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
      input.name = field.name;
      input.id = field.name;
      if (field.required) input.required = true;
      if (field.min !== undefined) input.min = field.min;
      if (field.step !== undefined) input.step = field.step;
    }
    modalForm.appendChild(input);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'حفظ';
  modalForm.appendChild(submitBtn);

  modalOverlay.classList.remove('hidden');
  modalForm.onsubmit = e => {
    e.preventDefault();
    const formData = {};
    fields.forEach(f => {
      formData[f.name] = modalForm.elements[f.name].value;
    });
    onSubmit(formData);
  };
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalForm.innerHTML = '';
}

modalCancel.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// وظائف التحرير (ممكن تضيف لاحقاً)
window.editTask = function (idx) {
  alert('ميزة تعديل المهمة قيد التطوير');
};
window.editEmployee = function (idx) {
  alert('ميزة تعديل الموظف قيد التطوير');
};

// تهيئة التطبيق
function init() {
  renderProjects();
  showProjectDetails();
  enableActionButtons(false);
}

init();
