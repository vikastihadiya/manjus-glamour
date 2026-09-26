/*
 * MANJU'S THE WORLD OF GLAMOUR
 * ADMIN PANEL
 * Matched with the current admin.html and verified Supabase schema.
 */

"use strict";

let currentUser = null;

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(message, type = "success") {
    const existing = $("adminMessage");

    if (existing) {
        existing.textContent = message;
        existing.className = `admin-message ${type}`;
        existing.style.display = "block";

        setTimeout(() => {
            existing.style.display = "none";
        }, 4000);

        return;
    }

    const el = document.createElement("div");
    el.id = "adminMessage";
    el.className = `admin-message ${type}`;
    el.textContent = message;

    document.body.appendChild(el);

    setTimeout(() => el.remove(), 4000);
}

function showLoading(text = "Loading...") {
    const content = $("moduleContent");

    if (content) {
        content.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${escapeHTML(text)}</p>
            </div>
        `;
    }
}

function showError(error, fallback = "Something went wrong.") {
    console.error(error);

    const message =
        error?.message ||
        error?.error_description ||
        fallback;

    const content = $("moduleContent");

    if (content) {
        content.innerHTML = `
            <div class="error-state">
                <h3>Unable to load this section</h3>
                <p>${escapeHTML(message)}</p>
                <button class="admin-btn" onclick="location.reload()">Reload</button>
            </div>
        `;
    }
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
        return "Price on enquiry";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return escapeHTML(value);
    }

    return `₹${number.toLocaleString("en-IN")}`;
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            console.error("supabaseClient not found.");
            showLogin();
            return;
        }

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(error);
            showLogin();
            return;
        }

        currentUser = session?.user || null;

        if (currentUser) {
            showAdmin();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error(error);
        showLogin();
    }
}

function showLogin() {
    const login = $("loginSection");
    const admin = $("adminPanel");

    if (login) {
        login.style.display = "";
    }

    if (admin) {
        admin.style.display = "none";
    }
}

function showAdmin() {
    const login = $("loginSection");
    const admin = $("adminPanel");

    if (login) {
        login.style.display = "none";
    }

    if (admin) {
        admin.style.display = "";
    }

    openModule("dashboard");
}

async function handleLogin(event) {
    event.preventDefault();

    const email = $("adminEmail")?.value.trim();
    const password = $("adminPassword")?.value;

    const message = $("loginMessage");

    if (!email || !password) {
        if (message) {
            message.textContent = "Enter your email and password.";
        }
        return;
    }

    if (message) {
        message.textContent = "Signing in...";
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        currentUser = data.user;

        if (message) {
            message.textContent = "";
        }

        showAdmin();

    } catch (error) {
        console.error(error);

        if (message) {
            message.textContent =
                error.message || "Login failed.";
        }
    }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error(error);
    }

    currentUser = null;
    showLogin();
}

/* =========================================================
   MODULE HEADER
========================================================= */

const moduleInfo = {

    dashboard: {
        title: "Dashboard",
        description: "Overview of your salon website."
    },

    appointments: {
        title: "Appointments",
        description: "Manage appointment requests."
    },

    services: {
        title: "Services",
        description: "Manage salon and beauty services."
    },

    offers: {
        title: "Offers",
        description: "Manage active offers and prices."
    },

    gallery: {
        title: "Gallery",
        description: "Manage your main work gallery."
    },

    bride_gallery: {
        title: "Bride & Girls",
        description: "Manage bridal and girls photos."
    },

    customer_gallery: {
        title: "Customers",
        description: "Manage customer photos and testimonials."
    },

    before_after: {
        title: "Before & After",
        description: "Manage transformation photos."
    },

    bridal_packages: {
        title: "Bridal Packages",
        description: "Manage bridal packages."
    },

    team: {
        title: "Team",
        description: "Manage team members."
    },

    testimonials: {
        title: "Testimonials",
        description: "Manage customer reviews."
    },

    faqs: {
        title: "FAQs",
        description: "Manage frequently asked questions."
    },

    settings: {
        title: "Settings",
        description: "Manage business information."
    }
};

function updateModuleHeader(moduleName) {
    const info = moduleInfo[moduleName] || {
        title: moduleName,
        description: ""
    };

    if ($("moduleTitle")) {
        $("moduleTitle").textContent = info.title;
    }

    if ($("moduleDescription")) {
        $("moduleDescription").textContent =
            info.description;
    }
}

/* =========================================================
   MODULE ROUTER
========================================================= */

async function openModule(moduleName) {

    if (!moduleName) {
        moduleName = "dashboard";
    }

    if (!currentUser) {
        return;
    }

    updateModuleHeader(moduleName);

    document
        .querySelectorAll("[data-module]")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.module === moduleName
            );
        });

    const loaders = {
        dashboard: loadDashboard,
        appointments: loadAppointments,
        services: loadServices,
        offers: loadOffers,
        gallery: loadGallery,
        bride_gallery: loadBrideGallery,
        customer_gallery: loadCustomerGallery,
        before_after: loadBeforeAfter,
        bridal_packages: loadBridalPackages,
        team: loadTeam,
        testimonials: loadTestimonials,
        faqs: loadFAQs,
        settings: loadSettings
    };

    const loader = loaders[moduleName];

    if (!loader) {
        showError(
            null,
            `Unknown admin module: ${moduleName}`
        );
        return;
    }

    try {
        await loader();
    } catch (error) {
        showError(error);
    }
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    showLoading("Loading dashboard...");

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

    const counts = {};

    for (const table of tables) {

        const { count, error } =
            await supabaseClient
                .from(table)
                .select("*", {
                    count: "exact",
                    head: true
                });

        if (error) {
            console.warn(
                `Unable to count ${table}:`,
                error.message
            );

            counts[table] = 0;
        } else {
            counts[table] = count || 0;
        }
    }

    const content = $("moduleContent");

    if (!content) {
        console.error("moduleContent not found.");
        return;
    }

    content.innerHTML = `

        <div class="dashboard-grid">

            <button class="dashboard-card"
                data-dashboard-module="appointments">
                <strong>${counts.appointments}</strong>
                <span>Appointments</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="services">
                <strong>${counts.services}</strong>
                <span>Services</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="offers">
                <strong>${counts.offers}</strong>
                <span>Offers</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="gallery">
                <strong>${counts.gallery}</strong>
                <span>Gallery Photos</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="bride_gallery">
                <strong>${counts.bride_gallery}</strong>
                <span>Bride & Girls</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="customer_gallery">
                <strong>${counts.customer_gallery}</strong>
                <span>Customers</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="before_after">
                <strong>${counts.before_after}</strong>
                <span>Before / After</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="bridal_packages">
                <strong>${counts.bridal_packages}</strong>
                <span>Bridal Packages</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="team">
                <strong>${counts.team}</strong>
                <span>Team</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="testimonials">
                <strong>${counts.testimonials}</strong>
                <span>Testimonials</span>
            </button>

            <button class="dashboard-card"
                data-dashboard-module="faqs">
                <strong>${counts.faqs}</strong>
                <span>FAQs</span>
            </button>

        </div>

        <div class="admin-form-card" style="margin-top:24px;">
            <h3>Admin account</h3>
            <p>
                ${escapeHTML(currentUser?.email || "")}
            </p>
            <p style="opacity:.7;">
                Supabase authentication is active.
            </p>
        </div>
    `;

    content
        .querySelectorAll("[data-dashboard-module]")
        .forEach(card => {
            card.addEventListener("click", () => {
                openModule(
                    card.dataset.dashboardModule
                );
            });
        });
}

/* =========================================================
   GENERIC TABLE UTILITIES
========================================================= */

function tableShell(headers, rows, emptyText = "No records found.") {

    if (!rows || rows.length === 0) {
        return `
            <div class="empty-state">
                <h3>${escapeHTML(emptyText)}</h3>
            </div>
        `;
    }

    return `
        <div class="admin-table-wrap">
            <table class="admin-table">

                <thead>
                    <tr>
                        ${headers.map(
                            h => `<th>${escapeHTML(h)}</th>`
                        ).join("")}
                    </tr>
                </thead>

                <tbody>
                    ${rows.join("")}
                </tbody>

            </table>
        </div>
    `;
}

async function deleteRecord(table, id, label = "this item") {

    if (!currentUser) {
        showMessage(
            "You are not authenticated.",
            "error"
        );
        return;
    }

    const confirmed = confirm(
        `Delete ${label}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {

        const { error } =
            await supabaseClient
                .from(table)
                .delete()
                .eq("id", id);

        if (error) {
            throw error;
        }

        showMessage("Deleted successfully.");

        const active =
            document.querySelector(
                "[data-module].active"
            );

        if (active) {
            await openModule(active.dataset.module);
        }

    } catch (error) {
        showMessage(
            error.message || "Delete failed.",
            "error"
        );
    }
}

/* =========================================================
   APPOINTMENTS
========================================================= */

async function loadAppointments() {

    showLoading("Loading appointments...");

    const { data, error } =
        await supabaseClient
            .from("appointments")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">
            <h3>Appointment requests</h3>
            <p>
                ${data?.length || 0} appointment request(s).
            </p>
        </div>

        ${tableShell(
            [
                "Customer",
                "Phone",
                "Date",
                "Time",
                "Status",
                "WhatsApp",
                "Created",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(item.customer_name)}
                        </strong>
                        ${
                            item.email
                            ? `<small>${escapeHTML(item.email)}</small>`
                            : ""
                        }
                    </td>

                    <td>
                        ${escapeHTML(item.phone)}
                    </td>

                    <td>
                        ${formatDate(item.appointment_date)}
                    </td>

                    <td>
                        ${escapeHTML(item.appointment_time || "—")}
                    </td>

                    <td>
                        <select
                            class="appointment-status"
                            data-id="${item.id}">
                            ${[
                                "New",
                                "Confirmed",
                                "Completed",
                                "Cancelled",
                                "No-show"
                            ].map(status => `
                                <option
                                    value="${status}"
                                    ${item.status === status ? "selected" : ""}>
                                    ${status}
                                </option>
                            `).join("")}
                        </select>
                    </td>

                    <td>
                        ${item.whatsapp_requested ? "Yes" : "No"}
                    </td>

                    <td>
                        ${formatDateTime(item.created_at)}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-appointment="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No appointment requests yet."
        )}
    `;

    content
        .querySelectorAll(".appointment-status")
        .forEach(select => {

            select.addEventListener("change", async () => {

                const id = select.dataset.id;
                const status = select.value;

                const { error } =
                    await supabaseClient
                        .from("appointments")
                        .update({
                            status,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", id);

                if (error) {
                    showMessage(
                        error.message,
                        "error"
                    );
                } else {
                    showMessage(
                        "Appointment status updated."
                    );
                }
            });
        });

    content
        .querySelectorAll("[data-delete-appointment]")
        .forEach(button => {

            button.addEventListener("click", () => {
                deleteRecord(
                    "appointments",
                    button.dataset.deleteAppointment,
                    "this appointment"
                );
            });
        });
}

/* =========================================================
   CATEGORIES
========================================================= */

async function getCategories() {

    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .eq("active", true)
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    return data || [];
}

/* =========================================================
   SERVICES
========================================================= */

async function loadServices() {

    showLoading("Loading services...");

    const categories = await getCategories();

    const { data, error } =
        await supabaseClient
            .from("services")
            .select(`
                *,
                categories (
                    name
                )
            `)
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add service</h3>

            <form id="serviceForm">

                <div class="form-grid">

                    <input
                        name="name"
                        required
                        placeholder="Service name">

                    <input
                        name="slug"
                        required
                        placeholder="Slug">

                    <select name="category_id">

                        <option value="">
                            Select category
                        </option>

                        ${categories.map(category => `
                            <option value="${category.id}">
                                ${escapeHTML(category.name)}
                            </option>
                        `).join("")}

                    </select>

                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="Price">

                    <input
                        name="price_label"
                        placeholder="Price label"
                        value="Price on enquiry">

                    <input
                        name="duration_minutes"
                        type="number"
                        placeholder="Duration in minutes">

                    <input
                        name="image_url"
                        placeholder="Image URL">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="active"
                        checked>
                    Active
                </label>

                <button class="admin-btn" type="submit">
                    Save service
                </button>

            </form>

        </div>

        ${tableShell(
            [
                "Service",
                "Category",
                "Price",
                "Duration",
                "Status",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                        <small>
                            ${escapeHTML(item.slug)}
                        </small>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.categories?.name || "—"
                        )}
                    </td>

                    <td>
                        ${
                            item.price !== null
                            ? formatCurrency(item.price)
                            : escapeHTML(
                                item.price_label ||
                                "Price on enquiry"
                              )
                        }
                    </td>

                    <td>
                        ${
                            item.duration_minutes
                            ? `${item.duration_minutes} min`
                            : "—"
                        }
                    </td>

                    <td>
                        ${item.active ? "Active" : "Inactive"}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-service="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No services added yet."
        )}
    `;

    $("serviceForm").addEventListener(
        "submit",
        saveService
    );

    content
        .querySelectorAll("[data-delete-service]")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteRecord(
                    "services",
                    button.dataset.deleteService,
                    "this service"
                );

            });

        });
}

async function saveService(event) {

    event.preventDefault();

    const form = event.target;
    const fd = new FormData(form);

    const name = fd.get("name")?.trim();

    if (!name) {
        showMessage(
            "Service name is required.",
            "error"
        );
        return;
    }

    let slug = fd.get("slug")?.trim();

    if (!slug) {
        slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }

    const payload = {
        name,
        slug,
        category_id:
            fd.get("category_id") || null,
        description:
            fd.get("description")?.trim() || null,
        price:
            fd.get("price")
                ? Number(fd.get("price"))
                : null,
        price_label:
            fd.get("price_label")?.trim() ||
            "Price on enquiry",
        duration_minutes:
            fd.get("duration_minutes")
                ? Number(fd.get("duration_minutes"))
                : null,
        image_url:
            fd.get("image_url")?.trim() || null,
        featured:
            fd.get("featured") === "on",
        active:
            fd.get("active") === "on"
    };

    const { error } =
        await supabaseClient
            .from("services")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage("Service saved.");

    await loadServices();
}

/* =========================================================
   OFFERS
========================================================= */

async function loadOffers() {

    showLoading("Loading offers...");

    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add offer</h3>

            <form id="offerForm">

                <div class="form-grid">

                    <input
                        name="name"
                        required
                        placeholder="Offer name">

                    <input
                        name="original_price"
                        type="number"
                        step="0.01"
                        placeholder="Original price">

                    <input
                        name="offer_price"
                        type="number"
                        step="0.01"
                        placeholder="Offer price">

                    <input
                        name="discount_percent"
                        type="number"
                        step="0.01"
                        placeholder="Discount %">

                    <input
                        name="start_date"
                        type="date">

                    <input
                        name="end_date"
                        type="date">

                    <input
                        name="image_url"
                        placeholder="Image URL">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <textarea
                    name="included_services"
                    placeholder="Included services"></textarea>

                <textarea
                    name="terms"
                    placeholder="Terms"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="active"
                        checked>
                    Active
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <button class="admin-btn" type="submit">
                    Save offer
                </button>

            </form>

        </div>

        ${tableShell(
            [
                "Offer",
                "Prices",
                "Validity",
                "Status",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                    </td>

                    <td>
                        ${
                            item.original_price !== null
                            ? formatCurrency(
                                item.original_price
                              )
                            : "—"
                        }
                        →
                        ${
                            item.offer_price !== null
                            ? formatCurrency(
                                item.offer_price
                              )
                            : "—"
                        }
                    </td>

                    <td>
                        ${formatDate(
                            item.start_date ||
                            item.valid_from
                        )}
                        -
                        ${formatDate(
                            item.end_date ||
                            item.valid_until
                        )}
                    </td>

                    <td>
                        ${item.active ? "Active" : "Inactive"}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-offer="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No offers added yet."
        )}
    `;

    $("offerForm").addEventListener(
        "submit",
        saveOffer
    );

    content
        .querySelectorAll("[data-delete-offer]")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteRecord(
                    "offers",
                    button.dataset.deleteOffer,
                    "this offer"
                );

            });

        });
}

async function saveOffer(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const startDate =
        fd.get("start_date") || null;

    const endDate =
        fd.get("end_date") || null;

    const payload = {
        name:
            fd.get("name")?.trim(),
        description:
            fd.get("description")?.trim() || null,
        image_url:
            fd.get("image_url")?.trim() || null,
        original_price:
            fd.get("original_price")
                ? Number(fd.get("original_price"))
                : null,
        offer_price:
            fd.get("offer_price")
                ? Number(fd.get("offer_price"))
                : null,
        discount_percent:
            fd.get("discount_percent")
                ? Number(fd.get("discount_percent"))
                : null,
        valid_from: startDate,
        valid_until: endDate,
        start_date:
            startDate
            ? `${startDate}T00:00:00`
            : null,
        end_date:
            endDate
            ? `${endDate}T23:59:59`
            : null,
        included_services:
            fd.get("included_services")?.trim() ||
            null,
        terms:
            fd.get("terms")?.trim() ||
            null,
        active:
            fd.get("active") === "on",
        featured:
            fd.get("featured") === "on"
    };

    const { error } =
        await supabaseClient
            .from("offers")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage("Offer saved.");

    await loadOffers();
}

/* =========================================================
   GALLERY
========================================================= */

async function loadGallery() {

    showLoading("Loading gallery...");

    const { data, error } =
        await supabaseClient
            .from("gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add gallery image</h3>

            <form id="galleryForm">

                <div class="form-grid">

                    <input
                        name="title"
                        placeholder="Title">

                    <input
                        name="category"
                        placeholder="Category">

                    <input
                        name="image_url"
                        required
                        placeholder="Image URL">

                    <input
                        name="display_order"
                        type="number"
                        value="0"
                        placeholder="Display order">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked>
                    Visible
                </label>

                <button class="admin-btn" type="submit">
                    Save image
                </button>

            </form>

        </div>

        ${galleryCards(data)}
    `;

    $("galleryForm").addEventListener(
        "submit",
        saveGallery
    );

    bindDeleteButtons(
        "gallery",
        "gallery"
    );
}

function galleryCards(data) {

    if (!data || data.length === 0) {
        return `
            <div class="empty-state">
                No gallery images yet.
            </div>
        `;
    }

    return `
        <div class="gallery-admin-grid">

            ${data.map(item => `

                <article class="admin-image-card">

                    ${
                        item.image_url
                        ? `<img
                            src="${escapeHTML(item.image_url)}"
                            alt="${escapeHTML(item.title || "")}">
                          `
                        : ""
                    }

                    <div>
                        <strong>
                            ${escapeHTML(
                                item.title || "Untitled"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                item.category || ""
                            )}
                        </p>

                        <button
                            class="delete-btn"
                            data-delete-table="gallery"
                            data-delete-id="${item.id}">
                            Delete
                        </button>
                    </div>

                </article>

            `).join("")}

        </div>
    `;
}

async function saveGallery(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        title:
            fd.get("title")?.trim() || null,
        description:
            fd.get("description")?.trim() || null,
        image_url:
            fd.get("image_url")?.trim(),
        category:
            fd.get("category")?.trim() || null,
        featured:
            fd.get("featured") === "on",
        visible:
            fd.get("visible") === "on",
        display_order:
            Number(fd.get("display_order") || 0)
    };

    const { error } =
        await supabaseClient
            .from("gallery")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage("Gallery image saved.");

    await loadGallery();
}

/* =========================================================
   BRIDE GALLERY
========================================================= */

async function loadBrideGallery() {

    showLoading("Loading bride gallery...");

    const { data, error } =
        await supabaseClient
            .from("bride_gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add bride / girls photo</h3>

            <form id="brideForm">

                <div class="form-grid">

                    <input
                        name="title"
                        placeholder="Title">

                    <input
                        name="category"
                        placeholder="Category">

                    <input
                        name="image_url"
                        required
                        placeholder="Image URL">

                    <input
                        name="photo_date"
                        type="date">

                    <input
                        name="display_order"
                        type="number"
                        value="0">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked>
                    Visible
                </label>

                <button class="admin-btn" type="submit">
                    Save photo
                </button>

            </form>

        </div>

        ${imageGrid(
            data,
            "bride_gallery"
        )}
    `;

    $("brideForm").addEventListener(
        "submit",
        saveBrideGallery
    );

    bindDeleteButtons(
        "bride_gallery",
        "bride_gallery"
    );
}

async function saveBrideGallery(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        title:
            fd.get("title")?.trim() || null,
        description:
            fd.get("description")?.trim() || null,
        image_url:
            fd.get("image_url")?.trim(),
        category:
            fd.get("category")?.trim() || null,
        photo_date:
            fd.get("photo_date") || null,
        featured:
            fd.get("featured") === "on",
        visible:
            fd.get("visible") === "on",
        display_order:
            Number(fd.get("display_order") || 0)
    };

    const { error } =
        await supabaseClient
            .from("bride_gallery")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage("Bride photo saved.");

    await loadBrideGallery();
}

/* =========================================================
   CUSTOMER GALLERY
========================================================= */

async function loadCustomerGallery() {

    showLoading("Loading customer gallery...");

    const { data, error } =
        await supabaseClient
            .from("customer_gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add customer photo</h3>

            <form id="customerGalleryForm">

                <div class="form-grid">

                    <input
                        name="customer_name"
                        placeholder="Customer name">

                    <input
                        name="service"
                        placeholder="Service">

                    <input
                        name="photo_url"
                        required
                        placeholder="Photo URL">

                    <input
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        placeholder="Rating">

                    <input
                        name="photo_date"
                        type="date">

                    <input
                        name="display_order"
                        type="number"
                        value="0">

                </div>

                <textarea
                    name="testimonial"
                    placeholder="Customer testimonial"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="consent_given">
                    Customer consent given
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked>
                    Visible
                </label>

                <button class="admin-btn" type="submit">
                    Save customer photo
                </button>

            </form>

        </div>

        ${imageGrid(
            data,
            "customer_gallery"
        )}
    `;

    $("customerGalleryForm")
        .addEventListener(
            "submit",
            saveCustomerGallery
        );

    bindDeleteButtons(
        "customer_gallery",
        "customer_gallery"
    );
}

async function saveCustomerGallery(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        customer_name:
            fd.get("customer_name")?.trim() ||
            null,
        photo_url:
            fd.get("photo_url")?.trim(),
        service:
            fd.get("service")?.trim() ||
            null,
        testimonial:
            fd.get("testimonial")?.trim() ||
            null,
        rating:
            fd.get("rating")
                ? Number(fd.get("rating"))
                : null,
        photo_date:
            fd.get("photo_date") ||
            null,
        featured:
            fd.get("featured") === "on",
        visible:
            fd.get("visible") === "on",
        consent_given:
            fd.get("consent_given") === "on",
        display_order:
            Number(fd.get("display_order") || 0)
    };

    const { error } =
        await supabaseClient
            .from("customer_gallery")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage(
        "Customer photo saved."
    );

    await loadCustomerGallery();
}

/* =========================================================
   BEFORE / AFTER
========================================================= */

async function loadBeforeAfter() {

    showLoading(
        "Loading before and after..."
    );

    const { data, error } =
        await supabaseClient
            .from("before_after")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add transformation</h3>

            <form id="beforeAfterForm">

                <div class="form-grid">

                    <input
                        name="title"
                        placeholder="Title">

                    <input
                        name="category"
                        placeholder="Category">

                    <input
                        name="before_image_url"
                        required
                        placeholder="Before image URL">

                    <input
                        name="after_image_url"
                        required
                        placeholder="After image URL">

                    <input
                        name="display_order"
                        type="number"
                        value="0">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked>
                    Visible
                </label>

                <button class="admin-btn" type="submit">
                    Save transformation
                </button>

            </form>

        </div>

        ${beforeAfterGrid(data)}
    `;

    $("beforeAfterForm")
        .addEventListener(
            "submit",
            saveBeforeAfter
        );

    bindDeleteButtons(
        "before_after",
        "before_after"
    );
}

function beforeAfterGrid(data) {

    if (!data?.length) {
        return `
            <div class="empty-state">
                No before/after records yet.
            </div>
        `;
    }

    return `
        <div class="gallery-admin-grid">

            ${data.map(item => `

                <article class="admin-image-card">

                    <div style="
                        display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:8px;
                    ">

                        <img
                            src="${escapeHTML(
                                item.before_image_url
                            )}"
                            alt="Before">

                        <img
                            src="${escapeHTML(
                                item.after_image_url
                            )}"
                            alt="After">

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.title || "Transformation"
                            )}
                        </strong>

                        <button
                            class="delete-btn"
                            data-delete-table="before_after"
                            data-delete-id="${item.id}">
                            Delete
                        </button>

                    </div>

                </article>

            `).join("")}

        </div>
    `;
}

async function saveBeforeAfter(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        title:
            fd.get("title")?.trim() || null,
        description:
            fd.get("description")?.trim() || null,
        before_image_url:
            fd.get("before_image_url")?.trim(),
        after_image_url:
            fd.get("after_image_url")?.trim(),
        category:
            fd.get("category")?.trim() || null,
        featured:
            fd.get("featured") === "on",
        visible:
            fd.get("visible") === "on",
        display_order:
            Number(fd.get("display_order") || 0)
    };

    const { error } =
        await supabaseClient
            .from("before_after")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage(
        "Before/after saved."
    );

    await loadBeforeAfter();
}

/* =========================================================
   BRIDAL PACKAGES
========================================================= */

async function loadBridalPackages() {

    showLoading(
        "Loading bridal packages..."
    );

    const { data, error } =
        await supabaseClient
            .from("bridal_packages")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add bridal package</h3>

            <form id="bridalPackageForm">

                <div class="form-grid">

                    <input
                        name="name"
                        required
                        placeholder="Package name">

                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="Price">

                    <input
                        name="price_label"
                        value="Price on enquiry"
                        placeholder="Price label">

                    <input
                        name="duration"
                        placeholder="Duration">

                    <input
                        name="image_url"
                        placeholder="Image URL">

                    <input
                        name="display_order"
                        type="number"
                        value="0">

                </div>

                <textarea
                    name="description"
                    placeholder="Description"></textarea>

                <textarea
                    name="included_services"
                    placeholder="Included services"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="active"
                        checked>
                    Active
                </label>

                <button class="admin-btn" type="submit">
                    Save package
                </button>

            </form>

        </div>

        ${tableShell(
            [
                "Package",
                "Price",
                "Duration",
                "Status",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                    </td>

                    <td>
                        ${
                            item.price !== null
                            ? formatCurrency(item.price)
                            : escapeHTML(
                                item.price_label ||
                                "Price on enquiry"
                              )
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            item.duration || "—"
                        )}
                    </td>

                    <td>
                        ${item.active ? "Active" : "Inactive"}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-package="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No bridal packages yet."
        )}
    `;

    $("bridalPackageForm")
        .addEventListener(
            "submit",
            saveBridalPackage
        );

    content
        .querySelectorAll("[data-delete-package]")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteRecord(
                    "bridal_packages",
                    button.dataset.deletePackage,
                    "this bridal package"
                );

            });

        });
}

async function saveBridalPackage(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        name:
            fd.get("name")?.trim(),
        description:
            fd.get("description")?.trim() ||
            null,
        image_url:
            fd.get("image_url")?.trim() ||
            null,
        price:
            fd.get("price")
                ? Number(fd.get("price"))
                : null,
        price_label:
            fd.get("price_label")?.trim() ||
            "Price on enquiry",
        included_services:
            fd.get("included_services")?.trim() ||
            null,
        duration:
            fd.get("duration")?.trim() ||
            null,
        featured:
            fd.get("featured") === "on",
        active:
            fd.get("active") === "on",
        display_order:
            Number(fd.get("display_order") || 0)
    };

    const { error } =
        await supabaseClient
            .from("bridal_packages")
            .insert(payload);

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

/* =========================================================
   TEAM
========================================================= */

async function loadTeam() {

    showLoading("Loading team...");

    const { data, error } =
        await supabaseClient
            .from("team")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add team member</h3>

            <form id="teamForm">

                <div class="form-grid">

                    <input
                        name="name"
                        required
                        placeholder="Name">

                    <input
                        name="role"
                        placeholder="Role">

                    <input
                        name="image_url"
                        placeholder="Image URL">

                    <input
                        name="instagram_url"
                        placeholder="Instagram URL">

                    <input
                        name="display_order"
                        type="number"
                        value="0">

                </div>

                <textarea
                    name="bio"
                    placeholder="Bio"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="active"
                        checked>
                    Active
                </label>

                <button class="admin-btn" type="submit">
                    Save team member
                </button>

            </form>

        </div>

        ${imageGrid(
            data,
            "team"
        )}
    `;

    $("teamForm")
        .addEventListener(
            "submit",
            saveTeam
        );

    bindDeleteButtons(
        "team",
        "team"
    );
}

async function saveTeam(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        name:
            fd.get("name")?.trim(),
        role:
            fd.get("role")?.trim() ||
            null,
        bio:
            fd.get("bio")?.trim() ||
            null,
        image_url:
            fd.get("image_url")?.trim() ||
            null,
        instagram_url:
            fd.get("instagram_url")?.trim() ||
            null,
        display_order:
            Number(fd.get("display_order") || 0),
        active:
            fd.get("active") === "on"
    };

    const { error } =
        await supabaseClient
            .from("team")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage(
        "Team member saved."
    );

    await loadTeam();
}

/* =========================================================
   TESTIMONIALS
========================================================= */

async function loadTestimonials() {

    showLoading(
        "Loading testimonials..."
    );

    const { data, error } =
        await supabaseClient
            .from("testimonials")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add testimonial</h3>

            <form id="testimonialForm">

                <div class="form-grid">

                    <input
                        name="customer_name"
                        required
                        placeholder="Customer name">

                    <input
                        name="service"
                        placeholder="Service">

                    <input
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        placeholder="Rating">

                    <input
                        name="image_url"
                        placeholder="Image URL">

                </div>

                <textarea
                    name="testimonial"
                    required
                    placeholder="Testimonial"></textarea>

                <label>
                    <input
                        type="checkbox"
                        name="featured">
                    Featured
                </label>

                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked>
                    Visible
                </label>

                <button class="admin-btn" type="submit">
                    Save testimonial
                </button>

            </form>

        </div>

        ${tableShell(
            [
                "Customer",
                "Review",
                "Rating",
                "Service",
                "Status",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        ${escapeHTML(
                            item.customer_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.testimonial
                        )}
                    </td>

                    <td>
                        ${item.rating || "—"}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.service || "—"
                        )}
                    </td>

                    <td>
                        ${item.visible ? "Visible" : "Hidden"}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-testimonial="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No testimonials yet."
        )}
    `;

    $("testimonialForm")
        .addEventListener(
            "submit",
            saveTestimonial
        );

    content
        .querySelectorAll(
            "[data-delete-testimonial]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteRecord(
                        "testimonials",
                        button.dataset.deleteTestimonial,
                        "this testimonial"
                    );

                }
            );

        });
}

async function saveTestimonial(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        customer_name:
            fd.get("customer_name")?.trim(),
        testimonial:
            fd.get("testimonial")?.trim(),
        rating:
            fd.get("rating")
                ? Number(fd.get("rating"))
                : null,
        image_url:
            fd.get("image_url")?.trim() ||
            null,
        service:
            fd.get("service")?.trim() ||
            null,
        featured:
            fd.get("featured") === "on",
        visible:
            fd.get("visible") === "on"
    };

    const { error } =
        await supabaseClient
            .from("testimonials")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage(
        "Testimonial saved."
    );

    await loadTestimonials();
}

/* =========================================================
   FAQ
========================================================= */

async function loadFAQs() {

    showLoading("Loading FAQs...");

    const { data, error } =
        await supabaseClient
            .from("faqs")
            .select("*")
            .order("display_order", {
                ascending: true
            });

    if (error) throw error;

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Add FAQ</h3>

            <form id="faqForm">

                <input
                    name="question"
                    required
                    placeholder="Question">

                <textarea
                    name="answer"
                    required
                    placeholder="Answer"></textarea>

                <input
                    name="display_order"
                    type="number"
                    value="0">

                <label>
                    <input
                        type="checkbox"
                        name="active"
                        checked>
                    Active
                </label>

                <button class="admin-btn" type="submit">
                    Save FAQ
                </button>

            </form>

        </div>

        ${tableShell(
            [
                "Question",
                "Answer",
                "Status",
                "Action"
            ],
            (data || []).map(item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.question
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.answer
                        )}
                    </td>

                    <td>
                        ${item.active ? "Active" : "Inactive"}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-delete-faq="${item.id}">
                            Delete
                        </button>
                    </td>

                </tr>

            `),
            "No FAQs yet."
        )}
    `;

    $("faqForm")
        .addEventListener(
            "submit",
            saveFAQ
        );

    content
        .querySelectorAll("[data-delete-faq]")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteRecord(
                    "faqs",
                    button.dataset.deleteFaq,
                    "this FAQ"
                );

            });

        });
}

async function saveFAQ(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const payload = {
        question:
            fd.get("question")?.trim(),
        answer:
            fd.get("answer")?.trim(),
        display_order:
            Number(fd.get("display_order") || 0),
        active:
            fd.get("active") === "on"
    };

    const { error } =
        await supabaseClient
            .from("faqs")
            .insert(payload);

    if (error) {
        showMessage(
            error.message,
            "error"
        );
        return;
    }

    showMessage("FAQ saved.");

    await loadFAQs();
}

/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

    showLoading("Loading settings...");

    const { data, error } =
        await supabaseClient
            .from("settings")
            .select("*")
            .order("setting_key");

    if (error) throw error;

    const settings = {};

    (data || []).forEach(item => {
        settings[item.setting_key] =
            item.setting_value || "";
    });

    const content = $("moduleContent");

    content.innerHTML = `

        <div class="admin-form-card">

            <h3>Business information</h3>

            <form id="settingsForm">

                <div class="form-grid">

                    <input
                        name="business_name"
                        value="${escapeHTML(
                            settings.business_name || ""
                        )}"
                        placeholder="Business name">

                    <input
                        name="artist_name"
                        value="${escapeHTML(
                            settings.artist_name || ""
                        )}"
                        placeholder="Artist name">

                    <input
                        name="phone"
                        value="${escapeHTML(
                            settings.phone || ""
                        )}"
                        placeholder="Phone">

                    <input
                        name="whatsapp"
                        value="${escapeHTML(
                            settings.whatsapp || ""
                        )}"
                        placeholder="WhatsApp">

                    <input
                        name="email"
                        value="${escapeHTML(
                            settings.email || ""
                        )}"
                        placeholder="Email">

                </div>

                <textarea
                    name="address"
                    placeholder="Address">${escapeHTML(
                        settings.address || ""
                    )}</textarea>

                <button
                    class="admin-btn"
                    type="submit">
                    Save settings
                </button>

            </form>

        </div>
    `;

    $("settingsForm")
        .addEventListener(
            "submit",
            saveSettings
        );
}

async function saveSettings(event) {

    event.preventDefault();

    const fd =
        new FormData(event.target);

    const values = {
        business_name:
            fd.get("business_name")?.trim() || "",
        artist_name:
            fd.get("artist_name")?.trim() || "",
        phone:
            fd.get("phone")?.trim() || "",
        whatsapp:
            fd.get("whatsapp")?.trim() || "",
        email:
            fd.get("email")?.trim() || "",
        address:
            fd.get("address")?.trim() || ""
    };

    try {

        for (const [key, value] of Object.entries(values)) {

            const { data: existing, error: findError } =
                await supabaseClient
                    .from("settings")
                    .select("id")
                    .eq("setting_key", key)
                    .maybeSingle();

            if (findError) {
                throw findError;
            }

            if (existing?.id) {

                const { error } =
                    await supabaseClient
                        .from("settings")
                        .update({
                            setting_value: value,
                            updated_at:
                                new Date().toISOString()
                        })
                        .eq("id", existing.id);

                if (error) throw error;

            } else {

                const { error } =
                    await supabaseClient
                        .from("settings")
                        .insert({
                            setting_key: key,
                            setting_value: value
                        });

                if (error) throw error;
            }
        }

        showMessage(
            "Settings saved successfully."
        );

        await loadSettings();

    } catch (error) {

        showMessage(
            error.message ||
            "Unable to save settings.",
            "error"
        );
    }
}

/* =========================================================
   IMAGE GRID
========================================================= */

function imageGrid(data, table) {

    if (!data?.length) {
        return `
            <div class="empty-state">
                No records yet.
            </div>
        `;
    }

    const imageField =
        table === "customer_gallery"
        ? "photo_url"
        : "image_url";

    return `
        <div class="gallery-admin-grid">

            ${data.map(item => {

                const image =
                    item[imageField];

                const title =
                    item.title ||
                    item.customer_name ||
                    item.name ||
                    "Untitled";

                return `

                    <article class="admin-image-card">

                        ${
                            image
                            ? `<img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(title)}">
                              `
                            : ""
                        }

                        <div>

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            ${
                                item.role
                                ? `<p>${escapeHTML(item.role)}</p>`
                                : ""
                            }

                            ${
                                item.service
                                ? `<p>${escapeHTML(item.service)}</p>`
                                : ""
                            }

                            <button
                                class="delete-btn"
                                data-delete-table="${table}"
                                data-delete-id="${item.id}">
                                Delete
                            </button>

                        </div>

                    </article>

                `;
            }).join("")}

        </div>
    `;
}

/* =========================================================
   DELETE BINDING
========================================================= */

function bindDeleteButtons(table, prefix) {

    document
        .querySelectorAll(
            `[data-delete-table="${table}"]`
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteRecord(
                        table,
                        button.dataset.deleteId,
                        "this item"
                    );

                }
            );

        });
}

/* =========================================================
   GLOBAL EVENTS
========================================================= */

function setupAdminInterface() {

    const loginForm =
        $("loginForm");

    const logoutBtn =
        $("logoutBtn");

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

    /*
     * Sidebar navigation.
     *
     * This works with the current admin.html:
     * <button data-module="dashboard">
     */

    document
        .querySelectorAll("[data-module]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const module =
                        button.dataset.module;

                    openModule(module);
                }
            );

        });
}

/* =========================================================
   SUPABASE AUTH STATE
========================================================= */

function setupAuthListener() {

    if (!window.supabaseClient) {
        console.error(
            "supabaseClient is not available."
        );
        return;
    }

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            currentUser =
                session?.user || null;

            if (session) {
                showAdmin();
            } else {
                showLogin();
            }
        }
    );
}

/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Manju Admin Panel loaded"
        );

        if (!window.supabaseClient) {

            console.error(
                "supabaseClient is not available. Check supabase-config.js."
            );

            return;
        }

        setupAdminInterface();

        setupAuthListener();

        checkAuth();
    }
);
