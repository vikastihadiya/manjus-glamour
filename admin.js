/* ============================================================
   MANJU'S THE WORLD OF GLAMOUR
   SCHEMA-MATCHED SUPABASE ADMIN PANEL
   ============================================================ */

"use strict";

/* ============================================================
   GLOBAL STATE
============================================================ */

let currentUser = null;
let activeModule = "dashboard";
let moduleContent = null;

/* ============================================================
   SUPABASE CHECK
============================================================ */

if (typeof supabaseClient === "undefined") {
    console.error(
        "Supabase client not found. Make sure supabase-config.js loads before admin.js."
    );
}

/* ============================================================
   DOM HELPERS
============================================================ */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
    return escapeHTML(value);
}

function formatDate(value) {
    if (!value) return "—";

    try {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return value;
    }
}

function formatDateTime(value) {
    if (!value) return "—";

    try {
        return new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return value;
    }
}

function money(value) {
    if (value === null || value === undefined || value === "") {
        return "Price on enquiry";
    }

    return "₹" + Number(value).toLocaleString("en-IN");
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function showMessage(message, type = "success") {
    let box = $("adminMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "adminMessage";
        document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.position = "fixed";
    box.style.top = "20px";
    box.style.right = "20px";
    box.style.zIndex = "99999";
    box.style.padding = "14px 18px";
    box.style.borderRadius = "12px";
    box.style.maxWidth = "420px";
    box.style.fontSize = "14px";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,.15)";
    box.style.background =
        type === "error" ? "#fee2e2" : "#dcfce7";
    box.style.color =
        type === "error" ? "#991b1b" : "#166534";

    clearTimeout(window.__adminMessageTimer);

    window.__adminMessageTimer = setTimeout(() => {
        box.remove();
    }, 4500);
}

function showError(error) {
    console.error(error);
    showMessage(
        error?.message || String(error) || "Something went wrong.",
        "error"
    );
}

/* ============================================================
   AUTHENTICATION
============================================================ */

async function checkAuth() {
    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Auth session error:", error);
            showLogin();
            return;
        }

        if (session?.user) {
            currentUser = session.user;
            showAdmin();
        } else {
            currentUser = null;
            showLogin();
        }
    } catch (error) {
        console.error(error);
        showLogin();
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email =
        $("adminEmail")?.value.trim() ||
        $("email")?.value.trim();

    const password =
        $("adminPassword")?.value ||
        $("password")?.value;

    if (!email || !password) {
        showMessage("Enter your email and password.", "error");
        return;
    }

    const button =
        event.submitter ||
        $("loginButton") ||
        $("loginBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Signing in...";
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        currentUser = data.user;

        showMessage("Login successful.");
        showAdmin();

    } catch (error) {
        console.error("Login error:", error);
        showMessage(
            error.message || "Login failed.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        showLogin();
    } catch (error) {
        showError(error);
    }
}

function showLogin() {
    const loginSection = $("loginSection");
    const adminPanel = $("adminPanel");
    const adminApp = $("adminApp");

    if (loginSection) {
        loginSection.style.display = "";
    }

    if (adminPanel) {
        adminPanel.style.display = "none";
    }

    if (adminApp) {
        adminApp.style.display = "";
    }
}

function showAdmin() {
    const loginSection = $("loginSection");
    const adminPanel = $("adminPanel");
    const adminApp = $("adminApp");

    if (loginSection) {
        loginSection.style.display = "none";
    }

    if (adminPanel) {
        adminPanel.style.display = "";
    }

    if (adminApp) {
        adminApp.style.display = "";
    }

    setupAdminInterface();
}

/* ============================================================
   ADMIN INTERFACE
============================================================ */

function setupAdminInterface() {
    let panel = $("adminPanel");

    if (!panel) {
        console.error("adminPanel not found.");
        return;
    }

    /*
       We intentionally create our own management area.
       This prevents the old admin.html/admin.js mismatch
       from producing a blank page.
    */

    let manager = $("schemaMatchedAdmin");

    if (!manager) {
        manager = document.createElement("div");
        manager.id = "schemaMatchedAdmin";
        panel.appendChild(manager);
    }

    manager.innerHTML = `
        <div class="sm-admin">

            <div class="sm-admin-header">
                <div>
                    <h1>Manju's Admin</h1>
                    <p>Website Management Dashboard</p>
                </div>

                <div class="sm-admin-account">
                    <span>${escapeHTML(
                        currentUser?.email || ""
                    )}</span>

                    <button
                        type="button"
                        id="schemaLogoutBtn"
                        class="sm-btn sm-btn-danger"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div class="sm-admin-nav">

                ${adminNavButton(
                    "dashboard",
                    "⌂",
                    "Dashboard"
                )}

                ${adminNavButton(
                    "appointments",
                    "📅",
                    "Appointments"
                )}

                ${adminNavButton(
                    "categories",
                    "▦",
                    "Categories"
                )}

                ${adminNavButton(
                    "services",
                    "💄",
                    "Services"
                )}

                ${adminNavButton(
                    "offers",
                    "🎁",
                    "Offers"
                )}

                ${adminNavButton(
                    "gallery",
                    "🖼",
                    "Gallery"
                )}

                ${adminNavButton(
                    "bride_gallery",
                    "👰",
                    "Bride & Girls"
                )}

                ${adminNavButton(
                    "customer_gallery",
                    "👩",
                    "Customers"
                )}

                ${adminNavButton(
                    "before_after",
                    "✨",
                    "Before / After"
                )}

                ${adminNavButton(
                    "bridal_packages",
                    "💍",
                    "Bridal Packages"
                )}

                ${adminNavButton(
                    "team",
                    "👩‍🎨",
                    "Team"
                )}

                ${adminNavButton(
                    "testimonials",
                    "⭐",
                    "Reviews"
                )}

                ${adminNavButton(
                    "faqs",
                    "❓",
                    "FAQs"
                )}

                ${adminNavButton(
                    "settings",
                    "⚙",
                    "Settings"
                )}

            </div>

            <div id="moduleContent"></div>

        </div>
    `;

    moduleContent = $("moduleContent");

    addAdminStyles();

    $("schemaLogoutBtn")?.addEventListener(
        "click",
        handleLogout
    );

    document
        .querySelectorAll(".sm-module-btn")
        .forEach(button => {
            button.addEventListener("click", () => {
                openModule(button.dataset.module);
            });
        });

    openModule("dashboard");
}

function adminNavButton(id, icon, title) {
    return `
        <button
            type="button"
            class="sm-module-btn"
            data-module="${id}"
        >
            <span>${icon}</span>
            <strong>${title}</strong>
        </button>
    `;
}

/* ============================================================
   MODULE ROUTER
============================================================ */

async function openModule(module) {
    activeModule = module;

    moduleContent = $("moduleContent");

    if (!moduleContent) {
        console.error("moduleContent not found.");
        return;
    }

    document
        .querySelectorAll(".sm-module-btn")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.module === module
            );
        });

    moduleContent.innerHTML = `
        <div class="sm-loading">
            Loading ${escapeHTML(module)}...
        </div>
    `;

    try {
        switch (module) {

            case "dashboard":
                await loadDashboard();
                break;

            case "appointments":
                await loadAppointments();
                break;

            case "categories":
                await loadCategories();
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
        console.error("Module error:", error);

        moduleContent.innerHTML = `
            <div class="sm-error">
                <h3>Something went wrong</h3>
                <p>${escapeHTML(
                    error.message || "Unknown error"
                )}</p>
            </div>
        `;
    }
}

/* ============================================================
   MODULE HEADER
============================================================ */

function moduleHeader(title, description, buttonText = "") {
    return `
        <div class="sm-module-header">

            <div>
                <h2>${escapeHTML(title)}</h2>
                <p>${escapeHTML(description)}</p>
            </div>

            ${
                buttonText
                    ? `
                        <button
                            type="button"
                            class="sm-btn sm-btn-primary"
                            id="moduleAddBtn"
                        >
                            + ${escapeHTML(buttonText)}
                        </button>
                    `
                    : ""
            }

        </div>
    `;
}

function emptyState(text) {
    return `
        <div class="sm-empty">
            <div>○</div>
            <p>${escapeHTML(text)}</p>
        </div>
    `;
}

/* ============================================================
   DASHBOARD
============================================================ */

async function getCount(table, filter = null) {
    let query = supabaseClient
        .from(table)
        .select("*", {
            count: "exact",
            head: true
        });

    if (filter) {
        query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
        console.error(
            `Count error ${table}:`,
            error
        );
        return 0;
    }

    return count || 0;
}

async function loadDashboard() {
    const tables = [
        "appointments",
        "categories",
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

    await Promise.all(
        tables.map(async table => {
            counts[table] =
                await getCount(table);
        })
    );

    const pendingAppointments =
        await getCount(
            "appointments",
            query =>
                query.eq("status", "New")
        );

    const activeOffers =
        await getCount(
            "offers",
            query =>
                query
                    .eq("active", true)
                    .or(
                        "valid_until.is.null,valid_until.gte." +
                        new Date().toISOString().slice(0, 10)
                    )
        );

    moduleContent.innerHTML = `
        ${moduleHeader(
            "Dashboard",
            "Manage Manju's The World of Glamour."
        )}

        <div class="sm-stats-grid">

            ${dashboardStat(
                "📅",
                counts.appointments,
                "Appointments",
                "appointments"
            )}

            ${dashboardStat(
                "🆕",
                pendingAppointments,
                "New Requests",
                "appointments"
            )}

            ${dashboardStat(
                "💄",
                counts.services,
                "Services",
                "services"
            )}

            ${dashboardStat(
                "🎁",
                activeOffers,
                "Active Offers",
                "offers"
            )}

            ${dashboardStat(
                "🖼",
                counts.gallery,
                "Gallery",
                "gallery"
            )}

            ${dashboardStat(
                "👰",
                counts.bride_gallery,
                "Bride & Girls",
                "bride_gallery"
            )}

            ${dashboardStat(
                "👩",
                counts.customer_gallery,
                "Customers",
                "customer_gallery"
            )}

            ${dashboardStat(
                "✨",
                counts.before_after,
                "Before / After",
                "before_after"
            )}

            ${dashboardStat(
                "💍",
                counts.bridal_packages,
                "Bridal Packages",
                "bridal_packages"
            )}

            ${dashboardStat(
                "👩‍🎨",
                counts.team,
                "Team",
                "team"
            )}

            ${dashboardStat(
                "⭐",
                counts.testimonials,
                "Reviews",
                "testimonials"
            )}

            ${dashboardStat(
                "❓",
                counts.faqs,
                "FAQs",
                "faqs"
            )}

        </div>
    `;

    document
        .querySelectorAll("[data-dashboard-module]")
        .forEach(card => {
            card.addEventListener(
                "click",
                () => openModule(
                    card.dataset.dashboardModule
                )
            );
        });
}

function dashboardStat(
    icon,
    number,
    label,
    module
) {
    return `
        <button
            type="button"
            class="sm-stat"
            data-dashboard-module="${module}"
        >
            <span class="sm-stat-icon">${icon}</span>
            <strong>${number}</strong>
            <small>${escapeHTML(label)}</small>
        </button>
    `;
}

/* ============================================================
   APPOINTMENTS
   Actual schema:
   id
   service_id
   customer_name
   phone
   email
   appointment_date
   appointment_time
   message
   status
   whatsapp_requested
   privacy_consent
   created_at
   updated_at
============================================================ */

async function loadAppointments() {
    const { data, error } =
        await supabaseClient
            .from("appointments")
            .select(`
                *,
                services (
                    name
                )
            `)
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Appointments",
        "Manage customer appointment requests."
    );

    if (!data?.length) {
        html += emptyState(
            "No appointment requests yet."
        );
    } else {
        html += `
            <div class="sm-table-wrap">
                <table class="sm-table">

                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
        `;

        data.forEach(item => {
            html += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.customer_name
                            )}
                        </strong>

                        ${
                            item.email
                                ? `<small>${escapeHTML(
                                    item.email
                                )}</small>`
                                : ""
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            item.services?.name ||
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
                        <a
                            href="tel:${escapeAttr(
                                item.phone
                            )}"
                        >
                            ${escapeHTML(
                                item.phone
                            )}
                        </a>
                    </td>

                    <td>
                        <select
                            class="sm-status-select"
                            data-appointment-status="${item.id}"
                        >
                            ${[
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
                                .join("")}
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
                            class="sm-btn sm-btn-small"
                            data-appointment-view="${item.id}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="appointments"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>
                    </td>

                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    moduleContent.innerHTML = html;

    document
        .querySelectorAll(
            "[data-appointment-status]"
        )
        .forEach(select => {
            select.addEventListener(
                "change",
                async () => {
                    await updateAppointmentStatus(
                        select.dataset.appointmentStatus,
                        select.value
                    );
                }
            );
        });

    document
        .querySelectorAll(
            "[data-appointment-view]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const appointment =
                        data.find(
                            item =>
                                item.id ===
                                button.dataset
                                    .appointmentView
                        );

                    if (appointment) {
                        showAppointmentDetails(
                            appointment
                        );
                    }
                }
            );
        });

    attachDeleteButtons();
}

async function updateAppointmentStatus(
    id,
    status
) {
    const { error } =
        await supabaseClient
            .from("appointments")
            .update({
                status,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", id);

    if (error) {
        showError(error);
        return;
    }

    showMessage(
        "Appointment status updated."
    );
}

function showAppointmentDetails(item) {
    alert(
        [
            `Customer: ${item.customer_name}`,
            `Phone: ${item.phone}`,
            `Email: ${item.email || "—"}`,
            `Date: ${item.appointment_date || "—"}`,
            `Time: ${item.appointment_time || "—"}`,
            `Status: ${item.status || "New"}`,
            `WhatsApp requested: ${
                item.whatsapp_requested
                    ? "Yes"
                    : "No"
            }`,
            `Privacy consent: ${
                item.privacy_consent
                    ? "Yes"
                    : "No"
            }`,
            "",
            `Message: ${item.message || "—"}`
        ].join("\n")
    );
}

/* ============================================================
   CATEGORIES
   Actual schema:
   id
   name
   slug
   description
   image_url
   display_order
   active
   created_at
============================================================ */

async function loadCategories() {
    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("name", {
                ascending: true
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Service Categories",
        "Create the categories used by your services.",
        "Add Category"
    );

    html += `
        <div id="categoryFormArea"></div>

        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No categories created yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>
                        <h3>${escapeHTML(
                            item.name
                        )}</h3>

                        <p>
                            Slug:
                            ${escapeHTML(
                                item.slug
                            )}
                        </p>

                        ${
                            item.description
                                ? `<p>${escapeHTML(
                                    item.description
                                )}</p>`
                                : ""
                        }

                        <small>
                            ${
                                item.active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </small>
                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-category="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="categories"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showCategoryForm()
    );

    document
        .querySelectorAll("[data-edit-category]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editCategory
                        );

                    if (item) {
                        showCategoryForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showCategoryForm(item = null) {
    const area = $("categoryFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="categoryForm" class="sm-form">

            <h3>
                ${item ? "Edit Category" : "Add Category"}
            </h3>

            <input
                type="text"
                id="categoryName"
                placeholder="Category name"
                value="${escapeAttr(
                    item?.name || ""
                )}"
                required
            >

            <input
                type="text"
                id="categorySlug"
                placeholder="Slug"
                value="${escapeAttr(
                    item?.slug || ""
                )}"
                required
            >

            <textarea
                id="categoryDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="url"
                id="categoryImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="number"
                id="categoryOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="categoryActive"
                    ${
                        item?.active !== false
                            ? "checked"
                            : ""
                    }
                >
                Active
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Category
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelCategory"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    $("categoryName")?.addEventListener(
        "input",
        event => {
            const slug =
                $("categorySlug");

            if (
                slug &&
                !item
            ) {
                slug.value =
                    slugify(
                        event.target.value
                    );
            }
        }
    );

    $("cancelCategory")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("categoryForm")
        ?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const payload = {
                    name:
                        $("categoryName")
                            .value.trim(),

                    slug:
                        $("categorySlug")
                            .value.trim(),

                    description:
                        $("categoryDescription")
                            .value.trim() ||
                        null,

                    image_url:
                        $("categoryImage")
                            .value.trim() ||
                        null,

                    display_order:
                        Number(
                            $("categoryOrder")
                                .value || 0
                        ),

                    active:
                        $("categoryActive")
                            .checked
                };

                await saveRecord(
                    "categories",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   SERVICES
   Actual schema:
   category_id
   name
   slug
   description
   price
   price_label
   duration_minutes
   image_url
   featured
   active
   display_order
============================================================ */

async function loadServices() {
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
            })
            .order("name", {
                ascending: true
            });

    if (error) {
        showError(error);
        return;
    }

    const categories =
        await getCategories();

    let html = moduleHeader(
        "Services",
        "Manage salon services, categories, prices and durations.",
        "Add Service"
    );

    html += `
        <div id="serviceFormArea"></div>

        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No services added yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttr(
                                            item.image_url
                                        )}"
                                        class="sm-thumb"
                                        alt=""
                                    >
                                `
                                : ""
                        }

                        <div>
                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <p>
                                Category:
                                ${escapeHTML(
                                    item.categories
                                        ?.name ||
                                    "Uncategorised"
                                )}
                            </p>

                            <p>
                                ${
                                    item.price !==
                                        null &&
                                    item.price !==
                                        undefined
                                        ? money(
                                            item.price
                                        )
                                        : escapeHTML(
                                            item.price_label ||
                                            "Price on enquiry"
                                        )
                                }

                                ${
                                    item.duration_minutes
                                        ? ` • ${item.duration_minutes} min`
                                        : ""
                                }
                            </p>

                            <small>
                                ${
                                    item.active
                                        ? "Active"
                                        : "Inactive"
                                }

                                ${
                                    item.featured
                                        ? " • Featured"
                                        : ""
                                }
                            </small>
                        </div>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-service="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="services"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showServiceForm(null, categories)
    );

    document
        .querySelectorAll("[data-edit-service]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editService
                        );

                    if (item) {
                        showServiceForm(
                            item,
                            categories
                        );
                    }
                }
            );
        });

    attachDeleteButtons();
}

async function getCategories() {
    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .eq("active", true)
            .order("display_order", {
                ascending: true
            });

    if (error) {
        console.error(error);
        return [];
    }

    return data || [];
}

function showServiceForm(
    item = null,
    categories = []
) {
    const area = $("serviceFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="serviceForm" class="sm-form">

            <h3>
                ${item ? "Edit Service" : "Add Service"}
            </h3>

            <select id="serviceCategory">
                <option value="">
                    Select category
                </option>

                ${categories
                    .map(category => `
                        <option
                            value="${category.id}"
                            ${
                                item?.category_id ===
                                category.id
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHTML(
                                category.name
                            )}
                        </option>
                    `)
                    .join("")}
            </select>

            <input
                type="text"
                id="serviceName"
                placeholder="Service name"
                value="${escapeAttr(
                    item?.name || ""
                )}"
                required
            >

            <input
                type="text"
                id="serviceSlug"
                placeholder="Slug"
                value="${escapeAttr(
                    item?.slug || ""
                )}"
                required
            >

            <textarea
                id="serviceDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="number"
                step="0.01"
                id="servicePrice"
                placeholder="Price (optional)"
                value="${
                    item?.price ??
                    ""
                }"
            >

            <input
                type="text"
                id="servicePriceLabel"
                placeholder="Price label"
                value="${escapeAttr(
                    item?.price_label ||
                    "Price on enquiry"
                )}"
            >

            <input
                type="number"
                id="serviceDuration"
                placeholder="Duration in minutes"
                value="${
                    item?.duration_minutes ??
                    ""
                }"
            >

            <input
                type="url"
                id="serviceImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="serviceImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                id="serviceOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="serviceFeatured"
                    ${
                        item?.featured
                            ? "checked"
                            : ""
                    }
                >
                Featured
            </label>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="serviceActive"
                    ${
                        item?.active !== false
                            ? "checked"
                            : ""
                    }
                >
                Active
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Service
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelService"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    $("serviceName")
        ?.addEventListener(
            "input",
            event => {
                if (!item) {
                    $("serviceSlug").value =
                        slugify(
                            event.target.value
                        );
                }
            }
        );

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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("serviceImage")
                        .value.trim() ||
                    null;

                const file =
                    $("serviceImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "services"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                const rawPrice =
                    $("servicePrice")
                        .value.trim();

                const rawDuration =
                    $("serviceDuration")
                        .value.trim();

                const payload = {
                    category_id:
                        $("serviceCategory")
                            .value ||
                        null,

                    name:
                        $("serviceName")
                            .value.trim(),

                    slug:
                        $("serviceSlug")
                            .value.trim(),

                    description:
                        $("serviceDescription")
                            .value.trim() ||
                        null,

                    price:
                        rawPrice === ""
                            ? null
                            : Number(rawPrice),

                    price_label:
                        $("servicePriceLabel")
                            .value.trim() ||
                        "Price on enquiry",

                    duration_minutes:
                        rawDuration === ""
                            ? null
                            : Number(
                                rawDuration
                            ),

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

                await saveRecord(
                    "services",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   OFFERS
   Actual schema:
   name
   description
   image_url
   original_price
   offer_price
   discount_percent
   valid_from
   valid_until
   included_services
   terms
   active
   featured
   end_date
   start_date
============================================================ */

async function loadOffers() {
    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Offers",
        "Manage promotional offers, prices and validity.",
        "Add Offer"
    );

    html += `
        <div id="offerFormArea"></div>
        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No offers created yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttr(
                                            item.image_url
                                        )}"
                                        class="sm-thumb"
                                        alt=""
                                    >
                                `
                                : ""
                        }

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <p>
                                ${
                                    item.offer_price !==
                                        null &&
                                    item.offer_price !==
                                        undefined
                                        ? money(
                                            item.offer_price
                                        )
                                        : "Price on enquiry"
                                }

                                ${
                                    item.original_price !==
                                        null &&
                                    item.original_price !==
                                        undefined
                                        ? ` • Original ${money(
                                            item.original_price
                                        )}`
                                        : ""
                                }
                            </p>

                            <p>
                                ${
                                    item.discount_percent !==
                                        null &&
                                    item.discount_percent !==
                                        undefined
                                        ? `${item.discount_percent}% off`
                                        : ""
                                }
                            </p>

                            <small>
                                ${
                                    item.valid_from
                                        ? `From ${formatDate(
                                            item.valid_from
                                        )}`
                                        : ""
                                }

                                ${
                                    item.valid_until
                                        ? ` • Until ${formatDate(
                                            item.valid_until
                                        )}`
                                        : ""
                                }
                            </small>

                            <br>

                            <small>
                                ${
                                    item.active
                                        ? "Active"
                                        : "Inactive"
                                }

                                ${
                                    item.featured
                                        ? " • Featured"
                                        : ""
                                }
                            </small>

                        </div>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-offer="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="offers"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showOfferForm(null)
    );

    document
        .querySelectorAll("[data-edit-offer]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editOffer
                        );

                    if (item) {
                        showOfferForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showOfferForm(item = null) {
    const area = $("offerFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="offerForm" class="sm-form">

            <h3>
                ${item ? "Edit Offer" : "Add Offer"}
            </h3>

            <input
                type="text"
                id="offerName"
                placeholder="Offer name"
                value="${escapeAttr(
                    item?.name || ""
                )}"
                required
            >

            <textarea
                id="offerDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="url"
                id="offerImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="offerImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                step="0.01"
                id="offerOriginalPrice"
                placeholder="Original price"
                value="${
                    item?.original_price ??
                    ""
                }"
            >

            <input
                type="number"
                step="0.01"
                id="offerPrice"
                placeholder="Offer price"
                value="${
                    item?.offer_price ??
                    ""
                }"
            >

            <input
                type="number"
                step="0.01"
                id="offerDiscount"
                placeholder="Discount %"
                value="${
                    item?.discount_percent ??
                    ""
                }"
            >

            <label>
                Valid from
                <input
                    type="date"
                    id="offerValidFrom"
                    value="${escapeAttr(
                        item?.valid_from || ""
                    )}"
                >
            </label>

            <label>
                Valid until
                <input
                    type="date"
                    id="offerValidUntil"
                    value="${escapeAttr(
                        item?.valid_until || ""
                    )}"
                >
            </label>

            <textarea
                id="offerIncludedServices"
                placeholder="Included services"
            >${escapeHTML(
                item?.included_services || ""
            )}</textarea>

            <textarea
                id="offerTerms"
                placeholder="Terms and conditions"
            >${escapeHTML(
                item?.terms || ""
            )}</textarea>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="offerActive"
                    ${
                        item?.active !== false
                            ? "checked"
                            : ""
                    }
                >
                Active
            </label>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="offerFeatured"
                    ${
                        item?.featured
                            ? "checked"
                            : ""
                    }
                >
                Featured
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Offer
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelOffer"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("offerImage")
                        .value.trim() ||
                    null;

                const file =
                    $("offerImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "offers"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                const original =
                    $("offerOriginalPrice")
                        .value.trim();

                const offer =
                    $("offerPrice")
                        .value.trim();

                const discount =
                    $("offerDiscount")
                        .value.trim();

                const validFrom =
                    $("offerValidFrom")
                        .value ||
                    null;

                const validUntil =
                    $("offerValidUntil")
                        .value ||
                    null;

                const payload = {
                    name:
                        $("offerName")
                            .value.trim(),

                    description:
                        $("offerDescription")
                            .value.trim() ||
                        null,

                    image_url:
                        imageUrl,

                    original_price:
                        original === ""
                            ? null
                            : Number(original),

                    offer_price:
                        offer === ""
                            ? null
                            : Number(offer),

                    discount_percent:
                        discount === ""
                            ? null
                            : Number(discount),

                    valid_from:
                        validFrom,

                    valid_until:
                        validUntil,

                    included_services:
                        $("offerIncludedServices")
                            .value.trim() ||
                        null,

                    terms:
                        $("offerTerms")
                            .value.trim() ||
                        null,

                    active:
                        $("offerActive")
                            .checked,

                    featured:
                        $("offerFeatured")
                            .checked,

                    /*
                       Keep the timestamp fields synchronized
                       with the date fields.
                    */

                    start_date:
                        validFrom
                            ? `${validFrom}T00:00:00`
                            : null,

                    end_date:
                        validUntil
                            ? `${validUntil}T23:59:59`
                            : null,

                    updated_at:
                        new Date().toISOString()
                };

                await saveRecord(
                    "offers",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   GALLERY
   Actual schema:
   title
   description
   image_url
   category
   featured
   visible
   display_order
============================================================ */

async function loadGallery() {
    const { data, error } =
        await supabaseClient
            .from("gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Gallery",
        "Manage salon and portfolio images.",
        "Add Image"
    );

    html += `
        <div id="galleryFormArea"></div>

        <div class="sm-gallery-grid">
    `;

    if (!data?.length) {
        html += emptyState(
            "No gallery images yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-gallery-card">

                    <img
                        src="${escapeAttr(
                            item.image_url
                        )}"
                        alt="${escapeAttr(
                            item.title || ""
                        )}"
                    >

                    <div class="sm-gallery-info">

                        <h3>
                            ${escapeHTML(
                                item.title ||
                                "Untitled"
                            )}
                        </h3>

                        <small>
                            ${escapeHTML(
                                item.category ||
                                "General"
                            )}
                        </small>

                        <div class="sm-actions">

                            <button
                                type="button"
                                class="sm-btn sm-btn-small"
                                data-edit-gallery="${item.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="sm-btn sm-btn-small sm-btn-danger"
                                data-delete-table="gallery"
                                data-delete-id="${item.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showGalleryForm(null)
    );

    document
        .querySelectorAll("[data-edit-gallery]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editGallery
                        );

                    if (item) {
                        showGalleryForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showGalleryForm(item = null) {
    const area = $("galleryFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="galleryForm" class="sm-form">

            <h3>
                ${item ? "Edit Gallery Image" : "Add Gallery Image"}
            </h3>

            <input
                type="text"
                id="galleryTitle"
                placeholder="Title"
                value="${escapeAttr(
                    item?.title || ""
                )}"
            >

            <textarea
                id="galleryDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="text"
                id="galleryCategory"
                placeholder="Category"
                value="${escapeAttr(
                    item?.category || ""
                )}"
            >

            <input
                type="url"
                id="galleryImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="galleryImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                id="galleryOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
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

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="galleryVisible"
                    ${
                        item?.visible !== false
                            ? "checked"
                            : ""
                    }
                >
                Visible
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Image
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelGallery"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("galleryImage")
                        .value.trim() ||
                    null;

                const file =
                    $("galleryImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "gallery"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                if (!imageUrl) {
                    showMessage(
                        "Please provide an image.",
                        "error"
                    );
                    return;
                }

                const payload = {
                    title:
                        $("galleryTitle")
                            .value.trim() ||
                        null,

                    description:
                        $("galleryDescription")
                            .value.trim() ||
                        null,

                    image_url:
                        imageUrl,

                    category:
                        $("galleryCategory")
                            .value.trim() ||
                        null,

                    featured:
                        $("galleryFeatured")
                            .checked,

                    visible:
                        $("galleryVisible")
                            .checked,

                    display_order:
                        Number(
                            $("galleryOrder")
                                .value || 0
                        )
                };

                await saveRecord(
                    "gallery",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   BRIDE GALLERY
   Actual schema:
   title
   description
   image_url
   category
   photo_date
   featured
   visible
   display_order
============================================================ */

async function loadBrideGallery() {
    const { data, error } =
        await supabaseClient
            .from("bride_gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Bride & Girls Gallery",
        "Upload bridal, bride and girls photos.",
        "Add Photo"
    );

    html += `
        <div id="brideFormArea"></div>
        <div class="sm-gallery-grid">
    `;

    if (!data?.length) {
        html += emptyState(
            "No bride/girls photos yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-gallery-card">

                    <img
                        src="${escapeAttr(
                            item.image_url
                        )}"
                        alt="${escapeAttr(
                            item.title || ""
                        )}"
                    >

                    <div class="sm-gallery-info">

                        <h3>
                            ${escapeHTML(
                                item.title ||
                                "Untitled"
                            )}
                        </h3>

                        <small>
                            ${escapeHTML(
                                item.category ||
                                "Bride"
                            )}
                        </small>

                        ${
                            item.photo_date
                                ? `<small>
                                    ${formatDate(
                                        item.photo_date
                                    )}
                                </small>`
                                : ""
                        }

                        <div class="sm-actions">

                            <button
                                type="button"
                                class="sm-btn sm-btn-small"
                                data-edit-bride="${item.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="sm-btn sm-btn-small sm-btn-danger"
                                data-delete-table="bride_gallery"
                                data-delete-id="${item.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showBrideForm(null)
    );

    document
        .querySelectorAll("[data-edit-bride]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editBride
                        );

                    if (item) {
                        showBrideForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showBrideForm(item = null) {
    const area = $("brideFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="brideForm" class="sm-form">

            <h3>
                ${item ? "Edit Bride/Girls Photo" : "Add Bride/Girls Photo"}
            </h3>

            <input
                type="text"
                id="brideTitle"
                placeholder="Title"
                value="${escapeAttr(
                    item?.title || ""
                )}"
            >

            <textarea
                id="brideDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="text"
                id="brideCategory"
                placeholder="Category e.g. Bride, Girls"
                value="${escapeAttr(
                    item?.category || ""
                )}"
            >

            <input
                type="date"
                id="brideDate"
                value="${escapeAttr(
                    item?.photo_date || ""
                )}"
            >

            <input
                type="url"
                id="brideImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="brideImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                id="brideOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="brideFeatured"
                    ${
                        item?.featured
                            ? "checked"
                            : ""
                    }
                >
                Featured
            </label>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="brideVisible"
                    ${
                        item?.visible !== false
                            ? "checked"
                            : ""
                    }
                >
                Visible
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Photo
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelBride"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    $("cancelBride")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("brideForm")
        ?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("brideImage")
                        .value.trim() ||
                    null;

                const file =
                    $("brideImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "bride-gallery"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                if (!imageUrl) {
                    showMessage(
                        "Please provide an image.",
                        "error"
                    );
                    return;
                }

                const payload = {
                    title:
                        $("brideTitle")
                            .value.trim() ||
                        null,

                    description:
                        $("brideDescription")
                            .value.trim() ||
                        null,

                    image_url:
                        imageUrl,

                    category:
                        $("brideCategory")
                            .value.trim() ||
                        null,

                    photo_date:
                        $("brideDate")
                            .value ||
                        null,

                    featured:
                        $("brideFeatured")
                            .checked,

                    visible:
                        $("brideVisible")
                            .checked,

                    display_order:
                        Number(
                            $("brideOrder")
                                .value || 0
                        )
                };

                await saveRecord(
                    "bride_gallery",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   CUSTOMER GALLERY
   Actual schema:
   customer_name
   photo_url
   service
   testimonial
   rating
   photo_date
   featured
   visible
   consent_given
   display_order
============================================================ */

async function loadCustomerGallery() {
    const { data, error } =
        await supabaseClient
            .from("customer_gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Customer Gallery",
        "Manage customer photos and consent.",
        "Add Customer"
    );

    html += `
        <div id="customerFormArea"></div>
        <div class="sm-gallery-grid">
    `;

    if (!data?.length) {
        html += emptyState(
            "No customer photos yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-gallery-card">

                    <img
                        src="${escapeAttr(
                            item.photo_url
                        )}"
                        alt="${escapeAttr(
                            item.customer_name ||
                            "Customer"
                        )}"
                    >

                    <div class="sm-gallery-info">

                        <h3>
                            ${escapeHTML(
                                item.customer_name ||
                                "Customer"
                            )}
                        </h3>

                        ${
                            item.service
                                ? `<small>
                                    ${escapeHTML(
                                        item.service
                                    )}
                                </small>`
                                : ""
                        }

                        ${
                            item.rating
                                ? `<small>
                                    Rating: ${item.rating}/5
                                </small>`
                                : ""
                        }

                        <small>
                            Consent:
                            ${
                                item.consent_given
                                    ? "Yes"
                                    : "No"
                            }
                        </small>

                        <div class="sm-actions">

                            <button
                                type="button"
                                class="sm-btn sm-btn-small"
                                data-edit-customer="${item.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="sm-btn sm-btn-small sm-btn-danger"
                                data-delete-table="customer_gallery"
                                data-delete-id="${item.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showCustomerForm(null)
    );

    document
        .querySelectorAll(
            "[data-edit-customer]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editCustomer
                        );

                    if (item) {
                        showCustomerForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showCustomerForm(item = null) {
    const area = $("customerFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="customerForm" class="sm-form">

            <h3>
                ${item ? "Edit Customer" : "Add Customer"}
            </h3>

            <input
                type="text"
                id="customerName"
                placeholder="Customer name"
                value="${escapeAttr(
                    item?.customer_name || ""
                )}"
            >

            <input
                type="text"
                id="customerService"
                placeholder="Service"
                value="${escapeAttr(
                    item?.service || ""
                )}"
            >

            <textarea
                id="customerTestimonial"
                placeholder="Customer testimonial"
            >${escapeHTML(
                item?.testimonial || ""
            )}</textarea>

            <input
                type="number"
                min="1"
                max="5"
                id="customerRating"
                placeholder="Rating 1-5"
                value="${
                    item?.rating ??
                    ""
                }"
            >

            <input
                type="date"
                id="customerDate"
                value="${escapeAttr(
                    item?.photo_date || ""
                )}"
            >

            <input
                type="url"
                id="customerImage"
                placeholder="Photo URL"
                value="${escapeAttr(
                    item?.photo_url || ""
                )}"
            >

            <input
                type="file"
                id="customerImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                id="customerOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
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

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="customerVisible"
                    ${
                        item?.visible !== false
                            ? "checked"
                            : ""
                    }
                >
                Visible
            </label>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="customerConsent"
                    ${
                        item?.consent_given
                            ? "checked"
                            : ""
                    }
                >
                Customer consent received
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Customer
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelCustomer"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("customerImage")
                        .value.trim() ||
                    null;

                const file =
                    $("customerImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "customer-gallery"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                if (!imageUrl) {
                    showMessage(
                        "Please provide a customer photo.",
                        "error"
                    );
                    return;
                }

                const rating =
                    $("customerRating")
                        .value.trim();

                const payload = {
                    customer_name:
                        $("customerName")
                            .value.trim() ||
                        null,

                    photo_url:
                        imageUrl,

                    service:
                        $("customerService")
                            .value.trim() ||
                        null,

                    testimonial:
                        $("customerTestimonial")
                            .value.trim() ||
                        null,

                    rating:
                        rating === ""
                            ? null
                            : Number(rating),

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
                        Number(
                            $("customerOrder")
                                .value || 0
                        )
                };

                await saveRecord(
                    "customer_gallery",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   BEFORE / AFTER
   Actual schema:
   title
   description
   before_image_url
   after_image_url
   category
   featured
   visible
   display_order
============================================================ */

async function loadBeforeAfter() {
    const { data, error } =
        await supabaseClient
            .from("before_after")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Before / After",
        "Manage beauty transformation photos.",
        "Add Transformation"
    );

    html += `
        <div id="beforeAfterFormArea"></div>

        <div class="sm-before-grid">
    `;

    if (!data?.length) {
        html += emptyState(
            "No before/after transformations yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-before-card">

                    <div class="sm-before-images">

                        <div>
                            <small>Before</small>
                            <img
                                src="${escapeAttr(
                                    item.before_image_url
                                )}"
                                alt="Before"
                            >
                        </div>

                        <div>
                            <small>After</small>
                            <img
                                src="${escapeAttr(
                                    item.after_image_url
                                )}"
                                alt="After"
                            >
                        </div>

                    </div>

                    <h3>
                        ${escapeHTML(
                            item.title ||
                            "Transformation"
                        )}
                    </h3>

                    <small>
                        ${escapeHTML(
                            item.category ||
                            "General"
                        )}
                    </small>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-before-after="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="before_after"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showBeforeAfterForm(null)
    );

    document
        .querySelectorAll(
            "[data-edit-before-after]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editBeforeAfter
                        );

                    if (item) {
                        showBeforeAfterForm(
                            item
                        );
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showBeforeAfterForm(item = null) {
    const area =
        $("beforeAfterFormArea");

    if (!area) return;

    area.innerHTML = `
        <form
            id="beforeAfterForm"
            class="sm-form"
        >

            <h3>
                ${
                    item
                        ? "Edit Transformation"
                        : "Add Transformation"
                }
            </h3>

            <input
                type="text"
                id="beforeAfterTitle"
                placeholder="Title"
                value="${escapeAttr(
                    item?.title || ""
                )}"
            >

            <textarea
                id="beforeAfterDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="text"
                id="beforeAfterCategory"
                placeholder="Category"
                value="${escapeAttr(
                    item?.category || ""
                )}"
            >

            <label>
                Before image URL
                <input
                    type="url"
                    id="beforeImage"
                    value="${escapeAttr(
                        item?.before_image_url ||
                        ""
                    )}"
                >
            </label>

            <input
                type="file"
                id="beforeImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <label>
                After image URL
                <input
                    type="url"
                    id="afterImage"
                    value="${escapeAttr(
                        item?.after_image_url ||
                        ""
                    )}"
                >
            </label>

            <input
                type="file"
                id="afterImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                id="beforeAfterOrder"
                value="${item?.display_order ?? 0}"
                placeholder="Display order"
            >

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="beforeAfterFeatured"
                    ${
                        item?.featured
                            ? "checked"
                            : ""
                    }
                >
                Featured
            </label>

            <label class="sm-check">
                <input
                    type="checkbox"
                    id="beforeAfterVisible"
                    ${
                        item?.visible !== false
                            ? "checked"
                            : ""
                    }
                >
                Visible
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"}
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelBeforeAfter"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    $("cancelBeforeAfter")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("beforeAfterForm")
        ?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                let beforeUrl =
                    $("beforeImage")
                        .value.trim() ||
                    null;

                let afterUrl =
                    $("afterImage")
                        .value.trim() ||
                    null;

                const beforeFile =
                    $("beforeImageFile")
                        ?.files?.[0];

                const afterFile =
                    $("afterImageFile")
                        ?.files?.[0];

                try {
                    if (beforeFile) {
                        beforeUrl =
                            await uploadImage(
                                beforeFile,
                                "before-after"
                            );
                    }

                    if (afterFile) {
                        afterUrl =
                            await uploadImage(
                                afterFile,
                                "before-after"
                            );
                    }
                } catch (error) {
                    showError(error);
                    return;
                }

                if (!beforeUrl || !afterUrl) {
                    showMessage(
                        "Both before and after images are required.",
                        "error"
                    );
                    return;
                }

                const payload = {
                    title:
                        $("beforeAfterTitle")
                            .value.trim() ||
                        null,

                    description:
                        $("beforeAfterDescription")
                            .value.trim() ||
                        null,

                    before_image_url:
                        beforeUrl,

                    after_image_url:
                        afterUrl,

                    category:
                        $("beforeAfterCategory")
                            .value.trim() ||
                        null,

                    featured:
                        $("beforeAfterFeatured")
                            .checked,

                    visible:
                        $("beforeAfterVisible")
                            .checked,

                    display_order:
                        Number(
                            $("beforeAfterOrder")
                                .value || 0
                        )
                };

                await saveRecord(
                    "before_after",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   BRIDAL PACKAGES
   Actual schema:
   name
   description
   image_url
   price
   price_label
   included_services
   duration
   featured
   active
   display_order
============================================================ */

async function loadBridalPackages() {
    const { data, error } =
        await supabaseClient
            .from("bridal_packages")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Bridal Packages",
        "Manage bridal packages and pricing.",
        "Add Package"
    );

    html += `
        <div id="bridalPackageFormArea"></div>
        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No bridal packages yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttr(
                                            item.image_url
                                        )}"
                                        class="sm-thumb"
                                        alt=""
                                    >
                                `
                                : ""
                        }

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <p>
                                ${
                                    item.price !==
                                        null &&
                                    item.price !==
                                        undefined
                                        ? money(
                                            item.price
                                        )
                                        : escapeHTML(
                                            item.price_label ||
                                            "Price on enquiry"
                                        )
                                }
                            </p>

                            ${
                                item.duration
                                    ? `<small>
                                        ${escapeHTML(
                                            item.duration
                                        )}
                                    </small>`
                                    : ""
                            }

                            <br>

                            <small>
                                ${
                                    item.active
                                        ? "Active"
                                        : "Inactive"
                                }

                                ${
                                    item.featured
                                        ? " • Featured"
                                        : ""
                                }
                            </small>

                        </div>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-bridal="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="bridal_packages"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showBridalPackageForm(null)
    );

    document
        .querySelectorAll(
            "[data-edit-bridal]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editBridal
                        );

                    if (item) {
                        showBridalPackageForm(
                            item
                        );
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showBridalPackageForm(item = null) {
    const area =
        $("bridalPackageFormArea");

    if (!area) return;

    area.innerHTML = `
        <form
            id="bridalPackageForm"
            class="sm-form"
        >

            <h3>
                ${
                    item
                        ? "Edit Bridal Package"
                        : "Add Bridal Package"
                }
            </h3>

            <input
                type="text"
                id="bridalName"
                placeholder="Package name"
                value="${escapeAttr(
                    item?.name || ""
                )}"
                required
            >

            <textarea
                id="bridalDescription"
                placeholder="Description"
            >${escapeHTML(
                item?.description || ""
            )}</textarea>

            <input
                type="url"
                id="bridalImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="bridalImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="number"
                step="0.01"
                id="bridalPrice"
                placeholder="Price"
                value="${
                    item?.price ??
                    ""
                }"
            >

            <input
                type="text"
                id="bridalPriceLabel"
                placeholder="Price label"
                value="${escapeAttr(
                    item?.price_label ||
                    "Price on enquiry"
                )}"
            >

            <textarea
                id="bridalIncluded"
                placeholder="Included services"
            >${escapeHTML(
                item?.included_services ||
                ""
            )}</textarea>

            <input
                type="text"
                id="bridalDuration"
                placeholder="Duration e.g. 4 hours"
                value="${escapeAttr(
                    item?.duration || ""
                )}"
            >

            <input
                type="number"
                id="bridalOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
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

            <label class="sm-check">
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

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Package
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelBridal"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("bridalImage")
                        .value.trim() ||
                    null;

                const file =
                    $("bridalImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "gallery"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                const rawPrice =
                    $("bridalPrice")
                        .value.trim();

                const payload = {
                    name:
                        $("bridalName")
                            .value.trim(),

                    description:
                        $("bridalDescription")
                            .value.trim() ||
                        null,

                    image_url:
                        imageUrl,

                    price:
                        rawPrice === ""
                            ? null
                            : Number(rawPrice),

                    price_label:
                        $("bridalPriceLabel")
                            .value.trim() ||
                        "Price on enquiry",

                    included_services:
                        $("bridalIncluded")
                            .value.trim() ||
                        null,

                    duration:
                        $("bridalDuration")
                            .value.trim() ||
                        null,

                    featured:
                        $("bridalFeatured")
                            .checked,

                    active:
                        $("bridalActive")
                            .checked,

                    display_order:
                        Number(
                            $("bridalOrder")
                                .value || 0
                        ),

                    updated_at:
                        new Date().toISOString()
                };

                await saveRecord(
                    "bridal_packages",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   TEAM
   Actual schema:
   name
   role
   bio
   image_url
   instagram_url
   display_order
   active

   IMPORTANT:
   There is NO description column.
============================================================ */

async function loadTeam() {
    const { data, error } =
        await supabaseClient
            .from("team")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Team",
        "Manage artists and team members.",
        "Add Team Member"
    );

    html += `
        <div id="teamFormArea"></div>
        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No team members added yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttr(
                                            item.image_url
                                        )}"
                                        class="sm-thumb"
                                        alt=""
                                    >
                                `
                                : ""
                        }

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    item.role ||
                                    ""
                                )}
                            </p>

                            ${
                                item.bio
                                    ? `<p>${escapeHTML(
                                        item.bio
                                    )}</p>`
                                    : ""
                            }

                            <small>
                                ${
                                    item.active
                                        ? "Active"
                                        : "Inactive"
                                }
                            </small>

                        </div>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-team="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="team"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showTeamForm(null)
    );

    document
        .querySelectorAll("[data-edit-team]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editTeam
                        );

                    if (item) {
                        showTeamForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showTeamForm(item = null) {
    const area = $("teamFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="teamForm" class="sm-form">

            <h3>
                ${item ? "Edit Team Member" : "Add Team Member"}
            </h3>

            <input
                type="text"
                id="teamName"
                placeholder="Name"
                value="${escapeAttr(
                    item?.name || ""
                )}"
                required
            >

            <input
                type="text"
                id="teamRole"
                placeholder="Role"
                value="${escapeAttr(
                    item?.role || ""
                )}"
            >

            <textarea
                id="teamBio"
                placeholder="Bio"
            >${escapeHTML(
                item?.bio || ""
            )}</textarea>

            <input
                type="url"
                id="teamImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="teamImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <input
                type="url"
                id="teamInstagram"
                placeholder="Instagram URL"
                value="${escapeAttr(
                    item?.instagram_url || ""
                )}"
            >

            <input
                type="number"
                id="teamOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
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

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Team Member
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelTeam"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("teamImage")
                        .value.trim() ||
                    null;

                const file =
                    $("teamImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "team"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                const payload = {
                    name:
                        $("teamName")
                            .value.trim(),

                    role:
                        $("teamRole")
                            .value.trim() ||
                        null,

                    bio:
                        $("teamBio")
                            .value.trim() ||
                        null,

                    image_url:
                        imageUrl,

                    instagram_url:
                        $("teamInstagram")
                            .value.trim() ||
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

                await saveRecord(
                    "team",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   TESTIMONIALS
   Actual schema:
   customer_name
   testimonial
   rating
   image_url
   service
   featured
   visible

   IMPORTANT:
   There is NO message column.
============================================================ */

async function loadTestimonials() {
    const { data, error } =
        await supabaseClient
            .from("testimonials")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "Testimonials / Reviews",
        "Manage customer reviews.",
        "Add Review"
    );

    html += `
        <div id="testimonialFormArea"></div>
        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No testimonials yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.customer_name
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.testimonial
                            )}
                        </p>

                        ${
                            item.rating
                                ? `<small>
                                    Rating: ${item.rating}/5
                                </small>`
                                : ""
                        }

                        ${
                            item.service
                                ? `<small>
                                    • ${escapeHTML(
                                        item.service
                                    )}
                                </small>`
                                : ""
                        }

                        <br>

                        <small>
                            ${
                                item.visible
                                    ? "Visible"
                                    : "Hidden"
                            }

                            ${
                                item.featured
                                    ? " • Featured"
                                    : ""
                            }
                        </small>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-testimonial="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="testimonials"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showTestimonialForm(null)
    );

    document
        .querySelectorAll(
            "[data-edit-testimonial]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editTestimonial
                        );

                    if (item) {
                        showTestimonialForm(
                            item
                        );
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showTestimonialForm(item = null) {
    const area =
        $("testimonialFormArea");

    if (!area) return;

    area.innerHTML = `
        <form
            id="testimonialForm"
            class="sm-form"
        >

            <h3>
                ${
                    item
                        ? "Edit Review"
                        : "Add Review"
                }
            </h3>

            <input
                type="text"
                id="testimonialName"
                placeholder="Customer name"
                value="${escapeAttr(
                    item?.customer_name || ""
                )}"
                required
            >

            <textarea
                id="testimonialText"
                placeholder="Testimonial"
                required
            >${escapeHTML(
                item?.testimonial || ""
            )}</textarea>

            <input
                type="number"
                min="1"
                max="5"
                id="testimonialRating"
                placeholder="Rating 1-5"
                value="${
                    item?.rating ??
                    ""
                }"
            >

            <input
                type="text"
                id="testimonialService"
                placeholder="Service"
                value="${escapeAttr(
                    item?.service || ""
                )}"
            >

            <input
                type="url"
                id="testimonialImage"
                placeholder="Image URL"
                value="${escapeAttr(
                    item?.image_url || ""
                )}"
            >

            <input
                type="file"
                id="testimonialImageFile"
                accept="image/jpeg,image/png,image/webp"
            >

            <label class="sm-check">
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

            <label class="sm-check">
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

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} Review
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelTestimonial"
                >
                    Cancel
                </button>

            </div>

        </form>
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
            async event => {
                event.preventDefault();

                let imageUrl =
                    $("testimonialImage")
                        .value.trim() ||
                    null;

                const file =
                    $("testimonialImageFile")
                        ?.files?.[0];

                if (file) {
                    try {
                        imageUrl =
                            await uploadImage(
                                file,
                                "customer-gallery"
                            );
                    } catch (error) {
                        showError(error);
                        return;
                    }
                }

                const rating =
                    $("testimonialRating")
                        .value.trim();

                const payload = {
                    customer_name:
                        $("testimonialName")
                            .value.trim(),

                    testimonial:
                        $("testimonialText")
                            .value.trim(),

                    rating:
                        rating === ""
                            ? null
                            : Number(rating),

                    image_url:
                        imageUrl,

                    service:
                        $("testimonialService")
                            .value.trim() ||
                        null,

                    featured:
                        $("testimonialFeatured")
                            .checked,

                    visible:
                        $("testimonialVisible")
                            .checked
                };

                await saveRecord(
                    "testimonials",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   FAQ
   Actual schema:
   question
   answer
   display_order
   active
============================================================ */

async function loadFAQs() {
    const { data, error } =
        await supabaseClient
            .from("faqs")
            .select("*")
            .order("display_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showError(error);
        return;
    }

    let html = moduleHeader(
        "FAQs",
        "Manage frequently asked questions.",
        "Add FAQ"
    );

    html += `
        <div id="faqFormArea"></div>
        <div class="sm-card-list">
    `;

    if (!data?.length) {
        html += emptyState(
            "No FAQs yet."
        );
    } else {
        data.forEach(item => {
            html += `
                <div class="sm-list-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.question
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.answer
                            )}
                        </p>

                        <small>
                            ${
                                item.active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </small>

                    </div>

                    <div class="sm-actions">

                        <button
                            type="button"
                            class="sm-btn sm-btn-small"
                            data-edit-faq="${item.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="sm-btn sm-btn-small sm-btn-danger"
                            data-delete-table="faqs"
                            data-delete-id="${item.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += "</div>";

    moduleContent.innerHTML = html;

    $("moduleAddBtn")?.addEventListener(
        "click",
        () => showFAQForm(null)
    );

    document
        .querySelectorAll("[data-edit-faq]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const item =
                        data.find(
                            x =>
                                x.id ===
                                button.dataset
                                    .editFaq
                        );

                    if (item) {
                        showFAQForm(item);
                    }
                }
            );
        });

    attachDeleteButtons();
}

function showFAQForm(item = null) {
    const area = $("faqFormArea");

    if (!area) return;

    area.innerHTML = `
        <form id="faqForm" class="sm-form">

            <h3>
                ${item ? "Edit FAQ" : "Add FAQ"}
            </h3>

            <input
                type="text"
                id="faqQuestion"
                placeholder="Question"
                value="${escapeAttr(
                    item?.question || ""
                )}"
                required
            >

            <textarea
                id="faqAnswer"
                placeholder="Answer"
                required
            >${escapeHTML(
                item?.answer || ""
            )}</textarea>

            <input
                type="number"
                id="faqOrder"
                placeholder="Display order"
                value="${item?.display_order ?? 0}"
            >

            <label class="sm-check">
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

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    ${item ? "Update" : "Save"} FAQ
                </button>

                <button
                    type="button"
                    class="sm-btn"
                    id="cancelFAQ"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    $("cancelFAQ")
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    $("faqForm")
        ?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const payload = {
                    question:
                        $("faqQuestion")
                            .value.trim(),

                    answer:
                        $("faqAnswer")
                            .value.trim(),

                    display_order:
                        Number(
                            $("faqOrder")
                                .value || 0
                        ),

                    active:
                        $("faqActive")
                            .checked
                };

                await saveRecord(
                    "faqs",
                    payload,
                    item?.id
                );
            }
        );
}

/* ============================================================
   SETTINGS
   Actual schema:
   setting_key
   setting_value

   IMPORTANT:
   Never use key/value here.
============================================================ */

async function loadSettings() {
    const { data, error } =
        await supabaseClient
            .from("settings")
            .select("*")
            .order("setting_key", {
                ascending: true
            });

    if (error) {
        showError(error);
        return;
    }

    const settings = {};

    (data || []).forEach(item => {
        settings[item.setting_key] =
            item.setting_value || "";
    });

    moduleContent.innerHTML = `
        ${moduleHeader(
            "Website Settings",
            "Manage core business information."
        )}

        <form id="settingsForm" class="sm-form">

            <label>
                Business name
                <input
                    type="text"
                    id="settingBusinessName"
                    value="${escapeAttr(
                        settings.business_name ||
                        ""
                    )}"
                >
            </label>

            <label>
                Artist name
                <input
                    type="text"
                    id="settingArtistName"
                    value="${escapeAttr(
                        settings.artist_name ||
                        ""
                    )}"
                >
            </label>

            <label>
                Phone
                <input
                    type="text"
                    id="settingPhone"
                    value="${escapeAttr(
                        settings.phone ||
                        ""
                    )}"
                >
            </label>

            <label>
                WhatsApp
                <input
                    type="text"
                    id="settingWhatsApp"
                    value="${escapeAttr(
                        settings.whatsapp ||
                        ""
                    )}"
                >
            </label>

            <label>
                Email
                <input
                    type="email"
                    id="settingEmail"
                    value="${escapeAttr(
                        settings.email ||
                        ""
                    )}"
                >
            </label>

            <label>
                Address
                <textarea
                    id="settingAddress"
                >${escapeHTML(
                    settings.address ||
                    ""
                )}</textarea>
            </label>

            <label>
                Instagram
                <input
                    type="url"
                    id="settingInstagram"
                    value="${escapeAttr(
                        settings.instagram ||
                        ""
                    )}"
                >
            </label>

            <label>
                YouTube
                <input
                    type="url"
                    id="settingYoutube"
                    value="${escapeAttr(
                        settings.youtube ||
                        ""
                    )}"
                >
            </label>

            <div class="sm-form-actions">

                <button
                    type="submit"
                    class="sm-btn sm-btn-primary"
                >
                    Save Settings
                </button>

            </div>

        </form>
    `;

    $("settingsForm")
        ?.addEventListener(
            "submit",
            saveSettings
        );
}

async function saveSettings(event) {
    event.preventDefault();

    const settings = {
        business_name:
            $("settingBusinessName")
                .value.trim(),

        artist_name:
            $("settingArtistName")
                .value.trim(),

        phone:
            $("settingPhone")
                .value.trim(),

        whatsapp:
            $("settingWhatsApp")
                .value.trim(),

        email:
            $("settingEmail")
                .value.trim(),

        address:
            $("settingAddress")
                .value.trim(),

        instagram:
            $("settingInstagram")
                .value.trim(),

        youtube:
            $("settingYoutube")
                .value.trim()
    };

    try {

        for (
            const [key, value]
            of Object.entries(settings)
        ) {

            const {
                data: existing,
                error: findError
            } =
                await supabaseClient
                    .from("settings")
                    .select("id")
                    .eq(
                        "setting_key",
                        key
                    )
                    .maybeSingle();

            if (findError) {
                throw findError;
            }

            if (existing?.id) {

                const { error } =
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

                if (error) {
                    throw error;
                }

            } else {

                const { error } =
                    await supabaseClient
                        .from("settings")
                        .insert({
                            setting_key:
                                key,

                            setting_value:
                                value
                        });

                if (error) {
                    throw error;
                }
            }
        }

        showMessage(
            "Settings saved successfully."
        );

    } catch (error) {
        showError(error);
    }
}

/* ============================================================
   GENERIC SAVE
============================================================ */

async function saveRecord(
    table,
    payload,
    id = null
) {
    try {

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from(table)
                    .update(payload)
                    .eq("id", id);

        } else {

            result =
                await supabaseClient
                    .from(table)
                    .insert(payload);
        }

        if (result.error) {
            throw result.error;
        }

        showMessage(
            id
                ? "Updated successfully."
                : "Saved successfully."
        );

        await openModule(
            activeModule
        );

    } catch (error) {
        console.error(
            `Save error [${table}]:`,
            error
        );

        showMessage(
            `${table}: ${
                error.message ||
                "Save failed."
            }`,
            "error"
        );
    }
}

/* ============================================================
   DELETE
============================================================ */

async function deleteRecord(
    table,
    id
) {
    if (!id) return;

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this item?"
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

        showMessage(
            "Deleted successfully."
        );

        await openModule(
            activeModule
        );

    } catch (error) {
        console.error(
            `Delete error [${table}]:`,
            error
        );

        showMessage(
            error.message ||
            "Delete failed.",
            "error"
        );
    }
}

function attachDeleteButtons() {
    document
        .querySelectorAll(
            "[data-delete-table]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await deleteRecord(
                        button.dataset
                            .deleteTable,

                        button.dataset
                            .deleteId
                    );

                }
            );

        });
}

/* ============================================================
   SUPABASE STORAGE
============================================================ */

async function uploadImage(
    file,
    bucket
) {
    if (!file) {
        throw new Error(
            "No image selected."
        );
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
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

    const fileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const path =
        `admin/${fileName}`;

    const { error } =
        await supabaseClient
            .storage
            .from(bucket)
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",
                    upsert: false,
                    contentType:
                        file.type
                }
            );

    if (error) {
        throw error;
    }

    const {
        data
    } =
        supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(path);

    return data.publicUrl;
}

/* ============================================================
   ADMIN STYLES
   Injected so admin.js remains self-contained.
============================================================ */

function addAdminStyles() {

    if ($("schemaMatchedAdminStyles")) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "schemaMatchedAdminStyles";

    style.textContent = `

        #schemaMatchedAdmin {
            width: 100%;
            box-sizing: border-box;
            font-family:
                Inter,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
        }

        .sm-admin {
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
        }

        .sm-admin-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
            padding: 22px;
            border-radius: 18px;
            background: #181512;
            color: #fff;
        }

        .sm-admin-header h1 {
            margin: 0 0 5px;
            font-size: 26px;
        }

        .sm-admin-header p {
            margin: 0;
            opacity: .7;
        }

        .sm-admin-account {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .sm-admin-nav {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }

        .sm-module-btn {
            flex: 0 0 auto;
            border: 1px solid #ddd4c7;
            background: #fff;
            border-radius: 12px;
            padding: 11px 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 7px;
            color: #302a25;
        }

        .sm-module-btn:hover,
        .sm-module-btn.active {
            background: #302a25;
            color: #fff;
        }

        .sm-module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }

        .sm-module-header h2 {
            margin: 0 0 5px;
            font-size: 25px;
        }

        .sm-module-header p {
            margin: 0;
            color: #777;
        }

        .sm-stats-grid {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
        }

        .sm-stat {
            text-align: left;
            border: 1px solid #e4ddd5;
            background: #fff;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            box-shadow:
                0 8px 30px rgba(0,0,0,.05);
        }

        .sm-stat:hover {
            transform: translateY(-2px);
        }

        .sm-stat-icon {
            display: block;
            font-size: 25px;
            margin-bottom: 12px;
        }

        .sm-stat strong {
            display: block;
            font-size: 30px;
            color: #29231f;
        }

        .sm-stat small {
            color: #777;
        }

        .sm-form {
            background: #fff;
            border: 1px solid #e5ded6;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow:
                0 8px 30px rgba(0,0,0,.04);
        }

        .sm-form h3 {
            margin-top: 0;
        }

        .sm-form input,
        .sm-form textarea,
        .sm-form select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d8d0c7;
            border-radius: 10px;
            padding: 12px 13px;
            margin: 7px 0 12px;
            font: inherit;
            background: #fff;
        }

        .sm-form textarea {
            min-height: 100px;
            resize: vertical;
        }

        .sm-form label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #4b443e;
        }

        .sm-check {
            display: flex !important;
            align-items: center;
            gap: 8px;
            margin: 10px 0;
        }

        .sm-check input {
            width: auto;
            margin: 0;
        }

        .sm-form-actions,
        .sm-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .sm-btn {
            border: 1px solid #d6cec5;
            background: #fff;
            color: #302a25;
            border-radius: 9px;
            padding: 9px 14px;
            cursor: pointer;
            font: inherit;
        }

        .sm-btn:hover {
            opacity: .85;
        }

        .sm-btn-primary {
            background: #302a25;
            color: #fff;
            border-color: #302a25;
        }

        .sm-btn-danger {
            background: #991b1b;
            color: #fff;
            border-color: #991b1b;
        }

        .sm-btn-small {
            padding: 7px 10px;
            font-size: 12px;
        }

        .sm-card-list {
            display: grid;
            gap: 12px;
        }

        .sm-list-card {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: center;
            padding: 18px;
            background: #fff;
            border: 1px solid #e5ded6;
            border-radius: 15px;
        }

        .sm-list-card h3 {
            margin: 0 0 7px;
        }

        .sm-list-card p {
            margin: 5px 0;
            color: #666;
        }

        .sm-list-card small {
            color: #777;
        }

        .sm-thumb {
            width: 75px;
            height: 75px;
            object-fit: cover;
            border-radius: 10px;
            margin-right: 15px;
            vertical-align: middle;
        }

        .sm-gallery-grid {
            display: grid;
            grid-template-columns:
                repeat(auto-fill, minmax(230px, 1fr));
            gap: 15px;
        }

        .sm-gallery-card {
            background: #fff;
            border: 1px solid #e5ded6;
            border-radius: 15px;
            overflow: hidden;
        }

        .sm-gallery-card > img {
            width: 100%;
            height: 220px;
            object-fit: cover;
            display: block;
        }

        .sm-gallery-info {
            padding: 14px;
        }

        .sm-gallery-info h3 {
            margin: 0 0 6px;
        }

        .sm-gallery-info small {
            display: block;
            color: #777;
            margin: 3px 0;
        }

        .sm-before-grid {
            display: grid;
            grid-template-columns:
                repeat(auto-fill, minmax(350px, 1fr));
            gap: 15px;
        }

        .sm-before-card {
            background: #fff;
            border: 1px solid #e5ded6;
            border-radius: 15px;
            padding: 15px;
        }

        .sm-before-images {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .sm-before-images img {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 8px;
            display: block;
            margin-top: 5px;
        }

        .sm-table-wrap {
            width: 100%;
            overflow-x: auto;
            background: #fff;
            border: 1px solid #e5ded6;
            border-radius: 15px;
        }

        .sm-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
        }

        .sm-table th,
        .sm-table td {
            padding: 13px;
            border-bottom: 1px solid #eee8e1;
            text-align: left;
            vertical-align: top;
        }

        .sm-table th {
            background: #f7f3ee;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .sm-table td small {
            display: block;
            color: #777;
            margin-top: 4px;
        }

        .sm-status-select {
            border: 1px solid #ddd4cb;
            border-radius: 8px;
            padding: 7px;
        }

        .sm-empty {
            text-align: center;
            padding: 50px 20px;
            border: 1px dashed #d9d0c7;
            border-radius: 15px;
            color: #777;
            background: #fff;
        }

        .sm-empty div {
            font-size: 30px;
            margin-bottom: 10px;
        }

        .sm-loading {
            text-align: center;
            padding: 60px 20px;
            color: #777;
        }

        .sm-error {
            padding: 25px;
            border-radius: 14px;
            background: #fee2e2;
            color: #991b1b;
        }

        @media (max-width: 700px) {

            .sm-admin {
                padding: 10px;
            }

            .sm-admin-header,
            .sm-module-header,
            .sm-list-card {
                align-items: flex-start;
                flex-direction: column;
            }

            .sm-admin-account {
                width: 100%;
            }

            .sm-admin-account span {
                overflow-wrap: anywhere;
            }

            .sm-stats-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .sm-before-grid {
                grid-template-columns: 1fr;
            }

            .sm-gallery-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .sm-gallery-card > img {
                height: 170px;
            }
        }

        @media (max-width: 430px) {

            .sm-stats-grid {
                grid-template-columns: 1fr 1fr;
            }

            .sm-gallery-grid {
                grid-template-columns: 1fr;
            }

            .sm-admin-header h1 {
                font-size: 21px;
            }
        }

    `;

    document.head.appendChild(style);
}

/* ============================================================
   STARTUP
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            $("loginForm");

        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }

        const logoutBtn =
            $("logoutBtn");

        if (logoutBtn) {
            logoutBtn.addEventListener(
                "click",
                handleLogout
            );
        }

        if (
            typeof supabaseClient !==
            "undefined"
        ) {

            supabaseClient.auth
                .onAuthStateChange(
                    (event, session) => {

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

            checkAuth();

        } else {

            console.error(
                "supabaseClient is unavailable."
            );

        }

    }
);

/* ============================================================
   END
============================================================ */
