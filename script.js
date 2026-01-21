window.onload = function () {
    let studentsDiv = document.getElementById("students");

    for (let i = 1; i <= 62; i++) {
        let label = document.createElement("label");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = i;

        // auto update when clicked
        checkbox.addEventListener("change", calculateAttendance);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" Roll " + i));

        studentsDiv.appendChild(label);
        studentsDiv.appendChild(document.createElement("br"));
    }

    calculateAttendance(); // initial count
};

function calculateAttendance() {
    let checkboxes = document.querySelectorAll('#students input[type="checkbox"]');
    let presentRolls = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            presentRolls.push(parseInt(cb.value));
        }
    });

    presentRolls.sort((a, b) => a - b);

    document.getElementById("total").innerText = checkboxes.length;
    document.getElementById("presentCount").innerText = presentRolls.length;
    document.getElementById("rolls").innerText =
        presentRolls.length ? presentRolls.join(", ") : "None";
}
