// ========================================
// CAREFLOW - HEALTHCARE STAFF SHIFT PLANNER
// ========================================

// Short helper for selecting HTML elements
const $ = (id) => document.getElementById(id);

const todayString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// ========================================
// SAMPLE DATA
// ========================================

let staff = [
    {
        id: 1,
        name: "Aarav Sharma",
        role: "Doctor",
        department: "Emergency",
        email: "aarav@example.com"
    },
    {
        id: 2,
        name: "Priya Verma",
        role: "Nurse",
        department: "ICU",
        email: "priya@example.com"
    },
    {
        id: 3,
        name: "Rahul Singh",
        role: "Technician",
        department: "Laboratory",
        email: "rahul@example.com"
    },
    {
        id: 4,
        name: "Ananya Gupta",
        role: "Nurse",
        department: "General Ward",
        email: "ananya@example.com"
    }
];

let shifts = [
    {
        id: 1,
        staffId: 1,
        date: todayString(),
        type: "Morning",
        start: "08:00",
        end: "14:00"
    },
    {
        id: 2,
        staffId: 2,
        date: todayString(),
        type: "Evening",
        start: "14:00",
        end: "20:00"
    },
    {
        id: 3,
        staffId: 3,
        date: todayString(),
        type: "Night",
        start: "20:00",
        end: "08:00"
    }
];

let leaves = [
    {
        id: 1,
        staffId: 4,
        date: todayString(),
        reason: "Personal work",
        status: "Pending"
    }
];

let nextStaffId = 5;
let nextShiftId = 4;
let nextLeaveId = 2;

// ========================================
// HELPER FUNCTIONS
// ========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getStaff(staffId) {
    return staff.find(person => person.id === Number(staffId));
}

function getStaffName(staffId) {
    const person = getStaff(staffId);
    return person ? person.name : "Unknown Staff";
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(time) {
    if (!time) return "-";

    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function toMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function getShiftInterval(shift) {
    const start = new Date(`${shift.date}T${shift.start}:00`);
    const end = new Date(`${shift.date}T${shift.end}:00`);

    // If end time is earlier than or equal to start time,
    // treat the shift as continuing into the next day.
    if (toMinutes(shift.end) <= toMinutes(shift.start)) {
        end.setDate(end.getDate() + 1);
    }

    return {
        start: start.getTime(),
        end: end.getTime()
    };
}

function intervalsOverlap(first, second) {
    return first.start < second.end &&
           second.start < first.end;
}

// ========================================
// STAFF DROPDOWNS
// ========================================

function renderStaffDropdowns() {
    const shiftSelect = $("shiftStaff");
    const leaveSelect = $("leaveStaff");

    const staffOptions = staff.map(person => `
        <option value="${person.id}">
            ${escapeHTML(person.name)} - ${escapeHTML(person.role)}
        </option>
    `).join("");

    shiftSelect.innerHTML =
        '<option value="">Choose staff member</option>' + staffOptions;

    leaveSelect.innerHTML =
        '<option value="">Choose staff member</option>' + staffOptions;
}

// ========================================
// STAFF MANAGEMENT
// ========================================

function renderStaff(searchText = "") {
    const table = $("staffTable");

    const search = searchText.trim().toLowerCase();

    const filteredStaff = staff.filter(person => {
        return (
            person.name.toLowerCase().includes(search) ||
            person.role.toLowerCase().includes(search) ||
            person.department.toLowerCase().includes(search) ||
            person.email.toLowerCase().includes(search)
        );
    });

    if (filteredStaff.length === 0) {
        table.innerHTML = `
            <tr><td colspan="5" class="empty-row">
                No staff members found.
            </td></tr>
        `;
        return;
    }

    table.innerHTML = filteredStaff.map(person => `
        <tr>
            <td>
                <span class="staff-avatar">
                    ${escapeHTML(person.name.charAt(0).toUpperCase())}
                </span>
                <span class="staff-name-cell">${escapeHTML(person.name)}</span>
            </td>
            <td>${escapeHTML(person.role)}</td>
            <td>${escapeHTML(person.department)}</td>
            <td>${escapeHTML(person.email)}</td>
            <td>
                <button class="action-button edit-button"
                    data-action="edit-staff" data-id="${person.id}">
                    Edit
                </button>
                <button class="action-button delete-button"
                    data-action="delete-staff" data-id="${person.id}">
                    Remove
                </button>
            </td>
        </tr>
    `).join("");
}

$("staffForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = $("staffName").value.trim();
    const role = $("staffRole").value;
    const department = $("department").value;
    const email = $("staffEmail").value.trim();

    if (!name || !role || !department || !email) {
        alert("Please complete all staff details.");
        return;
    }

    const emailExists = staff.some(person =>
        person.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
        alert("This email address is already registered.");
        return;
    }

    staff.push({
        id: nextStaffId++,
        name,
        role,
        department,
        email
    });

    this.reset();
    renderAll();

    alert("Staff member added successfully!");
});

$("staffSearch").addEventListener("input", function() {
    renderStaff(this.value);
});

$("staffTable").addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const person = getStaff(id);

    if (!person) return;

    if (action === "edit-staff") {
        const newName = prompt("Enter staff name:", person.name);

        if (newName === null) return;

        const cleanedName = newName.trim();

        if (!cleanedName) {
            alert("Name cannot be empty.");
            return;
        }

        const newEmail = prompt("Enter staff email:", person.email);

        if (newEmail === null) return;

        const cleanedEmail = newEmail.trim();

        if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
            alert("Please enter a valid email address.");
            return;
        }

        const emailExists = staff.some(item =>
            item.id !== id &&
            item.email.toLowerCase() === cleanedEmail.toLowerCase()
        );

        if (emailExists) {
            alert("This email is already used by another staff member.");
            return;
        }

        person.name = cleanedName;
        person.email = cleanedEmail;

        renderAll();
        alert("Staff details updated.");
    }

    if (action === "delete-staff") {
        const hasShifts = shifts.some(shift => shift.staffId === id);
        const hasLeaves = leaves.some(leave => leave.staffId === id);

        if (hasShifts || hasLeaves) {
            alert("This staff member has shift or leave records. Remove those records first.");
            return;
        }

        const confirmDelete = confirm(
            `Are you sure you want to remove ${person.name}?`
        );

        if (!confirmDelete) return;

        staff = staff.filter(item => item.id !== id);
        renderAll();
    }
});

// ========================================
// SHIFT MANAGEMENT
// ========================================

function renderShifts() {
    const table = $("shiftTable");

    if (shifts.length === 0) {
        table.innerHTML = `
            <tr><td colspan="5" class="empty-row">
                No shifts assigned yet.
            </td></tr>
        `;
        return;
    }

    const sortedShifts = [...shifts].sort((a, b) => {
        return (
            a.date.localeCompare(b.date) ||
            a.start.localeCompare(b.start)
        );
    });

    table.innerHTML = sortedShifts.map(shift => {
        const person = getStaff(shift.staffId);

        return `
            <tr>
                <td class="staff-name-cell">${escapeHTML(getStaffName(shift.staffId))}</td>
                <td>${person ? escapeHTML(person.department) : "-"}</td>
                <td>${formatDate(shift.date)}</td>
                <td>${escapeHTML(shift.type)}</td>
                <td>${formatTime(shift.start)} – ${formatTime(shift.end)}</td>
            </tr>
        `;
    }).join("");
}

function checkShiftConflict(newShift) {
    const newInterval = getShiftInterval(newShift);

    const existingConflict = shifts.some(oldShift => {
        if (oldShift.staffId !== newShift.staffId) return false;

        const oldInterval = getShiftInterval(oldShift);

        return intervalsOverlap(newInterval, oldInterval);
    });

    if (existingConflict) {
        return "This staff member already has an overlapping shift.";
    }

    const approvedLeave = leaves.some(leave => {
        return (
            leave.staffId === newShift.staffId &&
            leave.status === "Approved" &&
            leave.date === newShift.date
        );
    });

    if (approvedLeave) {
        return "This staff member has approved leave on this date.";
    }

    return "";
}

$("shiftForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const staffId = Number($("shiftStaff").value);
    const date = $("shiftDate").value;
    const type = $("shiftType").value;
    const start = $("startTime").value;
    const end = $("endTime").value;

    if (!staffId || !date || !type || !start || !end) {
        showMessage("Please complete all shift details.", "error");
        return;
    }

    if (start === end) {
        showMessage("Start time and end time cannot be the same.", "error");
        return;
    }

    const newShift = {
        id: nextShiftId,
        staffId,
        date,
        type,
        start,
        end
    };

    const conflict = checkShiftConflict(newShift);

    if (conflict) {
        showMessage(conflict, "error");
        return;
    }

    shifts.push(newShift);
    nextShiftId++;

    this.reset();
    $("shiftDate").value = todayString();

    showMessage("Shift assigned successfully!", "success");
    renderAll();
});

function showMessage(message, type) {
    const box = $("shiftMessage");

    box.textContent = message;
    box.className = `message ${type}`;
}

// ========================================
// LEAVE MANAGEMENT
// ========================================

function renderLeaves() {
    const table = $("leaveTable");

    if (leaves.length === 0) {
        table.innerHTML = `
            <tr><td colspan="5" class="empty-row">
                No leave requests available.
            </td></tr>
        `;
        return;
    }

    table.innerHTML = leaves.map(leave => {
        const statusClass = leave.status.toLowerCase();

        let actionButtons = "-";

        if (leave.status === "Pending") {
            actionButtons = `
                <button class="action-button approve-button"
                    data-action="approve-leave" data-id="${leave.id}">
                    Approve
                </button>
                <button class="action-button reject-button"
                    data-action="reject-leave" data-id="${leave.id}">
                    Reject
                </button>
            `;
        }

        return `
            <tr>
                <td class="staff-name-cell">${escapeHTML(getStaffName(leave.staffId))}</td>
                <td>${formatDate(leave.date)}</td>
                <td>${escapeHTML(leave.reason)}</td>
                <td>
                    <span class="status status-${statusClass}">
                        ${escapeHTML(leave.status)}
                    </span>
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join("");
}

$("leaveForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const staffId = Number($("leaveStaff").value);
    const date = $("leaveDate").value;
    const reason = $("leaveReason").value.trim();

    if (!staffId || !date || !reason) {
        alert("Please complete all leave details.");
        return;
    }

    const alreadyRequested = leaves.some(leave =>
        leave.staffId === staffId &&
        leave.date === date &&
        leave.status !== "Rejected"
    );

    if (alreadyRequested) {
        alert("A leave request already exists for this staff member on this date.");
        return;
    }

    leaves.push({
        id: nextLeaveId++,
        staffId,
        date,
        reason,
        status: "Pending"
    });

    this.reset();
    renderAll();

    alert("Leave request submitted successfully!");
});

$("leaveTable").addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const leave = leaves.find(item => item.id === id);

    if (!leave || leave.status !== "Pending") return;

    if (button.dataset.action === "approve-leave") {
        const hasShift = shifts.some(shift =>
            shift.staffId === leave.staffId &&
            shift.date === leave.date
        );

        if (hasShift) {
            alert("This staff member already has a shift on this date. The leave cannot be approved.");
            return;
        }

        leave.status = "Approved";
        alert("Leave request approved.");
    }

    if (button.dataset.action === "reject-leave") {
        leave.status = "Rejected";
        alert("Leave request rejected.");
    }

    renderAll();
});

// ========================================
// DASHBOARD
// ========================================

function getConflictCount() {
    let count = 0;

    for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            if (shifts[i].staffId !== shifts[j].staffId) continue;

            const first = getShiftInterval(shifts[i]);
            const second = getShiftInterval(shifts[j]);

            if (intervalsOverlap(first, second)) {
                count++;
            }
        }
    }

    return count;
}

function renderDashboard() {
    const pendingLeaves = leaves.filter(
        leave => leave.status === "Pending"
    ).length;

    $("staffCount").textContent = staff.length;
    $("shiftCount").textContent = shifts.length;
    $("conflictCount").textContent = getConflictCount();
    $("leaveCount").textContent = pendingLeaves;

    $("reportStaffCount").textContent = staff.length;
    $("reportShiftCount").textContent = shifts.length;
    $("reportLeaveCount").textContent = leaves.length;

    const today = todayString();

    const todayShifts = shifts.filter(shift => shift.date === today);
    const todayLeaves = leaves.filter(leave => leave.date === today);

    $("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    $("dashboardSummary").innerHTML = `
        <div class="summary-item">
            <span>Today's Shifts</span>
            <strong>${todayShifts.length}</strong>
        </div>
        <div class="summary-item">
            <span>Today's Leave Requests</span>
            <strong>${todayLeaves.length}</strong>
        </div>
        <div class="summary-item">
            <span>Available Staff Records</span>
            <strong>${staff.length}</strong>
        </div>
    `;
}

// ========================================
// CSV REPORT EXPORT
// ========================================

function exportCSV() {
    if (shifts.length === 0) {
        alert("There are no shift records to export.");
        return;
    }

    const headers = [
        "Staff Name",
        "Role",
        "Department",
        "Email",
        "Date",
        "Shift",
        "Start Time",
        "End Time"
    ];

    const rows = shifts.map(shift => {
        const person = getStaff(shift.staffId);

        return [
            person ? person.name : "Unknown Staff",
            person ? person.role : "",
            person ? person.department : "",
            person ? person.email : "",
            shift.date,
            shift.type,
            shift.start,
            shift.end
        ];
    });

    const escapeCSV = value => {
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "careflow-shift-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

$("exportBtn").addEventListener("click", exportCSV);

// ========================================
// PAGE NAVIGATION
// ========================================

const pageTitles = {
    dashboard: "Dashboard",
    staff: "Staff Management",
    shifts: "Shift Calendar",
    assign: "Assign Shift",
    leave: "Leave Management",
    reports: "Reports"
};

function openPage(pageId) {
    const target = $(pageId);

    if (!target) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    $("pageHeading").textContent = pageTitles[pageId] || "Dashboard";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.goto);
    });
});

// ========================================
// RENDER EVERYTHING
// ========================================

function renderAll() {
    renderStaff($("staffSearch").value);
    renderStaffDropdowns();
    renderShifts();
    renderLeaves();
    renderDashboard();
}

// ========================================
// INITIAL SETUP
// ===========================