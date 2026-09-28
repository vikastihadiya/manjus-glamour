
/* ============================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL — MATCHED VERSION
   Works with the current admin.html + existing Supabase schema
   ============================================================ */

let currentUser = null;
let currentModule = "dashboard";

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
        return String(value);
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
        return String(value);
    }
}

function showMessage(message, type = "success") {
    const old = $("adminMessage");
    if (old) old.remove();

    const box = document.createElement("div");
    box.id = "adminMessage";
    box.className = `admin-message ${type}`;
    box.textContent = message;

    const target = $("moduleContent") || document.body;
    target.prepend(box);

    setTimeout(() => box.remove(), 5000);
}

function showDatabaseError(error) {
    console.error(error);

    const message = error?.message || "Database request failed.";

    if ($("moduleContent")) {
        $("moduleContent").innerHTML = `
            <div class="admin-error">
                <h3>Could not load this section</h3>
                <p>${escapeHTML(message)}</p>
                <button type="button" class="primary-button"
                    onclick="openModule('${escapeAttr(currentModule)}')">
                    Try Again
                </button>
            </div>
        `;
    }
}

function moduleHeader(title, description = "") {
    return `
        <div class="module-header">
            <div>
                <h2>${escapeHTML(title)}</h2>
                <p>${escapeHTML(description)}</p>
            </div>
        </div>
    `;
}

function emptyMessage(message) {
    return `
        <div class="empty-admin">
            <strong>${escapeHTML(message)}</strong>
        </div>
    `;
}

/* ============================================================
   AUTH
   ============================================================ */

function showLogin() {
    const loginSection = $("loginSection");
    const adminPanel = $("adminPanel");

    if (loginSection) loginSection.style.display = "flex";
    if (adminPanel) adminPanel.style.display = "none";

    document.body.classList.remove("admin-logged-in");
}

function showAdmin() {
    const loginSection = $("loginSection");
    const adminPanel = $("adminPanel");

    if (loginSection) loginSection.style.display = "none";

    if (!adminPanel) {
        console.error("adminPanel not found in admin.html");
        return;
    }

    adminPanel.style.display = "block";
    document.body.classList.add("admin-logged-in");

    document.querySelectorAll("[data-admin-email]").forEach(el => {
        el.textContent = currentUser?.email || "";
    });

    openModule("dashboard");
}

async function checkAuth() {
    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (session) {
            currentUser = session.user;
            showAdmin();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error("Auth check error:", error);
        showLogin();
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = $("adminEmail")?.value.trim();
    const password = $("adminPassword")?.value || "";

    if (!email || !password) {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    const button = $("loginForm")?.querySelector(
        "button[type='submit']"
    );

    const originalText = button?.textContent;

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
            button.textContent = originalText || "Login";
        }
    }
}

async function handleLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        currentUser = null;
        showLogin();
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(error.message || "Logout failed.", "error");
    }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-module]");
        if (!button) return;

        event.preventDefault();

        const moduleName = button.dataset.module;
        if (!moduleName) return;

        document.querySelectorAll("[data-module]").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        openModule(moduleName);
    });
}

async function openModule(moduleName) {
    currentModule = moduleName;

    const container = $("moduleContent");

    if (!container) {
        console.error("moduleContent not found in admin.html");
        return;
    }

    container.innerHTML = `
        <div class="module-loading">
            Loading ${escapeHTML(moduleName.replaceAll("_", " "))}...
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
                container.innerHTML = emptyMessage(
                    "This module is not available."
                );
        }
    } catch (error) {
        showDatabaseError(error);
    }
}

/* ============================================================
   STORAGE
   ============================================================ */

async function uploadStorageFile(bucket, file) {
    if (!file) return null;

    const {
        data: { session } = {}
    } = await supabaseClient.auth.getSession();

    if (!session) {
        alert("Your admin session has expired. Please log in again.");
        showLogin();
        return null;
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error("Maximum image size is 10 MB.");
    }

    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowed.includes(file.type)) {
        throw new Error(
            "Only JPG, PNG and WEBP images are allowed."
        );
    }

    const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

    const path =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabaseClient
        .storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } =
        supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(path);

    return data.publicUrl;
}

function imagePreview(url, alt = "Image") {
    if (!url) return "";

    return `
        <div class="image-preview">
            <img
                src="${escapeAttr(url)}"
                alt="${escapeAttr(alt)}"
                loading="lazy"
                onerror="this.style.display='none'"
            >
        </div>
    `;
}

function fileInput(name, label, accept = "image/jpeg,image/png,image/webp") {
    return `
        <label class="form-field">
            <span>${escapeHTML(label)}</span>
            <input
                type="file"
                name="${escapeAttr(name)}"
                accept="${escapeAttr(accept)}"
            >
            <small>JPG, PNG or WEBP — maximum 10 MB</small>
        </label>
    `;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

async function getCount(table) {
    const { count, error } = await supabaseClient
        .from(table)
        .select("*", {
            count: "exact",
            head: true
        });

    if (error) {
        console.error(`Count error for ${table}:`, error);
        return 0;
    }

    return count || 0;
}

async function loadDashboard() {
    const container = $("moduleContent");

    container.innerHTML =
        moduleHeader(
            "Dashboard",
            "Manage Manju's The World of Glamour website."
        ) +
        `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <span class="dashboard-card-label">Appointments</span>
                <strong id="dashboardAppointments">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Services</span>
                <strong id="dashboardServices">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Offers</span>
                <strong id="dashboardOffers">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Gallery Photos</span>
                <strong id="dashboardGallery">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Bride & Girls Photos</span>
                <strong id="dashboardBrideGallery">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Customer Photos</span>
                <strong id="dashboardCustomerGallery">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Before / After</span>
                <strong id="dashboardBeforeAfter">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Bridal Packages</span>
                <strong id="dashboardBridalPackages">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Team Members</span>
                <strong id="dashboardTeam">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Testimonials</span>
                <strong id="dashboardTestimonials">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">FAQs</span>
                <strong id="dashboardFAQs">—</strong>
            </div>

            <div class="dashboard-card">
                <span class="dashboard-card-label">Categories</span>
                <strong id="dashboardCategories">—</strong>
            </div>
        </div>
        `;

    const counts = await Promise.all([
        getCount("appointments"),
        getCount("services"),
        getCount("offers"),
        getCount("gallery"),
        getCount("bride_gallery"),
        getCount("customer_gallery"),
        getCount("before_after"),
        getCount("bridal_packages"),
        getCount("team"),
        getCount("testimonials"),
        getCount("faqs"),
        getCount("categories")
    ]);

    const ids = [
        "dashboardAppointments",
        "dashboardServices",
        "dashboardOffers",
        "dashboardGallery",
        "dashboardBrideGallery",
        "dashboardCustomerGallery",
        "dashboardBeforeAfter",
        "dashboardBridalPackages",
        "dashboardTeam",
        "dashboardTestimonials",
        "dashboardFAQs",
        "dashboardCategories"
    ];

    counts.forEach((count, index) => {
        const element = $(ids[index]);
        if (element) {
            element.textContent = count;
        }
    });
}

/* ============================================================
   APPOINTMENTS
   ============================================================ */

async function loadAppointments() {
    const container = $("moduleContent");

    const { data, error } = await supabaseClient
        .from("appointments")
        .select(`
            id,
            service_id,
            customer_name,
            phone,
            email,
            appointment_date,
            appointment_time,
            message,
            status,
            whatsapp_requested,
            privacy_consent,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) throw error;

    container.innerHTML =
        moduleHeader(
            "Appointments",
            "Appointment requests submitted through the public website."
        ) +
        `
        <div class="admin-table-wrap">
            ${
                data?.length
                    ? `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>WhatsApp</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${data.map(item => `
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
                                        ${escapeHTML(
                                            item.appointment_time || "—"
                                        )}
                                    </td>

                                    <td>
                                        <select
                                            onchange="updateAppointmentStatus('${escapeAttr(item.id)}', this.value)"
                                        >
                                            ${[
                                                "New",
                                                "Confirmed",
                                                "Completed",
                                                "Cancelled",
                                                "No-show"
                                            ].map(status => `
                                                <option
                                                    value="${escapeAttr(status)}"
                                                    ${
                                                        item.status === status
                                                            ? "selected"
                                                            : ""
                                                    }
                                                >
                                                    ${escapeHTML(status)}
                                                </option>
                                            `).join("")}
                                                            );
        }
    } catch (error) {
        console.error(`Module ${moduleName} error:`, error);
        showDatabaseError(error);
    }
}

/* ============================================================
   DASHBOARD
   ============================================================ */

async function getCount(table) {
    const { count, error } = await supabaseClient
        .from(table)
        .select("*", { count: "exact", head: true });

    if (error) {
        console.error(`Count error: ${table}`, error);
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

    const results = await Promise.all(
        tables.map(table => getCount(table))
    );

    const counts = {};
    tables.forEach((table, index) => {
        counts[table] = results[index];
    });

    const container = $("moduleContent");

    container.innerHTML = `
        ${moduleHeader(
            "Dashboard",
            "Manage Manju's The World of Glamour."
        )}

        <div class="dashboard-grid">

            ${dashboardCard(
                "📅",
                "Appointments",
                counts.appointments,
                "Manage appointment requests",
                "appointments"
            )}

            ${dashboardCard(
                "💄",
                "Services",
                counts.services,
                "Manage salon services",
                "services"
            )}

            ${dashboardCard(
                "🏷️",
                "Offers",
                counts.offers,
                "Manage offers and prices",
                "offers"
            )}

            ${dashboardCard(
                "🖼️",
                "Gallery",
                counts.gallery,
                "Manage portfolio images",
                "gallery"
            )}

            ${dashboardCard(
                "👰",
                "Bride Gallery",
                counts.bride_gallery,
                "Manage bridal photos",
                "bride_gallery"
            )}

            ${dashboardCard(
                "✨",
                "Customer Gallery",
                counts.customer_gallery,
                "Manage customer photos",
                "customer_gallery"
            )}

            ${dashboardCard(
                "↔️",
                "Before / After",
                counts.before_after,
                "Manage transformation photos",
                "before_after"
            )}

            ${dashboardCard(
                "💍",
                "Bridal Packages",
                counts.bridal_packages,
                "Manage bridal packages",
                "bridal_packages"
            )}

            ${dashboardCard(
                "👩‍🎨",
                "Team",
                counts.team,
                "Manage team members",
                "team"
            )}

            ${dashboardCard(
                "⭐",
                "Testimonials",
                counts.testimonials,
                "Manage customer reviews",
                "testimonials"
            )}

            ${dashboardCard(
                "❓",
                "FAQs",
                counts.faqs,
                "Manage frequently asked questions",
                "faqs"
            )}

        </div>

        <div class="admin-form-card" style="margin-top:24px;">
            <h3>Admin account</h3>
            <p>
                Signed in as:
                <strong>${escapeHTML(currentUser?.email || "—")}</strong>
            </p>
        </div>
    `;
}

function dashboardCard(icon, title, count, description, module) {
    return `
        <button
            type="button"
            class="dashboard-card"
            data-module="${escapeAttr(module)}"
        >
            <div class="dashboard-card-icon">${icon}</div>
            <div class="dashboard-card-title">
                ${escapeHTML(title)}
            </div>
            <div class="dashboard-card-count">
                ${Number(count) || 0}
            </div>
            <div class="dashboard-card-description">
                ${escapeHTML(description)}
            </div>
        </button>
    `;
}

/* ============================================================
   APPOINTMENTS
   ============================================================ */

async function loadAppointments() {
    const { data, error } = await supabaseClient
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        showDatabaseError(error);
        return;
    }

    const rows = data || [];

    $("moduleContent").innerHTML = `
        ${moduleHeader(
            "Appointments",
            "Review and manage customer appointment requests."
        )}

        ${
            rows.length
                ? `
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Service ID</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(appointmentRow).join("")}
                        </tbody>
                    </table>
                </div>
                `
                : emptyMessage("No appointment requests yet.")
        }
    `;
}

function appointmentRow(item) {
    const statuses = [
        "New",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show"
    ];

    return `
        <tr>
            <td>
                <strong>${escapeHTML(item.customer_name)}</strong>
                ${
                    item.email
                        ? `<small>${escapeHTML(item.email)}</small>`
                        : ""
                }
                ${
                    item.message
                        ? `<small>${escapeHTML(item.message)}</small>`
                        : ""
                }
            </td>

            <td>${escapeHTML(item.phone)}</td>

            <td>${formatDate(item.appointment_date)}</td>

            <td>${escapeHTML(item.appointment_time || "—")}</td>

            <td>${escapeHTML(item.service_id || "—")}</td>

            <td>
                <select
                    onchange="updateAppointmentStatus(
                        '${escapeAttr(item.id)}',
                        this.value
                    )"
                >
                    ${statuses.map(status => `
                        <option
                            value="${escapeAttr(status)}"
                            ${item.status === status ? "selected" : ""}
                        >
                            ${escapeHTML(status)}
                        </option>
                    `).join("")}
                </select>
            </td>

            <td>${formatDateTime(item.created_at)}</td>

            <td>
                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteRecord(
                        'appointments',
                        '${escapeAttr(item.id)}'
                    )"
                >
                    Delete
                </button>
            </td>
        </tr>
    `;
}

async function updateAppointmentStatus(id, status) {
    const { error } = await supabaseClient
        .from("appointments")
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    showMessage("Appointment status updated.");
    await loadAppointments();
}

/* ============================================================
   GENERIC DELETE
   ============================================================ */

async function deleteRecord(table, id) {
    if (!table || !id) return;

    const confirmed = confirm(
        "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    showMessage("Item deleted successfully.");

    await openModule(currentModule);
}

/* ============================================================
   SERVICES
   ============================================================ */

async function loadServices() {
    const [
        { data: services, error: servicesError },
        { data: categories, error: categoriesError }
    ] = await Promise.all([
        supabaseClient
            .from("services")
            .select("*")
            .order("display_order", { ascending: true }),

        supabaseClient
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true })
    ]);

    if (servicesError) {
        showDatabaseError(servicesError);
        return;
    }

    if (categoriesError) {
        showDatabaseError(categoriesError);
        return;
    }

    const categoryMap = {};

    (categories || []).forEach(category => {
        categoryMap[category.id] = category.name;
    });

    $("moduleContent").innerHTML = `
        ${moduleHeader(
            "Services",
            "Add and manage salon and makeup services."
        )}

        <div class="admin-form-card">
            <h3>Add Service</h3>

            <form id="serviceForm">
                <div class="form-grid">

                    <label class="form-field">
                        <span>Service name *</span>
                        <input
                            type="text"
                            name="name"
                            required
                        >
                    </label>

                    <label class="form-field">
                        <span>Slug *</span>
                        <input
                            type="text"
                            name="slug"
                            placeholder="bridal-makeup"
                            required
                        >
                    </label>

                    <label class="form-field">
                        <span>Category</span>
                        <select name="category_id">
                            <option value="">
                                Select category
                            </option>

                            ${(categories || []).map(category => `
                                <option value="${escapeAttr(category.id)}">
                                    ${escapeHTML(category.name)}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label class="form-field">
                        <span>Price</span>
                        <input
                            type="number"
                            name="price"
                            min="0"
                            step="0.01"
                        >
                    </label>

                    <label class="form-field">
                        <span>Price label</span>
                        <input
                            type="text"
                            name="price_label"
                            value="Price on enquiry"
                        >
                    </label>

                    <label class="form-field">
                        <span>Duration (minutes)</span>
                        <input
                            type="number"
                            name="duration_minutes"
                            min="0"
                        >
                    </label>

                    <label class="form-field">
                        <span>Display order</span>
                        <input
                            type="number"
                            name="display_order"
                            value="0"
                        >
                    </label>

                    <label class="form-field checkbox-field">
                        <input
                            type="checkbox"
                            name="featured"
                        >
                        <span>Featured</span>
                    </label>

                    <label class="form-field checkbox-field">
                        <input
                            type="checkbox"
                            name="active"
                            checked
                        >
                        <span>Active</span>
                    </label>

                    ${fileInput(
                        "image",
                        "Service image"
                    )}

                </div>

                <label class="form-field">
                    <span>Description</span>
                    <textarea
                        name="description"
                        rows="5"
                    ></textarea>
                </label>

                <button
                    type="submit"
                    class="primary-button"
                >
                    Save Service
                </button>
            </form>
        </div>

        <div class="admin-table-wrap">
            <h3>Existing Services</h3>

            ${
                services?.length
                    ? `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Duration</th>
                                <th>Featured</th>
                                <th>Active</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${(services || []).map(service => `
                                <tr>
                                    <td>
                                        ${
                                            service.image_url
                                                ? `
                                                <img
                                                    src="${escapeAttr(service.image_url)}"
                                                    alt=""
                                                    class="admin-thumb"
                                                >
                                                `
                                                : "—"
                                        }
                                    </td>

                                    <td>
                                        <strong>
                                            ${escapeHTML(service.name)}
                                        </strong>
                                        ${
                                            service.description
                                                ? `
                                                <small>
                                                    ${escapeHTML(
                                                        service.description
                                                    )}
                                                </small>
                                                `
                                                : ""
                                        }
                                    </td>

                                    <td>
                                        ${
                                            categoryMap[
                                                service.category_id
                                            ] || "—"
                                        }
                                    </td>

                                    <td>
                                        ${
                                            service.price !== null &&
                                            service.price !== undefined
                                                ? `₹${escapeHTML(service.price)}`
                                                : escapeHTML(
                                                    service.price_label ||
                                                    "Price on enquiry"
                                                )
                                        }
                                    </td>

                                    <td>
                                        ${
                                            service.duration_minutes
                                                ? `${service.duration_minutes} min`
                                                : "—"
                                        }
                                    </td>

                                    <td>
                                        ${service.featured ? "Yes" : "No"}
                                    </td>

                                    <td>
                                        ${service.active ? "Yes" : "No"}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            class="delete-btn"
                                            onclick="deleteRecord(
                                                'services',
                                                '${escapeAttr(service.id)}'
                                            )"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    `
                    : emptyMessage("No services added yet.")
            }
        </div>
    `;

    const form = $("serviceForm");

    if (form) {
        form.addEventListener("submit", saveService);
    }
}

async function saveService(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const file = formData.get("image");

    try {
        let imageUrl = null;

        if (file && file.size) {
            imageUrl = await uploadStorageFile(
                "services",
                file
            );
        }

        const payload = {
            name: String(
                formData.get("name") || ""
            ).trim(),

            slug: String(
                formData.get("slug") || ""
            ).trim(),

            category_id:
                formData.get("category_id") || null,

            description:
                String(
                    formData.get("description") || ""
                ).trim() || null,

            price:
                formData.get("price")
                    ? Number(formData.get("price"))
                    : null,

            price_label:
                String(
                    formData.get("price_label") ||
                    "Price on enquiry"
                ).trim(),

            duration_minutes:
                formData.get("duration_minutes")
                    ? Number(formData.get("duration_minutes"))
                    : null,

            image_url: imageUrl,

            featured:
                formData.get("featured") === "on",

            active:
                formData.get("active") === "on",

            display_order:
                Number(
                    formData.get("display_order") || 0
                )
        };

        if (!payload.name || !payload.slug) {
            alert("Service name and slug are required.");
            return;
        }

        const { error } = await supabaseClient
            .from("services")
            .insert(payload);

        if (error) throw error;

        showMessage("Service saved successfully.");
        await loadServices();

    } catch (error) {
        console.error("Save service error:", error);
        alert(
            error.message ||
            "Could not save service."
        );
    }
}
/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   admin.js — PART 3
   ========================================================= */

/* ---------- GALLERY MODULE ---------- */

async function loadGalleryModule() {
    moduleContent.innerHTML = `
        <div class="module-header">
            <h2>Gallery</h2>
            <button class="primary-btn" onclick="showGalleryForm()">+ Add Gallery Image</button>
        </div>

        <div id="galleryFormArea"></div>

        <div id="galleryList" class="admin-grid">
            <div class="loading">Loading gallery...</div>
        </div>
    `;

    await loadGalleryImages();
}


function showGalleryForm(id = null) {
    const existing = id
        ? galleryData.find(item => item.id === id)
        : null;

    document.getElementById("galleryFormArea").innerHTML = `
        <div class="admin-form-card">
            <div class="form-header">
                <h3>${existing ? "Edit Gallery Image" : "Add Gallery Image"}</h3>
                <button class="close-btn" onclick="closeGalleryForm()">×</button>
            </div>

            <form id="galleryForm"
                  onsubmit="saveGalleryImage(event, '${existing?.id || ""}')">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            id="galleryTitle"
                            value="${escapeHTML(existing?.title || "")}"
                            placeholder="Bridal Makeup"
                        >
                    </div>

                    <div class="form-group">
                        <label>Category</label>
                        <select id="galleryCategory">
                            <option value="bridal"
                                ${existing?.category === "bridal" ? "selected" : ""}>
                                Bridal
                            </option>

                            <option value="girls"
                                ${existing?.category === "girls" ? "selected" : ""}>
                                Girls
                            </option>

                            <option value="customer"
                                ${existing?.category === "customer" ? "selected" : ""}>
                                Customer
                            </option>

                            <option value="salon"
                                ${existing?.category === "salon" ? "selected" : ""}>
                                Salon
                            </option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Image</label>

                        <input
                            type="file"
                            id="galleryImageFile"
                            accept="image/jpeg,image/png,image/webp"
                        >

                        <small>
                            Upload JPG, PNG or WEBP. Maximum 10 MB.
                        </small>

                        ${
                            existing?.image_url
                                ? `
                                <div class="current-image-preview">
                                    <img
                                        src="${existing.image_url}"
                                        alt="Current image"
                                    >
                                </div>
                                `
                                : ""
                        }
                    </div>

                    <div class="form-group full-width">
                        <label>OR Image URL</label>

                        <input
                            type="url"
                            id="galleryImageUrl"
                            value="${escapeHTML(existing?.image_url || "")}"
                            placeholder="https://example.com/image.jpg"
                        >

                        <small>
                            You can upload from your computer OR paste an image URL.
                        </small>
                    </div>

                </div>

                <div class="form-actions">
                    <button type="button"
                            class="secondary-btn"
                            onclick="closeGalleryForm()">
                        Cancel
                    </button>

                    <button type="submit"
                            class="primary-btn">
                        ${existing ? "Update Image" : "Save Image"}
                    </button>
                </div>

            </form>
        </div>
    `;
}


function closeGalleryForm() {
    const area = document.getElementById("galleryFormArea");

    if (area) {
        area.innerHTML = "";
    }
}


async function saveGalleryImage(event, id = "") {
    event.preventDefault();

    const form = event.target;
    const button = form.querySelector("button[type='submit']");

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        const title =
            document.getElementById("galleryTitle").value.trim();

        const category =
            document.getElementById("galleryCategory").value;

        const fileInput =
            document.getElementById("galleryImageFile");

        const imageUrlInput =
            document.getElementById("galleryImageUrl").value.trim();

        let imageUrl = imageUrlInput;

        /* -----------------------------------------
           UPLOAD FILE TO SUPABASE STORAGE
        ----------------------------------------- */

        if (fileInput.files && fileInput.files.length > 0) {

            const file = fileInput.files[0];

            validateImageFile(file);

            const extension =
                file.name.split(".").pop().toLowerCase();

            const fileName =
                `gallery-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}.${extension}`;

            const filePath =
                `gallery/${fileName}`;

            const { error: uploadError } =
                await supabaseClient
                    .storage
                    .from("customer-gallery")
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false
                    });

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } =
                supabaseClient
                    .storage
                    .from("customer-gallery")
                    .getPublicUrl(filePath);

            imageUrl =
                publicUrlData.publicUrl;
        }

        if (!imageUrl) {
            throw new Error("Please upload an image or enter an image URL.");
        }

        /* -----------------------------------------
           DATABASE DATA
        ----------------------------------------- */

        const payload = {
            title: title || null,
            category: category || "salon",
            image_url: imageUrl
        };

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from("gallery")
                    .update(payload)
                    .eq("id", id)
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("gallery")
                    .insert([payload])
                    .select()
                    .single();
        }

        if (result.error) {
            throw result.error;
        }

        showToast(
            id
                ? "Gallery image updated successfully."
                : "Gallery image added successfully.",
            "success"
        );

        closeGalleryForm();

        await loadGalleryImages();

    } catch (error) {

        console.error("Gallery save error:", error);

        showToast(
            error.message || "Could not save gallery image.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent =
            id ? "Update Image" : "Save Image";
    }
}


async function loadGalleryImages() {

    const container =
        document.getElementById("galleryList");

    if (!container) return;

    container.innerHTML =
        `<div class="loading">Loading...</div>`;

    try {

        const { data, error } =
            await supabaseClient
                .from("gallery")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        galleryData = data || [];

        if (!galleryData.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No gallery images yet</h3>
                    <p>Add your first gallery image.</p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            galleryData.map(item => `
                <div class="admin-card">

                    <img
                        class="admin-card-image"
                        src="${item.image_url}"
                        alt="${escapeHTML(item.title || "Gallery image")}"
                        onerror="this.style.display='none'"
                    >

                    <div class="admin-card-body">

                        <h3>
                            ${escapeHTML(
                                item.title || "Untitled"
                            )}
                        </h3>

                        <span class="badge">
                            ${escapeHTML(
                                item.category || "salon"
                            )}
                        </span>

                        <div class="admin-card-actions">

                            <button
                                class="secondary-btn"
                                onclick="showGalleryForm('${item.id}')">
                                Edit
                            </button>

                            <button
                                class="danger-btn"
                                onclick="deleteGalleryImage('${item.id}')">
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            `).join("");

    } catch (error) {

        console.error("Gallery loading error:", error);

        container.innerHTML = `
            <div class="error-state">
                <h3>Unable to load gallery</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


async function deleteGalleryImage(id) {

    if (!confirm(
        "Are you sure you want to delete this gallery image?"
    )) {
        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("gallery")
                .delete()
                .eq("id", id);

        if (error) {
            throw error;
        }

        showToast(
            "Gallery image deleted.",
            "success"
        );

        await loadGalleryImages();

    } catch (error) {

        console.error(
            "Gallery delete error:",
            error
        );

        showToast(
            error.message ||
            "Could not delete gallery image.",
            "error"
        );
    }
}


/* =========================================================
   OFFERS MODULE
   ========================================================= */

async function loadOffersModule() {

    moduleContent.innerHTML = `
        <div class="module-header">
            <h2>Special Offers</h2>

            <button
                class="primary-btn"
                onclick="showOfferForm()">
                + Add Offer
            </button>
        </div>

        <div id="offerFormArea"></div>

        <div id="offersList"
             class="admin-grid">

            <div class="loading">
                Loading offers...
            </div>

        </div>
    `;

    await loadOffers();
}


function showOfferForm(id = null) {

    const existing =
        id
            ? offersData.find(item => item.id === id)
            : null;

    document.getElementById("offerFormArea").innerHTML = `

        <div class="admin-form-card">

            <div class="form-header">

                <h3>
                    ${existing ? "Edit Offer" : "Add Offer"}
                </h3>

                <button
                    class="close-btn"
                    onclick="closeOfferForm()">
                    ×
                </button>

            </div>

            <form
                id="offerForm"
                onsubmit="saveOffer(event, '${existing?.id || ""}')">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Offer Title</label>

                        <input
                            type="text"
                            id="offerTitle"
                            value="${escapeHTML(existing?.title || "")}"
                            placeholder="Bridal Makeup Offer"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label>Price</label>

                        <input
                            type="number"
                            id="offerPrice"
                            value="${existing?.price ?? ""}"
                            min="0"
                            placeholder="4999"
                        >
                    </div>

                    <div class="form-group">
                        <label>Old Price</label>

                        <input
                            type="number"
                            id="offerOldPrice"
                            value="${existing?.old_price ?? ""}"
                            min="0"
                            placeholder="7999"
                        >
                    </div>

                    <div class="form-group">
                        <label>Start Date</label>

                        <input
                            type="date"
                            id="offerStartDate"
                            value="${existing?.start_date || ""}"
                        >
                    </div>

                    <div class="form-group">
                        <label>End Date</label>

                        <input
                            type="date"
                            id="offerEndDate"
                            value="${existing?.end_date || ""}"
                        >
                    </div>

                    <div class="form-group">
                        <label>Status</label>

                        <select id="offerStatus">

                            <option value="active"
                                ${existing?.status === "active"
                                    ? "selected"
                                    : ""}>
                                Active
                            </option>

                            <option value="inactive"
                                ${existing?.status === "inactive"
                                    ? "selected"
                                    : ""}>
                                Inactive
                            </option>

                        </select>
                    </div>

                    <div class="form-group full-width">

                        <label>Description</label>

                        <textarea
                            id="offerDescription"
                            rows="4"
                            placeholder="Describe this offer..."
                        >${escapeHTML(
                            existing?.description || ""
                        )}</textarea>

                    </div>

                    <div class="form-group full-width">

                        <label>Offer Image</label>

                        <input
                            type="file"
                            id="offerImageFile"
                            accept="image/jpeg,image/png,image/webp"
                        >

                        <small>
                            Upload an image from your computer.
                        </small>

                        ${
                            existing?.image_url
                            ? `
                            <div class="current-image-preview">

                                <img
                                    src="${existing.image_url}"
                                    alt="Offer image"
                                >

                            </div>
                            `
                            : ""
                        }

                    </div>

                    <div class="form-group full-width">

                        <label>OR Image URL</label>

                        <input
                            type="url"
                            id="offerImageUrl"
                            value="${escapeHTML(
                                existing?.image_url || ""
                            )}"
                            placeholder="https://example.com/offer.jpg"
                        >

                    </div>

                </div>

                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        onclick="closeOfferForm()">
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="primary-btn">
                        ${existing
                            ? "Update Offer"
                            : "Save Offer"}
                    </button>

                </div>

            </form>

        </div>
    `;
}


function closeOfferForm() {

    const area =
        document.getElementById("offerFormArea");

    if (area) {
        area.innerHTML = "";
    }
}


async function saveOffer(event, id = "") {

    event.preventDefault();

    const form = event.target;

    const button =
        form.querySelector(
            "button[type='submit']"
        );

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        const title =
            document.getElementById(
                "offerTitle"
            ).value.trim();

        const price =
            document.getElementById(
                "offerPrice"
            ).value;

        const oldPrice =
            document.getElementById(
                "offerOldPrice"
            ).value;

        const startDate =
            document.getElementById(
                "offerStartDate"
            ).value;

        const endDate =
            document.getElementById(
                "offerEndDate"
            ).value;

        const status =
            document.getElementById(
                "offerStatus"
            ).value;

        const description =
            document.getElementById(
                "offerDescription"
            ).value.trim();

        const fileInput =
            document.getElementById(
                "offerImageFile"
            );

        const imageUrlInput =
            document.getElementById(
                "offerImageUrl"
            ).value.trim();

        let imageUrl =
            imageUrlInput;

        /* -----------------------------------------
           SUPABASE STORAGE UPLOAD
        ----------------------------------------- */

        if (
            fileInput.files &&
            fileInput.files.length > 0
        ) {

            const file =
                fileInput.files[0];

            validateImageFile(file);

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();

            const fileName =
                `offer-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}.${extension}`;

            const filePath =
                `offers/${fileName}`;

            const { error: uploadError } =
                await supabaseClient
                    .storage
                    .from("offers")
                    .upload(
                        filePath,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } =
                supabaseClient
                    .storage
                    .from("offers")
                    .getPublicUrl(filePath);

            imageUrl =
                publicUrlData.publicUrl;
        }

        const payload = {

            title: title || null,

            price:
                price === ""
                    ? null
                    : Number(price),

            old_price:
                oldPrice === ""
                    ? null
                    : Number(oldPrice),

            start_date:
                startDate || null,

            end_date:
                endDate || null,

            status:
                status || "active",

            description:
                description || null,

            image_url:
                imageUrl || null
        };

        let result;

        if (id) {

            result =
                await supabaseClient
                    .from("offers")
                    .update(payload)
                    .eq("id", id)
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("offers")
                    .insert([payload])
                    .select()
                    .single();
        }

        if (result.error) {
            throw result.error;
        }

        showToast(
            id
                ? "Offer updated successfully."
                : "Offer added successfully.",
            "success"
        );

        closeOfferForm();

        await loadOffers();

    } catch (error) {

        console.error(
            "Offer save error:",
            error
        );

        showToast(
            error.message ||
            "Could not save offer.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            id
                ? "Update Offer"
                : "Save Offer";
    }
}


async function loadOffers() {

    const container =
        document.getElementById(
            "offersList"
        );

    if (!container) return;

    container.innerHTML =
        `<div class="loading">Loading...</div>`;

    try {

        const { data, error } =
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
            throw error;
        }

        offersData =
            data || [];

        if (!offersData.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <h3>No offers yet</h3>

                    <p>
                        Add your first special offer.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            offersData.map(item => `

                <div class="admin-card">

                    ${
                        item.image_url
                        ? `
                        <img
                            class="admin-card-image"
                            src="${item.image_url}"
                            alt="${escapeHTML(
                                item.title || "Offer"
                            )}"
                        >
                        `
                        : `
                        <div class="no-image">
                            No Image
                        </div>
                        `
                    }

                    <div class="admin-card-body">

                        <h3>
                            ${escapeHTML(
                                item.title || "Untitled Offer"
                            )}
                        </h3>

                        ${
                            item.price !== null
                            ? `
                            <p class="price">
                                ₹${Number(
                                    item.price
                                ).toLocaleString("en-IN")}
                            </p>
                            `
                            : ""
                        }

                        ${
                            item.old_price !== null
                            ? `
                            <p class="old-price">
                                ₹${Number(
                                    item.old_price
                                ).toLocaleString("en-IN")}
                            </p>
                            `
                            : ""
                        }

                        <span class="badge">
                            ${escapeHTML(
                                item.status || "active"
                            )}
                        </span>

                        <div class="admin-card-actions">

                            <button
                                class="secondary-btn"
                                onclick="showOfferForm('${item.id}')">
                                Edit
                            </button>

                            <button
                                class="danger-btn"
                                onclick="deleteOffer('${item.id}')">
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            `).join("");

    } catch (error) {

        console.error(
            "Offer loading error:",
            error
        );

        container.innerHTML = `
            <div class="error-state">

                <h3>
                    Unable to load offers
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}


async function deleteOffer(id) {

    if (!confirm(
        "Are you sure you want to delete this offer?"
    )) {
        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("offers")
                .delete()
                .eq("id", id);

        if (error) {
            throw error;
        }

        showToast(
            "Offer deleted successfully.",
            "success"
        );

        await loadOffers();

    } catch (error) {

        console.error(
            "Offer delete error:",
            error
        );

        showToast(
            error.message ||
            "Could not delete offer.",
            "error"
        );
    }
}


/* =========================================================
   COMMON IMAGE VALIDATION
   ========================================================= */

function validateImageFile(file) {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        throw new Error(
            "Only JPG, PNG and WEBP images are allowed."
        );
    }

    const maxSize =
        10 * 1024 * 1024;

    if (file.size > maxSize) {

        throw new Error(
            "Image must be smaller than 10 MB."
        );
    }
}


/* =========================================================
   SAFE HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST MESSAGE
   ========================================================= */

function showToast(message, type = "success") {

    let toast =
        document.getElementById("adminToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "adminToast";

        document.body.appendChild(toast);
    }

    toast.className =
        `admin-toast ${type}`;

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}
                                ? data.map(row => `
                                    <tr>
                                        <td>
                                            ${escapeHTML(
                                                row.setting_key
                                            )}
                                        </td>
                                        <td>
                                            ${escapeHTML(
                                                row.setting_value || ""
                                            )}
                                        </td>
                                    </tr>
                                `).join("")
                                : `
                                    <tr>
                                        <td colspan="2">
                                            No settings found.
                                        </td>
                                    </tr>
                                `
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function saveSettings() {
    const values = {
        business_name:
            $("settingBusinessName")?.value.trim() || "",
        artist_name:
            $("settingArtistName")?.value.trim() || "",
        phone:
            $("settingPhone")?.value.trim() || "",
        whatsapp:
            $("settingWhatsapp")?.value.trim() || "",
        email:
            $("settingEmail")?.value.trim() || "",
        address:
            $("settingAddress")?.value.trim() || "",
        instagram:
            $("settingInstagram")?.value.trim() || "",
        youtube:
            $("settingYoutube")?.value.trim() || ""
    };

    try {
        for (const [key, value] of Object.entries(values)) {

            const { data: existing, error: findError } =
                await supabaseClient
                    .from("settings")
                    .select("id")
                    .eq("setting_key", key)
                    .maybeSingle();

            if (findError) throw findError;

            if (existing?.id) {
                const { error } =
                    await supabaseClient
                        .from("settings")
                        .update({
                            setting_value: value,
                            updated_at: new Date().toISOString()
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

        showMessage("Website settings saved successfully.");
        await loadSettings();

    } catch (error) {
        console.error("Settings save error:", error);
        alert(error.message || "Could not save settings.");
    }
}

/* ============================================================
   DELETE
   ============================================================ */

async function deleteRecord(table, id) {
    if (!table || !id) return;

    const confirmed = confirm(
        "Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Delete error:", error);
        alert(error.message || "Could not delete record.");
        return;
    }

    showMessage("Record deleted successfully.");

    await openModule(currentModule);
}

/* ============================================================
   OPTIONAL PUBLIC FUNCTIONS
   ============================================================ */

window.openModule = openModule;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

window.updateAppointmentStatus =
    updateAppointmentStatus;

window.deleteRecord =
    deleteRecord;

window.showServiceForm =
    showServiceForm;

window.editService =
    editService;

window.saveService =
    saveService;

window.showOfferForm =
    showOfferForm;

window.editOffer =
    editOffer;

window.saveOffer =
    saveOffer;

window.showPhotoForm =
    showPhotoForm;

window.editPhoto =
    editPhoto;

window.savePhoto =
    savePhoto;

window.showBeforeAfterForm =
    showBeforeAfterForm;

window.editBeforeAfter =
    editBeforeAfter;

window.saveBeforeAfter =
    saveBeforeAfter;

window.showBridalPackageForm =
    showBridalPackageForm;

window.editBridalPackage =
    editBridalPackage;

window.saveBridalPackage =
    saveBridalPackage;

window.showTeamForm =
    showTeamForm;

window.editTeam =
    editTeam;

window.saveTeam =
    saveTeam;

window.showTestimonialForm =
    showTestimonialForm;

window.editTestimonial =
    editTestimonial;

window.saveTestimonial =
    saveTestimonial;

window.showFAQForm =
    showFAQForm;

window.editFAQ =
    editFAQ;

window.saveFAQ =
    saveFAQ;

window.saveSettings =
    saveSettings;

/* ============================================================
   STARTUP
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    console.log(
        "Manju Admin Panel loaded — matched version"
    );

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        console.error(
            "supabaseClient is not available."
        );

        const loginMessage = $("loginMessage");

        if (loginMessage) {
            loginMessage.textContent =
                "Supabase configuration could not be loaded.";
            loginMessage.style.display = "block";
        }

        return;
    }

    const loginForm = $("loginForm");
    const logoutBtn = $("logoutBtn");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    } else {
        console.warn("loginForm not found.");
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    } else {
        console.warn("logoutBtn not found.");
    }

    setupNavigation();

    try {
        supabaseClient.auth.onAuthStateChange(
            (event, session) => {

                console.log(
                    "Supabase auth event:",
                    event
                );

                if (session) {
                    currentUser = session.user;

                    if (
                        event === "SIGNED_IN" ||
                        event === "TOKEN_REFRESHED"
                    ) {
                        showAdmin();
                    }
                } else if (event === "SIGNED_OUT") {
                    currentUser = null;
                    showLogin();
                }
            }
        );

        await checkAuth();

    } catch (error) {
        console.error(
            "Admin startup error:",
            error
        );

        showLogin();
    }

});
                                        </select>
                                    </td>

                                    <td>
                                        ${
                                            item.whatsapp_requested
                                                ? "Yes"
                                                : "No"
                                        }
                                    </td>

                                    <td>
                                        ${formatDateTime(item.created_at)}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            class="delete-btn"
                                            onclick="deleteAppointment('${escapeAttr(item.id)}')"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>

                                ${
                                    item.message
                                        ? `
                                        <tr class="detail-row">
                                            <td colspan="8">
                                                <strong>Message:</strong>
                                                ${escapeHTML(item.message)}
                                            </td>
                                        </tr>
                                        `
                                        : ""
                                }
                            `).join("")}
                        </tbody>
                    </table>
                    `
                    : emptyMessage("No appointment requests yet.")
            }
        </div>
        `;
}

async function updateAppointmentStatus(id, status) {
    if (!id || !status) return;

    try {
        const { error } = await supabaseClient
            .from("appointments")
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;

        showMessage("Appointment status updated.");
    } catch (error) {
        console.error(error);
        showMessage(
            error.message || "Could not update appointment.",
            "error"
        );

        await loadAppointments();
    }
}

async function deleteAppointment(id) {
    if (!id) return;

    const confirmed = confirm(
        "Delete this appointment request permanently?"
    );

    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("appointments")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showMessage("Appointment deleted.");
        await loadAppointments();

    } catch (error) {
        console.error(error);
        showMessage(
            error.message || "Could not delete appointment.",
            "error"
        );
    }
}

/* ============================================================
   CATEGORIES
   ============================================================ */

async function getCategories() {
    const { data, error } = await supabaseClient
        .from("categories")
        .select(`
            id,
            name,
            slug,
            description,
            image_url,
            display_order,
            active
        `)
        .order("display_order", {
            ascending: true
        })
        .order("name", {
            ascending: true
        });

    if (error) throw error;

    return data || [];
}

async function loadCategoriesForSelect() {
    return await getCategories();
}
