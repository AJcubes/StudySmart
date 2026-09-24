const auth = document.querySelector("#auth");
const authForm = document.querySelector("#auth-form");
const email = document.querySelector("#email");
const dashboard = document.querySelector("#dashboard");
const updateDetails = document.querySelector("#update-details");
const emailUpdate = document.querySelector("#email-update");
const calendarURL = document.querySelector("#calendar-url");
const receiveEmails = document.querySelector("#receive-emails");
const signOut = document.querySelector("#sign-out");
const toDo = document.querySelector("#to-do");

const cloudStorage = {
    async getItem(currentUser, key) {
        const response = await fetch(`/api/get?email=${encodeURIComponent(currentUser)}&key=${encodeURIComponent(key)}`);
        const data = await response.json();
        return data.value;
    },

    async setItems(currentUser, data) {
        const response = await fetch(`/api/set?email=${encodeURIComponent(currentUser)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

async function init() {
    const storedEmail = localStorage.getItem("email");

    if (storedEmail) {
        await showDashboard();
    }
}

authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailInput = email.value.trim();
    if (!emailInput) return;

    localStorage.setItem("email", emailInput);

    await showDashboard();
});

updateDetails.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailInput = emailUpdate.value.trim() || "";
    const calendarURLInput = calendarURL.value.trim() || "";
    const receiveEmailInput = receiveEmails.checked === true;

    localStorage.setItem("email", emailInput);
    console.log(JSON.stringify({ "url": calendarURLInput, "receive_emails": receiveEmailInput }));
    await cloudStorage.setItems(emailInput, { "url": calendarURLInput, "receive_emails": receiveEmailInput });

    await showDashboard();
});

signOut.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("email");

    dashboard.style.display = "none";
    auth.style.display = "block";

    authForm.reset();
    toDo.innerHTML = "";
});

async function showDashboard() {
    const currentUser = localStorage.getItem("email");

    auth.style.display = "none";
    dashboard.style.display = "block";

    emailUpdate.value = currentUser;
    calendarURL.value = await cloudStorage.getItem(currentUser, "url") || "";
    receiveEmails.checked = await cloudStorage.getItem(currentUser, "receive_emails") === true;

    const response = await fetch(`/api/timetable?email=${encodeURIComponent(currentUser)}`);
    const data = await response.json();
    toDo.innerHTML = data["content"];
}

init();
