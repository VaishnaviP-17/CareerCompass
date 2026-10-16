
const STORAGE_KEY = "applications";
const CHECKLIST_KEY = "careerCompassChecklist";
const API_BASE_URL = "http://127.0.0.1:8000";
let applications = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

const form = document.getElementById("app-form");
const list = document.getElementById("app-list");
const deadlineList = document.getElementById("deadline-list");
const emptyState = document.getElementById("empty-state");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");

const statuses = [
    "Wishlist",
    "Applied",
    "Interview",
    "Offer",
    "Rejected"
];

// Save applications without changing the existing storage key.
async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        applications = await response.json();
        render();
    } catch (error) {
        console.error("Failed to load applications:", error);
    }
}
function save() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
    );
}

// Create an element and safely display text inside it.
function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// Format a date without changing the stored date.
function formatDate(dateString) {
    if (!dateString) {
        return "No date";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Compare calendar dates using local time.
function daysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(dateString + "T00:00:00");

    if (Number.isNaN(target.getTime())) {
        return null;
    }

    return Math.round(
        (target.getTime() - today.getTime()) / 86400000
    );
}

// Update the dashboard counters.
function updateStats() {
    const count = (status) =>
        applications.filter(
            (app) => app.status === status
        ).length;

    document.getElementById("stat-total").textContent =
        applications.length;

    document.getElementById("stat-applied").textContent =
        count("Applied");

    document.getElementById("stat-interview").textContent =
        count("Interview");

    document.getElementById("stat-offer").textContent =
        count("Offer");
}

const PREPARATION_KEY = "careerCompassApplicationTasks";

function getApplicationKey(app) {
    return JSON.stringify([
        app.company,
        app.role,
        app.deadline
    ]);
}

function getPreparationTasks(app) {
    const allTasks = JSON.parse(
        localStorage.getItem(PREPARATION_KEY) || "{}"
    );

    return allTasks[getApplicationKey(app)] || [];
}

function savePreparationTasks(app, tasks) {
    const allTasks = JSON.parse(
        localStorage.getItem(PREPARATION_KEY) || "{}"
    );

    allTasks[getApplicationKey(app)] = tasks;

    localStorage.setItem(
        PREPARATION_KEY,
        JSON.stringify(allTasks)
    );
}

function openPreparationChecklist(app) {
    const tasks = getPreparationTasks(app);

    const overlay = document.createElement("div");
    overlay.className = "preparation-overlay";

    const modal = document.createElement("section");
    modal.className = "preparation-modal";

    const heading = document.createElement("h2");
    heading.textContent = "Preparation checklist";

    const subtitle = document.createElement("p");
    subtitle.className = "muted";
    subtitle.textContent = app.company + " — " + app.role;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "secondary-button";
    closeButton.textContent = "Close";

    const taskList = document.createElement("div");
    taskList.className = "preparation-task-list";

    const progress = document.createElement("p");
    progress.className = "muted";

    const taskInput = document.createElement("input");
    taskInput.type = "text";
    taskInput.placeholder = "e.g. Practise Python questions";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "primary-button";
    addButton.textContent = "Add task";

    function updateProgress() {
        const completed = tasks.filter(
            (task) => task.completed
        ).length;

        progress.textContent =
            completed + " of " + tasks.length + " tasks completed";
    }

    function renderTasks() {
        taskList.replaceChildren();

        tasks.forEach((task, index) => {
            const row = document.createElement("div");
            row.className = "preparation-task";

            const label = document.createElement("label");
            label.className = "check-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;

            const text = document.createElement("span");
            text.textContent = task.text;

            checkbox.addEventListener("change", () => {
                tasks[index].completed = checkbox.checked;
                savePreparationTasks(app, tasks);
                renderTasks();
            });

            label.appendChild(checkbox);
            label.appendChild(text);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Remove";

            deleteButton.addEventListener("click", () => {
                tasks.splice(index, 1);
                savePreparationTasks(app, tasks);
                renderTasks();
            });

            row.appendChild(label);
            row.appendChild(deleteButton);
            taskList.appendChild(row);
        });

        updateProgress();
    }

    function addTask() {
        const text = taskInput.value.trim();

        if (!text) {
            taskInput.focus();
            return;
        }

        tasks.push({
            text: text,
            completed: false
        });

        savePreparationTasks(app, tasks);
        taskInput.value = "";
        renderTasks();
        taskInput.focus();
    }

    addButton.addEventListener("click", addTask);

    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addTask();
        }
    });

    function closeModal() {
        document.removeEventListener("keydown", handleEscape);
        overlay.remove();
    }

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    closeButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });

    document.addEventListener("keydown", handleEscape);

    const inputRow = document.createElement("div");
    inputRow.className = "preparation-input-row";
    inputRow.appendChild(taskInput);
    inputRow.appendChild(addButton);

    modal.appendChild(heading);
    modal.appendChild(subtitle);
    modal.appendChild(closeButton);
    modal.appendChild(taskList);
    modal.appendChild(progress);
    modal.appendChild(inputRow);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderTasks();
    taskInput.focus();
}

// Build one application card.
function createApplicationCard(app, index) {
    const card = makeElement("article", "application-card");
    const details = makeElement("div", "application-details");

    details.appendChild(
        makeElement("h3", "", app.company)
    );

    details.appendChild(
        makeElement("p", "", app.role)
    );

    const meta = makeElement("div", "application-meta");

    const statusBadge = makeElement(
        "span",
        "status-badge status-" +
            app.status.toLowerCase(),
        app.status
    );

    meta.appendChild(statusBadge);

    meta.appendChild(
        makeElement(
            "span",
            "muted",
            "Deadline: " + formatDate(app.deadline)
        )
    );

    details.appendChild(meta);

    const actions = makeElement("div", "card-actions");

    // Change an application's status.
    const editButton = makeElement(
        "button",
        "secondary-button",
        "Edit status"
    );

    editButton.type = "button";

    
editButton.addEventListener("click", async () => {
    const nextStatus = window.prompt(
        "Enter the new status:\n" + statuses.join(", "),
        app.status
    );

    if (nextStatus === null) {
        return;
    }

    const matchedStatus = statuses.find(
        (status) =>
            status.toLowerCase() === nextStatus.trim().toLowerCase()
    );

    if (!matchedStatus) {
        window.alert(
            "Invalid status. Choose: " + statuses.join(", ")
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/applications/${app.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    company: app.company,
                    role: app.role,
                    status: matchedStatus,
                    deadline: app.deadline
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const updatedApplication = await response.json();

        applications[index] = updatedApplication;
        save();
        render();

        window.alert("Application status updated successfully!");
    } catch (error) {
        console.error("Failed to update application:", error);
        window.alert(
            "Could not update the status. Please check the backend and try again."
        );
    }
});


    // Delete only after confirmation.
    const deleteButton = makeElement(
        "button",
        "delete-button",
        "Delete"
    );

    deleteButton.type = "button";

    
deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
        "Delete the application for " + app.company + "?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/applications/${app.id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        applications.splice(index, 1);
        save();
        render();

        window.alert("Application deleted successfully!");
    } catch (error) {
        console.error("Failed to delete application:", error);
        window.alert(
            "Could not delete the application. Please check the backend and try again."
        );
    }
});

const prepareButton = makeElement(
    "button",
    "secondary-button",
    "Prepare"
);

prepareButton.type = "button";


prepareButton.addEventListener("click", () => {
    openPreparationChecklist(app);
});


    actions.appendChild(prepareButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    card.appendChild(details);
    card.appendChild(actions);

    return card;
}

// Display deadlines that are still relevant.

function renderDeadlines() {
    deadlineList.replaceChildren();

    const deadlineApplications = applications
        .filter(
            (app) =>
                app.deadline &&
                app.status !== "Rejected" &&
                app.status !== "Offer"
        )
        .map((app) => ({
            ...app,
            days: daysUntil(app.deadline)
        }))
        .filter((app) => app.days !== null)
        .sort((a, b) => a.days - b.days);

    if (deadlineApplications.length === 0) {
        deadlineList.appendChild(
            makeElement(
                "p",
                "empty-state",
                "No active application deadlines to display."
            )
        );
        return;
    }

    deadlineApplications.forEach((app) => {
        const card = makeElement("article", "deadline-card");
        const details = makeElement("div");

        details.appendChild(
            makeElement(
                "strong",
                "",
                app.company + " — " + app.role
            )
        );

        details.appendChild(
            makeElement(
                "p",
                "",
                "Deadline: " + formatDate(app.deadline)
            )
        );

        let label;
        let badgeClass;

        if (app.days < 0) {
            label = "Overdue by " + Math.abs(app.days) +
                (Math.abs(app.days) === 1 ? " day" : " days");
            badgeClass = "deadline-past";
        } else if (app.days === 0) {
            label = "Due today";
            badgeClass = "deadline-today";
        } else if (app.days <= 3) {
            label = app.days + " days left";
            badgeClass = "deadline-soon";
        } else {
            label = app.days + " days left";
            badgeClass = "deadline-normal";
        }

        card.appendChild(details);

        card.appendChild(
            makeElement(
                "span",
                "deadline-badge " + badgeClass,
                label
            )
        );

        deadlineList.appendChild(card);
    });
}


// Load and save checklist progress separately from applications.
function setupChecklist() {
    const savedTasks = JSON.parse(
        localStorage.getItem(CHECKLIST_KEY) || "{}"
    );

    const checkboxes = document.querySelectorAll(
        ".check-item input[type='checkbox']"
    );

    checkboxes.forEach((checkbox) => {
        checkbox.checked = savedTasks[checkbox.dataset.task] === true;

        checkbox.addEventListener("change", () => {
            savedTasks[checkbox.dataset.task] = checkbox.checked;

            localStorage.setItem(
                CHECKLIST_KEY,
                JSON.stringify(savedTasks)
            );

            updateChecklistProgress();
        });
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = Array.from(
        document.querySelectorAll(
            ".check-item input[type='checkbox']"
        )
    );

    const completed = checkboxes.filter(
        (checkbox) => checkbox.checked
    ).length;

    document.getElementById("checklist-progress").textContent =
        `${completed} of ${checkboxes.length} tasks completed`;
}

// Refresh the screen from the saved data.

function render() {
    list.replaceChildren();

    // Read the current search text and selected status.
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    // Keep only applications that match both conditions.
    const filteredApplications = applications.filter((app) => {
        const company = (app.company || "").toLowerCase();
        const role = (app.role || "").toLowerCase();

        const matchesSearch =
            company.includes(query) || role.includes(query);

        const matchesStatus =
            selectedStatus === "All" ||
            app.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Display the matching applications.
    filteredApplications.forEach((app) => {
        const originalIndex = applications.indexOf(app);

        list.appendChild(
            createApplicationCard(app, originalIndex)
        );
    });

    // Explain why the list is empty.
    emptyState.hidden = filteredApplications.length > 0;

    if (filteredApplications.length === 0) {
        emptyState.textContent = applications.length === 0
            ? "No applications yet. Add your first opportunity above!"
            : "No matching applications. Try another search or status.";
    }

    // The dashboard counts show ALL applications, not just filtered ones.
    document.getElementById("application-count").textContent =
        filteredApplications.length +
        (filteredApplications.length === 1
            ? " matching application"
            : " matching applications");

    updateStats();
    renderDeadlines();
}



 // Add a new application through the FastAPI backend.
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const company = document.getElementById("company").value.trim();
    const role = document.getElementById("role").value.trim();
    const deadline = document.getElementById("deadline").value;
    const status = document.getElementById("status").value;

    if (!company || !role || !deadline) {
        window.alert("Please fill in all the application fields.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                company,
                role,
                status,
                deadline
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || `Request failed: ${response.status}`
            );
        }

        const newApplication = await response.json();

        applications.push(newApplication);
        save();
        render();
        form.reset();

        window.alert("Application saved successfully!");
    } catch (error) {
        console.error("Failed to save application:", error);
        window.alert(
            "Could not save the application to the backend. Please check that the server is running."
        );
    }
});
loadApplications();
