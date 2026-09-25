// ============================================================
// MANJU'S THE WORLD OF GLAMOUR
// ADMIN PANEL
// ============================================================

const supabaseClient = window.supabaseClient;

let currentUser = null;
let currentModule = "dashboard";

const moduleArea = document.getElementById("moduleArea");
const moduleContent = document.getElementById("moduleContent");

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");


// ============================================================
// AUTH
// ============================================================

async function checkAuth() {
    if (!window.supabaseClient) {
        console.error("Supabase client not found.");
        return;
    }

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Auth session error:", error);
        showLogin();
        return;
    }

    if (session) {
        currentUser = session.user;
        showAdmin();
    } else {
        showLogin();
    }
}


function showLogin() {
    if (loginSection) {
        loginSection.style.display = "flex";
    }

    if (adminPanel) {
        adminPanel.style.display = "none";
    }
}


function showAdmin() {
    if (loginSection) {
        loginSection.style.display = "none";
    }

    if (adminPanel) {
        adminPanel.style.display = "block";
    }

    openModule("dashboard");
}


async function handleLogin(event) {
    event.preventDefault();

    const email = adminEmail?.value?.trim();
    const password = adminPassword?.value || "";

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            console.error("Login error:", error);
            alert(error.message);
            return;
        }

        currentUser = data.user;
        showAdmin();

    } catch (error) {
        console.error(error);
        alert("Login failed. Please try again.");
    }
}


async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error("Logout error:", error);
    }
}


// ============================================================
// HELPERS
// ============================================================

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


function showMessage(message, type = "success") {
    const existing = document.getElementById("adminMessage");

    if (existing) {
        existing.remove();
    }

    const box = document.createElement("div");
    box.id = "adminMessage";

    box.textContent = message;

    box.style.padding = "12px 16px";
    box.style.margin = "15px 0";
    box.style.borderRadius = "10px";
    box.style.fontSize = "14px";

    if (type === "error") {
        box.style.background = "#fee2e2";
        box.style.color = "#991b1b";
    } else {
        box.style.background = "#dcfce7";
        box.style.color = "#166534";
    }

    moduleContent?.prepend(box);

    setTimeout(() => {
        box.remove();
    }, 4000);
}


async function deleteRecord(table, id) {
    if (!id) return;

    const confirmed = confirm(
        "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Delete error:", error);
        showMessage(error.message, "error");
        return;
    }

    showMessage("Deleted successfully.");
    openModule(currentModule);
}


// ============================================================
// MODULE ROUTER
// ============================================================

async function openModule(moduleName) {
    currentModule = moduleName;

    if (!moduleContent) return;

    moduleContent.innerHTML = `
        <div style="padding:40px;text-align:center;">
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
                await loadImageGallery(
                    "gallery",
                    "Gallery",
                    "gallery",
                    "Upload work/gallery images."
                );
                break;

            case "bride_gallery":
                await loadImageGallery(
                    "bride_gallery",
                    "Bride Gallery",
                    "bride-gallery",
                    "Upload bridal/before wedding images."
                );
                break;

            case "customer_gallery":
                await loadImageGallery(
                    "customer_gallery",
                    "Customer Gallery",
                    "customer-gallery",
                    "Upload customer photos."
                );
                break;

            case "before_after":
                await loadBeforeAfter();
                break;

            case "bridal_packages":
                await loadBridalPackages();
                break;

            case "team":
                await loadSimpleTable(
                    "team",
                    "Team",
                    "Add team members and artists."
                );
                break;

            case "testimonials":
                await loadSimpleTable(
                    "testimonials",
                    "Testimonials",
                    "Manage customer reviews."
                );
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
            <div style="padding:30px;">
                <h3>Something went wrong</h3>
                <p>${escapeHTML(error.message)}</p>
                <p>Check the browser console for more details.</p>
            </div>
        `;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

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

    moduleContent.innerHTML = `
        <div class="admin-module">

            <div class="module-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>Manage Manju's The World of Glamour.</p>
                </div>
            </div>

            <div class="dashboard-grid">

                <div class="dashboard-card"
                     data-open-module="appointments">
                    <h3>${counts.appointments}</h3>
                    <p>Appointments</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="services">
                    <h3>${counts.services}</h3>
                    <p>Services</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="offers">
                    <h3>${counts.offers}</h3>
                    <p>Offers</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="gallery">
                    <h3>${counts.gallery}</h3>
                    <p>Gallery</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="bride_gallery">
                    <h3>${counts.bride_gallery}</h3>
                    <p>Bride Gallery</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="customer_gallery">
                    <h3>${counts.customer_gallery}</h3>
                    <p>Customer Gallery</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="before_after">
                    <h3>${counts.before_after}</h3>
                    <p>Before / After</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="bridal_packages">
                    <h3>${counts.bridal_packages}</h3>
                    <p>Bridal Packages</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="team">
                    <h3>${counts.team}</h3>
                    <p>Team</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="testimonials">
                    <h3>${counts.testimonials}</h3>
                    <p>Testimonials</p>
                </div>

                <div class="dashboard-card"
                     data-open-module="faqs">
                    <h3>${counts.faqs}</h3>
                    <p>FAQs</p>
                </div>

            </div>

        </div>
    `;

    moduleContent
        .querySelectorAll("[data-open-module]")
        .forEach(card => {
            card.addEventListener("click", () => {
                openModule(card.dataset.openModule);
            });
        });
}


// ============================================================
// APPOINTMENTS
// ============================================================

async function loadAppointments() {

    const { data, error } = await supabaseClient
        .from("appointments")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error("Appointments error:", error);
        moduleContent.innerHTML = `
            <h2>Appointments</h2>
            <p>${escapeHTML(error.message)}</p>
        `;
        return;
    }

    moduleContent.innerHTML = `
        <div class="admin-module">

            <div class="module-header">
                <div>
                    <h2>Appointments</h2>
                    <p>Customer booking requests.</p>
                </div>
            </div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">
                    <table class="admin-table">
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
                                        ${escapeHTML(
                                            item.name ||
                                            item.customer_name ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.phone || "—")}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.service ||
                                            item.service_name ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.date || "—")}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.time || "—")}
                                    </td>

                                    <td>

                                        <select
                                            class="appointment-status"
                                            data-id="${item.id}"
                                        >

                                            ${[
                                                "New",
                                                "Confirmed",
                                                "Completed",
                                                "Cancelled"
                                            ].map(status => `
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
                                            `).join("")}

                                        </select>

                                    </td>

                                    <td>
                                        ${formatDateTime(item.created_at)}
                                    </td>

                                    <td>
                                        <button
                                            class="delete-btn"
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
                `
                : `
                    <div class="empty-state">
                        No appointment requests yet.
                    </div>
                `
            }

        </div>
    `;

    moduleContent
        .querySelectorAll(".appointment-status")
        .forEach(select => {

            select.addEventListener("change", async event => {

                const id = event.target.dataset.id;
                const status = event.target.value;

                const { error } = await supabaseClient
                    .from("appointments")
                    .update({ status })
                    .eq("id", id);

                if (error) {
                    console.error(error);
                    alert(error.message);
                    return;
                }

                showMessage("Appointment status updated.");
            });
        });

    attachDeleteButtons();
}


// ============================================================
// SERVICES
// ============================================================

async function loadServices() {

    const { data, error } = await supabaseClient
        .from("services")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error("Services error:", error);

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>Services</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `
        <div class="admin-module">

            <div class="module-header">
                <div>
                    <h2>Services</h2>
                    <p>Manage beauty and salon services.</p>
                </div>

                <button id="addServiceBtn" class="primary-btn">
                    + Add Service
                </button>
            </div>

            <div id="serviceFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Duration</th>
                                <th>Active</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${data.map(item => `
                                <tr>

                                    <td>
                                        ${escapeHTML(item.name)}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.category || "—")}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.price || "—")}
                                    </td>

                                    <td>
                                        ${escapeHTML(item.duration || "—")}
                                    </td>

                                    <td>
                                        ${item.active !== false
                                            ? "Yes"
                                            : "No"}
                                    </td>

                                    <td>
                                        <button
                                            class="delete-btn"
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
                `
                : `
                    <div class="empty-state">
                        No services added yet.
                    </div>
                `
            }

        </div>
    `;

    document
        .getElementById("addServiceBtn")
        ?.addEventListener("click", () => {
            showServiceForm();
        });

    attachDeleteButtons();
}


function showServiceForm(service = null) {

    const area = document.getElementById("serviceFormArea");

    if (!area) return;

    area.innerHTML = `
        <div class="admin-form-card">

            <h3>
                ${service ? "Edit Service" : "Add Service"}
            </h3>

            <form id="serviceForm">

                <div class="form-grid">

                    <div>
                        <label>Service Name</label>
                        <input
                            id="serviceName"
                            required
                            value="${escapeHTML(service?.name || "")}"
                        >
                    </div>

                    <div>
                        <label>Category</label>

                        <select id="serviceCategory">

                            <option value="bridal"
                                ${service?.category === "bridal"
                                    ? "selected" : ""}>
                                Bridal
                            </option>

                            <option value="makeup"
                                ${service?.category === "makeup"
                                    ? "selected" : ""}>
                                Makeup
                            </option>

                            <option value="hair"
                                ${service?.category === "hair"
                                    ? "selected" : ""}>
                                Hair
                            </option>

                            <option value="skin"
                                ${service?.category === "skin"
                                    ? "selected" : ""}>
                                Skin
                            </option>

                            <option value="nails"
                                ${service?.category === "nails"
                                    ? "selected" : ""}>
                                Nails
                            </option>

                            <option value="spa"
                                ${service?.category === "spa"
                                    ? "selected" : ""}>
                                Spa
                            </option>

                        </select>

                    </div>

                    <div>
                        <label>Price</label>
                        <input
                            id="servicePrice"
                            value="${escapeHTML(service?.price || "")}"
                            placeholder="Price on enquiry"
                        >
                    </div>

                    <div>
                        <label>Duration</label>
                        <input
                            id="serviceDuration"
                            value="${escapeHTML(service?.duration || "")}"
                            placeholder="1 hour"
                        >
                    </div>

                </div>

                <div>
                    <label>Description</label>
                    <textarea
                        id="serviceDescription"
                        rows="4"
                    >${escapeHTML(service?.description || "")}</textarea>
                </div>

                <div>
                    <label>
                        <input
                            type="checkbox"
                            id="serviceActive"
                            ${service?.active !== false ? "checked" : ""}
                        >
                        Active
                    </label>
                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Service
                    </button>

                    <button
                        type="button"
                        id="cancelServiceBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    document
        .getElementById("cancelServiceBtn")
        ?.addEventListener("click", () => {
            area.innerHTML = "";
        });

    document
        .getElementById("serviceForm")
        ?.addEventListener("submit", async event => {

            event.preventDefault();

            const payload = {
                name: document
                    .getElementById("serviceName")
                    .value
                    .trim(),

                category: document
                    .getElementById("serviceCategory")
                    .value,

                price: document
                    .getElementById("servicePrice")
                    .value
                    .trim(),

                duration: document
                    .getElementById("serviceDuration")
                    .value
                    .trim(),

                description: document
                    .getElementById("serviceDescription")
                    .value
                    .trim(),

                active: document
                    .getElementById("serviceActive")
                    .checked
            };

            const { error } = service?.id
                ? await supabaseClient
                    .from("services")
                    .update(payload)
                    .eq("id", service.id)

                : await supabaseClient
                    .from("services")
                    .insert(payload);

            if (error) {
                console.error("Service save error:", error);
                showMessage(error.message, "error");
                return;
            }

            showMessage("Service saved successfully.");
            loadServices();
        });
}


// ============================================================
// OFFERS
// ============================================================

async function loadOffers() {

    const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Offers error:", error);

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>Offers</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `
        <div class="admin-module">

            <div class="module-header">

                <div>
                    <h2>Offers</h2>
                    <p>Manage special offers and promotions.</p>
                </div>

                <button
                    id="addOfferBtn"
                    class="primary-btn"
                >
                    + Add Offer
                </button>

            </div>

            <div id="offerFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Original Price</th>
                                <th>Offer Price</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Active</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${data.map(item => `
                                <tr>

                                    <td>
                                        ${escapeHTML(item.name)}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.original_price || "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.offer_price || "—"
                                        )}
                                    </td>

                                    <td>
                                        ${formatDate(item.start_date)}
                                    </td>

                                    <td>
                                        ${formatDate(item.end_date)}
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
                                            class="delete-btn"
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
                `
                : `
                    <div class="empty-state">
                        No offers added yet.
                    </div>
                `
            }

        </div>
    `;

    document
        .getElementById("addOfferBtn")
        ?.addEventListener("click", () => {
            showOfferForm();
        });

    attachDeleteButtons();
}


function showOfferForm(offer = null) {

    const area = document.getElementById("offerFormArea");

    if (!area) return;

    area.innerHTML = `
        <div class="admin-form-card">

            <h3>
                ${offer ? "Edit Offer" : "Add Offer"}
            </h3>

            <form id="offerForm">

                <div class="form-grid">

                    <div>
                        <label>Offer Name</label>

                        <input
                            id="offerName"
                            required
                            value="${escapeHTML(
                                offer?.name || ""
                            )}"
                        >
                    </div>

                    <div>
                        <label>Original Price</label>

                        <input
                            id="offerOriginalPrice"
                            value="${escapeHTML(
                                offer?.original_price || ""
                            )}"
                        >
                    </div>

                    <div>
                        <label>Offer Price</label>

                        <input
                            id="offerPrice"
                            value="${escapeHTML(
                                offer?.offer_price || ""
                            )}"
                        >
                    </div>

                    <div>
                        <label>Start Date</label>

                        <input
                            type="date"
                            id="offerStartDate"
                            value="${
                                offer?.start_date
                                ? String(
                                    offer.start_date
                                ).slice(0, 10)
                                : ""
                            }"
                        >
                    </div>

                    <div>
                        <label>End Date</label>

                        <input
                            type="date"
                            id="offerEndDate"
                            value="${
                                offer?.end_date
                                ? String(
                                    offer.end_date
                                ).slice(0, 10)
                                : ""
                            }"
                        >
                    </div>

                </div>

                <div>
                    <label>Description</label>

                    <textarea
                        id="offerDescription"
                        rows="4"
                    >${escapeHTML(
                        offer?.description || ""
                    )}</textarea>
                </div>

                <div>
                    <label>Terms</label>

                    <textarea
                        id="offerTerms"
                        rows="3"
                    >${escapeHTML(
                        offer?.terms || ""
                    )}</textarea>
                </div>

                <div>

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

                        Active

                    </label>

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Offer
                    </button>

                    <button
                        type="button"
                        id="cancelOfferBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    document
        .getElementById("cancelOfferBtn")
        ?.addEventListener("click", () => {
            area.innerHTML = "";
        });

    document
        .getElementById("offerForm")
        ?.addEventListener("submit", async event => {

            event.preventDefault();

            const payload = {

                name: document
                    .getElementById("offerName")
                    .value
                    .trim(),

                original_price: document
                    .getElementById("offerOriginalPrice")
                    .value
                    .trim(),

                offer_price: document
                    .getElementById("offerPrice")
                    .value
                    .trim(),

                start_date:
                    document.getElementById(
                        "offerStartDate"
                    ).value || null,

                end_date:
                    document.getElementById(
                        "offerEndDate"
                    ).value || null,

                description:
                    document.getElementById(
                        "offerDescription"
                    ).value.trim(),

                terms:
                    document.getElementById(
                        "offerTerms"
                    ).value.trim(),

                active:
                    document.getElementById(
                        "offerActive"
                    ).checked
            };

            const { error } = offer?.id

                ? await supabaseClient
                    .from("offers")
                    .update(payload)
                    .eq("id", offer.id)

                : await supabaseClient
                    .from("offers")
                    .insert(payload);

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

            loadOffers();
        });
}


// ============================================================
// GALLERY
// ============================================================

async function loadImageGallery(
    table,
    title,
    bucket,
    description
) {

    const { data, error } = await supabaseClient
        .from(table)
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            `${table} error:`,
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>${escapeHTML(title)}</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `
        <div class="admin-module">

            <div class="module-header">

                <div>
                    <h2>${escapeHTML(title)}</h2>

                    <p>
                        ${escapeHTML(description)}
                    </p>
                </div>

                <button
                    id="addGalleryBtn"
                    class="primary-btn"
                >
                    + Add Image
                </button>

            </div>

            <div id="galleryFormArea"></div>

            ${
                data?.length
                ? `
                    <div class="admin-gallery-grid">

                        ${data.map(item => `

                            <div class="admin-gallery-card">

                                ${
                                    item.image_url
                                    ? `
                                    <img
                                        src="${escapeHTML(
                                            item.image_url
                                        )}"
                                        alt="${escapeHTML(
                                            item.title ||
                                            item.name ||
                                            ""
                                        )}"
                                    >
                                    `
                                    : `
                                    <div class="no-image">
                                        No Image
                                    </div>
                                    `
                                }

                                <div class="admin-gallery-info">

                                    <h4>
                                        ${escapeHTML(
                                            item.title ||
                                            item.name ||
                                            "Untitled"
                                        )}
                                    </h4>

                                    ${
                                        item.category
                                        ? `
                                        <p>
                                            ${escapeHTML(
                                                item.category
                                            )}
                                        </p>
                                        `
                                        : ""
                                    }

                                    ${
                                        item.description
                                        ? `
                                        <p>
                                            ${escapeHTML(
                                                item.description
                                            )}
                                        </p>
                                        `
                                        : ""
                                    }

                                    <button
                                        class="delete-btn"
                                        data-delete-table="${table}"
                                        data-delete-id="${item.id}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

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

    document
        .getElementById("addGalleryBtn")
        ?.addEventListener("click", () => {

            showGalleryForm(
                table,
                bucket
            );

        });

    attachDeleteButtons();
}


function showGalleryForm(table, bucket) {

    const area =
        document.getElementById(
            "galleryFormArea"
        );

    if (!area) return;

    area.innerHTML = `

        <div class="admin-form-card">

            <h3>Add Gallery Image</h3>

            <form id="galleryForm">

                <div class="form-grid">

                    <div>

                        <label>Title</label>

                        <input
                            id="galleryTitle"
                            required
                        >

                    </div>

                    <div>

                        <label>Category</label>

                        <input
                            id="galleryCategory"
                            placeholder="Bridal, Makeup, Hair..."
                        >

                    </div>

                    <div>

                        <label>Date</label>

                        <input
                            type="date"
                            id="galleryDate"
                        >

                    </div>

                </div>

                <div>

                    <label>Description</label>

                    <textarea
                        id="galleryDescription"
                        rows="4"
                    ></textarea>

                </div>

                <div>

                    <label>Photo</label>

                    <input
                        type="file"
                        id="galleryFile"
                        accept="image/jpeg,image/png,image/webp"
                        required
                    >

                </div>

                <div>

                    <label>

                        <input
                            type="checkbox"
                            id="galleryFeatured"
                        >

                        Featured

                    </label>

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Upload Image
                    </button>

                    <button
                        type="button"
                        id="cancelGalleryBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `;

    document
        .getElementById("cancelGalleryBtn")
        ?.addEventListener("click", () => {
            area.innerHTML = "";
        });

    document
        .getElementById("galleryForm")
        ?.addEventListener("submit", async event => {

            event.preventDefault();

            await uploadGalleryImage(
                table,
                bucket
            );

        });
}


// ============================================================
// STORAGE UPLOAD
// ============================================================

async function uploadFile(
    bucket,
    file
) {

    if (!file) {
        throw new Error(
            "Please select an image."
        );
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error(
            "Maximum file size is 10 MB."
        );
    }

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

    const extension =
        file.name.split(".").pop();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}.${extension}`;

    const path = fileName;

    const {
        error
    } = await supabaseClient.storage
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
    } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
}


async function uploadGalleryImage(
    table,
    bucket
) {

    try {

        const title =
            document
                .getElementById(
                    "galleryTitle"
                )
                .value
                .trim();

        const category =
            document
                .getElementById(
                    "galleryCategory"
                )
                .value
                .trim();

        const description =
            document
                .getElementById(
                    "galleryDescription"
                )
                .value
                .trim();

        const date =
            document
                .getElementById(
                    "galleryDate"
                )
                .value || null;

        const featured =
            document
                .getElementById(
                    "galleryFeatured"
                )
                .checked;

        const file =
            document
                .getElementById(
                    "galleryFile"
                )
                .files[0];

        if (!title) {
            alert("Please enter a title.");
            return;
        }

        const imageUrl =
            await uploadFile(
                bucket,
                file
            );

        const payload = {
            title,
            category,
            description,
            date,
            featured,
            image_url: imageUrl
        };

        const {
            error
        } = await supabaseClient
            .from(table)
            .insert(payload);

        if (error) {
            throw error;
        }

        showMessage(
            "Image uploaded successfully."
        );

        loadImageGallery(
            table,
            table === "gallery"
                ? "Gallery"
                : table === "bride_gallery"
                    ? "Bride Gallery"
                    : "Customer Gallery",
            bucket,
            "Manage uploaded images."
        );

    } catch (error) {

        console.error(
            "Gallery upload error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );
    }
}


// ============================================================
// BEFORE / AFTER
// ============================================================

async function loadBeforeAfter() {

    const { data, error } = await supabaseClient
        .from("before_after")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Before/After error:",
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>Before / After</h2>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>
                    <h2>Before / After</h2>
                    <p>
                        Upload transformation images.
                    </p>
                </div>

                <button
                    id="addBeforeAfterBtn"
                    class="primary-btn"
                >
                    + Add Transformation
                </button>

            </div>

            <div id="beforeAfterFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-gallery-grid">

                    ${data.map(item => `

                        <div class="admin-gallery-card">

                            <div class="before-after-preview">

                                ${
                                    item.before_image_url
                                    ? `
                                    <img
                                        src="${escapeHTML(
                                            item.before_image_url
                                        )}"
                                        alt="Before"
                                    >
                                    `
                                    : ""
                                }

                                ${
                                    item.after_image_url
                                    ? `
                                    <img
                                        src="${escapeHTML(
                                            item.after_image_url
                                        )}"
                                        alt="After"
                                    >
                                    `
                                    : ""
                                }

                            </div>

                            <div class="admin-gallery-info">

                                <h4>
                                    ${escapeHTML(
                                        item.title ||
                                        "Transformation"
                                    )}
                                </h4>

                                <button
                                    class="delete-btn"
                                    data-delete-table="before_after"
                                    data-delete-id="${item.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `).join("")}

                </div>
                `
                : `
                    <div class="empty-state">
                        No before/after images yet.
                    </div>
                `
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

    if (!area) return;

    area.innerHTML = `

        <div class="admin-form-card">

            <h3>Add Before / After</h3>

            <form id="beforeAfterForm">

                <div>

                    <label>Title</label>

                    <input
                        id="beforeAfterTitle"
                        required
                    >

                </div>

                <div>

                    <label>Before Image</label>

                    <input
                        type="file"
                        id="beforeImage"
                        accept="image/jpeg,image/png,image/webp"
                        required
                    >

                </div>

                <div>

                    <label>After Image</label>

                    <input
                        type="file"
                        id="afterImage"
                        accept="image/jpeg,image/png,image/webp"
                        required
                    >

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Upload
                    </button>

                    <button
                        type="button"
                        id="cancelBeforeAfterBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>

    `;

    document
        .getElementById(
            "cancelBeforeAfterBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    document
        .getElementById(
            "beforeAfterForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                try {

                    const title =
                        document
                            .getElementById(
                                "beforeAfterTitle"
                            )
                            .value
                            .trim();

                    const beforeFile =
                        document
                            .getElementById(
                                "beforeImage"
                            )
                            .files[0];

                    const afterFile =
                        document
                            .getElementById(
                                "afterImage"
                            )
                            .files[0];

                    const beforeUrl =
                        await uploadFile(
                            "before-after",
                            beforeFile
                        );

                    const afterUrl =
                        await uploadFile(
                            "before-after",
                            afterFile
                        );

                    const {
                        error
                    } = await supabaseClient
                        .from(
                            "before_after"
                        )
                        .insert({
                            title,
                            before_image_url:
                                beforeUrl,
                            after_image_url:
                                afterUrl
                        });

                    if (error) {
                        throw error;
                    }

                    showMessage(
                        "Before/After saved successfully."
                    );

                    loadBeforeAfter();

                } catch (error) {

                    console.error(
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


// ============================================================
// BRIDAL PACKAGES
// ============================================================

async function loadBridalPackages() {

    const { data, error } =
        await supabaseClient
            .from("bridal_packages")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Bridal packages error:",
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>Bridal Packages</h2>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>
                    <h2>Bridal Packages</h2>

                    <p>
                        Manage bridal packages.
                    </p>
                </div>

                <button
                    id="addBridalPackageBtn"
                    class="primary-btn"
                >
                    + Add Package
                </button>

            </div>

            <div id="bridalPackageFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>

                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${data.map(item => `

                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            item.name
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.description ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.price ||
                                            "—"
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            class="delete-btn"
                                            data-delete-table="bridal_packages"
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
                `
                : `
                    <div class="empty-state">
                        No bridal packages yet.
                    </div>
                `
            }

        </div>

    `;

    document
        .getElementById(
            "addBridalPackageBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                showBridalPackageForm();
            }
        );

    attachDeleteButtons();
}


function showBridalPackageForm() {

    const area =
        document.getElementById(
            "bridalPackageFormArea"
        );

    if (!area) return;

    area.innerHTML = `

        <div class="admin-form-card">

            <h3>Add Bridal Package</h3>

            <form id="bridalPackageForm">

                <div>

                    <label>Package Name</label>

                    <input
                        id="bridalPackageName"
                        required
                    >

                </div>

                <div>

                    <label>Description</label>

                    <textarea
                        id="bridalPackageDescription"
                        rows="4"
                    ></textarea>

                </div>

                <div>

                    <label>Price</label>

                    <input
                        id="bridalPackagePrice"
                    >

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Package
                    </button>

                    <button
                        type="button"
                        id="cancelBridalPackageBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>

    `;

    document
        .getElementById(
            "cancelBridalPackageBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

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

                    description:
                        document
                            .getElementById(
                                "bridalPackageDescription"
                            )
                            .value
                            .trim(),

                    price:
                        document
                            .getElementById(
                                "bridalPackagePrice"
                            )
                            .value
                            .trim()

                };

                const {
                    error
                } = await supabaseClient
                    .from(
                        "bridal_packages"
                    )
                    .insert(payload);

                if (error) {

                    console.error(
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }

                showMessage(
                    "Bridal package saved."
                );

                loadBridalPackages();
            }
        );
}


// ============================================================
// SIMPLE TABLES
// TEAM / TESTIMONIALS
// ============================================================

async function loadSimpleTable(
    table,
    title,
    description
) {

    const { data, error } =
        await supabaseClient
            .from(table)
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            `${table} error:`,
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>${escapeHTML(title)}</h2>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p>
                        ${escapeHTML(description)}
                    </p>

                </div>

                <button
                    id="addSimpleBtn"
                    class="primary-btn"
                >
                    + Add
                </button>

            </div>

            <div id="simpleFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>

                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${data.map(item => `

                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            item.name ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.description ||
                                            item.message ||
                                            item.title ||
                                            "—"
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            class="delete-btn"
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
                `
                : `
                    <div class="empty-state">
                        No entries yet.
                    </div>
                `
            }

        </div>

    `;

    document
        .getElementById("addSimpleBtn")
        ?.addEventListener(
            "click",
            () => {

                showSimpleForm(
                    table,
                    title
                );

            }
        );

    attachDeleteButtons();
}


function showSimpleForm(
    table,
    title
) {

    const area =
        document.getElementById(
            "simpleFormArea"
        );

    if (!area) return;

    area.innerHTML = `

        <div class="admin-form-card">

            <h3>
                Add ${escapeHTML(title)}
            </h3>

            <form id="simpleForm">

                <div>

                    <label>Name</label>

                    <input
                        id="simpleName"
                        required
                    >

                </div>

                <div>

                    <label>Description / Message</label>

                    <textarea
                        id="simpleDescription"
                        rows="5"
                    ></textarea>

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save
                    </button>

                    <button
                        type="button"
                        id="cancelSimpleBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>

    `;

    document
        .getElementById(
            "cancelSimpleBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

    document
        .getElementById(
            "simpleForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById(
                            "simpleName"
                        )
                        .value
                        .trim();

                const description =
                    document
                        .getElementById(
                            "simpleDescription"
                        )
                        .value
                        .trim();

                let payload;

                if (table === "testimonials") {

                    payload = {
                        name,
                        description,
                        message: description
                    };

                } else {

                    payload = {
                        name,
                        description
                    };

                }

                const {
                    error
                } = await supabaseClient
                    .from(table)
                    .insert(payload);

                if (error) {

                    console.error(
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }

                showMessage(
                    "Saved successfully."
                );

                loadSimpleTable(
                    table,
                    title,
                    "Manage your entries."
                );
            }
        );
}


// ============================================================
// FAQ
// ============================================================

async function loadFAQs() {

    const { data, error } =
        await supabaseClient
            .from("faqs")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "FAQs error:",
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>FAQs</h2>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;

        return;
    }

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>FAQs</h2>

                    <p>
                        Frequently asked questions.
                    </p>

                </div>

                <button
                    id="addFaqBtn"
                    class="primary-btn"
                >
                    + Add FAQ
                </button>

            </div>

            <div id="faqFormArea"></div>

            ${
                data?.length
                ? `
                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>

                            <tr>
                                <th>Question</th>
                                <th>Answer</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${data.map(item => `

                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            item.question
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            item.answer
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            class="delete-btn"
                                            data-delete-table="faqs"
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
                `
                : `
                    <div class="empty-state">
                        No FAQs added yet.
                    </div>
                `
            }

        </div>

    `;

    document
        .getElementById(
            "addFaqBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                showFAQForm();
            }
        );

    attachDeleteButtons();
}


function showFAQForm() {

    const area =
        document.getElementById(
            "faqFormArea"
        );

    if (!area) return;

    area.innerHTML = `

        <div class="admin-form-card">

            <h3>Add FAQ</h3>

            <form id="faqForm">

                <div>

                    <label>Question</label>

                    <input
                        id="faqQuestion"
                        required
                    >

                </div>

                <div>

                    <label>Answer</label>

                    <textarea
                        id="faqAnswer"
                        rows="5"
                        required
                    ></textarea>

                </div>

                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save FAQ
                    </button>

                    <button
                        type="button"
                        id="cancelFaqBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>

    `;

    document
        .getElementById(
            "cancelFaqBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                area.innerHTML = "";
            }
        );

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
                } = await supabaseClient
                    .from("faqs")
                    .insert(payload);

                if (error) {

                    console.error(
                        error
                    );

                    showMessage(
                        error.message,
                        "error"
                    );

                    return;
                }

                showMessage(
                    "FAQ saved successfully."
                );

                loadFAQs();
            }
        );
}


// ============================================================
// SETTINGS
// ============================================================

async function loadSettings() {

    const { data, error } =
        await supabaseClient
            .from("settings")
            .select("*")
            .order("key");

    if (error) {

        console.error(
            "Settings error:",
            error
        );

        moduleContent.innerHTML = `
            <div class="admin-module">
                <h2>Settings</h2>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;

        return;
    }

    const settings = {};

    (data || []).forEach(item => {
        settings[item.key] =
            item.value || "";
    });

    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>Settings</h2>

                    <p>
                        Manage basic website settings.
                    </p>

                </div>

            </div>

            <form id="settingsForm"
                  class="admin-form-card">

                <div>

                    <label>Business Name</label>

                    <input
                        id="settingBusinessName"
                        value="${escapeHTML(
                            settings.business_name ||
                            "Manju's The World of Glamour"
                        )}"
                    >

                </div>

                <div>

                    <label>Phone</label>

                    <input
                        id="settingPhone"
                        value="${escapeHTML(
                            settings.phone ||
                            "+91 88267 74495"
                        )}"
                    >

                </div>

                <div>

                    <label>WhatsApp</label>

                    <input
                        id="settingWhatsApp"
                        value="${escapeHTML(
                            settings.whatsapp ||
                            "918826774495"
                        )}"
                    >

                </div>

                <div>

                    <label>Email</label>

                    <input
                        id="settingEmail"
                        value="${escapeHTML(
                            settings.email ||
                            "manjustudio83@gmail.com"
                        )}"
                    >

                </div>

                <div>

                    <label>Address</label>

                    <textarea
                        id="settingAddress"
                        rows="4"
                    >${escapeHTML(
                        settings.address ||
                        "F-22/170, 2nd Floor, Sector 3, Rohini, New Delhi - 110085"
                    )}</textarea>

                </div>

                <div>

                    <label>Instagram</label>

                    <input
                        id="settingInstagram"
                        value="${escapeHTML(
                            settings.instagram ||
                            "https://instagram.com/manjuchaudharyy"
                        )}"
                    >

                </div>

                <div>

                    <label>YouTube</label>

                    <input
                        id="settingYoutube"
                        value="${escapeHTML(
                            settings.youtube ||
                            "https://youtube.com/c/ManjuStudio"
                        )}"
                    >

                </div>

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

    document
        .getElementById(
            "settingsForm"
        )
        ?.addEventListener(
            "submit",
            saveSettings
        );
}


async function saveSettings(event) {

    event.preventDefault();

    const settings = {

        business_name:
            document
                .getElementById(
                    "settingBusinessName"
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
                    "settingWhatsApp"
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
                .trim(),

        instagram:
            document
                .getElementById(
                    "settingInstagram"
                )
                .value
                .trim(),

        youtube:
            document
                .getElementById(
                    "settingYoutube"
                )
                .value
                .trim()

    };

    try {

        for (
            const [key, value]
            of Object.entries(settings)
        ) {

            const {
                data: existing,
                error: findError
            } = await supabaseClient
                .from("settings")
                .select("id")
                .eq("key", key)
                .maybeSingle();

            if (findError) {
                throw findError;
            }

            if (existing?.id) {

                const {
                    error
                } = await supabaseClient
                    .from("settings")
                    .update({ value })
                    .eq("id", existing.id);

                if (error) {
                    throw error;
                }

            } else {

                const {
                    error
                } = await supabaseClient
                    .from("settings")
                    .insert({
                        key,
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

        console.error(
            "Settings save error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );
    }
}


// ============================================================
// DELETE BUTTONS
// ============================================================

function attachDeleteButtons() {

    moduleContent
        ?.querySelectorAll(
            "[data-delete-table]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await deleteRecord(
                        button.dataset.deleteTable,
                        button.dataset.deleteId
                    );

                }
            );

        });
}


// ============================================================
// STARTUP
// ============================================================

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


if (window.supabaseClient) {

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

    checkAuth();

} else {

    console.error(
        "supabaseClient is not available. Make sure supabase-config.js loads before admin.js."
    );

}
// ============================================================
// END OF ADMIN.JS
// ============================================================
