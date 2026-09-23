/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL — SUPABASE MANAGEMENT SYSTEM
   VERSION 2 — FIXED ADMIN APP CONTROLLER
   ========================================================= */

let currentUser = null;
let activeModule = "dashboard";

/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Manju Admin Panel loaded");

    if (typeof supabaseClient === "undefined") {
        showSystemError(
            "Supabase configuration could not be loaded. Check supabase-config.js."
        );
        return;
    }

    connectLoginForm();
    connectLogoutButton();
    connectModuleButtons();

    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            showLoginScreen();
            return;
        }

        if (session) {
            currentUser = session.user;
            showAdminPanel();
        } else {
            showLoginScreen();
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);

            if (event === "SIGNED_OUT") {
                currentUser = null;
                showLoginScreen();
            }

            if (
                event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED"
            ) {
                if (session) {
                    currentUser = session.user;
                    showAdminPanel();
                }
            }
        });

    } catch (error) {
        console.error("Startup error:", error);
        showSystemError(error.message || "Could not initialize admin panel.");
    }
});


/* =========================================================
   LOGIN / ADMIN VISIBILITY
========================================================= */

function showLoginScreen() {

    const loginSection =
        document.getElementById("loginSection");

    const adminApp =
        document.getElementById("adminApp");

    if (loginSection) {
        loginSection.style.display = "block";
    }

    if (adminApp) {
        adminApp.style.display = "none";
    }

    document.body.classList.remove("admin-logged-in");
}


function showAdminPanel() {

    const loginSection =
        document.getElementById("loginSection");

    const adminApp =
        document.getElementById("adminApp");

    if (!adminApp) {
        console.error("adminApp element not found.");
        return;
    }

    if (loginSection) {
        loginSection.style.display = "none";
    }

    adminApp.style.display = "block";

    document.body.classList.add("admin-logged-in");

    updateAdminEmail();

    console.log("Admin panel visible.");

    showDashboardModule();
}


function updateAdminEmail() {

    const elements = document.querySelectorAll(
        "[data-admin-email]"
    );

    elements.forEach(element => {
        element.textContent =
            currentUser?.email || "";
    });
}


/* =========================================================
   LOGIN
========================================================= */

function connectLoginForm() {

    const form =
        document.getElementById("loginForm");

    if (!form) {
        console.warn("loginForm not found.");
        return;
    }

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const email =
            document.getElementById("adminEmail")
                ?.value
                .trim();

        const password =
            document.getElementById("adminPassword")
                ?.value || "";

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        const submitButton =
            form.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent =
                "Signing in...";
        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                throw error;
            }

            currentUser = data.user;

            showAdminPanel();

        } catch (error) {

            console.error("Login error:", error);

            alert(
                "Login failed.\n\n" +
                (error.message ||
                    "Please check your email and password.")
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;

                submitButton.textContent =
                    submitButton.dataset.originalText ||
                    "Login";
            }
        }
    });
}


/* =========================================================
   LOGOUT
========================================================= */

function connectLogoutButton() {

    const logoutButtons =
        document.querySelectorAll(
            "[data-admin-logout]"
        );

    logoutButtons.forEach(button => {

        button.addEventListener("click", logoutAdmin);

    });
}


async function logoutAdmin() {

    const confirmed =
        confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;

        showLoginScreen();

    } catch (error) {

        console.error(error);

        alert(
            "Logout failed:\n\n" +
            (error.message || "Please try again.")
        );
    }
}


/* =========================================================
   MODULE NAVIGATION
========================================================= */

function connectModuleButtons() {

    document.addEventListener("click", event => {

        const button =
            event.target.closest("[data-module]");

        if (!button) return;

        const module =
            button.dataset.module;

        if (!module) return;

        event.preventDefault();

        openModule(module);
    });
}


async function openModule(module) {

    activeModule = module;

    const moduleArea =
        document.getElementById("moduleArea");

    const moduleTitle =
        document.getElementById("moduleTitle");

    const moduleDescription =
        document.getElementById("moduleDescription");

    const moduleContent =
        document.getElementById("moduleContent");

    if (!moduleContent) {
        console.error("moduleContent not found.");
        return;
    }

    if (moduleArea) {
        moduleArea.style.display = "block";
    }

    if (moduleTitle) {
        moduleTitle.textContent =
            formatTitle(module);
    }

    if (moduleDescription) {
        moduleDescription.textContent =
            getModuleDescription(module);
    }

    moduleContent.innerHTML = `
        <div class="module-loading">
            Loading ${escapeHTML(formatTitle(module))}...
        </div>
    `;

    try {

        switch (module) {

            case "dashboard":
                showDashboardModule();
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
                moduleContent.innerHTML =
                    emptyMessage("Module not available.");
        }

    } catch (error) {

        console.error(error);

        showDatabaseError(error);
    }
}


function showDashboardModule() {

    activeModule = "dashboard";

    const moduleArea =
        document.getElementById("moduleArea");

    const moduleTitle =
        document.getElementById("moduleTitle");

    const moduleDescription =
        document.getElementById("moduleDescription");

    const moduleContent =
        document.getElementById("moduleContent");

    if (moduleArea) {
        moduleArea.style.display = "block";
    }

    if (moduleTitle) {
        moduleTitle.textContent =
            "Dashboard";
    }

    if (moduleDescription) {
        moduleDescription.textContent =
            "Manage your beauty business website.";
    }

    if (!moduleContent) return;

    moduleContent.innerHTML = `
        <div class="admin-dashboard-welcome">

            <h2>Welcome to Manju's The World of Glamour</h2>

            <p>
                Use the management sections to update your
                salon website.
            </p>

            <div class="dashboard-quick-grid">

                <button
                    type="button"
                    data-module="appointments"
                >
                    📅
                    <strong>Appointments</strong>
                    <small>Manage booking requests</small>
                </button>

                <button
                    type="button"
                    data-module="services"
                >
                    💄
                    <strong>Services</strong>
                    <small>Manage services and prices</small>
                </button>

                <button
                    type="button"
                    data-module="offers"
                >
                    🎁
                    <strong>Offers</strong>
                    <small>Manage offers and pricing</small>
                </button>

                <button
                    type="button"
                    data-module="gallery"
                >
                    🖼️
                    <strong>Gallery</strong>
                    <small>Upload salon photos</small>
                </button>

                <button
                    type="button"
                    data-module="bride_gallery"
                >
                    👰
                    <strong>Bride & Girls</strong>
                    <small>Upload bridal photos</small>
                </button>

                <button
                    type="button"
                    data-module="customer_gallery"
                >
                    👩
                    <strong>Customers</strong>
                    <small>Manage customer photos</small>
                </button>

                <button
                    type="button"
                    data-module="before_after"
                >
                    ✨
                    <strong>Before / After</strong>
                    <small>Manage transformations</small>
                </button>

                <button
                    type="button"
                    data-module="bridal_packages"
                >
                    💍
                    <strong>Bridal Packages</strong>
                    <small>Manage bridal packages</small>
                </button>

                <button
                    type="button"
                    data-module="team"
                >
                    👩‍🎨
                    <strong>Team</strong>
                    <small>Manage team members</small>
                </button>

                <button
                    type="button"
                    data-module="testimonials"
                >
                    ⭐
                    <strong>Reviews</strong>
                    <small>Manage testimonials</small>
                </button>

                <button
                    type="button"
                    data-module="faqs"
                >
                    ❓
                    <strong>FAQs</strong>
                    <small>Manage FAQs</small>
                </button>

                <button
                    type="button"
                    data-module="settings"
                >
                    ⚙️
                    <strong>Settings</strong>
                    <small>Manage website settings</small>
                </button>

            </div>

        </div>
    `;

    addAdminStyles();
}


/* =========================================================
   MODULE DESCRIPTIONS
========================================================= */

function getModuleDescription(module) {

    const descriptions = {

        dashboard:
            "Manage your beauty business website.",

        appointments:
            "Manage appointment requests.",

        services:
            "Add, edit and manage salon services.",

        offers:
            "Manage promotional offers and prices.",

        gallery:
            "Upload and manage salon photos.",

        bride_gallery:
            "Manage bride and girls photos.",

        customer_gallery:
            "Manage customer photos with permission.",

        before_after:
            "Manage beauty transformation photos.",

        bridal_packages:
            "Manage bridal packages.",

        team:
            "Manage team members.",

        testimonials:
            "Manage customer testimonials.",

        faqs:
            "Manage frequently asked questions.",

        settings:
            "Manage website contact information."
    };

    return descriptions[module] || "";
}


/* =========================================================
   APPOINTMENTS
========================================================= */

async function loadAppointments() {

    const { data, error } =
        await supabaseClient
            .from("appointments")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            "📅 Appointments",
            "Customer appointment requests"
        )}

        <div class="admin-table-wrapper">

            <table class="admin-table">

                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
    `;

    if (!data || data.length === 0) {

        html += `
            <tr>
                <td colspan="7">
                    ${emptyMessage(
                        "No appointment requests yet."
                    )}
                </td>
            </tr>
        `;

    } else {

        data.forEach(item => {

            html += `

                <tr>

                    <td>
                        ${escapeHTML(
                            item.name ||
                            item.customer_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.phone || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.service ||
                            item.service_name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.date || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.time || "-"
                        )}
                    </td>

                    <td>

                        <select
                            onchange="
                                updateAppointmentStatus(
                                    '${escapeAttribute(item.id)}',
                                    this.value
                                )
                            "
                        >

                            ${appointmentStatusOptions(
                                item.status
                            )}

                        </select>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="danger-button"
                            onclick="
                                deleteRecord(
                                    'appointments',
                                    '${escapeAttribute(item.id)}',
                                    loadAppointments
                                )
                            "
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        });
    }

    html += `
                </tbody>

            </table>

        </div>
    `;

    setModuleHTML(html);
}


function appointmentStatusOptions(status) {

    const statuses = [
        "New",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show"
    ];

    return statuses.map(value => `

        <option
            value="${escapeAttribute(value)}"
            ${status === value ? "selected" : ""}
        >
            ${escapeHTML(value)}
        </option>

    `).join("");
}


async function updateAppointmentStatus(id, status) {

    const { error } =
        await supabaseClient
            .from("appointments")
            .update({ status })
            .eq("id", id);

    if (error) {

        alert(error.message);
        return;
    }

    await loadAppointments();
}


/* =========================================================
   SERVICES
========================================================= */

async function loadServices() {

    const { data, error } =
        await supabaseClient
            .from("services")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            "💄 Services",
            "Add and manage salon services"
        )}

        <button
            type="button"
            class="primary-button"
            onclick="showServiceForm()"
        >
            + Add Service
        </button>

        <div id="serviceForm"></div>

        <div class="admin-card-list">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            "No services added yet."
        );

    } else {

        data.forEach(service => {

            html += `

                <div class="admin-item-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                service.name ||
                                "Unnamed service"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                service.description || ""
                            )}
                        </p>

                        <strong>
                            ${
                                service.price !== null &&
                                service.price !== undefined &&
                                service.price !== ""
                                    ? "₹" +
                                      escapeHTML(
                                          String(service.price)
                                      )
                                    : "Price not set"
                            }
                        </strong>

                        ${
                            service.duration
                                ? `
                                    <small>
                                        Duration:
                                        ${escapeHTML(
                                            service.duration
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                    <div class="admin-actions">

                        <button
                            type="button"
                            onclick='editService(${safeJSON(service)})'
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="danger-button"
                            onclick="
                                deleteRecord(
                                    'services',
                                    '${escapeAttribute(service.id)}',
                                    loadServices
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showServiceForm(service = null) {

    const container =
        document.getElementById("serviceForm");

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>
                ${service ? "Edit Service" : "Add Service"}
            </h3>

            <label>Service Name</label>

            <input
                id="serviceName"
                placeholder="Service name"
                value="${escapeAttribute(
                    service?.name || ""
                )}"
            >

            <label>Description</label>

            <textarea
                id="serviceDescription"
                placeholder="Description"
            >${escapeHTML(
                service?.description || ""
            )}</textarea>

            <label>Price</label>

            <input
                id="servicePrice"
                type="number"
                min="0"
                placeholder="Price"
                value="${escapeAttribute(
                    service?.price ?? ""
                )}"
            >

            <label>Duration</label>

            <input
                id="serviceDuration"
                placeholder="e.g. 60 minutes"
                value="${escapeAttribute(
                    service?.duration || ""
                )}"
            >

            <label>Category</label>

            <input
                id="serviceCategory"
                placeholder="Category"
                value="${escapeAttribute(
                    service?.category || ""
                )}"
            >

            <label>

                <input
                    type="checkbox"
                    id="serviceActive"
                    ${service?.active !== false
                        ? "checked"
                        : ""}
                >

                Active

            </label>

            <div class="form-buttons">

                <button
                    type="button"
                    class="primary-button"
                    onclick="
                        saveService(
                            '${escapeAttribute(
                                service?.id || ""
                            )}'
                        )
                    "
                >
                    Save Service
                </button>

                <button
                    type="button"
                    onclick="
                        document.getElementById(
                            'serviceForm'
                        ).innerHTML=''
                    "
                >
                    Cancel
                </button>

            </div>

        </div>
    `;
}


async function saveService(id) {

    const name =
        document.getElementById("serviceName")
            ?.value
            .trim();

    if (!name) {
        alert("Please enter a service name.");
        return;
    }

    const priceValue =
        document.getElementById("servicePrice")
            ?.value;

    const payload = {

        name,

        description:
            document.getElementById(
                "serviceDescription"
            )?.value.trim() || "",

        price:
            priceValue
                ? Number(priceValue)
                : null,

        duration:
            document.getElementById(
                "serviceDuration"
            )?.value.trim() || "",

        category:
            document.getElementById(
                "serviceCategory"
            )?.value.trim() || "",

        active:
            document.getElementById(
                "serviceActive"
            )?.checked !== false
    };

    let result;

    if (id) {

        result =
            await supabaseClient
                .from("services")
                .update(payload)
                .eq("id", id);

    } else {

        result =
            await supabaseClient
                .from("services")
                .insert(payload);
    }

    if (result.error) {

        alert(result.error.message);
        return;
    }

    alert("Service saved successfully.");

    await loadServices();
}


function editService(service) {

    showServiceForm(service);

    document
        .getElementById("serviceForm")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


/* =========================================================
   OFFERS
========================================================= */

async function loadOffers() {

    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            "🎁 Offers",
            "Manage promotional offers and prices"
        )}

        <button
            type="button"
            class="primary-button"
            onclick="showOfferForm()"
        >
            + Add Offer
        </button>

        <div id="offerForm"></div>

        <div class="admin-card-list">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            "No offers added yet."
        );

    } else {

        data.forEach(offer => {

            html += `

                <div class="admin-item-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                offer.name || "Offer"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                offer.description || ""
                            )}
                        </p>

                        <div>

                            ${
                                offer.original_price
                                    ? `
                                        <del>
                                            ₹${escapeHTML(
                                                String(
                                                    offer.original_price
                                                )
                                            )}
                                        </del>
                                      `
                                    : ""
                            }

                            ${
                                offer.offer_price
                                    ? `
                                        <strong>
                                            ₹${escapeHTML(
                                                String(
                                                    offer.offer_price
                                                )
                                            )}
                                        </strong>
                                      `
                                    : "Price not set"
                            }

                        </div>

                        <small>
                            ${
                                offer.active === false
                                    ? "Inactive"
                                    : "Active"
                            }
                        </small>

                    </div>

                    <div class="admin-actions">

                        <button
                            type="button"
                            onclick='editOffer(${safeJSON(offer)})'
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="danger-button"
                            onclick="
                                deleteRecord(
                                    'offers',
                                    '${escapeAttribute(offer.id)}',
                                    loadOffers
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showOfferForm(offer = null) {

    const container =
        document.getElementById("offerForm");

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>
                ${offer ? "Edit Offer" : "Add Offer"}
            </h3>

            <label>Offer Name</label>

            <input
                id="offerName"
                placeholder="Offer name"
                value="${escapeAttribute(
                    offer?.name || ""
                )}"
            >

            <label>Description</label>

            <textarea
                id="offerDescription"
                placeholder="Offer description"
            >${escapeHTML(
                offer?.description || ""
            )}</textarea>

            <label>Original Price</label>

            <input
                id="offerOriginalPrice"
                type="number"
                min="0"
                placeholder="Original price"
                value="${escapeAttribute(
                    offer?.original_price ?? ""
                )}"
            >

            <label>Offer Price</label>

            <input
                id="offerPrice"
                type="number"
                min="0"
                placeholder="Offer price"
                value="${escapeAttribute(
                    offer?.offer_price ?? ""
                )}"
            >

            <label>Start Date</label>

            <input
                id="offerStart"
                type="date"
                value="${escapeAttribute(
                    offer?.start_date || ""
                )}"
            >

            <label>End Date</label>

            <input
                id="offerEnd"
                type="date"
                value="${escapeAttribute(
                    offer?.end_date || ""
                )}"
            >

            <label>Terms</label>

            <textarea
                id="offerTerms"
                placeholder="Terms and conditions"
            >${escapeHTML(
                offer?.terms || ""
            )}</textarea>

            <label>

                <input
                    type="checkbox"
                    id="offerActive"
                    ${offer?.active !== false
                        ? "checked"
                        : ""}
                >

                Active

            </label>

            <div class="form-buttons">

                <button
                    type="button"
                    class="primary-button"
                    onclick="
                        saveOffer(
                            '${escapeAttribute(
                                offer?.id || ""
                            )}'
                        )
                    "
                >
                    Save Offer
                </button>

                <button
                    type="button"
                    onclick="
                        document.getElementById(
                            'offerForm'
                        ).innerHTML=''
                    "
                >
                    Cancel
                </button>

            </div>

        </div>
    `;
}


async function saveOffer(id) {

    const name =
        document.getElementById("offerName")
            ?.value
            .trim();

    if (!name) {
        alert("Please enter an offer name.");
        return;
    }

    const originalPrice =
        document.getElementById(
            "offerOriginalPrice"
        )?.value;

    const offerPrice =
        document.getElementById(
            "offerPrice"
        )?.value;

    const payload = {

        name,

        description:
            document.getElementById(
                "offerDescription"
            )?.value.trim() || "",

        original_price:
            originalPrice
                ? Number(originalPrice)
                : null,

        offer_price:
            offerPrice
                ? Number(offerPrice)
                : null,

        start_date:
            document.getElementById(
                "offerStart"
            )?.value || null,

        end_date:
            document.getElementById(
                "offerEnd"
            )?.value || null,

        terms:
            document.getElementById(
                "offerTerms"
            )?.value.trim() || "",

        active:
            document.getElementById(
                "offerActive"
            )?.checked !== false
    };

    let result;

    if (id) {

        result =
            await supabaseClient
                .from("offers")
                .update(payload)
                .eq("id", id);

    } else {

        result =
            await supabaseClient
                .from("offers")
                .insert(payload);
    }

    if (result.error) {

        alert(result.error.message);
        return;
    }

    alert("Offer saved successfully.");

    await loadOffers();
}


function editOffer(offer) {

    showOfferForm(offer);

    document
        .getElementById("offerForm")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================================================
   GALLERY
========================================================= */

async function loadGallery() {

    await loadImageGallery(
        "gallery",
        "🖼️ Salon Gallery",
        "gallery",
        "Salon photos"
    );
}


async function loadBrideGallery() {

    await loadImageGallery(
        "bride_gallery",
        "👰 Bride & Girls Gallery",
        "bride-gallery",
        "Bride and girls photos"
    );
}


async function loadCustomerGallery() {

    await loadImageGallery(
        "customer_gallery",
        "👩 Customer Gallery",
        "customer-gallery",
        "Customer photos — upload only with permission"
    );
}


async function loadImageGallery(
    table,
    title,
    bucket,
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

        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(title, description)}

        <button
            type="button"
            class="primary-button"
            onclick="
                showGalleryForm(
                    '${escapeAttribute(table)}',
                    '${escapeAttribute(bucket)}'
                )
            "
        >
            + Upload Photo
        </button>

        <div id="${escapeAttribute(table)}Form"></div>

        <div class="photo-grid">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            "No photos uploaded yet."
        );

    } else {

        data.forEach(item => {

            const image =
                item.image_url ||
                item.url ||
                item.photo_url;

            html += `

                <div class="photo-admin-card">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeAttribute(image)}"
                                    alt="${escapeAttribute(
                                        item.title ||
                                        item.name ||
                                        "Photo"
                                    )}"
                                >
                              `
                            : `
                                <div class="no-image">
                                    No image
                                </div>
                              `
                    }

                    <div class="photo-admin-info">

                        <strong>
                            ${escapeHTML(
                                item.title ||
                                item.name ||
                                "Photo"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.category || ""
                            )}
                        </small>

                        <button
                            type="button"
                            class="danger-button"
                            onclick="
                                deleteRecord(
                                    '${escapeAttribute(table)}',
                                    '${escapeAttribute(item.id)}',
                                    () => loadImageGallery(
                                        '${escapeAttribute(table)}',
                                        '${escapeAttribute(title)}',
                                        '${escapeAttribute(bucket)}',
                                        '${escapeAttribute(description)}'
                                    )
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showGalleryForm(table, bucket) {

    const container =
        document.getElementById(
            `${table}Form`
        );

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>Upload Photo</h3>

            <label>Title</label>

            <input
                id="galleryTitle"
                placeholder="Photo title"
            >

            <label>Category</label>

            <input
                id="galleryCategory"
                placeholder="Category"
            >

            <label>Description</label>

            <textarea
                id="galleryDescription"
                placeholder="Description"
            ></textarea>

            <label>Date</label>

            <input
                id="galleryDate"
                type="date"
            >

            <label>Photo</label>

            <input
                id="galleryFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <label>

                <input
                    type="checkbox"
                    id="galleryFeatured"
                >

                Featured

            </label>

            <button
                type="button"
                class="primary-button"
                onclick="
                    uploadGalleryImage(
                        '${escapeAttribute(table)}',
                        '${escapeAttribute(bucket)}'
                    )
                "
            >
                Upload Photo
            </button>

        </div>
    `;
}


async function uploadGalleryImage(
    table,
    bucket
) {

    const file =
        document.getElementById(
            "galleryFile"
        )?.files[0];

    if (!file) {

        alert("Please select an image.");
        return;
    }

    const imageUrl =
        await uploadStorageFile(
            bucket,
            file
        );

    if (!imageUrl) return;

    const payload = {

        title:
            document.getElementById(
                "galleryTitle"
            )?.value.trim() || "",

        category:
            document.getElementById(
                "galleryCategory"
            )?.value.trim() || "",

        description:
            document.getElementById(
                "galleryDescription"
            )?.value.trim() || "",

        date:
            document.getElementById(
                "galleryDate"
            )?.value || null,

        featured:
            document.getElementById(
                "galleryFeatured"
            )?.checked || false,

        image_url:
            imageUrl
    };

    const { error } =
        await supabaseClient
            .from(table)
            .insert(payload);

    if (error) {

        alert(
            "Image uploaded, but database record failed:\n\n" +
            error.message
        );

        return;
    }

    alert("Photo uploaded successfully.");

    if (table === "gallery") {
        await loadGallery();
    }

    if (table === "bride_gallery") {
        await loadBrideGallery();
    }

    if (table === "customer_gallery") {
        await loadCustomerGallery();
    }
}


/* =========================================================
   BEFORE / AFTER
========================================================= */

async function loadBeforeAfter() {

    const { data, error } =
        await supabaseClient
            .from("before_after")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            "✨ Before / After",
            "Beauty transformation photos"
        )}

        <button
            type="button"
            class="primary-button"
            onclick="showBeforeAfterForm()"
        >
            + Add Transformation
        </button>

        <div id="beforeAfterForm"></div>

        <div class="photo-grid">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            "No transformations uploaded yet."
        );

    } else {

        data.forEach(item => {

            html += `

                <div class="photo-admin-card">

                    <div class="before-after-preview">

                        ${
                            item.before_image_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
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
                                        src="${escapeAttribute(
                                            item.after_image_url
                                        )}"
                                        alt="After"
                                    >
                                  `
                                : ""
                        }

                    </div>

                    <div class="photo-admin-info">

                        <strong>
                            ${escapeHTML(
                                item.title ||
                                "Transformation"
                            )}
                        </strong>

                        <button
                            type="button"
                            class="danger-button"
                            onclick="
                                deleteRecord(
                                    'before_after',
                                    '${escapeAttribute(item.id)}',
                                    loadBeforeAfter
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showBeforeAfterForm() {

    const container =
        document.getElementById(
            "beforeAfterForm"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>Add Before / After</h3>

            <label>Transformation Title</label>

            <input
                id="baTitle"
                placeholder="Transformation title"
            >

            <label>Before Photo</label>

            <input
                id="baBefore"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <label>After Photo</label>

            <input
                id="baAfter"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <button
                type="button"
                class="primary-button"
                onclick="uploadBeforeAfter()"
            >
                Upload Transformation
            </button>

        </div>
    `;
}


async function uploadBeforeAfter() {

    const before =
        document.getElementById(
            "baBefore"
        )?.files[0];

    const after =
        document.getElementById(
            "baAfter"
        )?.files[0];

    const title =
        document.getElementById(
            "baTitle"
        )?.value.trim() || "";

    if (!before || !after) {

        alert(
            "Please select both before and after images."
        );

        return;
    }

    const beforeUrl =
        await uploadStorageFile(
            "before-after",
            before
        );

    if (!beforeUrl) return;

    const afterUrl =
        await uploadStorageFile(
            "before-after",
            after
        );

    if (!afterUrl) return;

    const { error } =
        await supabaseClient
            .from("before_after")
            .insert({

                title,

                before_image_url:
                    beforeUrl,

                after_image_url:
                    afterUrl
            });

    if (error) {

        alert(error.message);
        return;
    }

    alert(
        "Before / After transformation uploaded."
    );

    await loadBeforeAfter();
}


/* =========================================================
   BRIDAL PACKAGES
========================================================= */

async function loadBridalPackages() {

    const { data, error } =
        await supabaseClient
            .from("bridal_packages")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            "💍 Bridal Packages",
            "Manage bridal packages"
        )}

        <button
            type="button"
            class="primary-button"
            onclick="showBridalPackageForm()"
        >
            + Add Bridal Package
        </button>

        <div id="bridalPackageForm"></div>

        <div class="admin-card-list">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            "No bridal packages added yet."
        );

    } else {

        data.forEach(item => {

            html += `

                <div class="admin-item-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.name ||
                                "Bridal Package"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.description || ""
                            )}
                        </p>

                        <strong>
                            ${
                                item.price !== null &&
                                item.price !== undefined
                                    ? "₹" +
                                      escapeHTML(
                                          String(item.price)
                                      )
                                    : "Price not set"
                            }
                        </strong>

                    </div>

                    <button
                        type="button"
                        class="danger-button"
                        onclick="
                            deleteRecord(
                                'bridal_packages',
                                '${escapeAttribute(item.id)}',
                                loadBridalPackages
                            )
                        "
                    >
                        Delete
                    </button>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showBridalPackageForm() {

    const container =
        document.getElementById(
            "bridalPackageForm"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>Add Bridal Package</h3>

            <label>Package Name</label>

            <input
                id="bridalName"
                placeholder="Package name"
            >

            <label>Description</label>

            <textarea
                id="bridalDescription"
                placeholder="Package description"
            ></textarea>

            <label>Price</label>

            <input
                id="bridalPrice"
                type="number"
                min="0"
                placeholder="Price"
            >

            <button
                type="button"
                class="primary-button"
                onclick="saveBridalPackage()"
            >
                Save Package
            </button>

        </div>
    `;
}


async function saveBridalPackage() {

    const name =
        document.getElementById(
            "bridalName"
        )?.value.trim();

    if (!name) {

        alert("Please enter a package name.");
        return;
    }

    const price =
        document.getElementById(
            "bridalPrice"
        )?.value;

    const payload = {

        name,

        description:
            document.getElementById(
                "bridalDescription"
            )?.value.trim() || "",

        price:
            price
                ? Number(price)
                : null
    };

    const { error } =
        await supabaseClient
            .from("bridal_packages")
            .insert(payload);

    if (error) {

        alert(error.message);
        return;
    }

    alert("Bridal package saved.");

    await loadBridalPackages();
}


/* =========================================================
   TEAM
========================================================= */

async function loadTeam() {

    await loadSimpleModule(
        "team",
        "👩‍🎨 Team",
        "Manage your team members"
    );
}


/* =========================================================
   TESTIMONIALS
========================================================= */

async function loadTestimonials() {

    await loadSimpleModule(
        "testimonials",
        "⭐ Reviews",
        "Manage customer testimonials"
    );
}


/* =========================================================
   FAQ
========================================================= */

async function loadFAQs() {

    await loadSimpleModule(
        "faqs",
        "❓ FAQs",
        "Manage frequently asked questions"
    );
}


/* =========================================================
   SIMPLE MODULES
========================================================= */

async function loadSimpleModule(
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

        showDatabaseError(error);
        return;
    }

    let html = `

        ${moduleHeader(
            title,
            description
        )}

        <button
            type="button"
            class="primary-button"
            onclick="
                showSimpleForm(
                    '${escapeAttribute(table)}'
                )
            "
        >
            + Add
        </button>

        <div id="simpleForm"></div>

        <div class="admin-card-list">
    `;

    if (!data || data.length === 0) {

        html += emptyMessage(
            `No ${table} records yet.`
        );

    } else {

        data.forEach(item => {

            const titleText =
                item.name ||
                item.question ||
                item.title ||
                "Record";

            const descriptionText =
                item.description ||
                item.answer ||
                item.bio ||
                item.message ||
                "";

            html += `

                <div class="admin-item-card">

                    <div>

                        <h3>
                            ${escapeHTML(titleText)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                descriptionText
                            )}
                        </p>

                    </div>

                    <button
                        type="button"
                        class="danger-button"
                        onclick="
                            deleteRecord(
                                '${escapeAttribute(table)}',
                                '${escapeAttribute(item.id)}',
                                () => loadSimpleModule(
                                    '${escapeAttribute(table)}',
                                    '${escapeAttribute(title)}',
                                    '${escapeAttribute(description)}'
                                )
                            )
                        "
                    >
                        Delete
                    </button>

                </div>
            `;
        });
    }

    html += `</div>`;

    setModuleHTML(html);
}


function showSimpleForm(table) {

    const container =
        document.getElementById(
            "simpleForm"
        );

    if (!container) return;

    if (table === "faqs") {

        container.innerHTML = `

            <div class="admin-form-card">

                <h3>Add FAQ</h3>

                <label>Question</label>

                <input
                    id="simpleTitle"
                    placeholder="Question"
                >

                <label>Answer</label>

                <textarea
                    id="simpleDescription"
                    placeholder="Answer"
                ></textarea>

                <button
                    type="button"
                    class="primary-button"
                    onclick="
                        saveSimpleRecord('faqs')
                    "
                >
                    Save FAQ
                </button>

            </div>
        `;

    } else {

        container.innerHTML = `

            <div class="admin-form-card">

                <h3>Add Record</h3>

                <label>Name / Title</label>

                <input
                    id="simpleTitle"
                    placeholder="Name / Title"
                >

                <label>Description</label>

                <textarea
                    id="simpleDescription"
                    placeholder="Description"
                ></textarea>

                <button
                    type="button"
                    class="primary-button"
                    onclick="
                        saveSimpleRecord(
                            '${escapeAttribute(table)}'
                        )
                    "
                >
                    Save
                </button>

            </div>
        `;
    }
}


async function saveSimpleRecord(table) {

    let payload;

    if (table === "faqs") {

        payload = {

            question:
                document.getElementById(
                    "simpleTitle"
                )?.value.trim() || "",

            answer:
                document.getElementById(
                    "simpleDescription"
                )?.value.trim() || ""
        };

    } else {

        payload = {

            name:
                document.getElementById(
                    "simpleTitle"
                )?.value.trim() || "",

            description:
                document.getElementById(
                    "simpleDescription"
                )?.value.trim() || ""
        };
    }

    const { error } =
        await supabaseClient
            .from(table)
            .insert(payload);

    if (error) {

        alert(error.message);
        return;
    }

    alert("Saved successfully.");

    if (table === "team") {
        await loadTeam();
    }

    if (table === "testimonials") {
        await loadTestimonials();
    }

    if (table === "faqs") {
        await loadFAQs();
    }
}


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

    const { data, error } =
        await supabaseClient
            .from("settings")
            .select("*")
            .order("key");

    if (error) {

        showDatabaseError(error);
        return;
    }

    const settings = {};

    (data || []).forEach(item => {

        settings[item.key] =
            item.value;
    });

    setModuleHTML(`

        ${moduleHeader(
            "⚙️ Website Settings",
            "Manage business contact information"
        )}

        <div class="admin-form-card">

            <label>Business Name</label>

            <input
                id="settingBusinessName"
                value="${escapeAttribute(
                    settings.business_name || ""
                )}"
            >

            <label>Artist Name</label>

            <input
                id="settingArtistName"
                value="${escapeAttribute(
                    settings.artist_name || ""
                )}"
            >

            <label>Phone</label>

            <input
                id="settingPhone"
                value="${escapeAttribute(
                    settings.phone || ""
                )}"
            >

            <label>WhatsApp</label>

            <input
                id="settingWhatsapp"
                value="${escapeAttribute(
                    settings.whatsapp || ""
                )}"
            >

            <label>Email</label>

            <input
                id="settingEmail"
                type="email"
                value="${escapeAttribute(
                    settings.email || ""
                )}"
            >

            <label>Address</label>

            <textarea
                id="settingAddress"
            >${escapeHTML(
                settings.address || ""
            )}</textarea>

            <button
                type="button"
                class="primary-button"
                onclick="saveSettings()"
            >
                Save Website Settings
            </button>

        </div>
    `);
}


async function saveSettings() {

    const values = {

        business_name:
            document.getElementById(
                "settingBusinessName"
            )?.value.trim() || "",

        artist_name:
            document.getElementById(
                "settingArtistName"
            )?.value.trim() || "",

        phone:
            document.getElementById(
                "settingPhone"
            )?.value.trim() || "",

        whatsapp:
            document.getElementById(
                "settingWhatsapp"
            )?.value.trim() || "",

        email:
            document.getElementById(
                "settingEmail"
            )?.value.trim() || "",

        address:
            document.getElementById(
                "settingAddress"
            )?.value.trim() || ""
    };

    for (
        const [key, value]
        of Object.entries(values)
    ) {

        const {
            data: existing,
            error: findError
        } =
            await supabaseClient
                .from("settings")
                .select("id")
                .eq("key", key)
                .maybeSingle();

        if (findError) {

            alert(
                `Could not read ${key}:\n${findError.message}`
            );

            return;
        }

        let result;

        if (existing) {

            result =
                await supabaseClient
                    .from("settings")
                    .update({
                        value
                    })
                    .eq("key", key);

        } else {

            result =
                await supabaseClient
                    .from("settings")
                    .insert({
                        key,
                        value
                    });
        }

        if (result.error) {

            alert(
                `Could not save ${key}:\n${result.error.message}`
            );

            return;
        }
    }

    alert(
        "Website settings saved successfully."
    );
}


/* =========================================================
   STORAGE
========================================================= */

async function uploadStorageFile(
    bucket,
    file
) {

    if (!file) return null;

    if (file.size > 10 * 1024 * 1024) {

        alert(
            "Maximum image size is 10 MB."
        );

        return null;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert(
            "Only JPG, PNG and WEBP images are allowed."
        );

        return null;
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;

    const {
        error
    } =
        await supabaseClient.storage
            .from(bucket)
            .upload(
                fileName,
                file,
                {
                    contentType: file.type,
                    upsert: false
                }
            );

    if (error) {

        console.error(error);

        alert(
            "Image upload failed:\n\n" +
            error.message
        );

        return null;
    }

    const {
        data
    } =
        supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);

    return data?.publicUrl || null;
}


/* =========================================================
   DELETE
========================================================= */

async function deleteRecord(
    table,
    id,
    callback
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this item?"
        );

    if (!confirmed) return;

    const {
        error
    } =
        await supabaseClient
            .from(table)
            .delete()
            .eq("id", id);

    if (error) {

        alert(
            "Delete failed:\n\n" +
            error.message
        );

        return;
    }

    alert("Deleted successfully.");

    if (typeof callback === "function") {
        await callback();
    }
}


/* =========================================================
   UI HELPERS
========================================================= */

function setModuleHTML(html) {

    const container =
        document.getElementById(
            "moduleContent"
        );

    if (container) {
        container.innerHTML = html;
    }
}


function moduleHeader(
    title,
    description
) {

    return `

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
                type="button"
                onclick="showDashboardModule()"
            >
                ← Dashboard
            </button>

        </div>
    `;
}


function closeModule() {

    showDashboardModule();
}


function emptyMessage(message) {

    return `

        <div class="empty-admin">
            ${escapeHTML(message)}
        </div>

    `;
}


function showDatabaseError(error) {

    console.error(
        "Supabase database error:",
        error
    );

    setModuleHTML(`

        <div class="admin-error">

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHTML(
                    error?.message ||
                    "Database error"
                )}
            </p>

            <small>
                Check the browser console for more details.
            </small>

        </div>
    `);
}


function showSystemError(message) {

    const existing =
        document.getElementById(
            "systemErrorMessage"
        );

    if (existing) {
        existing.remove();
    }

    const div =
        document.createElement("div");

    div.id =
        "systemErrorMessage";

    div.style.cssText = `
        padding:30px;
        margin:30px;
        background:#fff0f0;
        border:1px solid #e0aaaa;
        color:#7b2222;
        border-radius:12px;
        font-family:Arial,sans-serif;
    `;

    div.textContent = message;

    document.body.prepend(div);
}


function formatTitle(text) {

    return String(text || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, c =>
            c.toUpperCase()
        );
}


/* =========================================================
   SAFE HTML / JSON
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


function safeJSON(object) {

    return JSON.stringify(object)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/'/g, "\\u0027");
}


/* =========================================================
   ADMIN STYLES
========================================================= */

function addAdminStyles() {

    if (
        document.getElementById(
            "manjuAdminExtraStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "manjuAdminExtraStyles";

    style.textContent = `

        .admin-dashboard-welcome {
            padding:25px;
            background:#faf8f5;
            border:1px solid #e8dfd6;
            border-radius:20px;
        }

        .admin-dashboard-welcome h2 {
            margin:0 0 8px;
        }

        .admin-dashboard-welcome p {
            color:#777;
            margin:0 0 25px;
        }

        .dashboard-quick-grid {
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(190px,1fr));
            gap:14px;
        }

        .dashboard-quick-grid button {
            border:1px solid #e6ddd5;
            background:#fff;
            border-radius:15px;
            padding:20px;
            cursor:pointer;
            text-align:left;
            display:flex;
            flex-direction:column;
            gap:7px;
            font-size:25px;
            transition:.2s ease;
        }

        .dashboard-quick-grid button:hover {
            transform:translateY(-2px);
            box-shadow:
                0 8px 25px rgba(0,0,0,.08);
        }

        .dashboard-quick-grid button strong {
            font-size:15px;
            color:#222;
        }

        .dashboard-quick-grid button small {
            font-size:12px;
            color:#777;
        }

        .admin-manager {
            margin-top:25px;
        }

        .module-loading {
            padding:35px;
            text-align:center;
            color:#777;
        }

        .admin-error {
            padding:25px;
            background:#fff0f0;
            border:1px solid #e0aaaa;
            border-radius:14px;
            color:#7b2222;
        }

        .admin-form-card {
            background:#fff;
            border:1px solid #e7ded5;
            padding:20px;
            border-radius:16px;
            margin:15px 0 25px;
            display:flex;
            flex-direction:column;
            gap:10px;
        }

        .admin-form-card input,
        .admin-form-card textarea,
        .admin-form-card select {
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #ddd;
            border-radius:9px;
            font:inherit;
        }

        .admin-form-card textarea {
            min-height:100px;
            resize:vertical;
        }

        .form-buttons {
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        }

        .primary-button {
            border:0;
            background:#222;
            color:#fff;
            padding:12px 18px;
            border-radius:10px;
            cursor:pointer;
        }

        .primary-button:disabled {
            opacity:.6;
            cursor:not-allowed;
        }

        .danger-button {
            background:#8d2525 !important;
            color:#fff !important;
            border:0 !important;
            padding:8px 12px;
            border-radius:8px;
            cursor:pointer;
        }

        .admin-card-list {
            display:flex;
            flex-direction:column;
            gap:12px;
        }

        .admin-item-card {
            background:#fff;
            border:1px solid #e7ded5;
            border-radius:14px;
            padding:18px;
            display:flex;
            justify-content:space-between;
            gap:20px;
            align-items:center;
        }

        .admin-item-card h3 {
            margin:0 0 7px;
        }

        .admin-item-card p {
            color:#777;
            margin:5px 0 10px;
        }

        .admin-actions {
            display:flex;
            gap:8px;
            flex-wrap:wrap;
        }

        .admin-actions button {
            padding:8px 12px;
            border:1px solid #ddd;
            background:#fff;
            border-radius:8px;
            cursor:pointer;
        }

        .admin-table-wrapper {
            overflow-x:auto;
            background:#fff;
            border-radius:14px;
        }

        .admin-table {
            width:100%;
            border-collapse:collapse;
            min-width:750px;
        }

        .admin-table th,
        .admin-table td {
            padding:13px;
            border-bottom:1px solid #eee;
            text-align:left;
        }

        .admin-table th {
            background:#f7f3ef;
        }

        .admin-table select {
            padding:7px;
            border-radius:7px;
            border:1px solid #ddd;
        }

        .photo-grid {
            display:grid;
            grid-template-columns:
                repeat(auto-fill,minmax(210px,1fr));
            gap:16px;
        }

        .photo-admin-card {
            background:#fff;
            border:1px solid #e7ded5;
            border-radius:14px;
            overflow:hidden;
        }

        .photo-admin-card > img {
            width:100%;
            height:210px;
            object-fit:cover;
            display:block;
        }

        .photo-admin-info {
            padding:14px;
            display:flex;
            flex-direction:column;
            gap:8px;
        }

        .photo-admin-info small {
            color:#777;
        }

        .before-after-preview {
            display:grid;
            grid-template-columns:1fr 1fr;
        }

        .before-after-preview img {
            width:100%;
            height:170px;
            object-fit:cover;
        }

        .empty-admin {
            padding:35px;
            text-align:center;
            color:#777;
            background:#fff;
            border:1px dashed #ddd;
            border-radius:14px;
        }

        .no-image {
            height:210px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#f5f1ed;
            color:#888;
        }

        @media(max-width:700px) {

            .admin-item-card {
                flex-direction:column;
                align-items:flex-start;
            }

            .admin-table {
                min-width:700px;
            }

            .photo-grid {
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
            }

            .photo-admin-card > img {
                height:160px;
            }

            .no-image {
                height:160px;
            }

        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.showAdminPanel =
    showAdminPanel;

window.showLoginScreen =
    showLoginScreen;

window.loginAdmin =
    loginAdmin;

window.logoutAdmin =
    logoutAdmin;

window.openModule =
    openModule;

window.closeModule =
    closeModule;

window.showDashboardModule =
    showDashboardModule;

window.updateAppointmentStatus =
    updateAppointmentStatus;

window.deleteRecord =
    deleteRecord;

window.showServiceForm =
    showServiceForm;

window.saveService =
    saveService;

window.editService =
    editService;

window.showOfferForm =
    showOfferForm;

window.saveOffer =
    saveOffer;

window.editOffer =
    editOffer;

window.showGalleryForm =
    showGalleryForm;

window.uploadGalleryImage =
    uploadGalleryImage;

window.showBeforeAfterForm =
    showBeforeAfterForm;

window.uploadBeforeAfter =
    uploadBeforeAfter;

window.showBridalPackageForm =
    showBridalPackageForm;

window.saveBridalPackage =
    saveBridalPackage;

window.showSimpleForm =
    showSimpleForm;

window.saveSimpleRecord =
    saveSimpleRecord;

window.saveSettings =
    saveSettings;
