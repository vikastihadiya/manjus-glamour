/* ============================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL
   Supabase-compatible admin controller

   IMPORTANT:
   - This file intentionally DOES NOT redeclare supabaseClient.
   - supabase-config.js must load before this file.
============================================================ */

"use strict";

/* ============================================================
   GLOBAL STATE
============================================================ */

let currentUser = null;
let currentModule = "dashboard";
let serviceCategories = [];


/* ============================================================
   DOM HELPERS
============================================================ */

function $(id) {
    return document.getElementById(id);
}

function getModuleContent() {
    return $("moduleContent");
}

function getLoginSection() {
    return $("loginSection");
}

function getAdminPanel() {
    return $("adminPanel");
}


/* ============================================================
   SUPABASE CHECK
============================================================ */

function getDatabase() {

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient ||
        !supabaseClient.auth
    ) {
        console.error(
            "Supabase client is not available. " +
            "Make sure supabase-config.js loads before admin.js."
        );

        return null;
    }

    return supabaseClient;
}


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const db = getDatabase();

    if (!db) {
        showLoginMessage(
            "Supabase is not connected. Check supabase-config.js.",
            "error"
        );
        return;
    }

    const loginForm = $("loginForm");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }

    const logoutBtn = $("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    }

    db.auth.onAuthStateChange(function (event, session) {

        currentUser = session?.user || null;

        if (session) {
            showAdmin();
        } else {
            showLogin();
        }

    });

    checkAuth();

});


/* ============================================================
   AUTHENTICATION
============================================================ */

async function checkAuth() {

    const db = getDatabase();

    if (!db) {
        showLogin();
        return;
    }

    try {

        const {
            data,
            error
        } = await db.auth.getSession();

        if (error) {
            console.error(
                "Session check error:",
                error
            );

            showLogin();
            return;
        }

        if (data?.session) {

            currentUser = data.session.user;

            showAdmin();

        } else {

            currentUser = null;

            showLogin();

        }

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        showLogin();
    }
}


async function handleLogin(event) {

    event.preventDefault();

    const db = getDatabase();

    if (!db) {
        showLoginMessage(
            "Supabase is not connected.",
            "error"
        );
        return;
    }

    const email =
        $("adminEmail")?.value?.trim();

    const password =
        $("adminPassword")?.value || "";

    if (!email || !password) {

        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    const button =
        document.querySelector(
            '#loginForm button[type="submit"]'
        );

    const originalText =
        button?.textContent || "SIGN IN";

    if (button) {
        button.disabled = true;
        button.textContent = "SIGNING IN...";
    }

    try {

        const {
            data,
            error
        } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        currentUser = data.user;

        showAdmin();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showLoginMessage(
            error.message ||
            "Login failed. Please check your credentials.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }

    }
}


async function handleLogout() {

    const db = getDatabase();

    if (!db) {
        showLogin();
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } = await db.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;

        showLogin();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            error.message ||
            "Logout failed."
        );
    }
}


function showLogin() {

    const login =
        getLoginSection();

    const panel =
        getAdminPanel();

    if (login) {
        login.style.display = "flex";
    }

    if (panel) {
        panel.style.display = "none";
    }
}


function showAdmin() {

    const login =
        getLoginSection();

    const panel =
        getAdminPanel();

    if (login) {
        login.style.display = "none";
    }

    if (panel) {
        panel.style.display = "block";
    }

    openModule("dashboard");
}


function showLoginMessage(message, type = "error") {

    const box =
        $("loginMessage");

    if (!box) {
        console.error(message);
        return;
    }

    box.textContent = message;

    box.className =
        "message " + type;
}


/* ============================================================
   GENERAL HELPERS
============================================================ */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHTML(value);
}


function slugify(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    try {

        return new Date(value)
            .toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

    } catch {

        return value;
    }
}


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    try {

        return new Date(value)
            .toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    } catch {

        return value;
    }
}


function money(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Price on enquiry";
    }

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return "₹" +
        number.toLocaleString("en-IN");
}


function showMessage(
    message,
    type = "success"
) {

    let box =
        $("adminMessage");

    if (box) {
        box.remove();
    }

    box =
        document.createElement("div");

    box.id = "adminMessage";

    box.textContent = message;

    box.style.position = "fixed";
    box.style.right = "20px";
    box.style.bottom = "20px";
    box.style.zIndex = "99999";
    box.style.maxWidth = "380px";
    box.style.padding = "14px 18px";
    box.style.borderRadius = "10px";
    box.style.boxShadow =
        "0 12px 40px rgba(0,0,0,.18)";
    box.style.fontSize = "14px";

    if (type === "error") {

        box.style.background = "#fee2e2";
        box.style.color = "#991b1b";

    } else {

        box.style.background = "#dcfce7";
        box.style.color = "#166534";
    }

    document.body.appendChild(box);

    setTimeout(function () {

        if (box.parentNode) {
            box.remove();
        }

    }, 4000);
}


function setLoading(message = "Loading...") {

    const content =
        getModuleContent();

    if (!content) {
        return;
    }

    content.innerHTML = `
        <div class="module-loading">
            ${escapeHTML(message)}
        </div>
    `;
}


function setError(message) {

    const content =
        getModuleContent();

    if (!content) {
        return;
    }

    content.innerHTML = `
        <div class="admin-module">

            <div class="empty-state">

                <h3>
                    Something went wrong
                </h3>

                <p style="margin-top:10px;">
                    ${escapeHTML(message)}
                </p>

            </div>

        </div>
    `;
}


function confirmDelete(label = "this item") {

    return window.confirm(
        `Are you sure you want to delete ${label}?`
    );
}


/* ============================================================
   MODULE INFORMATION
============================================================ */

const MODULE_INFO = {

    dashboard: {
        title: "Dashboard",
        description:
            "Manage your beauty business website."
    },

    appointments: {
        title: "Appointments",
        description:
            "View and manage customer appointment requests."
    },

    services: {
        title: "Services",
        description:
            "Manage services, categories, prices and durations."
    },

    offers: {
        title: "Offers",
        description:
            "Manage current offers, prices and validity."
    },

    gallery: {
        title: "Our Work Gallery",
        description:
            "Upload and manage your beauty work."
    },

    bride_gallery: {
        title: "Bride / Girls Gallery",
        description:
            "Upload bridal and girls portfolio images."
    },

    customer_gallery: {
        title: "Customer Gallery",
        description:
            "Manage customer photos with consent."
    },

    before_after: {
        title: "Before / After",
        description:
            "Manage transformation images."
    },

    bridal_packages: {
        title: "Bridal Packages",
        description:
            "Manage bridal packages and enquiries."
    },

    team: {
        title: "Team",
        description:
            "Manage team members and artists."
    },

    testimonials: {
        title: "Testimonials",
        description:
            "Manage customer testimonials."
    },

    faqs: {
        title: "FAQs",
        description:
            "Manage frequently asked questions."
    },

    settings: {
        title: "Settings",
        description:
            "Manage website business information."
    }

};


function updateModuleHeader(moduleName) {

    const info =
        MODULE_INFO[moduleName] ||
        MODULE_INFO.dashboard;

    const title =
        $("moduleTitle");

    const description =
        $("moduleDescription");

    if (title) {
        title.textContent =
            info.title;
    }

    if (description) {
        description.textContent =
            info.description;
    }
}


/* ============================================================
   MODULE ROUTER
============================================================ */

async function openModule(moduleName) {

    currentModule =
        moduleName || "dashboard";

    updateModuleHeader(
        currentModule
    );

    setLoading(
        "Loading " +
        (
            MODULE_INFO[currentModule]?.title ||
            "module"
        ) +
        "..."
    );

    try {

        switch (currentModule) {

            case "dashboard":
                await loadDashboard();
                break;

            case "appointments":
                await loadAppointments();
                break;

            case "services":
                await loadServices();
                break;

            case "offers":
                await loadOffers();
                break;

            case "gallery":
                await loadGallery();
                break;

            case "bride_gallery":
                await loadBrideGallery();
                break;

            case "customer_gallery":
                await loadCustomerGallery();
                break;

            case "before_after":
                await loadBeforeAfter();
                break;

            case "bridal_packages":
                await loadBridalPackages();
                break;

            case "team":
                await loadTeam();
                break;

            case "testimonials":
                await loadTestimonials();
                break;

            case "faqs":
                await loadFAQs();
                break;

            case "settings":
                await loadSettings();
                break;

            default:
                await loadDashboard();
        }

    } catch (error) {

        console.error(
            "Module error:",
            error
        );

        setError(
            error.message ||
            "Unable to load this module."
        );
    }
}


/* ============================================================
   DASHBOARD
============================================================ */

async function countTable(table) {

    const db = getDatabase();

    if (!db) {
        return 0;
    }

    const {
        count,
        error
    } = await db
        .from(table)
        .select("id", {
            count: "exact",
            head: true
        });

    if (error) {

        console.error(
            `Count error for ${table}:`,
            error
        );

        return 0;
    }

    return count || 0;
}


async function loadDashboard() {

    const tables = [
        "appointments",
        "services",
        "offers",
        "gallery",
        "bride_gallery",
        "customer_gallery",
        "before_after",
        "bridal_packages",
        "team",
        "testimonials",
        "faqs"
    ];

    const values =
        await Promise.all(
            tables.map(
                table => countTable(table)
            )
        );

    const counts = {};

    tables.forEach(
        (table, index) => {
            counts[table] =
                values[index];
        }
    );

    const content =
        getModuleContent();

    if (!content) {
        return;
    }

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>
                    <h2>
                        Welcome to your admin panel
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Your website content is managed from here.
                    </p>
                </div>

            </div>

            <div class="admin-grid">

                ${dashboardCard(
                    "appointments",
                    counts.appointments,
                    "Appointments"
                )}

                ${dashboardCard(
                    "services",
                    counts.services,
                    "Services"
                )}

                ${dashboardCard(
                    "offers",
                    counts.offers,
                    "Offers"
                )}

                ${dashboardCard(
                    "gallery",
                    counts.gallery,
                    "Our Work Gallery"
                )}

                ${dashboardCard(
                    "bride_gallery",
                    counts.bride_gallery,
                    "Bride / Girls Gallery"
                )}

                ${dashboardCard(
                    "customer_gallery",
                    counts.customer_gallery,
                    "Customer Gallery"
                )}

                ${dashboardCard(
                    "before_after",
                    counts.before_after,
                    "Before / After"
                )}

                ${dashboardCard(
                    "bridal_packages",
                    counts.bridal_packages,
                    "Bridal Packages"
                )}

                ${dashboardCard(
                    "team",
                    counts.team,
                    "Team"
                )}

                ${dashboardCard(
                    "testimonials",
                    counts.testimonials,
                    "Testimonials"
                )}

                ${dashboardCard(
                    "faqs",
                    counts.faqs,
                    "FAQs"
                )}

            </div>

        </div>
    `;

    content
        .querySelectorAll(
            "[data-open-module]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                function () {

                    openModule(
                        card.dataset.openModule
                    );

                }
            );

        });
}


function dashboardCard(
    module,
    count,
    label
) {

    return `

        <div
            class="admin-card"
            data-open-module="${escapeAttribute(module)}"
            style="cursor:pointer;"
        >

            <h3>
                ${escapeHTML(count)}
            </h3>

            <p>
                ${escapeHTML(label)}
            </p>

        </div>
    `;
}


/* ============================================================
   APPOINTMENTS
============================================================ */

async function loadAppointments() {

    const db = getDatabase();

    if (!db) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("appointments")
        .select("*")
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    let serviceMap = {};

    const serviceIds =
        [
            ...new Set(
                (data || [])
                    .map(item => item.service_id)
                    .filter(Boolean)
            )
        ];

    if (serviceIds.length) {

        const {
            data: services
        } = await db
            .from("services")
            .select("id,name")
            .in("id", serviceIds);

        (services || []).forEach(
            service => {
                serviceMap[service.id] =
                    service.name;
            }
        );
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>
                    <h2>
                        Appointment Requests
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        ${data?.length || 0}
                        request(s)
                    </p>
                </div>

                <button
                    class="secondary-btn"
                    id="refreshAppointments"
                    type="button"
                >
                    Refresh
                </button>

            </div>

            ${
                data?.length
                ? `
                    <div style="overflow-x:auto;">

                        <table>

                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Service</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${data.map(item => `

                                    <tr>

                                        <td>
                                            <strong>
                                                ${escapeHTML(
                                                    item.customer_name
                                                )}
                                            </strong>

                                            ${
                                                item.email
                                                ? `
                                                    <div
                                                        style="
                                                            color:var(--muted);
                                                            margin-top:4px;
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            item.email
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                            }
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                item.phone
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                serviceMap[
                                                    item.service_id
                                                ] ||
                                                "General enquiry"
                                            )}
                                        </td>

                                        <td>
                                            ${formatDate(
                                                item.appointment_date
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                item.appointment_time ||
                                                "—"
                                            )}
                                        </td>

                                        <td>

                                            <select
                                                class="appointment-status"
                                                data-id="${escapeAttribute(
                                                    item.id
                                                )}"
                                            >

                                                ${
                                                    [
                                                        "New",
                                                        "Confirmed",
                                                        "Completed",
                                                        "Cancelled",
                                                        "No-show"
                                                    ]
                                                    .map(status => `

                                                        <option
                                                            value="${status}"
                                                            ${
                                                                item.status === status
                                                                ? "selected"
                                                                : ""
                                                            }
                                                        >
                                                            ${status}
                                                        </option>

                                                    `)
                                                    .join("")
                                                }

                                            </select>

                                        </td>

                                        <td>
                                            ${formatDateTime(
                                                item.created_at
                                            )}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                class="danger-btn delete-record"
                                                data-table="appointments"
                                                data-id="${escapeAttribute(
                                                    item.id
                                                )}"
                                                data-label="this appointment"
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>
                `
                : `
                    <div class="empty-state">
                        No appointment requests yet.
                    </div>
                `
            }

        </div>
    `;

    $("refreshAppointments")
        ?.addEventListener(
            "click",
            () => loadAppointments()
        );

    content
        .querySelectorAll(
            ".appointment-status"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async function () {

                    const id =
                        select.dataset.id;

                    const status =
                        select.value;

                    const {
                        error
                    } = await db
                        .from("appointments")
                        .update({
                            status,
                            updated_at:
                                new Date().toISOString()
                        })
                        .eq(
                            "id",
                            id
                        );

                    if (error) {

                        console.error(error);

                        showMessage(
                            error.message,
                            "error"
                        );

                        return;
                    }

                    showMessage(
                        "Appointment status updated."
                    );

                }
            );

        });

    attachDeleteHandlers();
}


/* ============================================================
   CATEGORIES
============================================================ */

async function fetchCategories() {

    const db = getDatabase();

    const {
        data,
        error
    } = await db
        .from("categories")
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    serviceCategories =
        data || [];

    return serviceCategories;
}


async function addCategory() {

    const db = getDatabase();

    const name =
        window.prompt(
            "Enter the new service category name:"
        );

    if (!name?.trim()) {
        return;
    }

    const cleanName =
        name.trim();

    const slug =
        slugify(cleanName);

    const {
        error
    } = await db
        .from("categories")
        .insert({
            name: cleanName,
            slug,
            active: true,
            display_order: 0
        });

    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }

    showMessage(
        "Category created successfully."
    );

    await loadServices();
}


/* ============================================================
   SERVICES
============================================================ */

async function loadServices() {

    const db = getDatabase();

    if (!db) {
        return;
    }

    const [
        serviceResult,
        categories
    ] = await Promise.all([
        db
            .from("services")
            .select("*")
            .order(
                "display_order",
                { ascending: true }
            )
            .order(
                "created_at",
                { ascending: true }
            ),

        fetchCategories()
    ]);

    if (serviceResult.error) {
        throw serviceResult.error;
    }

    const services =
        serviceResult.data || [];

    const categoryMap = {};

    categories.forEach(
        category => {
            categoryMap[category.id] =
                category.name;
        }
    );

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>
                    <h2>
                        Services
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage services shown on the public website.
                    </p>
                </div>

                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        class="secondary-btn"
                        id="addCategoryBtn"
                        type="button"
                    >
                        + Category
                    </button>

                    <button
                        class="primary-btn"
                        id="addServiceBtn"
                        type="button"
                    >
                        + Add Service
                    </button>

                </div>

            </div>

            <div id="serviceFormArea"></div>

            ${
                services.length
                ? `

                    <div style="overflow-x:auto;">

                        <table>

                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Duration</th>
                                    <th>Active</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${services.map(item => `

                                    <tr>

                                        <td>

                                            <strong>
                                                ${escapeHTML(
                                                    item.name
                                                )}
                                            </strong>

                                            ${
                                                item.description
                                                ? `
                                                    <div
                                                        style="
                                                            color:var(--muted);
                                                            margin-top:5px;
                                                            max-width:350px;
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            item.description
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                            }

                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                categoryMap[
                                                    item.category_id
                                                ] ||
                                                "Uncategorized"
                                            )}
                                        </td>

                                        <td>

                                            ${
                                                item.price !== null &&
                                                item.price !== undefined
                                                ? money(item.price)
                                                : escapeHTML(
                                                    item.price_label ||
                                                    "Price on enquiry"
                                                )
                                            }

                                        </td>

                                        <td>

                                            ${
                                                item.duration_minutes
                                                ? escapeHTML(
                                                    item.duration_minutes +
                                                    " min"
                                                )
                                                : "—"
                                            }

                                        </td>

                                        <td>

                                            ${
                                                item.active
                                                ? "Yes"
                                                : "No"
                                            }

                                        </td>

                                        <td>

                                            <div
                                                style="
                                                    display:flex;
                                                    gap:6px;
                                                    flex-wrap:wrap;
                                                "
                                            >

                                                <button
                                                    class="secondary-btn edit-service"
                                                    type="button"
                                                    data-id="${escapeAttribute(
                                                        item.id
                                                    )}"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    class="danger-btn delete-record"
                                                    type="button"
                                                    data-table="services"
                                                    data-id="${escapeAttribute(
                                                        item.id
                                                    )}"
                                                    data-label="this service"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>

                `
                : `
                    <div class="empty-state">
                        No services added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addCategoryBtn")
        ?.addEventListener(
            "click",
            addCategory
        );

    $("addServiceBtn")
        ?.addEventListener(
            "click",
            () => showServiceForm()
        );

    content
        .querySelectorAll(
            ".edit-service"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        services.find(
                            service =>
                                service.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showServiceForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


async function showServiceForm(service = null) {

    const area =
        $("serviceFormArea");

    if (!area) {
        return;
    }

    if (!serviceCategories.length) {
        try {
            await fetchCategories();
        } catch (error) {
            showMessage(
                error.message,
                "error"
            );
            return;
        }
    }

    const categoryOptions =
        serviceCategories
            .map(category => `

                <option
                    value="${escapeAttribute(
                        category.id
                    )}"
                    ${
                        service?.category_id === category.id
                        ? "selected"
                        : ""
                    }
                >
                    ${escapeHTML(
                        category.name
                    )}
                </option>

            `)
            .join("");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${service ? "Edit Service" : "Add Service"}
            </h3>

            <form
                id="serviceForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Service Name
                        </label>

                        <input
                            id="serviceName"
                            type="text"
                            required
                            value="${escapeAttribute(
                                service?.name || ""
                            )}"
                            placeholder="Example: Bridal Makeup"
                        >

                    </div>

                    <div>

                        <label>
                            Category
                        </label>

                        <select
                            id="serviceCategory"
                            required
                        >

                            <option value="">
                                Select category
                            </option>

                            ${categoryOptions}

                        </select>

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Price
                        </label>

                        <input
                            id="servicePrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value="${
                                service?.price ??
                                ""
                            }"
                            placeholder="Leave blank for enquiry"
                        >

                    </div>

                    <div>

                        <label>
                            Price Label
                        </label>

                        <input
                            id="servicePriceLabel"
                            type="text"
                            value="${escapeAttribute(
                                service?.price_label ||
                                "Price on enquiry"
                            )}"
                            placeholder="Price on enquiry"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Duration (minutes)
                        </label>

                        <input
                            id="serviceDuration"
                            type="number"
                            min="0"
                            step="1"
                            value="${
                                service?.duration_minutes ??
                                ""
                            }"
                            placeholder="Example: 90"
                        >

                    </div>

                    <div>

                        <label>
                            Display Order
                        </label>

                        <input
                            id="serviceOrder"
                            type="number"
                            min="0"
                            step="1"
                            value="${
                                service?.display_order ??
                                0
                            }"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="serviceDescription"
                        placeholder="Describe the service..."
                    >${escapeHTML(
                        service?.description || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Service Image
                    </label>

                    <input
                        id="serviceImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    >

                    ${
                        service?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    service.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label
                    style="
                        display:flex;
                        gap:8px;
                        align-items:center;
                    "
                >

                    <input
                        type="checkbox"
                        id="serviceFeatured"
                        ${
                            service?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured service

                </label>


                <label
                    style="
                        display:flex;
                        gap:8px;
                        align-items:center;
                    "
                >

                    <input
                        type="checkbox"
                        id="serviceActive"
                        ${
                            service?.active !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Active / visible

                </label>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        ${
                            service
                            ? "Update Service"
                            : "Save Service"
                        }
                    </button>

                    <button
                        type="button"
                        id="cancelService"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelService")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("serviceForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                const name =
                    $("serviceName")
                        .value
                        .trim();

                const categoryId =
                    $("serviceCategory")
                        .value;

                if (!name) {

                    showMessage(
                        "Service name is required.",
                        "error"
                    );

                    return;
                }

                if (!categoryId) {

                    showMessage(
                        "Please select a category.",
                        "error"
                    );

                    return;
                }

                const priceValue =
                    $("servicePrice")
                        .value
                        .trim();

                const durationValue =
                    $("serviceDuration")
                        .value
                        .trim();

                const imageFile =
                    $("serviceImage")
                        ?.files?.[0];

                let imageUrl =
                    service?.image_url ||
                    null;

                try {

                    if (imageFile) {

                        imageUrl =
                            await uploadImage(
                                "services",
                                imageFile
                            );
                    }

                    const payload = {

                        category_id:
                            categoryId,

                        name,

                        slug:
                            service?.slug ||
                            slugify(name),

                        description:
                            $("serviceDescription")
                                .value
                                .trim() ||
                            null,

                        price:
                            priceValue === ""
                            ? null
                            : Number(priceValue),

                        price_label:
                            $("servicePriceLabel")
                                .value
                                .trim() ||
                            "Price on enquiry",

                        duration_minutes:
                            durationValue === ""
                            ? null
                            : Number(durationValue),

                        image_url:
                            imageUrl,

                        featured:
                            $("serviceFeatured")
                                .checked,

                        active:
                            $("serviceActive")
                                .checked,

                        display_order:
                            Number(
                                $("serviceOrder")
                                    .value || 0
                            )

                    };

                    let result;

                    if (service?.id) {

                        result =
                            await db
                                .from("services")
                                .update(payload)
                                .eq(
                                    "id",
                                    service.id
                                );

                    } else {

                        result =
                            await db
                                .from("services")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        service
                        ? "Service updated successfully."
                        : "Service created successfully."
                    );

                    await loadServices();

                } catch (error) {

                    console.error(
                        "Service save error:",
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   OFFERS
============================================================ */

async function loadOffers() {

    const db = getDatabase();

    const {
        data,
        error
    } = await db
        .from("offers")
        .select("*")
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>
                    <h2>
                        Offers
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage offers, prices and validity.
                    </p>
                </div>

                <button
                    id="addOfferBtn"
                    class="primary-btn"
                    type="button"
                >
                    + Add Offer
                </button>

            </div>

            <div id="offerFormArea"></div>

            ${
                data?.length
                ? `

                    <div style="overflow-x:auto;">

                        <table>

                            <thead>
                                <tr>
                                    <th>Offer</th>
                                    <th>Original</th>
                                    <th>Offer Price</th>
                                    <th>Valid Until</th>
                                    <th>Active</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${data.map(item => `

                                    <tr>

                                        <td>

                                            <strong>
                                                ${escapeHTML(
                                                    item.name
                                                )}
                                            </strong>

                                            ${
                                                item.description
                                                ? `
                                                    <div
                                                        style="
                                                            color:var(--muted);
                                                            margin-top:4px;
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            item.description
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                            }

                                        </td>

                                        <td>
                                            ${
                                                item.original_price !== null
                                                ? money(
                                                    item.original_price
                                                )
                                                : "—"
                                            }
                                        </td>

                                        <td>
                                            ${
                                                item.offer_price !== null
                                                ? money(
                                                    item.offer_price
                                                )
                                                : "—"
                                            }
                                        </td>

                                        <td>
                                            ${formatDate(
                                                item.valid_until
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                item.active
                                                ? "Yes"
                                                : "No"
                                            }
                                        </td>

                                        <td>

                                            <div
                                                style="
                                                    display:flex;
                                                    gap:6px;
                                                    flex-wrap:wrap;
                                                "
                                            >

                                                <button
                                                    class="secondary-btn edit-offer"
                                                    type="button"
                                                    data-id="${escapeAttribute(
                                                        item.id
                                                    )}"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    class="danger-btn delete-record"
                                                    type="button"
                                                    data-table="offers"
                                                    data-id="${escapeAttribute(
                                                        item.id
                                                    )}"
                                                    data-label="this offer"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>

                `
                : `
                    <div class="empty-state">
                        No offers added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addOfferBtn")
        ?.addEventListener(
            "click",
            () => showOfferForm()
        );

    content
        .querySelectorAll(
            ".edit-offer"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            offer =>
                                offer.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showOfferForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showOfferForm(offer = null) {

    const area =
        $("offerFormArea");

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${offer ? "Edit Offer" : "Add Offer"}
            </h3>

            <form
                id="offerForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Offer Name
                        </label>

                        <input
                            id="offerName"
                            required
                            value="${escapeAttribute(
                                offer?.name || ""
                            )}"
                            placeholder="Offer name"
                        >

                    </div>

                    <div>

                        <label>
                            Original Price
                        </label>

                        <input
                            id="offerOriginalPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value="${
                                offer?.original_price ??
                                ""
                            }"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Offer Price
                        </label>

                        <input
                            id="offerPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value="${
                                offer?.offer_price ??
                                ""
                            }"
                        >

                    </div>

                    <div>

                        <label>
                            Discount %
                        </label>

                        <input
                            id="offerDiscount"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${
                                offer?.discount_percent ??
                                ""
                            }"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Valid From
                        </label>

                        <input
                            id="offerValidFrom"
                            type="date"
                            value="${
                                offer?.valid_from ||
                                ""
                            }"
                        >

                    </div>

                    <div>

                        <label>
                            Valid Until
                        </label>

                        <input
                            id="offerValidUntil"
                            type="date"
                            value="${
                                offer?.valid_until ||
                                ""
                            }"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="offerDescription"
                    >${escapeHTML(
                        offer?.description || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Included Services
                    </label>

                    <textarea
                        id="offerServices"
                    >${escapeHTML(
                        offer?.included_services || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Terms
                    </label>

                    <textarea
                        id="offerTerms"
                    >${escapeHTML(
                        offer?.terms || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Offer Image
                    </label>

                    <input
                        id="offerImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    >

                    ${
                        offer?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    offer.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="offerFeatured"
                        ${
                            offer?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured offer

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="offerActive"
                        ${
                            offer?.active !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Active offer

                </label>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        ${
                            offer
                            ? "Update Offer"
                            : "Save Offer"
                        }
                    </button>

                    <button
                        type="button"
                        id="cancelOffer"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelOffer")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("offerForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let imageUrl =
                        offer?.image_url ||
                        null;

                    const file =
                        $("offerImage")
                            ?.files?.[0];

                    if (file) {

                        imageUrl =
                            await uploadImage(
                                "offers",
                                file
                            );
                    }

                    const payload = {

                        name:
                            $("offerName")
                                .value
                                .trim(),

                        description:
                            $("offerDescription")
                                .value
                                .trim() ||
                            null,

                        image_url:
                            imageUrl,

                        original_price:
                            $("offerOriginalPrice")
                                .value === ""
                            ? null
                            : Number(
                                $("offerOriginalPrice")
                                    .value
                            ),

                        offer_price:
                            $("offerPrice")
                                .value === ""
                            ? null
                            : Number(
                                $("offerPrice")
                                    .value
                            ),

                        discount_percent:
                            $("offerDiscount")
                                .value === ""
                            ? null
                            : Number(
                                $("offerDiscount")
                                    .value
                            ),

                        valid_from:
                            $("offerValidFrom")
                                .value ||
                            null,

                        valid_until:
                            $("offerValidUntil")
                                .value ||
                            null,

                        included_services:
                            $("offerServices")
                                .value
                                .trim() ||
                            null,

                        terms:
                            $("offerTerms")
                                .value
                                .trim() ||
                            null,

                        active:
                            $("offerActive")
                                .checked,

                        featured:
                            $("offerFeatured")
                                .checked

                    };

                    let result;

                    if (offer?.id) {

                        result =
                            await db
                                .from("offers")
                                .update(payload)
                                .eq(
                                    "id",
                                    offer.id
                                );

                    } else {

                        result =
                            await db
                                .from("offers")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        offer
                        ? "Offer updated successfully."
                        : "Offer created successfully."
                    );

                    await loadOffers();

                } catch (error) {

                    console.error(
                        "Offer save error:",
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   GENERIC IMAGE UPLOAD
============================================================ */

async function uploadImage(
    bucket,
    file
) {

    const db =
        getDatabase();

    if (!file) {
        return null;
    }

    if (
        ![
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.type)
    ) {

        throw new Error(
            "Only JPG, PNG and WebP images are allowed."
        );
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Image must be 10 MB or smaller."
        );
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const path =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const {
        error
    } = await db
        .storage
        .from(bucket)
        .upload(
            path,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            }
        );

    if (error) {
        throw error;
    }

    const {
        data
    } = db
        .storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
}


/* ============================================================
   GALLERY
============================================================ */

async function loadGallery() {

    await loadStandardGallery(
        "gallery",
        "gallery",
        "Our Work Gallery",
        "Upload portfolio and beauty work images.",
        false
    );
}


async function loadBrideGallery() {

    await loadStandardGallery(
        "bride_gallery",
        "bride-gallery",
        "Bride / Girls Gallery",
        "Upload bridal and girls portfolio images.",
        true
    );
}


async function loadStandardGallery(
    table,
    bucket,
    title,
    description,
    hasDate
) {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from(table)
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        )
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        ${escapeHTML(description)}
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addGalleryBtn"
                    type="button"
                >
                    + Upload Image
                </button>

            </div>

            <div id="galleryFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    auto-fill,
                                    minmax(210px,1fr)
                                );
                            gap:16px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                                style="padding:12px;"
                            >

                                <img
                                    src="${escapeAttribute(
                                        item.image_url
                                    )}"
                                    alt="${escapeAttribute(
                                        item.title ||
                                        ""
                                    )}"
                                    style="
                                        width:100%;
                                        height:220px;
                                        object-fit:cover;
                                        border-radius:9px;
                                        border:1px solid var(--border);
                                    "
                                >

                                <h3
                                    style="
                                        margin-top:12px;
                                        font-size:18px;
                                    "
                                >
                                    ${escapeHTML(
                                        item.title ||
                                        "Untitled"
                                    )}
                                </h3>

                                ${
                                    item.category
                                    ? `
                                        <p
                                            style="
                                                color:var(--muted);
                                                margin-top:5px;
                                            "
                                        >
                                            ${escapeHTML(
                                                item.category
                                            )}
                                        </p>
                                    `
                                    : ""
                                }

                                ${
                                    hasDate &&
                                    item.photo_date
                                    ? `
                                        <p
                                            style="
                                                color:var(--muted);
                                                margin-top:5px;
                                            "
                                        >
                                            ${formatDate(
                                                item.photo_date
                                            )}
                                        </p>
                                    `
                                    : ""
                                }

                                <div
                                    style="
                                        display:flex;
                                        gap:7px;
                                        margin-top:12px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-gallery"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="${escapeAttribute(
                                            table
                                        )}"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this image"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No images uploaded yet.
                    </div>
                `
            }

        </div>
    `;

    $("addGalleryBtn")
        ?.addEventListener(
            "click",
            () =>
                showGalleryForm(
                    table,
                    bucket,
                    hasDate
                )
        );

    content
        .querySelectorAll(
            ".edit-gallery"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {

                        showGalleryForm(
                            table,
                            bucket,
                            hasDate,
                            item
                        );
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showGalleryForm(
    table,
    bucket,
    hasDate,
    item = null
) {

    const area =
        $("galleryFormArea");

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${item ? "Edit Image" : "Upload Image"}
            </h3>

            <form
                id="galleryForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Title
                        </label>

                        <input
                            id="galleryTitle"
                            value="${escapeAttribute(
                                item?.title || ""
                            )}"
                            placeholder="Image title"
                        >

                    </div>

                    <div>

                        <label>
                            Category
                        </label>

                        <input
                            id="galleryCategory"
                            value="${escapeAttribute(
                                item?.category || ""
                            )}"
                            placeholder="Bridal, Makeup, Hair..."
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="galleryDescription"
                    >${escapeHTML(
                        item?.description || ""
                    )}</textarea>

                </div>


                ${
                    hasDate
                    ? `
                        <div>

                            <label>
                                Photo Date
                            </label>

                            <input
                                id="galleryDate"
                                type="date"
                                value="${
                                    item?.photo_date ||
                                    ""
                                }"
                            >

                        </div>
                    `
                    : ""
                }


                <div>

                    <label>
                        ${
                            item
                            ? "Replace Image (optional)"
                            : "Image"
                        }
                    </label>

                    <input
                        id="galleryImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ${
                            item
                            ? ""
                            : "required"
                        }
                    >

                    ${
                        item?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="galleryFeatured"
                        ${
                            item?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="galleryVisible"
                        ${
                            item?.visible !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Visible on website

                </label>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Upload"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelGallery"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelGallery")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("galleryForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let imageUrl =
                        item?.image_url ||
                        null;

                    const file =
                        $("galleryImage")
                            ?.files?.[0];

                    if (file) {

                        imageUrl =
                            await uploadImage(
                                bucket,
                                file
                            );
                    }

                    if (!imageUrl) {

                        throw new Error(
                            "Please select an image."
                        );
                    }

                    const payload = {

                        title:
                            $("galleryTitle")
                                .value
                                .trim() ||
                            null,

                        description:
                            $("galleryDescription")
                                .value
                                .trim() ||
                            null,

                        image_url:
                            imageUrl,

                        category:
                            $("galleryCategory")
                                .value
                                .trim() ||
                            null,

                        featured:
                            $("galleryFeatured")
                                .checked,

                        visible:
                            $("galleryVisible")
                                .checked,

                        display_order:
                            item?.display_order ||
                            0

                    };

                    if (hasDate) {

                        payload.photo_date =
                            $("galleryDate")
                                .value ||
                            null;
                    }

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from(table)
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from(table)
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Image updated successfully."
                        : "Image uploaded successfully."
                    );

                    if (table === "gallery") {
                        await loadGallery();
                    } else {
                        await loadBrideGallery();
                    }

                } catch (error) {

                    console.error(
                        "Gallery save error:",
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   CUSTOMER GALLERY
============================================================ */

async function loadCustomerGallery() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("customer_gallery")
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        )
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Customer Gallery
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Only publish customer photos when consent has been given.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addCustomerBtn"
                    type="button"
                >
                    + Add Customer Photo
                </button>

            </div>

            <div id="customerFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    auto-fill,
                                    minmax(210px,1fr)
                                );
                            gap:16px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                                style="padding:12px;"
                            >

                                <img
                                    src="${escapeAttribute(
                                        item.photo_url
                                    )}"
                                    alt=""
                                    style="
                                        width:100%;
                                        height:220px;
                                        object-fit:cover;
                                        border-radius:9px;
                                    "
                                >

                                <h3
                                    style="
                                        margin-top:12px;
                                        font-size:18px;
                                    "
                                >
                                    ${escapeHTML(
                                        item.customer_name ||
                                        "Customer"
                                    )}
                                </h3>

                                ${
                                    item.service
                                    ? `
                                        <p
                                            style="
                                                color:var(--muted);
                                                margin-top:5px;
                                            "
                                        >
                                            ${escapeHTML(
                                                item.service
                                            )}
                                        </p>
                                    `
                                    : ""
                                }

                                <p
                                    style="
                                        margin-top:8px;
                                        font-size:13px;
                                    "
                                >
                                    Consent:
                                    <strong>
                                        ${
                                            item.consent_given
                                            ? "Yes"
                                            : "No"
                                        }
                                    </strong>
                                </p>

                                <p
                                    style="
                                        margin-top:4px;
                                        font-size:13px;
                                    "
                                >
                                    Visible:
                                    <strong>
                                        ${
                                            item.visible
                                            ? "Yes"
                                            : "No"
                                        }
                                    </strong>
                                </p>

                                <div
                                    style="
                                        display:flex;
                                        gap:7px;
                                        margin-top:12px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-customer"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="customer_gallery"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this customer photo"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No customer photos added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addCustomerBtn")
        ?.addEventListener(
            "click",
            () => showCustomerForm()
        );

    content
        .querySelectorAll(
            ".edit-customer"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showCustomerForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showCustomerForm(item = null) {

    const area =
        $("customerFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit Customer Photo"
                    : "Add Customer Photo"
                }
            </h3>

            <form
                id="customerForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Customer Name
                        </label>

                        <input
                            id="customerName"
                            value="${escapeAttribute(
                                item?.customer_name || ""
                            )}"
                            placeholder="Optional"
                        >

                    </div>

                    <div>

                        <label>
                            Service
                        </label>

                        <input
                            id="customerService"
                            value="${escapeAttribute(
                                item?.service || ""
                            )}"
                            placeholder="Optional"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Testimonial
                    </label>

                    <textarea
                        id="customerTestimonial"
                    >${escapeHTML(
                        item?.testimonial || ""
                    )}</textarea>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Rating
                        </label>

                        <input
                            id="customerRating"
                            type="number"
                            min="1"
                            max="5"
                            value="${
                                item?.rating ??
                                ""
                            }"
                        >

                    </div>

                    <div>

                        <label>
                            Photo Date
                        </label>

                        <input
                            id="customerDate"
                            type="date"
                            value="${
                                item?.photo_date ||
                                ""
                            }"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        ${
                            item
                            ? "Replace Photo (optional)"
                            : "Customer Photo"
                        }
                    </label>

                    <input
                        id="customerImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ${
                            item
                            ? ""
                            : "required"
                        }
                    >

                    ${
                        item?.photo_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.photo_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="customerConsent"
                        ${
                            item?.consent_given
                            ? "checked"
                            : ""
                        }
                    >

                    Customer consent has been given

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="customerVisible"
                        ${
                            item?.visible !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Visible on website

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="customerFeatured"
                        ${
                            item?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured

                </label>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelCustomer"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelCustomer")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("customerForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let photoUrl =
                        item?.photo_url ||
                        null;

                    const file =
                        $("customerImage")
                            ?.files?.[0];

                    if (file) {

                        photoUrl =
                            await uploadImage(
                                "customer-gallery",
                                file
                            );
                    }

                    if (!photoUrl) {

                        throw new Error(
                            "Please select a customer photo."
                        );
                    }

                    const ratingValue =
                        $("customerRating")
                            .value;

                    const payload = {

                        customer_name:
                            $("customerName")
                                .value
                                .trim() ||
                            null,

                        photo_url:
                            photoUrl,

                        service:
                            $("customerService")
                                .value
                                .trim() ||
                            null,

                        testimonial:
                            $("customerTestimonial")
                                .value
                                .trim() ||
                            null,

                        rating:
                            ratingValue === ""
                            ? null
                            : Number(
                                ratingValue
                            ),

                        photo_date:
                            $("customerDate")
                                .value ||
                            null,

                        featured:
                            $("customerFeatured")
                                .checked,

                        visible:
                            $("customerVisible")
                                .checked,

                        consent_given:
                            $("customerConsent")
                                .checked,

                        display_order:
                            item?.display_order ||
                            0

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("customer_gallery")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("customer_gallery")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Customer photo updated."
                        : "Customer photo saved."
                    );

                    await loadCustomerGallery();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   BEFORE / AFTER
============================================================ */

async function loadBeforeAfter() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("before_after")
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        )
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Before / After
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage transformation images.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addBeforeAfter"
                    type="button"
                >
                    + Add Transformation
                </button>

            </div>

            <div id="beforeAfterFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    auto-fill,
                                    minmax(280px,1fr)
                                );
                            gap:18px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                            >

                                <h3>
                                    ${escapeHTML(
                                        item.title ||
                                        "Transformation"
                                    )}
                                </h3>

                                <div
                                    style="
                                        display:grid;
                                        grid-template-columns:1fr 1fr;
                                        gap:8px;
                                        margin-top:12px;
                                    "
                                >

                                    <img
                                        src="${escapeAttribute(
                                            item.before_image_url
                                        )}"
                                        style="
                                            width:100%;
                                            height:180px;
                                            object-fit:cover;
                                            border-radius:8px;
                                        "
                                        alt="Before"
                                    >

                                    <img
                                        src="${escapeAttribute(
                                            item.after_image_url
                                        )}"
                                        style="
                                            width:100%;
                                            height:180px;
                                            object-fit:cover;
                                            border-radius:8px;
                                        "
                                        alt="After"
                                    >

                                </div>

                                ${
                                    item.description
                                    ? `
                                        <p
                                            style="
                                                margin-top:10px;
                                                color:var(--muted);
                                            "
                                        >
                                            ${escapeHTML(
                                                item.description
                                            )}
                                        </p>
                                    `
                                    : ""
                                }

                                <div
                                    style="
                                        display:flex;
                                        gap:7px;
                                        margin-top:12px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-before-after"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="before_after"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this transformation"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No before/after transformations added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addBeforeAfter")
        ?.addEventListener(
            "click",
            () => showBeforeAfterForm()
        );

    content
        .querySelectorAll(
            ".edit-before-after"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showBeforeAfterForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showBeforeAfterForm(item = null) {

    const area =
        $("beforeAfterFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit Transformation"
                    : "Add Transformation"
                }
            </h3>

            <form
                id="beforeAfterForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Title
                        </label>

                        <input
                            id="beforeTitle"
                            value="${escapeAttribute(
                                item?.title || ""
                            )}"
                            placeholder="Transformation title"
                        >

                    </div>

                    <div>

                        <label>
                            Category
                        </label>

                        <input
                            id="beforeCategory"
                            value="${escapeAttribute(
                                item?.category || ""
                            )}"
                            placeholder="Makeup, Hair..."
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="beforeDescription"
                    >${escapeHTML(
                        item?.description || ""
                    )}</textarea>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Before Image
                        </label>

                        <input
                            id="beforeImage"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            ${
                                item
                                ? ""
                                : "required"
                            }
                        >

                    </div>

                    <div>

                        <label>
                            After Image
                        </label>

                        <input
                            id="afterImage"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            ${
                                item
                                ? ""
                                : "required"
                            }
                        >

                    </div>

                </div>


                ${
                    item
                    ? `
                        <div
                            style="
                                display:grid;
                                grid-template-columns:1fr 1fr;
                                gap:10px;
                            "
                        >

                            <img
                                src="${escapeAttribute(
                                    item.before_image_url
                                )}"
                                class="admin-image"
                                style="
                                    width:100%;
                                    height:180px;
                                "
                                alt=""
                            >

                            <img
                                src="${escapeAttribute(
                                    item.after_image_url
                                )}"
                                class="admin-image"
                                style="
                                    width:100%;
                                    height:180px;
                                "
                                alt=""
                            >

                        </div>
                    `
                    : ""
                }


                <label>

                    <input
                        type="checkbox"
                        id="beforeFeatured"
                        ${
                            item?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="beforeVisible"
                        ${
                            item?.visible !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Visible

                </label>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelBefore"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelBefore")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("beforeAfterForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let beforeUrl =
                        item?.before_image_url ||
                        null;

                    let afterUrl =
                        item?.after_image_url ||
                        null;

                    const beforeFile =
                        $("beforeImage")
                            ?.files?.[0];

                    const afterFile =
                        $("afterImage")
                            ?.files?.[0];

                    if (beforeFile) {

                        beforeUrl =
                            await uploadImage(
                                "before-after",
                                beforeFile
                            );
                    }

                    if (afterFile) {

                        afterUrl =
                            await uploadImage(
                                "before-after",
                                afterFile
                            );
                    }

                    if (!beforeUrl || !afterUrl) {

                        throw new Error(
                            "Both before and after images are required."
                        );
                    }

                    const payload = {

                        title:
                            $("beforeTitle")
                                .value
                                .trim() ||
                            null,

                        description:
                            $("beforeDescription")
                                .value
                                .trim() ||
                            null,

                        before_image_url:
                            beforeUrl,

                        after_image_url:
                            afterUrl,

                        category:
                            $("beforeCategory")
                                .value
                                .trim() ||
                            null,

                        featured:
                            $("beforeFeatured")
                                .checked,

                        visible:
                            $("beforeVisible")
                                .checked,

                        display_order:
                            item?.display_order ||
                            0

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("before_after")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("before_after")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Transformation updated."
                        : "Transformation added."
                    );

                    await loadBeforeAfter();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   BRIDAL PACKAGES
============================================================ */

async function loadBridalPackages() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("bridal_packages")
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Bridal Packages
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage bridal packages and enquiries.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addBridalPackage"
                    type="button"
                >
                    + Add Package
                </button>

            </div>

            <div id="bridalPackageFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    auto-fill,
                                    minmax(250px,1fr)
                                );
                            gap:16px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                            >

                                ${
                                    item.image_url
                                    ? `
                                        <img
                                            src="${escapeAttribute(
                                                item.image_url
                                            )}"
                                            style="
                                                width:100%;
                                                height:180px;
                                                object-fit:cover;
                                                border-radius:8px;
                                            "
                                            alt=""
                                        >
                                    `
                                    : ""
                                }

                                <h3
                                    style="margin-top:12px;"
                                >
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </h3>

                                ${
                                    item.price !== null
                                    ? `
                                        <p
                                            style="
                                                margin-top:7px;
                                                color:var(--gold-dark);
                                                font-weight:700;
                                            "
                                        >
                                            ${money(
                                                item.price
                                            )}
                                        </p>
                                    `
                                    : `
                                        <p
                                            style="
                                                margin-top:7px;
                                                color:var(--gold-dark);
                                            "
                                        >
                                            ${escapeHTML(
                                                item.price_label ||
                                                "Price on enquiry"
                                            )}
                                        </p>
                                    `
                                }

                                ${
                                    item.description
                                    ? `
                                        <p
                                            style="
                                                margin-top:8px;
                                                color:var(--muted);
                                            "
                                        >
                                            ${escapeHTML(
                                                item.description
                                            )}
                                        </p>
                                    `
                                    : ""
                                }

                                <div
                                    style="
                                        display:flex;
                                        gap:7px;
                                        margin-top:12px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-bridal"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="bridal_packages"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this bridal package"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No bridal packages added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addBridalPackage")
        ?.addEventListener(
            "click",
            () => showBridalPackageForm()
        );

    content
        .querySelectorAll(
            ".edit-bridal"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showBridalPackageForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showBridalPackageForm(item = null) {

    const area =
        $("bridalPackageFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit Bridal Package"
                    : "Add Bridal Package"
                }
            </h3>

            <form
                id="bridalPackageForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Package Name
                        </label>

                        <input
                            id="bridalName"
                            required
                            value="${escapeAttribute(
                                item?.name || ""
                            )}"
                        >

                    </div>

                    <div>

                        <label>
                            Price
                        </label>

                        <input
                            id="bridalPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value="${
                                item?.price ??
                                ""
                            }"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Price Label
                    </label>

                    <input
                        id="bridalPriceLabel"
                        value="${escapeAttribute(
                            item?.price_label ||
                            "Price on enquiry"
                        )}"
                    >

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="bridalDescription"
                    >${escapeHTML(
                        item?.description || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Included Services
                    </label>

                    <textarea
                        id="bridalIncluded"
                    >${escapeHTML(
                        item?.included_services || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Duration
                    </label>

                    <input
                        id="bridalDuration"
                        value="${escapeAttribute(
                            item?.duration || ""
                        )}"
                    >

                </div>


                <div>

                    <label>
                        Image
                    </label>

                    <input
                        id="bridalImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    >

                    ${
                        item?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="bridalFeatured"
                        ${
                            item?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="bridalActive"
                        ${
                            item?.active !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Active

                </label>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelBridal"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelBridal")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("bridalPackageForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let imageUrl =
                        item?.image_url ||
                        null;

                    const file =
                        $("bridalImage")
                            ?.files?.[0];

                    if (file) {

                        imageUrl =
                            await uploadImage(
                                "gallery",
                                file
                            );
                    }

                    const priceValue =
                        $("bridalPrice")
                            .value;

                    const payload = {

                        name:
                            $("bridalName")
                                .value
                                .trim(),

                        description:
                            $("bridalDescription")
                                .value
                                .trim() ||
                            null,

                        image_url:
                            imageUrl,

                        price:
                            priceValue === ""
                            ? null
                            : Number(priceValue),

                        price_label:
                            $("bridalPriceLabel")
                                .value
                                .trim() ||
                            "Price on enquiry",

                        included_services:
                            $("bridalIncluded")
                                .value
                                .trim() ||
                            null,

                        duration:
                            $("bridalDuration")
                                .value
                                .trim() ||
                            null,

                        featured:
                            $("bridalFeatured")
                                .checked,

                        active:
                            $("bridalActive")
                                .checked,

                        display_order:
                            item?.display_order ||
                            0

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("bridal_packages")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("bridal_packages")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Bridal package updated."
                        : "Bridal package created."
                    );

                    await loadBridalPackages();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   TEAM
============================================================ */

async function loadTeam() {

    await loadSimpleContentTable(
        "team",
        "Team",
        [
            "name",
            "role",
            "bio",
            "image_url",
            "instagram_url",
            "display_order",
            "active"
        ]
    );
}


async function loadSimpleContentTable(
    table,
    title,
    columns
) {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from(table)
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    let rows = "";

    if (table === "team") {

        rows =
            (data || []).map(item => `

                <tr>

                    <td>
                        ${
                            item.image_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        item.image_url
                                    )}"
                                    class="admin-image"
                                    alt=""
                                >
                            `
                            : "—"
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.role ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.bio ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${
                            item.active
                            ? "Yes"
                            : "No"
                        }
                    </td>

                    <td>

                        <button
                            class="secondary-btn edit-team"
                            type="button"
                            data-id="${escapeAttribute(
                                item.id
                            )}"
                        >
                            Edit
                        </button>

                        <button
                            class="danger-btn delete-record"
                            type="button"
                            data-table="team"
                            data-id="${escapeAttribute(
                                item.id
                            )}"
                            data-label="this team member"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `).join("");

    }

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage ${escapeHTML(
                            title.toLowerCase()
                        )}.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addTeamBtn"
                    type="button"
                >
                    + Add Member
                </button>

            </div>

            <div id="teamFormArea"></div>

            ${
                rows
                ? `

                    <div style="overflow-x:auto;">

                        <table>

                            <thead>

                                <tr>
                                    <th>Photo</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Bio</th>
                                    <th>Active</th>
                                    <th>Action</th>
                                </tr>

                            </thead>

                            <tbody>
                                ${rows}
                            </tbody>

                        </table>

                    </div>

                `
                : `
                    <div class="empty-state">
                        No team members added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addTeamBtn")
        ?.addEventListener(
            "click",
            () => showTeamForm()
        );

    content
        .querySelectorAll(
            ".edit-team"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showTeamForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showTeamForm(item = null) {

    const area =
        $("teamFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit Team Member"
                    : "Add Team Member"
                }
            </h3>

            <form
                id="teamForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Name
                        </label>

                        <input
                            id="teamName"
                            required
                            value="${escapeAttribute(
                                item?.name || ""
                            )}"
                        >

                    </div>

                    <div>

                        <label>
                            Role
                        </label>

                        <input
                            id="teamRole"
                            value="${escapeAttribute(
                                item?.role || ""
                            )}"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Bio
                    </label>

                    <textarea
                        id="teamBio"
                    >${escapeHTML(
                        item?.bio || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Instagram URL
                    </label>

                    <input
                        id="teamInstagram"
                        type="url"
                        value="${escapeAttribute(
                            item?.instagram_url || ""
                        )}"
                    >

                </div>


                <div>

                    <label>
                        Photo
                    </label>

                    <input
                        id="teamImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    >

                    ${
                        item?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Display Order
                        </label>

                        <input
                            id="teamOrder"
                            type="number"
                            min="0"
                            value="${
                                item?.display_order ??
                                0
                            }"
                        >

                    </div>

                    <div>

                        <label>

                            <input
                                type="checkbox"
                                id="teamActive"
                                ${
                                    item?.active !== false
                                    ? "checked"
                                    : ""
                                }
                            >

                            Active

                        </label>

                    </div>

                </div>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelTeam"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelTeam")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("teamForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let imageUrl =
                        item?.image_url ||
                        null;

                    const file =
                        $("teamImage")
                            ?.files?.[0];

                    if (file) {

                        imageUrl =
                            await uploadImage(
                                "team",
                                file
                            );
                    }

                    const payload = {

                        name:
                            $("teamName")
                                .value
                                .trim(),

                        role:
                            $("teamRole")
                                .value
                                .trim() ||
                            null,

                        bio:
                            $("teamBio")
                                .value
                                .trim() ||
                            null,

                        image_url:
                            imageUrl,

                        instagram_url:
                            $("teamInstagram")
                                .value
                                .trim() ||
                            null,

                        display_order:
                            Number(
                                $("teamOrder")
                                    .value || 0
                            ),

                        active:
                            $("teamActive")
                                .checked

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("team")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("team")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Team member updated."
                        : "Team member added."
                    );

                    await loadTeam();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   TESTIMONIALS
============================================================ */

async function loadTestimonials() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("testimonials")
        .select("*")
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Testimonials
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage customer reviews.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addTestimonial"
                    type="button"
                >
                    + Add Testimonial
                </button>

            </div>

            <div id="testimonialFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            gap:14px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        gap:15px;
                                        align-items:flex-start;
                                    "
                                >

                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                item.customer_name
                                            )}
                                        </h3>

                                        ${
                                            item.service
                                            ? `
                                                <p
                                                    style="
                                                        color:var(--muted);
                                                        margin-top:4px;
                                                    "
                                                >
                                                    ${escapeHTML(
                                                        item.service
                                                    )}
                                                </p>
                                            `
                                            : ""
                                        }

                                    </div>

                                    <strong>
                                        ${
                                            item.rating
                                            ? "★".repeat(
                                                Math.min(
                                                    5,
                                                    Number(
                                                        item.rating
                                                    )
                                                )
                                            )
                                            : "—"
                                        }
                                    </strong>

                                </div>

                                <p
                                    style="
                                        margin-top:12px;
                                        line-height:1.6;
                                    "
                                >
                                    ${escapeHTML(
                                        item.testimonial
                                    )}
                                </p>

                                <p
                                    style="
                                        margin-top:8px;
                                        color:var(--muted);
                                    "
                                >
                                    Visible:
                                    ${
                                        item.visible
                                        ? "Yes"
                                        : "No"
                                    }
                                </p>

                                <div
                                    style="
                                        margin-top:12px;
                                        display:flex;
                                        gap:7px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-testimonial"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="testimonials"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this testimonial"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No testimonials added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addTestimonial")
        ?.addEventListener(
            "click",
            () => showTestimonialForm()
        );

    content
        .querySelectorAll(
            ".edit-testimonial"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showTestimonialForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showTestimonialForm(item = null) {

    const area =
        $("testimonialFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit Testimonial"
                    : "Add Testimonial"
                }
            </h3>

            <form
                id="testimonialForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Customer Name
                        </label>

                        <input
                            id="testimonialName"
                            required
                            value="${escapeAttribute(
                                item?.customer_name || ""
                            )}"
                        >

                    </div>

                    <div>

                        <label>
                            Service
                        </label>

                        <input
                            id="testimonialService"
                            value="${escapeAttribute(
                                item?.service || ""
                            )}"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Testimonial
                    </label>

                    <textarea
                        id="testimonialText"
                        required
                    >${escapeHTML(
                        item?.testimonial || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Rating
                    </label>

                    <input
                        id="testimonialRating"
                        type="number"
                        min="1"
                        max="5"
                        value="${
                            item?.rating ??
                            ""
                        }"
                    >

                </div>


                <div>

                    <label>
                        Customer Image
                    </label>

                    <input
                        id="testimonialImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    >

                    ${
                        item?.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                class="admin-image"
                                style="margin-top:10px;"
                                alt=""
                            >
                        `
                        : ""
                    }

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="testimonialFeatured"
                        ${
                            item?.featured
                            ? "checked"
                            : ""
                        }
                    >

                    Featured

                </label>


                <label>

                    <input
                        type="checkbox"
                        id="testimonialVisible"
                        ${
                            item?.visible !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Visible

                </label>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelTestimonial"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelTestimonial")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("testimonialForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    let imageUrl =
                        item?.image_url ||
                        null;

                    const file =
                        $("testimonialImage")
                            ?.files?.[0];

                    if (file) {

                        imageUrl =
                            await uploadImage(
                                "customer-gallery",
                                file
                            );
                    }

                    const ratingValue =
                        $("testimonialRating")
                            .value;

                    const payload = {

                        customer_name:
                            $("testimonialName")
                                .value
                                .trim(),

                        testimonial:
                            $("testimonialText")
                                .value
                                .trim(),

                        rating:
                            ratingValue === ""
                            ? null
                            : Number(
                                ratingValue
                            ),

                        image_url:
                            imageUrl,

                        service:
                            $("testimonialService")
                                .value
                                .trim() ||
                            null,

                        featured:
                            $("testimonialFeatured")
                                .checked,

                        visible:
                            $("testimonialVisible")
                                .checked

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("testimonials")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("testimonials")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "Testimonial updated."
                        : "Testimonial added."
                    );

                    await loadTestimonials();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   FAQ
============================================================ */

async function loadFAQs() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("faqs")
        .select("*")
        .order(
            "display_order",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        FAQs
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        Manage frequently asked questions.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addFaq"
                    type="button"
                >
                    + Add FAQ
                </button>

            </div>

            <div id="faqFormArea"></div>

            ${
                data?.length
                ? `

                    <div
                        style="
                            display:grid;
                            gap:12px;
                        "
                    >

                        ${data.map(item => `

                            <article
                                class="admin-card"
                            >

                                <h3>
                                    ${escapeHTML(
                                        item.question
                                    )}
                                </h3>

                                <p
                                    style="
                                        margin-top:8px;
                                        line-height:1.6;
                                        color:var(--muted);
                                    "
                                >
                                    ${escapeHTML(
                                        item.answer
                                    )}
                                </p>

                                <p
                                    style="
                                        margin-top:8px;
                                        font-size:13px;
                                    "
                                >
                                    Active:
                                    ${
                                        item.active
                                        ? "Yes"
                                        : "No"
                                    }
                                </p>

                                <div
                                    style="
                                        margin-top:12px;
                                        display:flex;
                                        gap:7px;
                                    "
                                >

                                    <button
                                        class="secondary-btn edit-faq"
                                        type="button"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn delete-record"
                                        type="button"
                                        data-table="faqs"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        data-label="this FAQ"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        `).join("")}

                    </div>

                `
                : `
                    <div class="empty-state">
                        No FAQs added yet.
                    </div>
                `
            }

        </div>
    `;

    $("addFaq")
        ?.addEventListener(
            "click",
            () => showFAQForm()
        );

    content
        .querySelectorAll(
            ".edit-faq"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const item =
                        data.find(
                            row =>
                                row.id ===
                                button.dataset.id
                        );

                    if (item) {
                        showFAQForm(item);
                    }

                }
            );

        });

    attachDeleteHandlers();
}


function showFAQForm(item = null) {

    const area =
        $("faqFormArea");

    area.innerHTML = `

        <div
            class="admin-card"
            style="margin-bottom:20px;"
        >

            <h3>
                ${
                    item
                    ? "Edit FAQ"
                    : "Add FAQ"
                }
            </h3>

            <form
                id="faqForm"
                class="admin-form"
                style="margin-top:18px;"
            >

                <div>

                    <label>
                        Question
                    </label>

                    <input
                        id="faqQuestion"
                        required
                        value="${escapeAttribute(
                            item?.question || ""
                        )}"
                    >

                </div>


                <div>

                    <label>
                        Answer
                    </label>

                    <textarea
                        id="faqAnswer"
                        required
                    >${escapeHTML(
                        item?.answer || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        Display Order
                    </label>

                    <input
                        id="faqOrder"
                        type="number"
                        min="0"
                        value="${
                            item?.display_order ??
                            0
                        }"
                    >

                </div>


                <label>

                    <input
                        type="checkbox"
                        id="faqActive"
                        ${
                            item?.active !== false
                            ? "checked"
                            : ""
                        }
                    >

                    Active

                </label>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        ${
                            item
                            ? "Update"
                            : "Save"
                        }
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelFaq"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    $("cancelFaq")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("faqForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const db =
                    getDatabase();

                try {

                    const payload = {

                        question:
                            $("faqQuestion")
                                .value
                                .trim(),

                        answer:
                            $("faqAnswer")
                                .value
                                .trim(),

                        display_order:
                            Number(
                                $("faqOrder")
                                    .value || 0
                            ),

                        active:
                            $("faqActive")
                                .checked

                    };

                    let result;

                    if (item?.id) {

                        result =
                            await db
                                .from("faqs")
                                .update(payload)
                                .eq(
                                    "id",
                                    item.id
                                );

                    } else {

                        result =
                            await db
                                .from("faqs")
                                .insert(payload);
                    }

                    if (result.error) {
                        throw result.error;
                    }

                    showMessage(
                        item
                        ? "FAQ updated."
                        : "FAQ added."
                    );

                    await loadFAQs();

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


/* ============================================================
   SETTINGS
============================================================ */

async function loadSettings() {

    const db =
        getDatabase();

    const {
        data,
        error
    } = await db
        .from("settings")
        .select("*")
        .order(
            "setting_key",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    const settings = {};

    (data || []).forEach(
        item => {
            settings[item.setting_key] =
                item;
        }
    );

    const content =
        getModuleContent();

    content.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Business Settings
                    </h2>

                    <p style="margin-top:7px;color:var(--muted);">
                        These values are used by the website.
                    </p>

                </div>

            </div>


            <form
                id="settingsForm"
                class="admin-form"
            >

                ${settingField(
                    "business_name",
                    "Business Name",
                    settings
                )}

                ${settingField(
                    "artist_name",
                    "Artist Name",
                    settings
                )}

                ${settingField(
                    "phone",
                    "Phone",
                    settings
                )}

                ${settingField(
                    "whatsapp",
                    "WhatsApp",
                    settings
                )}

                ${settingField(
                    "email",
                    "Email",
                    settings
                )}

                ${settingField(
                    "address",
                    "Address",
                    settings,
                    true
                )}

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Settings
                    </button>

                </div>

            </form>

        </div>
    `;

    $("settingsForm")
        ?.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                try {

                    const keys = [
                        "business_name",
                        "artist_name",
                        "phone",
                        "whatsapp",
                        "email",
                        "address"
                    ];

                    for (
                        const key of keys
                    ) {

                        const input =
                            document.querySelector(
                                `[data-setting-key="${key}"]`
                            );

                        if (!input) {
                            continue;
                        }

                        const value =
                            input.value.trim();

                        const existing =
                            settings[key];

                        let result;

                        if (existing?.id) {

                            result =
                                await db
                                    .from("settings")
                                    .update({
                                        setting_value:
                                            value
                                    })
                                    .eq(
                                        "id",
                                        existing.id
                                    );

                        } else {

                            result =
                                await db
                                    .from("settings")
                                    .insert({
                                        setting_key:
                                            key,
                                        setting_value:
                                            value
                                    });
                        }

                        if (result.error) {
                            throw result.error;
                        }
                    }

                    showMessage(
                        "Settings saved successfully."
                    );

                    await loadSettings();

                } catch (error) {

                    console.error(
                        "Settings error:",
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );
                }

            }
        );
}


function settingField(
    key,
    label,
    settings,
    textarea = false
) {

    const value =
        settings[key]?.setting_value ||
        "";

    return `

        <div>

            <label>
                ${escapeHTML(label)}
            </label>

            ${
                textarea
                ? `
                    <textarea
                        data-setting-key="${escapeAttribute(
                            key
                        )}"
                    >${escapeHTML(
                        value
                    )}</textarea>
                `
                : `
                    <input
                        type="text"
                        data-setting-key="${escapeAttribute(
                            key
                        )}"
                        value="${escapeAttribute(
                            value
                        )}"
                    >
                `
            }

        </div>
    `;
}


/* ============================================================
   DELETE HANDLERS
============================================================ */

function attachDeleteHandlers() {

    const content =
        getModuleContent();

    if (!content) {
        return;
    }

    content
        .querySelectorAll(
            ".delete-record"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async function () {

                    const table =
                        button.dataset.table;

                    const id =
                        button.dataset.id;

                    const label =
                        button.dataset.label ||
                        "this item";

                    if (!confirmDelete(label)) {
                        return;
                    }

                    const db =
                        getDatabase();

                    try {

                        const {
                            error
                        } = await db
                            .from(table)
                            .delete()
                            .eq(
                                "id",
                                id
                            );

                        if (error) {
                            throw error;
                        }

                        showMessage(
                            "Deleted successfully."
                        );

                        await openModule(
                            currentModule
                        );

                    } catch (error) {

                        console.error(
                            "Delete error:",
                            error
                        );

                        showMessage(
                            error.message,
                            "error"
                        );
                    }

                }
            );

        });
}


/* ============================================================
   PUBLIC FUNCTIONS
   These are intentionally global because admin.html
   calls openModule() from its navigation script.
============================================================ */

window.openModule =
    openModule;

window.showAdmin =
    showAdmin;

window.showLogin =
    showLogin;
