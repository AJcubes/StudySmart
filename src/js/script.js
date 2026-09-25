const auth = document.querySelector("#auth");
const authForm = document.querySelector("#auth-form");
const email = document.querySelector("#email");
const dashboard = document.querySelector("#dashboard");
const updateDetails = document.querySelector("#update-details");
const emailValue = document.querySelector("#email-value");
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
    await cloudStorage.setItems(emailInput, { "url": "", "receive_emails": false });

    await showDashboard();
});

updateDetails.addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentEmail = localStorage.getItem("email");
    const calendarURLInput = calendarURL.value.trim() || "";
    const receiveEmailInput = receiveEmails.checked === true;

    await cloudStorage.setItems(currentEmail, { "url": calendarURLInput, "receive_emails": receiveEmailInput });

    const response = await fetch(`/api/timetable?email=${encodeURIComponent(currentEmail)}`);
    const data = await response.json();
    toDo.innerHTML = data["content"];
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

    emailValue.innerText = `Email: ${currentUser}`;
    calendarURL.value = await cloudStorage.getItem(currentUser, "url") || "";
    receiveEmails.checked = await cloudStorage.getItem(currentUser, "receive_emails") === true;

    const response = await fetch(`/api/timetable?email=${encodeURIComponent(currentUser)}`);
    const data = await response.json();
    toDo.innerHTML = data["content"];
}

init();
