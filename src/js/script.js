// Store all useful DOM elements in variables
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

// Cloud Storage wrapper to integrate with /netlify/functions/api.js and Netlify blobs storage.
const cloudStorage = {
    // Get an item from the user's Netlify storage
    async getItem(currentUser, key) {
        const uriEmail = encodeURIComponent(currentUser);
        const uriKey = encodeURIComponent(key);
        const response = await fetch(`/api/get?email=${uriEmail}&key=${uriKey}`);
        const data = await response.json();
        return data.value;
    },

    // Set an item to the user's Netlify storage
    async setItems(currentUser, data) {
        const uriEmail = encodeURIComponent(currentUser);
        const response = await fetch(`/api/set?email=${uriEmail}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

// Sign in form listener. When submitted, it signs a user into their account (or creates one for them).
authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailInput = email.value.trim();
    if (!emailInput) return;

    localStorage.setItem("email", emailInput);

    await showDashboard();
});

// Update form listener. It listens to the update-details form in the dashboard to set new calendar URLs and their
// choice to receive emails or not.
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

// Sign out button listener. It listens to the sign-out button and removes the email from localStorage, keeping their
// data in the Netlify cloud storage but signing them out locally.
signOut.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("email");

    dashboard.style.display = "none";
    auth.style.display = "block";

    authForm.reset();
    toDo.innerHTML = "";
});

// Show the dashboard. This function is called after any data storage edits and updates the values displayed. It will
// update the timetable shown.
async function showDashboard() {
    const currentUser = localStorage.getItem("email");

    auth.style.display = "none";
    dashboard.style.display = "block";

    emailValue.innerHTML = `<b>Email: </b>${currentUser}`;
    calendarURL.value = await cloudStorage.getItem(currentUser, "url") || "";
    receiveEmails.checked = await cloudStorage.getItem(currentUser, "receive_emails") === true;

    const response = await fetch(`/api/timetable?email=${encodeURIComponent(currentUser)}`);
    const data = await response.json();
    toDo.innerHTML = data["content"];
}

// Initialization function. This is called at the start to set up the website. It will see if you are logged in, and if
// so, it will show your dashboard. Otherwise, it will show the auth form to let you signup.
async function init() {
    const storedEmail = localStorage.getItem("email");

    if (storedEmail) {
        await showDashboard();
    }
}

// Initialization. This calls the init() function to set up the website.
init();
