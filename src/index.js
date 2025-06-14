const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filter-category");
const sortBySelect = document.getElementById("sort-by");
const exportBtn = document.getElementById("export-tasks");
const submitBtn = taskForm.querySelector("button[type='submit']");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let isEditing = false;
let editIndex = null;
let noTasksMessages = [];

const priorityMap = {
  high: 1,
  medium: 2,
  low: 3
};

// Select a random "no tasks left" message from messages.json
// If the contents of messages.json cannot be fetched , use a default message
function getRandomNoTasksMessage() {
  if (!noTasksMessages.length) return "🎉 No tasks left!";
  const index = Math.floor(Math.random() * noTasksMessages.length);
  return noTasksMessages[index];
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";
  let visibleCount = 0;
  const search = searchInput.value.toLowerCase();
  const categoryFilterValue = filterCategory.value;
  const sortOption = sortBySelect.value;

  const categories = new Set();
  tasks.forEach(task => {
    if (task.category) categories.add(task.category);
  });

  updateCategoryFilter(categories);

  let sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;

    const dateA = a.deadline ? new Date(a.deadline) : null;
    const dateB = b.deadline ? new Date(b.deadline) : null;
    const prioA = priorityMap[a.priority?.toLowerCase()] || 99;
    const prioB = priorityMap[b.priority?.toLowerCase()] || 99;

    switch (sortOption) {
      case "due-asc": return (dateA || Infinity) - (dateB || Infinity);
      case "due-desc": return (dateB || -Infinity) - (dateA || -Infinity);
      case "priority-asc": return prioA - prioB;
      case "priority-desc": return prioB - prioA;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  sortedTasks.forEach(task => {
    const taskCategory = task.category || "";
    if (
      (task.name.toLowerCase().includes(search) || taskCategory.toLowerCase().includes(search)) &&
      (categoryFilterValue === "" || taskCategory === categoryFilterValue)
    ) {
      visibleCount++;

      const li = document.createElement("li");
      li.classList.add(`priority-${task.priority?.toLowerCase() || "none"}`);
      if (task.done) li.classList.add("done");

      const daysLeft = task.deadline
        ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      const originalIndex = tasks.indexOf(task);

      li.innerHTML = `
        <div class="task-header">
          <strong>${task.name}</strong>
          <span>${taskCategory || "No category"}</span>
        </div>
        <div class="task-meta">
          ${task.deadline ? `Due ${task.deadline} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : "No deadline"} |
          Priority: ${task.priority || "None"}
        </div>
        <div class="task-actions">
          <button onclick="toggleDone(${originalIndex})">${task.done ? "Mark as incomplete" : "Mark as completed"}</button>
          <button onclick="editTask(${originalIndex})">Edit task</button>
          <button onclick="deleteTask(${originalIndex})">Delete task</button>
        </div>
      `;
      taskList.appendChild(li);
    }
  });

  if (visibleCount === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.fontStyle = "italic";
    emptyMessage.style.color = "#555";
    emptyMessage.textContent = search
      ? `No tasks found for "${search}"`
      : getRandomNoTasksMessage();
    taskList.appendChild(emptyMessage);
  }
}

function updateCategoryFilter(categories) {
  const currentValue = filterCategory.value;
  filterCategory.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All categories";
  filterCategory.appendChild(allOption);

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterCategory.appendChild(option);
  });

  if (categories.has(currentValue)) {
    filterCategory.value = currentValue;
  }
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  if (confirm("Delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

function editTask(index) {
  const task = tasks[index];
  document.getElementById("task-name").value = task.name;
  document.getElementById("task-category").value = task.category;
  document.getElementById("task-deadline").value = task.deadline;
  document.getElementById("task-priority").value = task.priority;

  isEditing = true;
  editIndex = index;
  submitBtn.textContent = "Update task";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

taskForm.addEventListener("submit", e => {
  e.preventDefault();

  const newTask = {
    name: document.getElementById("task-name").value.trim(),
    category: document.getElementById("task-category").value.trim(),
    deadline: document.getElementById("task-deadline").value,
    priority: document.getElementById("task-priority").value.trim().toLowerCase(),
    done: false
  };

  if (!newTask.name) return;

  if (isEditing && editIndex !== null) {
    tasks[editIndex] = newTask;
    isEditing = false;
    editIndex = null;
    submitBtn.textContent = "Add Task";
  } else {
    tasks.push(newTask);
  }

  saveTasks();
  renderTasks();
  taskForm.reset();
});

searchInput.addEventListener("input", renderTasks);
filterCategory.addEventListener("change", renderTasks);
sortBySelect.addEventListener("change", renderTasks);

function exportTasks() {
  if (tasks.length === 0) {
    alert("No tasks to export!");
    return;
  }

  const content = tasks.map(task => {
    return [
      `Task: ${task.name}`,
      `Category: ${task.category || "None"}`,
      `Deadline: ${task.deadline || "None"}`,
      `Priority: ${task.priority || "None"}`,
      `Status: ${task.done ? "Done" : "Not done"}`,
      "--------------------------"
    ].join("\n");
  }).join("\n\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "homework_tasks.txt";
  a.click();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportTasks);

// Fetch external messages and render after loaded
fetch('messages.json')
  .then(response => response.json())
  .then(data => {
    noTasksMessages = data.noTasksMessages || [];
    renderTasks();
  })
  .catch(err => {
    console.warn("Could not load messages.json, using default message.");
    renderTasks();
  });
