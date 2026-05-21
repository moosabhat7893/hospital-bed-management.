const API = "http://localhost:5000";

/* =========================
   ADD PATIENT
========================= */

async function addPatient() {

    const patient = {

        pid: Math.floor(1000 + Math.random() * 9000),

        name: document.getElementById("name").value,

        age: document.getElementById("age").value,

        contact: document.getElementById("contact").value
    };

    if (!patient.name || !patient.age || !patient.contact) {

        alert("Please fill all patient fields");
        return;
    }

    await fetch(`${API}/patients`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(patient)
    });

    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("contact").value = "";

    refreshAll();
}

/* =========================
   LOAD PATIENTS
========================= */

async function loadPatients() {

    const response = await fetch(`${API}/patients`);

    const patients = await response.json();

    const list = document.getElementById("patientList");

    const dropdown = document.getElementById("historyPid");

    list.innerHTML = "";

    dropdown.innerHTML = "";

    patients.forEach(patient => {

        const li = document.createElement("li");

        li.innerHTML = `
            PID: ${patient.pid} |
            ${patient.name} |
            Age: ${patient.age} |
            Contact: ${patient.contact}

            <button onclick="deletePatient(${patient.pid})">
                Delete
            </button>
        `;

        list.appendChild(li);

        dropdown.innerHTML += `
            <option value="${patient.pid}">
                ${patient.name} (PID: ${patient.pid})
            </option>
        `;
    });
}

/* =========================
   DELETE PATIENT
========================= */

async function deletePatient(pid) {

    await fetch(`${API}/patients/${pid}`, {

        method: "DELETE"
    });

    refreshAll();
}

/* =========================
   ADD BED
========================= */

async function addBed() {

    const bed = {

        bid: Math.floor(1000 + Math.random() * 9000),

        bedNumber: document.getElementById("bedNumber").value,

        bedType: document.getElementById("bedType").value,

        pid: null,

        status: "Available"
    };

    if (!bed.bedNumber || !bed.bedType) {

        alert("Please fill all bed fields");
        return;
    }

    await fetch(`${API}/beds`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(bed)
    });

    document.getElementById("bedNumber").value = "";
    document.getElementById("bedType").value = "";

    refreshAll();
}

/* =========================
   LOAD BEDS
========================= */

async function loadBeds() {

    const response = await fetch(`${API}/beds`);

    const beds = await response.json();

    const list = document.getElementById("bedList");

    const dropdown = document.getElementById("historyBid");

    list.innerHTML = "";

    dropdown.innerHTML = "";

    beds.forEach(bed => {

        const li = document.createElement("li");

        li.innerHTML = `
            BID: ${bed.bid} |
            Bed No: ${bed.bedNumber} |
            Type: ${bed.bedType} |
            Status: ${bed.status}

            ${bed.pid
                ? `<button onclick="dischargeBed(${bed.bid})">
                        Discharge
                   </button>`
                : ""
            }

            <button onclick="deleteBed(${bed.bid})">
                Delete
            </button>
        `;

        list.appendChild(li);

        dropdown.innerHTML += `
    <option value="${bed.bid}">
        Bed ${bed.bedNumber} (${bed.bedType})
    </option>
`;
        
    });
}

/* =========================
   DELETE BED
========================= */

async function deleteBed(bid) {

    await fetch(`${API}/beds/${bid}`, {

        method: "DELETE"
    });

    refreshAll();
}

/* =========================
   DISCHARGE BED
========================= */

async function dischargeBed(bid) {

    await fetch(`${API}/beds/discharge/${bid}`, {

        method: "PUT"
    });

    refreshAll();
}

/* =========================
   ASSIGN BED
========================= */

async function assignBed() {

    const history = {

        hid: Math.floor(1000 + Math.random() * 9000),

        pid: Number(document.getElementById("historyPid").value),

        bid: Number(document.getElementById("historyBid").value),

        diagnosis: document.getElementById("diagnosis").value,

        treatment: document.getElementById("treatment").value,

        fromDate: document.getElementById("fromDate").value,

        toDate: document.getElementById("toDate").value
    };

    if (
        !history.pid ||
        !history.bid ||
        !history.diagnosis ||
        !history.treatment ||
        !history.fromDate ||
        !history.toDate
    ) {

        alert("Please fill all assignment fields");
        return;
    }

    const response = await fetch(`${API}/history`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(history)
    });

    const data = await response.json();

    alert(data.message);

    document.getElementById("diagnosis").value = "";
    document.getElementById("treatment").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";

    refreshAll();
}

/* =========================
   LOAD HISTORY
========================= */

async function loadHistory() {

    const response = await fetch(`${API}/history`);

    const history = await response.json();

    const list = document.getElementById("historyList");

    list.innerHTML = "";

    history.forEach(record => {

        const li = document.createElement("li");

        li.innerHTML = `
            Patient ID: ${record.pid} |
            Bed ID: ${record.bid} |
            ${record.diagnosis} |
            ${new Date(record.fromDate).toLocaleDateString()}
to
            ${new Date(record.toDate).toLocaleDateString()}
        `;

        list.appendChild(li);
    });
}

/* =========================
   SEARCH PATIENT
========================= */

function searchPatients() {

    const value =
        document.getElementById("searchPatient")
        .value
        .toLowerCase();

    const items =
        document.querySelectorAll("#patientList li");

    items.forEach(item => {

        item.style.display =
            item.innerText.toLowerCase().includes(value)
            ? "block"
            : "none";
    });
}

/* =========================
   REFRESH ALL
========================= */

function refreshAll() {

    loadPatients();
    loadBeds();
    loadHistory();
}

refreshAll();