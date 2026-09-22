const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userForm = document.getElementById('user-form');
const emailInput = document.getElementById('email-input');
const urlInput = document.getElementById('url-input');
const welcomeMsg = document.getElementById('welcome-msg');
const displayUrl = document.getElementById('display-url');
const signOutBtn = document.getElementById('sign-out-btn');
const resultBox = document.getElementById('result-box');

async function init() {
    const savedEmail = localStorage.getItem('user_email');
    const savedUrl = localStorage.getItem('user_url');

    if (savedEmail) {
        showDashboard(savedEmail, savedUrl || "");
        if (savedUrl) {
            fetchTargetUrl(null, savedEmail);
        }
    }
}

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const targetUrl = urlInput.value.trim();

    if (!email) return;

    // Save to LocalStorage immediately
    localStorage.setItem('user_email', email);
    if (targetUrl) {
        localStorage.setItem('user_url', targetUrl);
    }

    // Save to Netlify Blobs via serverless router (/api/save)
    try {
        if (targetUrl) {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, targetUrl })
            });
        }
    } catch (err) {
        console.error("Failed to sync to Netlify blobs:", err);
    }

    showDashboard(email, targetUrl || localStorage.getItem('user_url') || "");
    fetchTargetUrl(targetUrl || localStorage.getItem('user_url'), email);
});

signOutBtn.addEventListener('click', () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_url');
    dashboardSection.style.display = 'none';
    authSection.style.display = 'block';
    userForm.reset();
    resultBox.textContent = '';
});

function showDashboard(email, url) {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    welcomeMsg.textContent = `Welcome, ${email}`;
    displayUrl.textContent = url || "None provided";
}

async function fetchTargetUrl(url, email) {
    resultBox.textContent = "Fetching target URL (following redirects)...";
    try {
        let queryEndpoint = `/api/fetch-url?`;
        if (url) queryEndpoint += `url=${encodeURIComponent(url)}`;
        else if (email) queryEndpoint += `email=${encodeURIComponent(email)}`;

        const res = await fetch(queryEndpoint);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch");
        }

        displayUrl.textContent = data.fetchedUrl;
        localStorage.setItem('user_url', data.fetchedUrl);
        resultBox.textContent = data.body;
    } catch (err) {
        resultBox.textContent = `Error fetching target URL: ${err.message}`;
    }
}

init();