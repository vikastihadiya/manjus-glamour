/* ============================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL
   COMPLETE ADMIN.JS
   ============================================================ */

"use strict";


/* ============================================================
   GLOBAL STATE
   ============================================================ */

let supabaseClient = null;

let currentUser = null;
let currentModule = "dashboard";

let moduleArea = null;
let moduleContent = null;

let loginSection = null;
let adminPanel = null;
let loginForm = null;
let logoutBtn = null;

let adminEmail = null;
let adminPassword = null;


/* ============================================================
   DOM INITIALIZATION
   ============================================================ */

function initializeAdminElements() {

    moduleArea =
        document.getElementById("moduleArea");

    moduleContent =
        document.getElementById("moduleContent");

    loginSection =
        document.getElementById("loginSection");

    adminPanel =
        document.getElementById("adminPanel");

    loginForm =
        document.getElementById("loginForm");

    logoutBtn =
        document.getElementById("logoutBtn");

    adminEmail =
        document.getElementById("adminEmail");

    adminPassword =
        document.getElementById("adminPassword");

    console.log("Admin elements initialized:", {
        moduleArea: !!moduleArea,
        moduleContent: !!moduleContent,
        loginSection: !!loginSection,
        adminPanel: !!adminPanel,
        loginForm: !!loginForm,
        logoutBtn: !!logoutBtn,
        adminEmail: !!adminEmail,
        adminPassword: !!adminPassword
    });

    if (!moduleContent) {
        console.error(
            "CRITICAL: #moduleContent was not found."
        );

        return false;
    }

    return true;
}


/* ============================================================
   SUPABASE INITIALIZATION
   ============================================================ */

function initializeSupabase() {

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        supabaseClient =
            window.supabaseClient;

        console.log(
            "Supabase client loaded."
        );

        return true;
    }

    console.error(
        "Supabase client not found. Check supabase-config.js."
    );

    return false;
}


/* ============================================================
   HTML HELPERS
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

        return String(value);
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

        return String(value);
    }
}


function slugify(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(
    message,
    type = "success"
) {

    const old =
        document.getElementById(
            "adminMessage"
        );

    if (old) {
        old.remove();
    }

    const box =
        document.createElement("div");

    box.id = "adminMessage";

    box.textContent =
        message;

    box.style.position =
        "fixed";

    box.style.right =
        "20px";

    box.style.bottom =
        "20px";

    box.style.zIndex =
        "99999";

    box.style.padding =
        "14px 18px";

    box.style.borderRadius =
        "10px";

    box.style.fontSize =
        "14px";

    box.style.maxWidth =
        "380px";

    box.style.boxShadow =
        "0 10px 35px rgba(0,0,0,.15)";

    if (type === "error") {

        box.style.background =
            "#fee2e2";

        box.style.color =
            "#991b1b";

    } else {

        box.style.background =
            "#dcfce7";

        box.style.color =
            "#166534";
    }

    document.body.appendChild(box);

    setTimeout(
        () => {
            box.remove();
        },
        4000
    );
}


/* ============================================================
   AUTHENTICATION
   ============================================================ */

async function checkAuth() {

    if (!supabaseClient) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();

        if (error) {

            console.error(
                "Session error:",
                error
            );

            showLogin();
            return;
        }

        if (data?.session) {

            currentUser =
                data.session.user;

            showAdmin();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "Auth check failed:",
            error
        );

        showLogin();
    }
}


function showLogin() {

    if (loginSection) {

        loginSection.style.display =
            "flex";
    }

    if (adminPanel) {

        adminPanel.style.display =
            "none";
    }
}


function showAdmin() {

    if (loginSection) {

        loginSection.style.display =
            "none";
    }

    if (adminPanel) {

        adminPanel.style.display =
            "block";
    }

    openModule(
        "dashboard"
    );
}


async function handleLogin(event) {

    event.preventDefault();

    if (!supabaseClient) {

        showMessage(
            "Supabase is not connected.",
            "error"
        );

        return;
    }

    const email =
        adminEmail?.value?.trim();

    const password =
        adminPassword?.value || "";

    if (!email || !password) {

        showMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password
                });

        if (error) {

            console.error(
                "Login error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );

            return;
        }

        currentUser =
            data.user;

        showAdmin();

    } catch (error) {

        console.error(
            "Login exception:",
            error
        );

        showMessage(
            "Login failed. Please try again.",
            "error"
        );
    }
}


async function handleLogout() {

    if (!supabaseClient) {
        return;
    }

    try {

        await supabaseClient
            .auth
            .signOut();

        currentUser = null;

        showLogin();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-module]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const moduleName =
                        this.dataset.module;

                    if (!moduleName) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".nav-btn"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });

                    this.classList.add(
                        "active"
                    );

                    openModule(
                        moduleName
                    );
                }
            );
        });
}


/* ============================================================
   MODULE ROUTER
   ============================================================ */

async function openModule(
    moduleName
) {

    currentModule =
        moduleName;

    if (!moduleContent) {

        console.error(
            "moduleContent not found."
        );

        return;
    }

    moduleContent.innerHTML = `
        <div class="module-loading">
            Loading...
        </div>
    `;

    try {

        switch (moduleName) {

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

        moduleContent.innerHTML = `
            <div class="admin-module">

                <h2>Something went wrong</h2>

                <p style="margin-top:10px;color:#a33b3b;">
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;
    }
}


/* ============================================================
   DASHBOARD
   ============================================================ */

async function getCount(
    table
) {

    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from(table)
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                );

        if (error) {

            console.error(
                `Count error: ${table}`,
                error
            );

            return 0;
        }

        return count || 0;

    } catch {

        return 0;
    }
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

    const results =
        await Promise.all(
            tables.map(
                table =>
                    getCount(table)
            )
        );

    const counts = {};

    tables.forEach(
        (table, index) => {

            counts[table] =
                results[index];

        }
    );

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>
                    <h2>Dashboard</h2>

                    <p>
                        Manage Manju's The World of Glamour.
                    </p>
                </div>

            </div>


            <div class="admin-grid">

                ${dashboardCard(
                    "Appointments",
                    counts.appointments,
                    "appointments"
                )}

                ${dashboardCard(
                    "Services",
                    counts.services,
                    "services"
                )}

                ${dashboardCard(
                    "Offers",
                    counts.offers,
                    "offers"
                )}

                ${dashboardCard(
                    "Our Work",
                    counts.gallery,
                    "gallery"
                )}

                ${dashboardCard(
                    "Bride / Girls",
                    counts.bride_gallery,
                    "bride_gallery"
                )}

                ${dashboardCard(
                    "Customers",
                    counts.customer_gallery,
                    "customer_gallery"
                )}

                ${dashboardCard(
                    "Before / After",
                    counts.before_after,
                    "before_after"
                )}

                ${dashboardCard(
                    "Bridal Packages",
                    counts.bridal_packages,
                    "bridal_packages"
                )}

                ${dashboardCard(
                    "Team",
                    counts.team,
                    "team"
                )}

                ${dashboardCard(
                    "Testimonials",
                    counts.testimonials,
                    "testimonials"
                )}

                ${dashboardCard(
                    "FAQs",
                    counts.faqs,
                    "faqs"
                )}

            </div>

        </div>
    `;

    moduleContent
        .querySelectorAll(
            "[data-open-module]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openModule(
                        card.dataset.openModule
                    );

                }
            );

        });
}


function dashboardCard(
    title,
    count,
    module
) {

    return `

        <div
            class="admin-card"
            data-open-module="${module}"
            style="cursor:pointer;"
        >

            <h3>
                ${escapeHTML(count)}
            </h3>

            <p>
                ${escapeHTML(title)}
            </p>

        </div>
    `;
}


/* ============================================================
   APPOINTMENTS
   ============================================================ */

async function loadAppointments() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("appointments")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            "Appointments",
            error
        );

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>Appointments</h2>

                    <p>
                        Customer appointment requests.
                    </p>

                </div>

            </div>


            ${
                data?.length
                ? appointmentTable(data)
                : emptyState(
                    "No appointment requests yet."
                )
            }

        </div>
    `;

    moduleContent
        .querySelectorAll(
            ".appointment-status"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async event => {

                    const id =
                        event.target.dataset.id;

                    const status =
                        event.target.value;

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("appointments")
                            .update({
                                status
                            })
                            .eq(
                                "id",
                                id
                            );

                    if (error) {

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

    attachDeleteButtons();
}


function appointmentTable(data) {

    return `

        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Delete</th>
                    </tr>

                </thead>

                <tbody>

                    ${data.map(item => `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    item.customer_name ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.phone ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.email ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.appointment_date ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.appointment_time ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.message ||
                                    "—"
                                )}
                            </td>

                            <td>

                                <select
                                    class="appointment-status"
                                    data-id="${item.id}"
                                >

                                    ${appointmentStatuses(
                                        item.status
                                    )}

                                </select>

                            </td>

                            <td>
                                ${formatDateTime(
                                    item.created_at
                                )}
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    data-delete-table="appointments"
                                    data-delete-id="${item.id}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


function appointmentStatuses(
    current
) {

    const statuses = [
        "New",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show"
    ];

    return statuses.map(
        status => `

            <option
                value="${status}"
                ${current === status
                    ? "selected"
                    : ""}
            >
                ${status}
            </option>

        `
    ).join("");
}


/* ============================================================
   SERVICES
   IMPORTANT:
   VERIFIED DATABASE:
   category_id
   duration_minutes
   slug
   ============================================================ */

async function loadServices() {

    const [
        servicesResult,
        categoriesResult
    ] =
        await Promise.all([

            supabaseClient
                .from("services")
                .select("*")
                .order(
                    "display_order",
                    {
                        ascending: true
                    }
                ),

            supabaseClient
                .from("categories")
                .select("*")
                .eq(
                    "active",
                    true
                )
                .order(
                    "display_order",
                    {
                        ascending: true
                    }
                )

        ]);

    if (servicesResult.error) {

        showDatabaseError(
            "Services",
            servicesResult.error
        );

        return;
    }

    const services =
        servicesResult.data || [];

    const categories =
        categoriesResult.data || [];

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>Services</h2>

                    <p>
                        Manage services, categories,
                        prices and durations.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addServiceBtn"
                >
                    + Add Service
                </button>

            </div>


            <div id="serviceFormArea"></div>


            ${
                services.length
                ? servicesTable(
                    services,
                    categories
                )
                : emptyState(
                    "No services added yet."
                )
            }

        </div>
    `;

    document
        .getElementById(
            "addServiceBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showServiceForm(
                    null,
                    categories
                );

            }
        );

    attachDeleteButtons();
}


function servicesTable(
    services,
    categories
) {

    const categoryMap = {};

    categories.forEach(
        category => {

            categoryMap[
                category.id
            ] =
                category.name;

        }
    );

    return `

        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Price Label</th>
                        <th>Duration</th>
                        <th>Active</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    ${services.map(item => `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    item.name
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    categoryMap[
                                        item.category_id
                                    ] || "—"
                                )}
                            </td>

                            <td>
                                ${item.price !== null
                                    ? escapeHTML(
                                        item.price
                                    )
                                    : "—"}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.price_label ||
                                    "Price on enquiry"
                                )}
                            </td>

                            <td>
                                ${item.duration_minutes
                                    ? escapeHTML(
                                        item.duration_minutes +
                                        " min"
                                    )
                                    : "—"}
                            </td>

                            <td>
                                ${item.active
                                    ? "Yes"
                                    : "No"}
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    data-delete-table="services"
                                    data-delete-id="${item.id}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


async function showServiceForm(
    service,
    categories
) {

    const area =
        document.getElementById(
            "serviceFormArea"
        );

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            style="
                border:1px solid #ddd5ca;
                padding:20px;
                border-radius:12px;
                margin-bottom:20px;
                background:#faf8f4;
            "
        >

            <h3 style="margin-bottom:18px;">
                ${service
                    ? "Edit Service"
                    : "Add Service"}
            </h3>


            <form id="serviceForm">

                <div class="form-row">

                    <div>

                        <label>
                            Service Name
                        </label>

                        <input
                            id="serviceName"
                            required
                            value="${escapeAttribute(
                                service?.name || ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Category
                        </label>

                        <select
                            id="serviceCategory"
                        >

                            <option value="">
                                Select category
                            </option>

                            ${categories.map(
                                category => `

                                <option
                                    value="${category.id}"
                                    ${
                                        service?.category_id ===
                                        category.id
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    ${escapeHTML(
                                        category.name
                                    )}
                                </option>

                            `
                            ).join("")}

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
                            step="0.01"
                            value="${escapeAttribute(
                                service?.price ?? ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Price Label
                        </label>

                        <input
                            id="servicePriceLabel"
                            value="${escapeAttribute(
                                service?.price_label ||
                                "Price on enquiry"
                            )}"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Duration in minutes
                        </label>

                        <input
                            id="serviceDuration"
                            type="number"
                            min="0"
                            value="${escapeAttribute(
                                service?.duration_minutes ||
                                ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Display Order
                        </label>

                        <input
                            id="serviceOrder"
                            type="number"
                            value="${escapeAttribute(
                                service?.display_order ||
                                0
                            )}"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="serviceDescription"
                    >${escapeHTML(
                        service?.description || ""
                    )}</textarea>

                </div>


                <div>

                    <label>
                        <input
                            type="checkbox"
                            id="serviceFeatured"
                            ${
                                service?.featured
                                ? "checked"
                                : ""
                            }
                        >
                        Featured
                    </label>

                </div>


                <div>

                    <label>
                        <input
                            type="checkbox"
                            id="serviceActive"
                            ${
                                service?.active !== false
                                ? "checked"
                                : ""
                            }
                        >
                        Active
                    </label>

                </div>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        Save Service
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelService"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;


    document
        .getElementById(
            "cancelService"
        )
        ?.addEventListener(
            "click",
            () => {

                area.innerHTML =
                    "";

            }
        );


    document
        .getElementById(
            "serviceForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById(
                            "serviceName"
                        )
                        .value
                        .trim();

                const categoryId =
                    document
                        .getElementById(
                            "serviceCategory"
                        )
                        .value || null;

                const priceRaw =
                    document
                        .getElementById(
                            "servicePrice"
                        )
                        .value;

                const durationRaw =
                    document
                        .getElementById(
                            "serviceDuration"
                        )
                        .value;

                const payload = {

                    category_id:
                        categoryId,

                    name,

                    slug:
                        slugify(name),

                    description:
                        document
                            .getElementById(
                                "serviceDescription"
                            )
                            .value
                            .trim(),

                    price:
                        priceRaw === ""
                        ? null
                        : Number(priceRaw),

                    price_label:
                        document
                            .getElementById(
                                "servicePriceLabel"
                            )
                            .value
                            .trim() ||
                        "Price on enquiry",

                    duration_minutes:
                        durationRaw === ""
                        ? null
                        : Number(durationRaw),

                    featured:
                        document
                            .getElementById(
                                "serviceFeatured"
                            )
                            .checked,

                    active:
                        document
                            .getElementById(
                                "serviceActive"
                            )
                            .checked,

                    display_order:
                        Number(
                            document
                                .getElementById(
                                    "serviceOrder"
                                )
                                .value || 0
                        )

                };


                let result;

                if (service?.id) {

                    result =
                        await supabaseClient
                            .from("services")
                            .update(payload)
                            .eq(
                                "id",
                                service.id
                            );

                } else {

                    result =
                        await supabaseClient
                            .from("services")
                            .insert(
                                payload
                            );
                }


                if (result.error) {

                    console.error(
                        "Service save error:",
                        result.error
                    );

                    showMessage(
                        result.error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Service saved successfully."
                );

                await loadServices();

            }
        );
}


/* ============================================================
   OFFERS
   ============================================================ */

async function loadOffers() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("offers")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            "Offers",
            error
        );

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>Offers</h2>

                    <p>
                        Manage promotional offers and prices.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addOfferBtn"
                >
                    + Add Offer
                </button>

            </div>

            <div id="offerFormArea"></div>

            ${
                data?.length
                ? offersTable(data)
                : emptyState(
                    "No offers added yet."
                )
            }

        </div>
    `;

    document
        .getElementById(
            "addOfferBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showOfferForm();

            }
        );

    attachDeleteButtons();
}


function offersTable(data) {

    return `

        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Description</th>
                        <th>Original Price</th>
                        <th>Offer Price</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Active</th>
                        <th>Delete</th>

                    </tr>

                </thead>

                <tbody>

                    ${data.map(item => `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    item.name || "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.description || "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.original_price ??
                                    item.price ??
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.offer_price ??
                                    item.discount_price ??
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.start_date ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.end_date ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${
                                    item.active !== false
                                    ? "Yes"
                                    : "No"
                                }
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    data-delete-table="offers"
                                    data-delete-id="${item.id}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


function showOfferForm(
    offer = null
) {

    const area =
        document.getElementById(
            "offerFormArea"
        );

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            style="
                background:#faf8f4;
                border:1px solid #ddd5ca;
                padding:20px;
                border-radius:12px;
                margin-bottom:20px;
            "
        >

            <h3 style="margin-bottom:18px;">
                Add Offer
            </h3>


            <form id="offerForm">

                <div class="form-row">

                    <div>

                        <label>
                            Offer Name
                        </label>

                        <input
                            id="offerName"
                            required
                        >

                    </div>

                    <div>

                        <label>
                            Original Price
                        </label>

                        <input
                            id="offerOriginalPrice"
                            type="number"
                            step="0.01"
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
                            step="0.01"
                        >

                    </div>


                    <div>

                        <label>
                            Image URL
                        </label>

                        <input
                            id="offerImage"
                            placeholder="Optional"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Start Date
                        </label>

                        <input
                            id="offerStart"
                            type="date"
                        >

                    </div>


                    <div>

                        <label>
                            End Date
                        </label>

                        <input
                            id="offerEnd"
                            type="date"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="offerDescription"
                    ></textarea>

                </div>


                <div>

                    <label>
                        <input
                            type="checkbox"
                            id="offerActive"
                            checked
                        >
                        Active
                    </label>

                </div>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        Save Offer
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelOffer"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;


    document
        .getElementById(
            "cancelOffer"
        )
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );


    document
        .getElementById(
            "offerForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const payload = {

                    name:
                        document
                            .getElementById(
                                "offerName"
                            )
                            .value
                            .trim(),

                    description:
                        document
                            .getElementById(
                                "offerDescription"
                            )
                            .value
                            .trim(),

                    original_price:
                        document
                            .getElementById(
                                "offerOriginalPrice"
                            )
                            .value === ""
                        ? null
                        : Number(
                            document
                                .getElementById(
                                    "offerOriginalPrice"
                                )
                                .value
                        ),

                    offer_price:
                        document
                            .getElementById(
                                "offerPrice"
                            )
                            .value === ""
                        ? null
                        : Number(
                            document
                                .getElementById(
                                    "offerPrice"
                                )
                                .value
                        ),

                    start_date:
                        document
                            .getElementById(
                                "offerStart"
                            )
                            .value || null,

                    end_date:
                        document
                            .getElementById(
                                "offerEnd"
                            )
                            .value || null,

                    image_url:
                        document
                            .getElementById(
                                "offerImage"
                            )
                            .value
                            .trim() || null,

                    active:
                        document
                            .getElementById(
                                "offerActive"
                            )
                            .checked

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from("offers")
                        .insert(
                            payload
                        );


                if (error) {

                    console.error(
                        "Offer save error:",
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Offer saved successfully."
                );

                await loadOffers();

            }
        );
}


/* ============================================================
   GALLERY HELPERS
   ============================================================ */

async function loadGallery() {

    await loadImageGallery(
        "gallery",
        "Our Work Gallery",
        "gallery"
    );
}


async function loadBrideGallery() {

    await loadImageGallery(
        "bride_gallery",
        "Bride / Girls Gallery",
        "bride-gallery"
    );
}


async function loadCustomerGallery() {

    await loadImageGallery(
        "customer_gallery",
        "Customer Gallery",
        "customer-gallery"
    );
}


async function loadImageGallery(
    table,
    title,
    bucket
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(table)
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            title,
            error
        );

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p>
                        Upload and manage images.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="uploadImageBtn"
                >
                    + Upload Image
                </button>

            </div>


            <div id="imageUploadArea"></div>


            ${
                data?.length
                ? galleryTable(
                    data,
                    table
                )
                : emptyState(
                    "No images uploaded yet."
                )
            }

        </div>
    `;


    document
        .getElementById(
            "uploadImageBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showImageUploadForm(
                    table,
                    bucket
                );

            }
        );


    attachDeleteButtons();
}


function galleryTable(
    data,
    table
) {

    return `

        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Created</th>
                        <th>Delete</th>
                    </tr>

                </thead>

                <tbody>

                    ${data.map(item => `

                        <tr>

                            <td>

                                ${
                                    item.image_url
                                    ? `
                                        <img
                                            src="${escapeAttribute(
                                                item.image_url
                                            )}"
                                            style="
                                                width:80px;
                                                height:80px;
                                                object-fit:cover;
                                                border-radius:8px;
                                            "
                                        >
                                    `
                                    : "—"
                                }

                            </td>

                            <td>
                                ${escapeHTML(
                                    item.title ||
                                    item.name ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.description ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    item.created_at
                                )}
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    data-delete-table="${table}"
                                    data-delete-id="${item.id}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


function showImageUploadForm(
    table,
    bucket
) {

    const area =
        document.getElementById(
            "imageUploadArea"
        );

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            style="
                padding:20px;
                border:1px solid #ddd5ca;
                background:#faf8f4;
                border-radius:12px;
                margin-bottom:20px;
            "
        >

            <form
                id="imageUploadForm"
            >

                <div class="form-row">

                    <div>

                        <label>
                            Title
                        </label>

                        <input
                            id="galleryTitle"
                        >

                    </div>


                    <div>

                        <label>
                            Image
                        </label>

                        <input
                            type="file"
                            id="galleryFile"
                            accept="image/jpeg,image/png,image/webp"
                            required
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="galleryDescription"
                    ></textarea>

                </div>


                <div class="form-actions">

                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        Upload
                    </button>

                    <button
                        class="secondary-btn"
                        type="button"
                        id="cancelGalleryUpload"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;


    document
        .getElementById(
            "cancelGalleryUpload"
        )
        ?.addEventListener(
            "click",
            () => {

                area.innerHTML = "";

            }
        );


    document
        .getElementById(
            "imageUploadForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const file =
                    document
                        .getElementById(
                            "galleryFile"
                        )
                        .files[0];

                if (!file) {
                    return;
                }

                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    showMessage(
                        "Image must be under 10 MB.",
                        "error"
                    );

                    return;
                }


                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const filename =
                    `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}.${extension}`;


                const path =
                    filename;


                const {
                    error:
                        uploadError
                } =
                    await supabaseClient
                        .storage
                        .from(bucket)
                        .upload(
                            path,
                            file,
                            {
                                upsert: false,
                                contentType:
                                    file.type
                            }
                        );


                if (uploadError) {

                    console.error(
                        uploadError
                    );

                    showMessage(
                        uploadError.message,
                        "error"
                    );

                    return;
                }


                const {
                    data:
                        publicData
                } =
                    supabaseClient
                        .storage
                        .from(bucket)
                        .getPublicUrl(
                            path
                        );


                const imageUrl =
                    publicData.publicUrl;


                /*
                   IMPORTANT:
                   customer_gallery previously had a
                   missing category column, so this generic
                   uploader does NOT send category.
                */

                const payload = {

                    image_url:
                        imageUrl,

                    title:
                        document
                            .getElementById(
                                "galleryTitle"
                            )
                            .value
                            .trim(),

                    description:
                        document
                            .getElementById(
                                "galleryDescription"
                            )
                            .value
                            .trim()

                };


                const {
                    error:
                        insertError
                } =
                    await supabaseClient
                        .from(table)
                        .insert(
                            payload
                        );


                if (insertError) {

                    console.error(
                        insertError
                    );

                    showMessage(
                        insertError.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Image uploaded successfully."
                );


                if (
                    table === "gallery"
                ) {
                    await loadGallery();

                } else if (
                    table === "bride_gallery"
                ) {
                    await loadBrideGallery();

                } else {
                    await loadCustomerGallery();
                }

            }
        );
}


/* ============================================================
   BEFORE / AFTER
   ============================================================ */

async function loadBeforeAfter() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("before_after")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            "Before / After",
            error
        );

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Before / After
                    </h2>

                    <p>
                        Manage transformation images.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addBeforeAfterBtn"
                >
                    + Add Transformation
                </button>

            </div>


            <div id="beforeAfterFormArea"></div>


            ${
                data?.length
                ? simpleRecordTable(
                    data,
                    "before_after"
                )
                : emptyState(
                    "No before / after records yet."
                )
            }

        </div>
    `;


    document
        .getElementById(
            "addBeforeAfterBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showBeforeAfterForm();

            }
        );


    attachDeleteButtons();
}


function showBeforeAfterForm() {

    const area =
        document.getElementById(
            "beforeAfterFormArea"
        );

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            style="
                background:#faf8f4;
                border:1px solid #ddd5ca;
                padding:20px;
                border-radius:12px;
                margin-bottom:20px;
            "
        >

            <form id="beforeAfterForm">

                <div class="form-row">

                    <div>

                        <label>
                            Title
                        </label>

                        <input
                            id="beforeAfterTitle"
                        >

                    </div>


                    <div>

                        <label>
                            Before Image URL
                        </label>

                        <input
                            id="beforeImage"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        After Image URL
                    </label>

                    <input
                        id="afterImage"
                    >

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="beforeAfterDescription"
                    ></textarea>

                </div>


                <button
                    class="primary-btn"
                    type="submit"
                >
                    Save
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "beforeAfterForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const payload = {

                    title:
                        document
                            .getElementById(
                                "beforeAfterTitle"
                            )
                            .value
                            .trim(),

                    before_image_url:
                        document
                            .getElementById(
                                "beforeImage"
                            )
                            .value
                            .trim(),

                    after_image_url:
                        document
                            .getElementById(
                                "afterImage"
                            )
                            .value
                            .trim(),

                    description:
                        document
                            .getElementById(
                                "beforeAfterDescription"
                            )
                            .value
                            .trim()

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "before_after"
                        )
                        .insert(
                            payload
                        );


                if (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Before / After saved."
                );

                await loadBeforeAfter();

            }
        );
}


/* ============================================================
   BRIDAL PACKAGES
   ============================================================ */

async function loadBridalPackages() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "bridal_packages"
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            "Bridal Packages",
            error
        );

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Bridal Packages
                    </h2>

                    <p>
                        Manage bridal packages.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addBridalPackageBtn"
                >
                    + Add Package
                </button>

            </div>


            <div id="bridalPackageFormArea"></div>


            ${
                data?.length
                ? simpleRecordTable(
                    data,
                    "bridal_packages"
                )
                : emptyState(
                    "No bridal packages added yet."
                )
            }

        </div>
    `;


    document
        .getElementById(
            "addBridalPackageBtn"
        )
        ?.addEventListener(
            "click",
            showBridalPackageForm
        );


    attachDeleteButtons();
}


function showBridalPackageForm() {

    const area =
        document.getElementById(
            "bridalPackageFormArea"
        );

    if (!area) {
        return;
    }

    area.innerHTML = `

        <div
            style="
                background:#faf8f4;
                border:1px solid #ddd5ca;
                padding:20px;
                border-radius:12px;
                margin-bottom:20px;
            "
        >

            <form id="bridalPackageForm">

                <div class="form-row">

                    <div>

                        <label>
                            Package Name
                        </label>

                        <input
                            id="bridalPackageName"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Price
                        </label>

                        <input
                            id="bridalPackagePrice"
                            type="number"
                            step="0.01"
                        >

                    </div>

                </div>


                <div>

                    <label>
                        Description
                    </label>

                    <textarea
                        id="bridalPackageDescription"
                    ></textarea>

                </div>


                <button
                    class="primary-btn"
                    type="submit"
                >
                    Save Package
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "bridalPackageForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const payload = {

                    name:
                        document
                            .getElementById(
                                "bridalPackageName"
                            )
                            .value
                            .trim(),

                    price:
                        document
                            .getElementById(
                                "bridalPackagePrice"
                            )
                            .value === ""
                        ? null
                        : Number(
                            document
                                .getElementById(
                                    "bridalPackagePrice"
                                )
                                .value
                        ),

                    description:
                        document
                            .getElementById(
                                "bridalPackageDescription"
                            )
                            .value
                            .trim()

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "bridal_packages"
                        )
                        .insert(
                            payload
                        );


                if (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Bridal package saved."
                );

                await loadBridalPackages();

            }
        );
}


/* ============================================================
   TEAM
   ============================================================ */

async function loadTeam() {

    await loadSimpleManagementTable(
        "team",
        "Team",
        "Add team members and artists."
    );
}


/* ============================================================
   TESTIMONIALS
   ============================================================ */

async function loadTestimonials() {

    await loadSimpleManagementTable(
        "testimonials",
        "Testimonials",
        "Manage customer testimonials."
    );
}


/* ============================================================
   GENERIC TEAM / TESTIMONIAL MANAGEMENT
   ============================================================ */

async function loadSimpleManagementTable(
    table,
    title,
    description
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(table)
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            title,
            error
        );

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p>
                        ${escapeHTML(description)}
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addSimpleBtn"
                >
                    + Add
                </button>

            </div>


            <div id="simpleFormArea"></div>


            ${
                data?.length
                ? simpleRecordTable(
                    data,
                    table
                )
                : emptyState(
                    `No ${title.toLowerCase()} added yet.`
                )
            }

        </div>
    `;


    document
        .getElementById(
            "addSimpleBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showSimpleForm(
                    table
                );

            }
        );


    attachDeleteButtons();
}


function simpleRecordTable(
    data,
    table
) {

    if (!data?.length) {
        return emptyState(
            "No records found."
        );
    }

    const keys =
        Object.keys(
            data[0]
        )
        .filter(
            key =>
                ![
                    "id",
                    "created_at",
                    "updated_at"
                ].includes(key)
        )
        .slice(0, 5);


    return `

        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>

                        ${keys.map(
                            key => `
                                <th>
                                    ${escapeHTML(
                                        key
                                    )}
                                </th>
                            `
                        ).join("")}

                        <th>
                            Delete
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${data.map(
                        item => `

                            <tr>

                                ${keys.map(
                                    key => `

                                        <td>
                                            ${escapeHTML(
                                                item[key] ??
                                                "—"
                                            )}
                                        </td>

                                    `
                                ).join("")}

                                <td>

                                    <button
                                        class="danger-btn"
                                        data-delete-table="${table}"
                                        data-delete-id="${item.id}"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

        </div>
    `;
}


function showSimpleForm(
    table
) {

    const area =
        document.getElementById(
            "simpleFormArea"
        );

    if (!area) {
        return;
    }


    if (table === "team") {

        area.innerHTML = `

            <div
                style="
                    background:#faf8f4;
                    padding:20px;
                    border:1px solid #ddd5ca;
                    border-radius:12px;
                    margin-bottom:20px;
                "
            >

                <form id="simpleForm">

                    <div class="form-row">

                        <div>

                            <label>
                                Name
                            </label>

                            <input
                                id="simpleName"
                                required
                            >

                        </div>


                        <div>

                            <label>
                                Role
                            </label>

                            <input
                                id="simpleRole"
                            >

                        </div>

                    </div>


                    <div>

                        <label>
                            Description
                        </label>

                        <textarea
                            id="simpleDescription"
                        ></textarea>

                    </div>


                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        Save
                    </button>

                </form>

            </div>
        `;


    } else {

        area.innerHTML = `

            <div
                style="
                    background:#faf8f4;
                    padding:20px;
                    border:1px solid #ddd5ca;
                    border-radius:12px;
                    margin-bottom:20px;
                "
            >

                <form id="simpleForm">

                    <div>

                        <label>
                            Customer Name
                        </label>

                        <input
                            id="simpleName"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Testimonial
                        </label>

                        <textarea
                            id="simpleDescription"
                            required
                        ></textarea>

                    </div>


                    <button
                        class="primary-btn"
                        type="submit"
                    >
                        Save
                    </button>

                </form>

            </div>
        `;
    }


    document
        .getElementById(
            "simpleForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                let payload;


                if (table === "team") {

                    payload = {

                        name:
                            document
                                .getElementById(
                                    "simpleName"
                                )
                                .value
                                .trim(),

                        role:
                            document
                                .getElementById(
                                    "simpleRole"
                                )
                                .value
                                .trim(),

                        description:
                            document
                                .getElementById(
                                    "simpleDescription"
                                )
                                .value
                                .trim()

                    };

                } else {

                    payload = {

                        name:
                            document
                                .getElementById(
                                    "simpleName"
                                )
                                .value
                                .trim(),

                        description:
                            document
                                .getElementById(
                                    "simpleDescription"
                                )
                                .value
                                .trim()

                    };
                }


                const {
                    error
                } =
                    await supabaseClient
                        .from(table)
                        .insert(
                            payload
                        );


                if (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Saved successfully."
                );


                if (table === "team") {

                    await loadTeam();

                } else {

                    await loadTestimonials();
                }

            }
        );
}


/* ============================================================
   FAQS
   ============================================================ */

async function loadFAQs() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("faqs")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        showDatabaseError(
            "FAQs",
            error
        );

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        FAQs
                    </h2>

                    <p>
                        Manage frequently asked questions.
                    </p>

                </div>

                <button
                    class="primary-btn"
                    id="addFaqBtn"
                >
                    + Add FAQ
                </button>

            </div>


            <div id="faqFormArea"></div>


            ${
                data?.length
                ? simpleRecordTable(
                    data,
                    "faqs"
                )
                : emptyState(
                    "No FAQs added yet."
                )
            }

        </div>
    `;


    document
        .getElementById(
            "addFaqBtn"
        )
        ?.addEventListener(
            "click",
            showFAQForm
        );


    attachDeleteButtons();
}


function showFAQForm() {

    const area =
        document.getElementById(
            "faqFormArea"
        );

    if (!area) {
        return;
    }


    area.innerHTML = `

        <div
            style="
                background:#faf8f4;
                padding:20px;
                border:1px solid #ddd5ca;
                border-radius:12px;
                margin-bottom:20px;
            "
        >

            <form id="faqForm">

                <div>

                    <label>
                        Question
                    </label>

                    <input
                        id="faqQuestion"
                        required
                    >

                </div>


                <div>

                    <label>
                        Answer
                    </label>

                    <textarea
                        id="faqAnswer"
                        required
                    ></textarea>

                </div>


                <button
                    class="primary-btn"
                    type="submit"
                >
                    Save FAQ
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "faqForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const payload = {

                    question:
                        document
                            .getElementById(
                                "faqQuestion"
                            )
                            .value
                            .trim(),

                    answer:
                        document
                            .getElementById(
                                "faqAnswer"
                            )
                            .value
                            .trim()

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from("faqs")
                        .insert(
                            payload
                        );


                if (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }


                showMessage(
                    "FAQ saved successfully."
                );

                await loadFAQs();

            }
        );
}


/* ============================================================
   SETTINGS
   VERIFIED SCHEMA:
   setting_key
   setting_value
   ============================================================ */

async function loadSettings() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("settings")
            .select(
                "id,setting_key,setting_value,updated_at"
            )
            .order(
                "setting_key",
                {
                    ascending: true
                }
            );

    if (error) {

        showDatabaseError(
            "Settings",
            error
        );

        return;
    }


    const settings = {};

    (data || []).forEach(
        item => {

            settings[
                item.setting_key
            ] =
                item.setting_value;

        }
    );


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-actions">

                <div>

                    <h2>
                        Settings
                    </h2>

                    <p>
                        Manage business contact information.
                    </p>

                </div>

            </div>


            <form id="settingsForm">

                <div class="form-row">

                    <div>

                        <label>
                            Business Name
                        </label>

                        <input
                            id="settingBusinessName"
                            value="${escapeAttribute(
                                settings.business_name ||
                                ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Artist Name
                        </label>

                        <input
                            id="settingArtist"
                            value="${escapeAttribute(
                                settings.artist_name ||
                                ""
                            )}"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Phone
                        </label>

                        <input
                            id="settingPhone"
                            value="${escapeAttribute(
                                settings.phone ||
                                ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            WhatsApp
                        </label>

                        <input
                            id="settingWhatsapp"
                            value="${escapeAttribute(
                                settings.whatsapp ||
                                ""
                            )}"
                        >

                    </div>

                </div>


                <div class="form-row">

                    <div>

                        <label>
                            Email
                        </label>

                        <input
                            id="settingEmail"
                            type="email"
                            value="${escapeAttribute(
                                settings.email ||
                                ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Address
                        </label>

                        <input
                            id="settingAddress"
                            value="${escapeAttribute(
                                settings.address ||
                                ""
                            )}"
                        >

                    </div>

                </div>


                <button
                    class="primary-btn"
                    type="submit"
                >
                    Save Settings
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "settingsForm"
        )
        ?.addEventListener(
            "submit",
            saveSettings
        );
}


async function saveSettings(
    event
) {

    event.preventDefault();


    const values = {

        business_name:
            document
                .getElementById(
                    "settingBusinessName"
                )
                .value
                .trim(),

        artist_name:
            document
                .getElementById(
                    "settingArtist"
                )
                .value
                .trim(),

        phone:
            document
                .getElementById(
                    "settingPhone"
                )
                .value
                .trim(),

        whatsapp:
            document
                .getElementById(
                    "settingWhatsapp"
                )
                .value
                .trim(),

        email:
            document
                .getElementById(
                    "settingEmail"
                )
                .value
                .trim(),

        address:
            document
                .getElementById(
                    "settingAddress"
                )
                .value
                .trim()

    };


    try {

        for (
            const [
                key,
                value
            ]
            of Object.entries(values)
        ) {

            const {
                data: existing
            } =
                await supabaseClient
                    .from("settings")
                    .select("id")
                    .eq(
                        "setting_key",
                        key
                    )
                    .maybeSingle();


            let result;


            if (existing?.id) {

                result =
                    await supabaseClient
                        .from("settings")
                        .update({
                            setting_value:
                                value,
                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                        .eq(
                            "id",
                            existing.id
                        );

            } else {

                result =
                    await supabaseClient
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


/* ============================================================
   DELETE
   ============================================================ */

function attachDeleteButtons() {

    if (!moduleContent) {
        return;
    }


    moduleContent
        .querySelectorAll(
            "[data-delete-table]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const table =
                        button.dataset
                            .deleteTable;

                    const id =
                        button.dataset
                            .deleteId;

                    await deleteRecord(
                        table,
                        id
                    );

                }
            );

        });
}


async function deleteRecord(
    table,
    id
) {

    if (!table || !id) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this item?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(table)
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Deleted successfully."
    );


    await openModule(
        currentModule
    );
}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function emptyState(
    message
) {

    return `

        <div class="empty-state">

            ${escapeHTML(message)}

        </div>
    `;
}


/* ============================================================
   DATABASE ERROR
   ============================================================ */

function showDatabaseError(
    moduleName,
    error
) {

    console.error(
        `${moduleName} database error:`,
        error
    );


    if (!moduleContent) {
        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <h2>
                ${escapeHTML(moduleName)}
            </h2>

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    background:#fee2e2;
                    color:#991b1b;
                    border-radius:10px;
                "
            >

                <strong>
                    Database error
                </strong>

                <p style="margin-top:8px;">
                    ${escapeHTML(
                        error?.message ||
                        "Unknown database error."
                    )}
                </p>

            </div>

        </div>
    `;
}


/* ============================================================
   AUTH STATE LISTENER
   ============================================================ */

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient
        .auth
        .onAuthStateChange(
            (
                event,
                session
            ) => {

                console.log(
                    "Auth state:",
                    event
                );


                currentUser =
                    session?.user ||
                    null;


                if (session) {

                    showAdmin();

                } else {

                    showLogin();
                }

            }
        );
}


/* ============================================================
   STARTUP
   ============================================================ */

async function startAdminPanel() {

    console.log(
        "Manju Admin Panel starting..."
    );


    const elementsReady =
        initializeAdminElements();


    if (!elementsReady) {

        console.error(
            "Required admin HTML elements are missing."
        );

        return;
    }


    const supabaseReady =
        initializeSupabase();


    if (!supabaseReady) {

        showMessage(
            "Supabase configuration could not be loaded.",
            "error"
        );

        return;
    }


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    }


    setupNavigation();


    setupAuthListener();


    await checkAuth();


    console.log(
        "Manju Admin Panel loaded."
    );
}


/* ============================================================
   DOM READY
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAdminPanel
    );

} else {

    startAdminPanel();
}


/* ============================================================
   END OF ADMIN.JS
   ============================================================ */
   
