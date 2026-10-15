/* ============================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL — MATCHED VERSION
   Works with the current admin.html + existing Supabase schema
   ============================================================ */

let currentUser = null;
let currentModule = "dashboard";
let galleryData = [];

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

    if (loginSection) {
        loginSection.classList.remove("hidden");
        loginSection.style.display = "flex";
    }
    if (adminPanel) {
        adminPanel.classList.add("hidden");
        adminPanel.style.display = "none";
    }

    document.body.classList.remove("admin-logged-in");
}

function showAdmin() {
    const loginSection = $("loginSection");
    const adminPanel = $("adminPanel");

    if (!adminPanel) {
        console.error("adminPanel not found in admin.html");
        return;
    }

    if (loginSection) {
        loginSection.classList.add("hidden");
        loginSection.style.display = "none";
    }

    // admin.html uses `.hidden { display: none !important; }`, so changing
    // only the inline display style cannot reveal this section after login.
    adminPanel.classList.remove("hidden");
    adminPanel.style.display = "block";
    document.body.classList.add("admin-logged-in");

    document.querySelectorAll("[data-admin-email]").forEach(el => {
        el.textContent = currentUser?.email || "";
    });
    if ($("userEmail")) {
        $("userEmail").textContent = currentUser?.email || "";
    }

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

            case "categories":
                await loadManagedModule("categories");
                break;

            case "services":
                await loadServices();
                break;

            case "offers":
                await loadOffers();
                break;

            case "gallery":
                await loadGalleryModule();
                break;

            case "bride_gallery":
                await loadManagedModule("bride_gallery");
                break;

            case "customer_gallery":
                await loadManagedModule("customer_gallery");
                break;

            case "before_after":
                await loadManagedModule("before_after");
                break;

            case "bridal_packages":
                await loadManagedModule("bridal_packages");
                break;

            case "team":
                await loadManagedModule("team");
                break;

            case "testimonials":
                await loadManagedModule("testimonials");
                break;

            case "faqs":
                await loadManagedModule("faqs");
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
    $("moduleContent").innerHTML = `
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
                  onsubmit="saveGalleryImage(event, '${escapeAttr(existing?.id || "")}')">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            id="galleryTitle"
                            value="${escapeAttr(existing?.title || "")}" 
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
                                                src="${escapeAttr(existing.image_url)}"
                                        alt="Current image"
                                    >
                                </div>
                                `
                                : ""
                        }
                    </div>

                    <div class="form-group full-width">

                        <input
                            type="url"
                            id="galleryImageUrl"
                            value="${escapeAttr(existing?.image_url || "")}" 
                            placeholder="https://example.com/image.jpg"
                        >

                        <small>
                            Or paste an image URL. A selected file takes priority.
                        </small>
                    </div>

                    <div class="form-group full-width">
                        <label>Description</label>
                        <textarea id="galleryDescription" rows="3">${escapeHTML(existing?.description || "")}</textarea>
                    </div>

                    <label class="form-field checkbox-field">
                        <input type="checkbox" id="galleryFeatured" ${existing?.featured ? "checked" : ""}>
                        <span>Featured</span>
                    </label>

                    <label class="form-field checkbox-field">
                        <input type="checkbox" id="galleryVisible" ${(existing?.visible ?? true) ? "checked" : ""}>
                        <span>Visible on website</span>
                    </label>

                    <div class="form-group">
                        <label>Display order</label>
                        <input type="number" id="galleryDisplayOrder" min="0" step="1" value="${escapeAttr(existing?.display_order ?? 0)}">
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

        const description =
            document.getElementById("galleryDescription").value.trim();

        const fileInput =
            document.getElementById("galleryImageFile");
        let imageUrl =
            document.getElementById("galleryImageUrl").value.trim() || null;

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

        if (!imageUrl && id) {
            const { data: existingImage, error: existingImageError } = await supabaseClient
                .from("gallery").select("image_url").eq("id", id).single();
            if (existingImageError) throw existingImageError;
            imageUrl = existingImage?.image_url || null;
        }
        if (!imageUrl) {
            throw new Error("Paste an image URL or upload an image from your computer.");
        }

        /* -----------------------------------------
           DATABASE DATA
        ----------------------------------------- */

        const payload = {
            title: title || null,
            description: description || null,
            category: category || "salon",
            image_url: imageUrl,
            featured: document.getElementById("galleryFeatured").checked,
            visible: document.getElementById("galleryVisible").checked,
            display_order: Number(document.getElementById("galleryDisplayOrder").value || 0)
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

    $("moduleContent").innerHTML = `
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


                        <input
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
let imageUrl = null;

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

/* Open the Services module from any existing HTML onclick handler. */
function showServiceForm() {
    currentModule = "services";
    return loadServices();
}

/* ============================================================
   PUBLIC FUNCTIONS USED BY INLINE HTML HANDLERS
   Only export functions that are actually defined in this file.
   ============================================================ */

window.openModule = openModule;
window.showServiceForm = showServiceForm;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.updateAppointmentStatus = updateAppointmentStatus;
window.deleteRecord = deleteRecord;
window.showGalleryForm = showGalleryForm;
window.closeGalleryForm = closeGalleryForm;
window.saveGalleryImage = saveGalleryImage;
window.deleteGalleryImage = deleteGalleryImage;
window.showOfferForm = showOfferForm;
window.closeOfferForm = closeOfferForm;
window.saveOffer = saveOffer;
window.deleteOffer = deleteOffer;
window.saveSettings = saveSettings;

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

/* ============================================================
   SHARED CONTENT MANAGER
   The public page reads these same tables. Keep the admin forms
   aligned with the columns and visibility flags it expects.
   ============================================================ */

const ADMIN_MANAGED_MODULES = {
    categories: {
        table: "categories",
        title: "Categories",
        description: "Organize the services shown on the website.",
        titleField: "name",
        orderBy: "display_order",
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "slug", label: "Slug", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "url" },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 },
            { name: "active", label: "Active on website", type: "checkbox", defaultValue: true }
        ]
    },
    gallery: {
        table: "gallery",
        title: "Our Work",
        description: "Manage portfolio images displayed in the main gallery.",
        titleField: "title",
        orderBy: "display_order",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "url", required: true },
            { name: "category", label: "Category", type: "text", defaultValue: "salon" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "visible", label: "Visible on website", type: "checkbox", defaultValue: true },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 }
        ]
    },
    bride_gallery: {
        table: "bride_gallery",
        title: "Bride & Girls",
        description: "Manage bridal and makeup portfolio photos.",
        titleField: "title",
        orderBy: "display_order",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "url", required: true },
            { name: "category", label: "Category", type: "text", defaultValue: "bridal" },
            { name: "photo_date", label: "Photo date", type: "date" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "visible", label: "Visible on website", type: "checkbox", defaultValue: true },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 }
        ]
    },
    customer_gallery: {
        table: "customer_gallery",
        title: "Customers",
        description: "Publish customer photos only when consent has been given.",
        titleField: "customer_name",
        orderBy: "display_order",
        fields: [
            { name: "customer_name", label: "Customer name", type: "text", required: true },
            { name: "photo_url", label: "Photo URL", type: "url", required: true },
            { name: "service", label: "Service", type: "text" },
            { name: "testimonial", label: "Testimonial", type: "textarea" },
            { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
            { name: "photo_date", label: "Photo date", type: "date" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "visible", label: "Visible on website", type: "checkbox" },
            { name: "consent_given", label: "Customer consent received", type: "checkbox" },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 }
        ]
    },
    before_after: {
        table: "before_after",
        title: "Before / After",
        description: "Manage transformation photos displayed on the website.",
        titleField: "title",
        orderBy: "display_order",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "before_image_url", label: "Before image URL", type: "url", required: true },
            { name: "after_image_url", label: "After image URL", type: "url", required: true },
            { name: "category", label: "Category", type: "text" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "visible", label: "Visible on website", type: "checkbox", defaultValue: true },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 }
        ]
    },
    bridal_packages: {
        table: "bridal_packages",
        title: "Bridal Packages",
        description: "Manage package details and prices.",
        titleField: "name",
        orderBy: "display_order",
        fields: [
            { name: "name", label: "Package name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "url" },
            { name: "price", label: "Price", type: "number", min: 0, step: "0.01" },
            { name: "price_label", label: "Price label", type: "text" },
            { name: "included_services", label: "Included services", type: "textarea" },
            { name: "duration", label: "Duration", type: "text" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "active", label: "Active on website", type: "checkbox", defaultValue: true },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 }
        ]
    },
    team: {
        table: "team",
        title: "Team",
        description: "Manage the team members shown on the website.",
        titleField: "name",
        orderBy: "display_order",
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "role", label: "Role", type: "text" },
            { name: "bio", label: "Bio", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "url" },
            { name: "instagram_url", label: "Instagram URL", type: "url" },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 },
            { name: "active", label: "Active on website", type: "checkbox", defaultValue: true }
        ]
    },
    testimonials: {
        table: "testimonials",
        title: "Testimonials",
        description: "Review and publish customer testimonials.",
        titleField: "customer_name",
        orderBy: "created_at",
        ascending: false,
        fields: [
            { name: "customer_name", label: "Customer name", type: "text", required: true },
            { name: "testimonial", label: "Testimonial", type: "textarea", required: true },
            { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
            { name: "image_url", label: "Image URL", type: "url" },
            { name: "service", label: "Service", type: "text" },
            { name: "featured", label: "Featured", type: "checkbox" },
            { name: "visible", label: "Visible on website", type: "checkbox", defaultValue: true }
        ]
    },
    faqs: {
        table: "faqs",
        title: "FAQs",
        description: "Manage questions and answers shown on the website.",
        titleField: "question",
        orderBy: "display_order",
        fields: [
            { name: "question", label: "Question", type: "text", required: true },
            { name: "answer", label: "Answer", type: "textarea", required: true },
            { name: "display_order", label: "Display order", type: "number", defaultValue: 0 },
            { name: "active", label: "Active on website", type: "checkbox", defaultValue: true }
        ]
    }
};

const managedRecordsByModule = Object.create(null);

function managedFieldMarkup(field, record) {
    const hasSavedValue = record && Object.prototype.hasOwnProperty.call(record, field.name);
    const value = hasSavedValue ? record[field.name] : (field.defaultValue ?? "");
    const required = field.required ? "required" : "";
    const numberAttrs = field.type === "number"
        ? `${field.min !== undefined ? ` min="${escapeAttr(field.min)}"` : ""}${field.max !== undefined ? ` max="${escapeAttr(field.max)}"` : ""} step="${escapeAttr(field.step ?? "1")}"`
        : "";

    if (field.type === "checkbox") {
        const checked = Boolean(value) ? "checked" : "";
        return `
            <label class="form-field checkbox-field">
                <input type="checkbox" name="${escapeAttr(field.name)}" ${checked}>
                <span>${escapeHTML(field.label)}</span>
            </label>
        `;
    }

    if (field.type === "textarea") {
        return `
            <label class="form-field">
                <span>${escapeHTML(field.label)}${field.required ? " *" : ""}</span>
                <textarea name="${escapeAttr(field.name)}" rows="4" ${required}>${escapeHTML(value ?? "")}</textarea>
            </label>
        `;
    }

    return `
        <label class="form-field">
            <span>${escapeHTML(field.label)}${field.required ? " *" : ""}</span>
            <input type="${escapeAttr(field.type)}" name="${escapeAttr(field.name)}" value="${escapeAttr(value ?? "")}"${numberAttrs} ${required}>
        </label>
    `;
}

function renderManagedRecordForm(moduleName, record = null) {
    const spec = ADMIN_MANAGED_MODULES[moduleName];
    const area = $("managedRecordFormArea");
    if (!spec || !area) return;
    const singular = {
        categories: "Category",
        gallery: "Gallery image",
        bride_gallery: "Gallery image",
        customer_gallery: "Customer photo",
        before_after: "Transformation",
        bridal_packages: "Bridal package",
        team: "Team member",
        testimonials: "Testimonial",
        faqs: "FAQ"
    }[moduleName] || spec.title;

    area.innerHTML = `
        <div class="admin-form-card">
            <h3>${record ? "Edit" : "Add"} ${escapeHTML(singular)}</h3>
            <form id="managedRecordForm">
                <input type="hidden" name="record_id" value="${escapeAttr(record?.id || "")}">
                <div class="form-grid">
                    ${spec.fields.map(field => managedFieldMarkup(field, record)).join("")}
                </div>
                <div class="form-actions">
                    <button class="primary-btn" type="submit">${record ? "Save changes" : "Add record"}</button>
                    ${record ? `<button class="secondary-btn" type="button" id="cancelManagedEdit">Cancel</button>` : ""}
                </div>
            </form>
        </div>
    `;

    $("managedRecordForm")?.addEventListener("submit", event => saveManagedRecord(event, moduleName));
    $("cancelManagedEdit")?.addEventListener("click", () => renderManagedRecordForm(moduleName));
}

function managedRecordCard(moduleName, record) {
    const spec = ADMIN_MANAGED_MODULES[moduleName];
    const imageField = spec.fields.find(field => ["image_url", "photo_url", "before_image_url"].includes(field.name));
    const image = imageField ? record[imageField.name] : null;
    const title = record[spec.titleField] || "Untitled";
    const detailFields = spec.fields.filter(field =>
        field.name !== spec.titleField &&
        !["description", "bio", "testimonial", "answer", "image_url", "photo_url", "before_image_url", "after_image_url"].includes(field.name)
    ).slice(0, 4);
    const details = detailFields.map(field => {
        const value = record[field.name];
        if (value === null || value === undefined || value === "") return "";
        const shown = field.type === "checkbox" ? (value ? "Yes" : "No") : String(value);
        return `<span><strong>${escapeHTML(field.label)}:</strong> ${escapeHTML(shown)}</span>`;
    }).join("");
    const flags = ["active", "visible", "consent_given"].filter(key => Object.prototype.hasOwnProperty.call(record, key));
    const badges = flags.map(key => `<span class="badge">${escapeHTML(key.replaceAll("_", " "))}: ${record[key] ? "Yes" : "No"}</span>`).join(" ");

    return `
        <article class="admin-card">
            ${image ? `<img class="admin-card-image" src="${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy" onerror="this.style.display='none'">` : ""}
            <div class="admin-card-body">
                <h3>${escapeHTML(title)}</h3>
                ${record.description ? `<p>${escapeHTML(record.description)}</p>` : ""}
                ${record.testimonial ? `<p>${escapeHTML(record.testimonial)}</p>` : ""}
                ${details ? `<div class="managed-record-details">${details}</div>` : ""}
                ${badges ? `<div class="managed-record-badges">${badges}</div>` : ""}
                <div class="admin-card-actions">
                    <button type="button" class="secondary-btn" data-managed-edit="${escapeAttr(record.id)}">Edit</button>
                    <button type="button" class="danger-btn" data-managed-delete="${escapeAttr(record.id)}">Delete</button>
                </div>
            </div>
        </article>
    `;
}

async function loadManagedModule(moduleName) {
    const spec = ADMIN_MANAGED_MODULES[moduleName];
    const container = $("moduleContent");
    if (!spec || !container) return;

    container.innerHTML = `<div class="module-loading">Loading ${escapeHTML(spec.title)}...</div>`;

    let request = supabaseClient.from(spec.table).select("*");
    if (spec.orderBy) {
        request = request.order(spec.orderBy, { ascending: spec.ascending ?? true });
    }

    const { data, error } = await request;
    if (error) throw error;

    managedRecordsByModule[moduleName] = data || [];
    container.innerHTML = `
        ${moduleHeader(spec.title, spec.description)}
        <div id="managedRecordFormArea"></div>
        <div class="admin-grid">
            ${managedRecordsByModule[moduleName].length
                ? managedRecordsByModule[moduleName].map(record => managedRecordCard(moduleName, record)).join("")
                : emptyMessage(`No ${spec.title.toLowerCase()} added yet.`)}
        </div>
    `;

    renderManagedRecordForm(moduleName);

    container.querySelectorAll("[data-managed-edit]").forEach(button => {
        button.addEventListener("click", () => {
            const record = managedRecordsByModule[moduleName].find(item => String(item.id) === button.dataset.managedEdit);
            if (record) renderManagedRecordForm(moduleName, record);
        });
    });

    container.querySelectorAll("[data-managed-delete]").forEach(button => {
        button.addEventListener("click", () => deleteRecord(spec.table, button.dataset.managedDelete));
    });
}

async function saveManagedRecord(event, moduleName) {
    event.preventDefault();
    const spec = ADMIN_MANAGED_MODULES[moduleName];
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const recordId = String(formData.get("record_id") || "");
    const payload = {};

    for (const field of spec.fields) {
        if (field.type === "checkbox") {
            payload[field.name] = formData.has(field.name);
            continue;
        }

        const raw = String(formData.get(field.name) ?? "").trim();
        if (!raw) {
            payload[field.name] = null;
        } else if (field.type === "number") {
            const parsed = Number(raw);
            if (!Number.isFinite(parsed)) {
                showMessage(`${field.label} must be a number.`, "error");
                return;
            }
            payload[field.name] = parsed;
        } else {
            payload[field.name] = raw;
        }
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    try {
        let request = supabaseClient.from(spec.table);
        request = recordId
            ? request.update(payload).eq("id", recordId)
            : request.insert(payload);
        const { error } = await request;
        if (error) throw error;

        const singular = {
            categories: "Category",
            gallery: "Gallery image",
            bride_gallery: "Gallery image",
            customer_gallery: "Customer photo",
            before_after: "Transformation",
            bridal_packages: "Bridal package",
            team: "Team member",
            testimonials: "Testimonial",
            faqs: "FAQ"
        }[moduleName] || spec.title;
        showMessage(`${singular} ${recordId ? "updated" : "added"}.`);
        await loadManagedModule(moduleName);
    } catch (error) {
        console.error(`Save ${spec.table} record error:`, error);
        showMessage(error.message || `Could not save ${spec.title.toLowerCase()}.`, "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = recordId ? "Save changes" : "Add record";
        }
    }
}

async function loadCategoriesForSelect() {
    return await getCategories();
}
