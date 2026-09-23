// ============================================================
// MANJU'S THE WORLD OF GLAMOUR
// ADMIN AUTHENTICATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    const loginSection = document.getElementById("loginSection");
    const dashboard = document.getElementById("dashboard");

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");

    const loginMessage = document.getElementById("loginMessage");
    const logoutBtn = document.getElementById("logoutBtn");


    // ========================================================
    // MESSAGE HELPER
    // ========================================================

    function showMessage(message, type = "error") {

        if (!loginMessage) return;

        loginMessage.textContent = message;

        loginMessage.className = "message " + type;
    }


    function clearMessage() {

        if (!loginMessage) return;

        loginMessage.textContent = "";
        loginMessage.className = "message";

    }


    // ========================================================
    // SHOW LOGIN
    // ========================================================

    function showLogin() {

        loginSection.style.display = "flex";
        dashboard.style.display = "none";

        if (emailInput) {
            emailInput.value = "";
        }

        if (passwordInput) {
            passwordInput.value = "";
        }

        clearMessage();
    }


    // ========================================================
    // SHOW DASHBOARD
    // ========================================================

    function showDashboard() {

        loginSection.style.display = "none";
        dashboard.style.display = "block";

    }


    // ========================================================
    // CHECK CURRENT SESSION
    // ========================================================

    async function checkSession() {

        try {

            const {
                data,
                error
            } = await supabaseClient.auth.getSession();

            if (error) {
                console.error("Session error:", error);
                showLogin();
                return;
            }

            if (data.session) {

                showDashboard();

            } else {

                showLogin();

            }

        } catch (error) {

            console.error("Session check failed:", error);

            showLogin();

        }

    }


    // ========================================================
    // LOGIN
    // ========================================================

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            clearMessage();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {

                showMessage(
                    "Please enter your email and password."
                );

                return;
            }


            const submitButton =
                loginForm.querySelector("button[type='submit']");

            const originalText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = "SIGNING IN...";


            try {

                const {
                    data,
                    error
                } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


                if (error) {

                    console.error("Login error:", error);

                    showMessage(
                        getLoginErrorMessage(error)
                    );

                    return;
                }


                if (data && data.session) {

                    showDashboard();

                } else {

                    showMessage(
                        "Login could not be completed. Please try again."
                    );

                }

            } catch (error) {

                console.error("Unexpected login error:", error);

                showMessage(
                    "Something went wrong. Please try again."
                );

            } finally {

                submitButton.disabled = false;
                submitButton.textContent = originalText;

            }

        });

    }


    // ========================================================
    // FRIENDLY LOGIN ERRORS
    // ========================================================

    function getLoginErrorMessage(error) {

        const message =
            String(error?.message || "").toLowerCase();


        if (
            message.includes("invalid login credentials")
        ) {

            return "Incorrect email or password.";

        }


        if (
            message.includes("email not confirmed")
        ) {

            return "Please confirm the email address before signing in.";

        }


        if (
            message.includes("too many requests")
        ) {

            return "Too many login attempts. Please wait a little and try again.";

        }


        return error?.message ||
            "Unable to sign in. Please try again.";

    }


    // ========================================================
    // LOGOUT
    // ========================================================

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async () => {

            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";


            try {

                const {
                    error
                } = await supabaseClient.auth.signOut();


                if (error) {

                    console.error("Logout error:", error);

                    alert(
                        "Unable to log out. Please try again."
                    );

                    return;
                }


                showLogin();

            } catch (error) {

                console.error("Unexpected logout error:", error);

                alert(
                    "Something went wrong while logging out."
                );

            } finally {

                logoutBtn.disabled = false;
                logoutBtn.textContent = "Logout";

            }

        });

    }


    // ========================================================
    // AUTH STATE LISTENER
    // ========================================================

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "Authentication event:",
                event
            );


            if (session) {

                showDashboard();

            } else {

                showLogin();

            }

        }
    );


    // ========================================================
    // INITIAL SESSION CHECK
    // ========================================================

    await checkSession();

});
