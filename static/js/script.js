function showLoading(show) {
    const loadingDiv = document.querySelector('.loading');
    if (!loadingDiv) return;
    if (show) {
        loadingDiv.classList.add('active');
    } else {
        loadingDiv.classList.remove('active');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Dark mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // Update total students based on batch config
    const numBatchesInput = document.getElementById('num-batches');
    const studentsPerBatchInput = document.getElementById('students-per-batch');
    const totalStudentsInput = document.getElementById('total-students');

    function updateTotalStudents() {
        const numBatches = parseInt(numBatchesInput.value) || 0;
        const studentsPerBatch = parseInt(studentsPerBatchInput.value) || 0;
        totalStudentsInput.value = numBatches * studentsPerBatch;
    }

    numBatchesInput.addEventListener('change', updateTotalStudents);
    studentsPerBatchInput.addEventListener('input', updateTotalStudents);

    updateTotalStudents();

    // Functions to add form input groups dynamically
    window.addSubject = function () {
        const subjectsDiv = document.getElementById('subjects');
        const subjectGroup = document.createElement('div');
        subjectGroup.classList.add('input-group');
        subjectGroup.innerHTML = `
            <div class="input-field">
                <label>Name:</label>
                <input type="text" class="subject-name" required placeholder="Enter subject name">
            </div>
            <div class="input-field">
                <label>Hours per week:</label>
                <input type="number" class="subject-hours" required min="1" max="15" placeholder="Hours required">
            </div>
            <div class="input-field">
                <label>Students:</label>
                <input type="number" class="subject-students" required min="1" placeholder="Number of students">
            </div>
            <div class="input-field">
                <label>Faculty:</label>
                <input type="text" class="subject-faculty" required placeholder="Comma-separated names">
            </div>
            <button class="remove-btn" type="button">
                <i class="fas fa-trash"></i> Remove
            </button>
        `;
        subjectGroup.querySelector('button.remove-btn').addEventListener('click', () => subjectGroup.remove());
        subjectsDiv.appendChild(subjectGroup);
    };

    window.addRoom = function () {
        const roomsDiv = document.getElementById('rooms');
        const roomGroup = document.createElement('div');
        roomGroup.classList.add('input-group');
        roomGroup.innerHTML = `
            <div class="input-field">
                <label>Name:</label>
                <input type="text" class="room-name" required placeholder="Enter room name">
            </div>
            <div class="input-field">
                <label>Capacity:</label>
                <input type="number" class="room-capacity" required min="1" placeholder="Room capacity">
            </div>
            <div class="input-field">
                <label>Type:</label>
                <select class="room-type" required>
                    <option value="classroom">Classroom</option>
                    <option value="lab">Laboratory</option>
                </select>
            </div>
            <button class="remove-btn" type="button">
                <i class="fas fa-trash"></i> Remove
            </button>
        `;
        roomGroup.querySelector('button.remove-btn').addEventListener('click', () => roomGroup.remove());
        roomsDiv.appendChild(roomGroup);
    };

    window.addLab = function () {
        const labsDiv = document.getElementById('labs');
        const labGroup = document.createElement('div');
        labGroup.classList.add('input-group');
        labGroup.innerHTML = `
            <div class="input-field">
                <label>Name:</label>
                <input type="text" class="lab-name" required placeholder="Enter lab name">
            </div>
            <div class="input-field">
                <label>Hours per week:</label>
                <input type="number" class="lab-hours" required min="2" max="12" step="2" placeholder="Hours required">
            </div>
            <div class="input-field">
                <label>Room:</label>
                <input type="text" class="lab-room" required placeholder="Enter lab room">
            </div>
            <div class="input-field">
                <label>Faculty:</label>
                <input type="text" class="lab-faculty" required placeholder="Comma-separated names">
            </div>
            <button class="remove-btn" type="button">
                <i class="fas fa-trash"></i> Remove
            </button>
        `;
        labGroup.querySelector('button.remove-btn').addEventListener('click', () => labGroup.remove());
        labsDiv.appendChild(labGroup);
    };

    // Generate timetable button click
    window.generateTimetable = async function () {
        try {
            clearTimetableDisplay();
            showLoading(true);

            const data = collectInputData();

            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Unknown error occurred'}`);
                return;
            }

            const result = await response.json();

            renderTimetable(result.timetable);
            renderAnalysis(result.analysis);

            document.getElementById('save-btn').disabled = false;
            document.getElementById('view-options').style.display = 'flex';

        } catch (error) {
            alert('Failed to generate timetable: ' + error.message);
        } finally {
            showLoading(false);
        }
    };

    // Collect form input data into structured JSON
    function collectInputData() {
        const subjects = [];
        document.querySelectorAll('#subjects .input-group').forEach(group => {
            const name = group.querySelector('.subject-name').value.trim();
            const hours = parseInt(group.querySelector('.subject-hours').value.trim());
            const students = parseInt(group.querySelector('.subject-students').value.trim());
            const facultyRaw = group.querySelector('.subject-faculty').value.trim();
            const faculty = facultyRaw.split(',').map(f => f.trim()).filter(f => f.length > 0);

            if (name && hours && students && faculty.length > 0) {
                subjects.push({ name, hours, students, faculty });
            }
        });

        const rooms = [];
        document.querySelectorAll('#rooms .input-group').forEach(group => {
            const name = group.querySelector('.room-name').value.trim();
            const capacity = parseInt(group.querySelector('.room-capacity').value.trim());
            const type = group.querySelector('.room-type').value;

            if (name && capacity && type) {
                rooms.push({ name, capacity, type });
            }
        });

        const labs = [];
        document.querySelectorAll('#labs .input-group').forEach(group => {
            const name = group.querySelector('.lab-name').value.trim();
            const hours = parseInt(group.querySelector('.lab-hours').value.trim());
            const room = group.querySelector('.lab-room').value.trim();
            const facultyRaw = group.querySelector('.lab-faculty').value.trim();
            const faculty = facultyRaw.split(',').map(f => f.trim()).filter(f => f.length > 0);

            if (name && hours && room && faculty.length > 0) {
                labs.push({ name, hours, room, faculty });
            }
        });

        const num_batches = parseInt(document.getElementById('num-batches').value) || 1;
        const students_per_batch = parseInt(document.getElementById('students-per-batch').value) || 0;

        return { subjects, rooms, labs, num_batches, students_per_batch };
    }

    // Render timetable in a table
    function renderTimetable(timetable) {
        const container = document.getElementById('timetable');
        container.innerHTML = '';

        if (!timetable) {
            container.innerHTML = '<p>No timetable data to display.</p>';
            return;
        }

        const days = Object.keys(timetable);
        if (days.length === 0) {
            container.innerHTML = '<p>Empty timetable data.</p>';
            return;
        }

        // Create table elements
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row with time slots
        const timeSlots = Object.values(timetable)[0].map(slot => slot.time);
        const headerRow = document.createElement('tr');
        const firstHeaderCell = document.createElement('th');
        firstHeaderCell.textContent = 'Day / Time';
        headerRow.appendChild(firstHeaderCell);
        timeSlots.forEach(time => {
            const th = document.createElement('th');
            th.textContent = time ? time : '';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // For each day, create a row with slot data
        for (const day of days) {
            const dayData = timetable[day];
            const row = document.createElement('tr');
            const dayCell = document.createElement('th');
            dayCell.textContent = day;
            row.appendChild(dayCell);

            dayData.forEach(slot => {
                // slot can include whole_class, batch_1, batch_2 etc
                // We'll just show whole_class subject for simplicity, or "Break" if break
                const td = document.createElement('td');
                let content = '';
                let className = '';

                if (slot.whole_class) {
                    const s = slot.whole_class;
                    content = s.subject;
                    className = s.type || '';
                } else {
                    content = '-';
                }
                td.textContent = content;
                if (className) {
                    td.classList.add(className);
                }
                row.appendChild(td);
            });

            tbody.appendChild(row);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
    }

    // Render analysis suggestions and statistics
    function renderAnalysis(analysis) {
        const container = document.getElementById('timetable-analysis');
        container.innerHTML = '';

        if (!analysis) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let html = `
            <div class="analysis-container">
                <div class="analysis-header">
                    <h3>Timetable Analysis</h3>
                </div>
                <div class="suggestions-container">
                    <h4>Suggestions:</h4>
                    <ul>
        `;

        if (analysis.suggestions && analysis.suggestions.length > 0) {
            analysis.suggestions.forEach(sug => {
                html += `<li>${sug}</li>`;
            });
        } else {
            html += '<li>No suggestions available.</li>';
        }

        html += `
                    </ul>
                </div>
        `;

        if (analysis.faculty_workload) {
            html += `
                <div class="faculty-workload">
                    <h4>Faculty Workload:</h4>
                    <table class="faculty-workload-table">
                        <thead>
                            <tr><th>Faculty</th><th>Hours</th></tr>
                        </thead>
                        <tbody>
            `;
            for (const faculty in analysis.faculty_workload.by_faculty) {
                html += `<tr><td>${faculty}</td><td>${analysis.faculty_workload.by_faculty[faculty]}</td></tr>`;
            }
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (analysis.gap_analysis) {
            html += `
                <div class="gap-analysis">
                    <h4>Gap Analysis:</h4>
                    <p>Total Gaps: ${analysis.gap_analysis.total_gaps}</p>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // Clear the timetable and analysis displays
    function clearTimetableDisplay() {
        document.getElementById('timetable').innerHTML = '';
        document.getElementById('timetable-analysis').innerHTML = '';
        document.getElementById('timetable-analysis').style.display = 'none';
        document.getElementById('save-btn').disabled = true;
        document.getElementById('view-options').style.display = 'none';
    }

    // Clear the entire form inputs
    window.clearForm = function () {
        if (!confirm("Are you sure you want to clear all inputs?")) {
            return;
        }
        // Clear subjects
        const subjectsDiv = document.getElementById('subjects');
        subjectsDiv.innerHTML = '';
        addSubject();

        // Clear rooms
        const roomsDiv = document.getElementById('rooms');
        roomsDiv.innerHTML = '';
        addRoom();

        // Clear labs
        const labsDiv = document.getElementById('labs');
        labsDiv.innerHTML = '';
        addLab();

        // Reset batch config inputs
        document.getElementById('num-batches').value = 1;
        document.getElementById('students-per-batch').value = '';
        document.getElementById('total-students').value = '';

        clearTimetableDisplay();
    };

    // Save timetable div as image
    window.saveTimetableAsImage = function () {
        const timetableContainer = document.getElementById('timetable');
        if (!timetableContainer) {
            alert('No timetable available to save.');
            return;
        }
        html2canvas(timetableContainer).then(canvas => {
            const link = document.createElement('a');
            link.download = 'timetable.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    // Initialize minimum 1 subject, room, and lab for user convenience
    const subjectsDiv = document.getElementById('subjects');
    if (!subjectsDiv.querySelector('.input-group')) {
        addSubject();
    }
    const roomsDiv = document.getElementById('rooms');
    if (!roomsDiv.querySelector('.input-group')) {
        addRoom();
    }
    const labsDiv = document.getElementById('labs');
    if (!labsDiv.querySelector('.input-group')) {
        addLab();
    }
});
