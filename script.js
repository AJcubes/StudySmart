document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("user-form");
    const emailInput = document.getElementById("email-input");
    const urlInput = document.getElementById("url-input");
    const authSection = document.getElementById("auth-section");
    const welcomeSection = document.getElementById("welcome-section");
    const userEmailDisplay = document.getElementById("user-email-display");
    const userUrlLink = document.getElementById("user-url-link");
    const signoutBtn = document.getElementById("signout-btn");
    const resultBox = document.getElementById("result-box");

    // Check localStorage on load
    const savedEmail = localStorage.getItem("netlify_user_email");
    const savedUrl = localStorage.getItem("netlify_user_url");

    if (savedEmail) {
        appSignedIn(savedEmail, savedUrl);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const url = urlInput.value.trim();

        if (!email) return;

        // Save to localStorage
        localStorage.setItem("netlify_user_email", email);
        if (url) localStorage.setItem("netlify_user_url", url);

        // Save to Netlify Blobs via serverless function
        try {
            const response = await fetch("/.netlify/functions/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, url })
            });

            if (!response.ok) {
                console.error("Failed to persist to Netlify Blobs");
            }
        } catch (err) {
            console.error("Error connecting to Netlify function:", err);
        }

        appSignedIn(email, url);
    });

    signoutBtn.addEventListener("click", () => {
        localStorage.removeItem("netlify_user_email");
        localStorage.removeItem("netlify_user_url");
        authSection.style.display = "block";
        welcomeSection.style.display = "none";
        emailInput.value = "";
        urlInput.value = "";
        resultBox.textContent = "Signed out.";
    });

    async function appSignedIn(email, url) {
        authSection.style.display = "none";
        welcomeSection.style.display = "block";
        userEmailDisplay.textContent = email;

        if (url) {
            userUrlLink.href = url;
            userUrlLink.textContent = url;

            resultBox.textContent = "Fetching URL following redirects...";
            try {
                // Using a public CORS proxy to safely fetch the redirected response text client-side
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const res = await fetch(proxyUrl);
                const data = await res.json();

                if (data && data.contents) {
                    // Show a snippet of the final text/HTML response
                    resultBox.textContent = data.contents.substring(0, 1500) + "\n\n[Content truncated for display]";
                } else {
                    resultBox.textContent = "Fetched successfully, but content was empty.";
                }
            } catch (error) {
                resultBox.textContent = "Error fetching target URL: " + error.message;
            }
        } else {
            userUrlLink.textContent = "No URL provided";
            resultBox.textContent = "No URL found in storage for this user.";
        }
    }
});