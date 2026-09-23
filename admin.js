/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN PANEL — SUPABASE MANAGEMENT SYSTEM
   ========================================================= */

let currentUser = null;
let activeModule = null;

/* ---------------------------------------------------------
   AUTHENTICATION
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Manju Admin Panel loaded");

    if (typeof supabaseClient === "undefined") {
        showSystemError(
            "Supabase configuration could not be loaded. Check supabase-config.js."
        );
        return;
    }

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    if (!session) {
        showLoginScreen();
        return;
    }

    currentUser = session.user;
    showDashboard();

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
            showLoginScreen();
        }

        if (event === "SIGNED_IN" && session) {
            currentUser = session.user;
            showDashboard();
        }
    });
});


/* ---------------------------------------------------------
   LOGIN SCREEN
--------------------------------------------------------- */

function showLoginScreen() {

    const loginSection =
        document.getElementById("loginSection");

    const dashboard =
        document.getElementById("dashboard");

    if (loginSection) loginSection.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
}


/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */

function showDashboard() {

    const loginSection =
        document.getElementById("loginSection");

    const dashboard =
        document.getElementById("dashboard");

    if (loginSection) loginSection.style.display = "none";
    if (dashboard) dashboard.style.display = "block";

    createAdminInterface();
}


/* ---------------------------------------------------------
   LOGIN
--------------------------------------------------------- */

async function loginAdmin(email, password) {

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

        showDashboard();

    } catch (error) {

        console.error(error);

        alert(
            "Login failed:\n\n" +
            (error.message || "Please check your email and password.")
        );
    }
}


/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */

async function logoutAdmin() {

    const confirmed =
        confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    await supabaseClient.auth.signOut();

    currentUser = null;

    showLoginScreen();
}


/* ---------------------------------------------------------
   CONNECT EXISTING LOGIN FORM
--------------------------------------------------------- */

document.addEventListener("submit", async (event) => {

    const form = event.target;

    if (form.id !== "loginForm") return;

    event.preventDefault();

    const email =
        document.getElementById("adminEmail")?.value.trim();

    const password =
        document.getElementById("adminPassword")?.value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    await loginAdmin(email, password);
});


/* ---------------------------------------------------------
   ADMIN INTERFACE
--------------------------------------------------------- */

function createAdminInterface() {

    const dashboard =
        document.getElementById("dashboard");

    if (!dashboard) return;

    /*
      We keep your existing dashboard.
      The management area is added underneath it.
    */

    let manager =
        document.getElementById("adminManager");

    if (!manager) {

        manager = document.createElement("div");

        manager.id = "adminManager";

        dashboard.appendChild(manager);
    }

    manager.innerHTML = `
        <div class="admin-manager">

            <div class="admin-manager-header">

                <div>
                    <h2>Management Center</h2>
                    <p>
                        Manage your salon website directly from Supabase.
                    </p>
                </div>

                <div class="admin-user">
                    ${escapeHTML(currentUser?.email || "")}
                </div>

            </div>

            <div class="admin-module-grid">

                ${moduleButton(
                    "appointments",
                    "📅",
                    "Appointments",
                    "Manage appointment requests"
                )}

                ${moduleButton(
                    "services",
                    "💄",
                    "Services",
                    "Manage salon services"
                )}

                ${moduleButton(
                    "offers",
                    "🎁",
                    "Offers",
                    "Manage offers and prices"
                )}

                ${moduleButton(
                    "gallery",
                    "🖼️",
                    "Gallery",
                    "Upload salon photos"
                )}

                ${moduleButton(
                    "before_after",
                    "✨",
                    "Before / After",
                    "Manage transformations"
                )}

                ${moduleButton(
                    "bride_gallery",
                    "👰",
                    "Bride & Girls",
                    "Upload bridal and girls photos"
                )}

                ${moduleButton(
                    "customer_gallery",
                    "👩",
                    "Customers",
                    "Manage customer photos"
                )}

                ${moduleButton(
                    "bridal_packages",
                    "💍",
                    "Bridal Packages",
                    "Manage bridal packages"
                )}

                ${moduleButton(
                    "team",
                    "👩‍🎨",
                    "Team",
                    "Manage team members"
                )}

                ${moduleButton(
                    "testimonials",
                    "⭐",
                    "Reviews",
                    "Manage testimonials"
                )}

                ${moduleButton(
                    "faqs",
                    "❓",
                    "FAQs",
                    "Manage frequently asked questions"
                )}

                ${moduleButton(
                    "settings",
                    "⚙️",
                    "Settings",
                    "Manage website settings"
                )}

            </div>

            <div id="moduleContent"></div>

        </div>
    `;

    addAdminStyles();

    document
        .querySelectorAll(".admin-module-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const module =
                    button.dataset.module;

                openModule(module);
            });
        });
}


/* ---------------------------------------------------------
   MODULE BUTTON
--------------------------------------------------------- */

function moduleButton(id, icon, title, description) {

    return `
        <button
            type="button"
            class="admin-module-button"
            data-module="${id}"
        >

            <span class="module-icon">${icon}</span>

            <span class="module-text">
                <strong>${title}</strong>
                <small>${description}</small>
            </span>

        </button>
    `;
}


/* ---------------------------------------------------------
   OPEN MODULE
--------------------------------------------------------- */

async function openModule(module) {

    activeModule = module;

    const container =
        document.getElementById("moduleContent");

    if (!container) return;

    container.innerHTML = `
        <div class="module-loading">
            Loading ${formatTitle(module)}...
        </div>
    `;

    switch (module) {

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

        case "before_after":
            await loadBeforeAfter();
            break;

        case "bride_gallery":
            await loadBrideGallery();
            break;

        case "customer_gallery":
            await loadCustomerGallery();
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
            container.innerHTML =
                "<p>Module not available.</p>";
    }
}


/* =========================================================
   APPOINTMENTS
========================================================= */

async function loadAppointments() {

    const { data, error } =
        await supabaseClient
            .from("appointments")
            .select("*")
            .order("created_at", { ascending: false });

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
                    <div class="empty-admin">
                        No appointment requests yet.
                    </div>
                </td>
            </tr>
        `;

    } else {

        data.forEach(item => {

            html += `
                <tr>

                    <td>${escapeHTML(
                        item.name || item.customer_name || "-"
                    )}</td>

                    <td>${escapeHTML(
                        item.phone || "-"
                    )}</td>

                    <td>${escapeHTML(
                        item.service || item.service_name || "-"
                    )}</td>

                    <td>${escapeHTML(
                        item.date || "-"
                    )}</td>

                    <td>${escapeHTML(
                        item.time || "-"
                    )}</td>

                    <td>

                        <select
                            onchange="updateAppointmentStatus('${item.id}', this.value)"
                        >

                            ${appointmentStatusOptions(
                                item.status
                            )}

                        </select>

                    </td>

                    <td>

                        <button
                            class="danger-button"
                            onclick="deleteRecord('appointments','${item.id}',loadAppointments)"
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

    return statuses
        .map(value => `
            <option
                value="${value}"
                ${status === value ? "selected" : ""}
            >
                ${value}
            </option>
        `)
        .join("");
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

    alert("Appointment status updated.");
}


/* =========================================================
   SERVICES
========================================================= */

async function loadServices() {

    const { data, error } =
        await supabaseClient
            .from("services")
            .select("*")
            .order("created_at", { ascending: false });

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
                                service.name || "Unnamed service"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                service.description || ""
                            )}
                        </p>

                        <strong>
                            ${
                                service.price
                                ? "₹" + escapeHTML(String(service.price))
                                : "Price not set"
                            }
                        </strong>

                    </div>

                    <div class="admin-actions">

                        <button
                            onclick='editService(${JSON.stringify(service)})'
                        >
                            Edit
                        </button>

                        <button
                            class="danger-button"
                            onclick="deleteRecord('services','${service.id}',loadServices)"
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

            <input
                id="serviceName"
                placeholder="Service name"
                value="${escapeAttribute(service?.name || "")}"
            >

            <textarea
                id="serviceDescription"
                placeholder="Description"
            >${escapeHTML(service?.description || "")}</textarea>

            <input
                id="servicePrice"
                type="number"
                placeholder="Price"
                value="${escapeAttribute(service?.price || "")}"
            >

            <input
                id="serviceDuration"
                placeholder="Duration e.g. 60 minutes"
                value="${escapeAttribute(service?.duration || "")}"
            >

            <input
                id="serviceCategory"
                placeholder="Category"
                value="${escapeAttribute(service?.category || "")}"
            >

            <label>
                <input
                    type="checkbox"
                    id="serviceActive"
                    ${service?.active !== false ? "checked" : ""}
                >
                Active
            </label>

            <div class="form-buttons">

                <button
                    class="primary-button"
                    onclick="saveService('${service?.id || ""}')"
                >
                    Save Service
                </button>

                <button
                    onclick="document.getElementById('serviceForm').innerHTML=''"
                >
                    Cancel
                </button>

            </div>

        </div>
    `;
}


async function saveService(id) {

    const payload = {

        name:
            document.getElementById("serviceName").value.trim(),

        description:
            document.getElementById("serviceDescription").value.trim(),

        price:
            document.getElementById("servicePrice").value
                ? Number(document.getElementById("servicePrice").value)
                : null,

        duration:
            document.getElementById("serviceDuration").value.trim(),

        category:
            document.getElementById("serviceCategory").value.trim(),

        active:
            document.getElementById("serviceActive").checked
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

    loadServices();
}


function editService(service) {
    showServiceForm(service);
}


/* =========================================================
   OFFERS
========================================================= */

async function loadOffers() {

    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .order("created_at", { ascending: false });

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

                        <strong>
                            ${
                                offer.offer_price
                                ? "₹" + offer.offer_price
                                : "Price not set"
                            }
                        </strong>

                    </div>

                    <div class="admin-actions">

                        <button
                            onclick='editOffer(${JSON.stringify(offer)})'
                        >
                            Edit
                        </button>

                        <button
                            class="danger-button"
                            onclick="deleteRecord('offers','${offer.id}',loadOffers)"
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

    document.getElementById("offerForm").innerHTML = `

        <div class="admin-form-card">

            <h3>
                ${offer ? "Edit Offer" : "Add Offer"}
            </h3>

            <input
                id="offerName"
                placeholder="Offer name"
                value="${escapeAttribute(offer?.name || "")}"
            >

            <textarea
                id="offerDescription"
                placeholder="Offer description"
            >${escapeHTML(offer?.description || "")}</textarea>

            <input
                id="offerOriginalPrice"
                type="number"
                placeholder="Original price"
                value="${escapeAttribute(offer?.original_price || "")}"
            >

            <input
                id="offerPrice"
                type="number"
                placeholder="Offer price"
                value="${escapeAttribute(offer?.offer_price || "")}"
            >

            <input
                id="offerStart"
                type="date"
                value="${escapeAttribute(offer?.start_date || "")}"
            >

            <input
                id="offerEnd"
                type="date"
                value="${escapeAttribute(offer?.end_date || "")}"
            >

            <textarea
                id="offerTerms"
                placeholder="Terms and conditions"
            >${escapeHTML(offer?.terms || "")}</textarea>

            <label>
                <input
                    type="checkbox"
                    id="offerActive"
                    ${offer?.active !== false ? "checked" : ""}
                >
                Active
            </label>

            <div class="form-buttons">

                <button
                    class="primary-button"
                    onclick="saveOffer('${offer?.id || ""}')"
                >
                    Save Offer
                </button>

                <button
                    onclick="document.getElementById('offerForm').innerHTML=''"
                >
                    Cancel
                </button>

            </div>

        </div>
    `;
}


async function saveOffer(id) {

    const payload = {

        name:
            document.getElementById("offerName").value.trim(),

        description:
            document.getElementById("offerDescription").value.trim(),

        original_price:
            document.getElementById("offerOriginalPrice").value
            ? Number(document.getElementById("offerOriginalPrice").value)
            : null,

        offer_price:
            document.getElementById("offerPrice").value
            ? Number(document.getElementById("offerPrice").value)
            : null,

        start_date:
            document.getElementById("offerStart").value || null,

        end_date:
            document.getElementById("offerEnd").value || null,

        terms:
            document.getElementById("offerTerms").value.trim(),

        active:
            document.getElementById("offerActive").checked
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

    alert("Offer saved.");

    loadOffers();
}


function editOffer(offer) {
    showOfferForm(offer);
}


/* =========================================================
   GALLERY MODULES
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
            .order("created_at", { ascending: false });

    if (error) {

        showDatabaseError(error);

        return;
    }

    let html = `
        ${moduleHeader(title, description)}

        <button
            class="primary-button"
            onclick="showGalleryForm('${table}','${bucket}')"
        >
            + Upload Photo
        </button>

        <div id="${table}Form"></div>

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
                        ? `<img src="${escapeAttribute(image)}">`
                        : `<div class="no-image">No image</div>`
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
                            class="danger-button"
                            onclick="deleteRecord('${table}','${item.id}',()=>loadImageGallery('${table}','${title}','${bucket}','${description}'))"
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
        document.getElementById(`${table}Form`);

    if (!container) return;

    container.innerHTML = `

        <div class="admin-form-card">

            <h3>Upload Photo</h3>

            <input
                id="galleryTitle"
                placeholder="Photo title"
            >

            <input
                id="galleryCategory"
                placeholder="Category"
            >

            <textarea
                id="galleryDescription"
                placeholder="Description"
            ></textarea>

            <input
                id="galleryDate"
                type="date"
            >

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
                class="primary-button"
                onclick="uploadGalleryImage('${table}','${bucket}')"
            >
                Upload Photo
            </button>

        </div>
    `;
}


async function uploadGalleryImage(table, bucket) {

    const file =
        document.getElementById("galleryFile")?.files[0];

    if (!file) {

        alert("Please select an image.");

        return;
    }

    if (file.size > 10 * 1024 * 1024) {

        alert("Maximum image size is 10 MB.");

        return;
    }

    const extension =
        file.name.split(".").pop();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;

    const filePath =
        fileName;

    const { error: uploadError } =
        await supabaseClient.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            });

    if (uploadError) {

        alert(uploadError.message);

        return;
    }

    const { data: publicData } =
        supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);

    const imageUrl =
        publicData.publicUrl;

    const payload = {

        title:
            document.getElementById("galleryTitle")?.value.trim(),

        category:
            document.getElementById("galleryCategory")?.value.trim(),

        description:
            document.getElementById("galleryDescription")?.value.trim(),

        date:
            document.getElementById("galleryDate")?.value || null,

        featured:
            document.getElementById("galleryFeatured")?.checked || false,

        image_url:
            imageUrl
    };

    const { error } =
        await supabaseClient
            .from(table)
            .insert(payload);

    if (error) {

        alert(
            "Photo uploaded but database record failed:\n\n" +
            error.message
        );

        return;
    }

    alert("Photo uploaded successfully.");

    if (table === "gallery") loadGallery();

    if (table === "bride_gallery") loadBrideGallery();

    if (table === "customer_gallery") loadCustomerGallery();
}


/* =========================================================
   BEFORE / AFTER
========================================================= */

async function loadBeforeAfter() {

    const { data, error } =
        await supabaseClient
            .from("before_after")
            .select("*")
            .order("created_at", { ascending: false });

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
                            ? `<img src="${escapeAttribute(item.before_image_url)}">`
                            : ""
                        }

                        ${
                            item.after_image_url
                            ? `<img src="${escapeAttribute(item.after_image_url)}">`
                            : ""
                        }

                    </div>

                    <div class="photo-admin-info">

                        <strong>
                            ${escapeHTML(
                                item.title || "Transformation"
                            )}
                        </strong>

                        <button
                            class="danger-button"
                            onclick="deleteRecord('before_after','${item.id}',loadBeforeAfter)"
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

    document.getElementById(
        "beforeAfterForm"
    ).innerHTML = `

        <div class="admin-form-card">

            <h3>Add Before / After</h3>

            <input
                id="baTitle"
                placeholder="Transformation title"
            >

            <input
                id="baBefore"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <label>Before Photo</label>

            <input
                id="baAfter"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <label>After Photo</label>

            <button
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
        document.getElementById("baBefore").files[0];

    const after =
        document.getElementById("baAfter").files[0];

    const title =
        document.getElementById("baTitle").value.trim();

    if (!before || !after) {

        alert("Please select both images.");

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

    alert("Transformation uploaded.");

    loadBeforeAfter();
}


/* =========================================================
   BRIDAL PACKAGES
========================================================= */

async function loadBridalPackages() {

    const { data, error } =
        await supabaseClient
            .from("bridal_packages")
            .select("*")
            .order("created_at", { ascending: false });

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
                                item.name || "Bridal Package"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.description || ""
                            )}
                        </p>

                        ${
                            item.price
                            ? `<strong>₹${item.price}</strong>`
                            : `<strong>Price not set</strong>`
                        }

                    </div>

                    <button
                        class="danger-button"
                        onclick="deleteRecord('bridal_packages','${item.id}',loadBridalPackages)"
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

    document.getElementById(
        "bridalPackageForm"
    ).innerHTML = `

        <div class="admin-form-card">

            <h3>Add Bridal Package</h3>

            <input
                id="bridalName"
                placeholder="Package name"
            >

            <textarea
                id="bridalDescription"
                placeholder="Package description"
            ></textarea>

            <input
                id="bridalPrice"
                type="number"
                placeholder="Price"
            >

            <button
                class="primary-button"
                onclick="saveBridalPackage()"
            >
                Save Package
            </button>

        </div>
    `;
}


async function saveBridalPackage() {

    const payload = {

        name:
            document.getElementById("bridalName").value.trim(),

        description:
            document.getElementById("bridalDescription").value.trim(),

        price:
            document.getElementById("bridalPrice").value
            ? Number(document.getElementById("bridalPrice").value)
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

    loadBridalPackages();
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


async function loadSimpleModule(
    table,
    title,
    description
) {

    const { data, error } =
        await supabaseClient
            .from(table)
            .select("*")
            .order("created_at", { ascending: false });

    if (error) {

        showDatabaseError(error);

        return;
    }

    let html = `
        ${moduleHeader(title, description)}

        <button
            class="primary-button"
            onclick="showSimpleForm('${table}')"
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
                            ${escapeHTML(descriptionText)}
                        </p>

                    </div>

                    <button
                        class="danger-button"
                        onclick="deleteRecord('${table}','${item.id}',()=>loadSimpleModule('${table}','${title}','${description}'))"
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
        document.getElementById("simpleForm");

    if (!container) return;

    if (table === "faqs") {

        container.innerHTML = `

            <div class="admin-form-card">

                <h3>Add FAQ</h3>

                <input
                    id="simpleTitle"
                    placeholder="Question"
                >

                <textarea
                    id="simpleDescription"
                    placeholder="Answer"
                ></textarea>

                <button
                    class="primary-button"
                    onclick="saveSimpleRecord('faqs')"
                >
                    Save FAQ
                </button>

            </div>
        `;

    } else {

        container.innerHTML = `

            <div class="admin-form-card">

                <h3>Add Record</h3>

                <input
                    id="simpleTitle"
                    placeholder="Name / Title"
                >

                <textarea
                    id="simpleDescription"
                    placeholder="Description"
                ></textarea>

                <button
                    class="primary-button"
                    onclick="saveSimpleRecord('${table}')"
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
                document.getElementById("simpleTitle")
                    .value.trim(),

            answer:
                document.getElementById("simpleDescription")
                    .value.trim()
        };

    } else {

        payload = {

            name:
                document.getElementById("simpleTitle")
                    .value.trim(),

            description:
                document.getElementById("simpleDescription")
                    .value.trim()
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

    if (table === "team") loadTeam();

    if (table === "testimonials") loadTestimonials();

    if (table === "faqs") loadFAQs();
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
        settings[item.key] = item.value;
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
            ).value.trim(),

        artist_name:
            document.getElementById(
                "settingArtistName"
            ).value.trim(),

        phone:
            document.getElementById(
                "settingPhone"
            ).value.trim(),

        whatsapp:
            document.getElementById(
                "settingWhatsapp"
            ).value.trim(),

        email:
            document.getElementById(
                "settingEmail"
            ).value.trim(),

        address:
            document.getElementById(
                "settingAddress"
            ).value.trim()
    };

    for (const [key, value] of Object.entries(values)) {

        const { data: existing } =
            await supabaseClient
                .from("settings")
                .select("id")
                .eq("key", key)
                .maybeSingle();

        let result;

        if (existing) {

            result =
                await supabaseClient
                    .from("settings")
                    .update({ value })
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

    alert("Website settings saved.");
}


/* =========================================================
   STORAGE
========================================================= */

async function uploadStorageFile(bucket, file) {

    if (!file) return null;

    if (file.size > 10 * 1024 * 1024) {

        alert("Maximum image size is 10 MB.");

        return null;
    }

    const extension =
        file.name.split(".").pop();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;

    const { error } =
        await supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            });

    if (error) {

        alert(error.message);

        return null;
    }

    const { data } =
        supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);

    return data.publicUrl;
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

    const { error } =
        await supabaseClient
            .from(table)
            .delete()
            .eq("id", id);

    if (error) {

        alert(error.message);

        return;
    }

    alert("Deleted successfully.");

    if (typeof callback === "function") {
        callback();
    }
}


/* =========================================================
   UI HELPERS
========================================================= */

function setModuleHTML(html) {

    const container =
        document.getElementById("moduleContent");

    if (container) {
        container.innerHTML = html;
    }
}


function moduleHeader(title, description) {

    return `

        <div class="module-header">

            <div>

                <h2>${title}</h2>

                <p>
                    ${escapeHTML(description)}
                </p>

            </div>

            <button
                onclick="closeModule()"
            >
                ← Dashboard
            </button>

        </div>
    `;
}


function closeModule() {

    const container =
        document.getElementById("moduleContent");

    if (container) {
        container.innerHTML = "";
    }

    activeModule = null;
}


function emptyMessage(message) {

    return `
        <div class="empty-admin">
            ${escapeHTML(message)}
        </div>
    `;
}


function showDatabaseError(error) {

    console.error(error);

    setModuleHTML(`

        <div class="admin-error">

            <h3>Something went wrong</h3>

            <p>
                ${escapeHTML(
                    error?.message ||
                    "Database error"
                )}
            </p>

        </div>
    `);
}


function showSystemError(message) {

    document.body.insertAdjacentHTML(
        "beforeend",

        `
        <div
            style="
                padding:30px;
                margin:30px;
                background:#fff0f0;
                border:1px solid #e0aaaa;
                color:#7b2222;
                border-radius:12px;
            "
        >
            ${escapeHTML(message)}
        </div>
        `
    );
}


function formatTitle(text) {

    return text
        .replaceAll("_", " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}


/* =========================================================
   SECURITY / HTML ESCAPING
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


/* =========================================================
   ADMIN STYLES
========================================================= */

function addAdminStyles() {

    if (document.getElementById("manjuAdminStyles")) {
        return;
    }

    const style =
        document.createElement("style");

    style.id = "manjuAdminStyles";

    style.textContent = `

        .admin-manager {
            margin-top:40px;
            padding:24px;
            background:#faf8f5;
            border-radius:20px;
        }

        .admin-manager-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:20px;
            margin-bottom:25px;
        }

        .admin-manager-header h2 {
            margin:0 0 6px;
        }

        .admin-manager-header p {
            margin:0;
            color:#777;
        }

        .admin-user {
            padding:10px 14px;
            background:#fff;
            border-radius:30px;
            font-size:13px;
            color:#666;
        }

        .admin-module-grid {
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(220px,1fr));
            gap:15px;
        }

        .admin-module-button {
            border:1px solid #e7ded5;
            background:#fff;
            border-radius:16px;
            padding:18px;
            display:flex;
            align-items:center;
            gap:14px;
            text-align:left;
            cursor:pointer;
            transition:.2s;
        }

        .admin-module-button:hover {
            transform:translateY(-2px);
            box-shadow:0 8px 25px rgba(0,0,0,.08);
        }

        .module-icon {
            font-size:28px;
        }

        .module-text {
            display:flex;
            flex-direction:column;
            gap:5px;
        }

        .module-text small {
            color:#777;
        }

        #moduleContent {
            margin-top:30px;
        }

        .module-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            margin-bottom:20px;
        }

        .module-header h2 {
            margin:0 0 5px;
        }

        .module-header p {
            margin:0;
            color:#777;
        }

        .primary-button {
            border:0;
            background:#222;
            color:#fff;
            padding:12px 18px;
            border-radius:10px;
            cursor:pointer;
            margin:8px 0 18px;
        }

        .danger-button {
            background:#8d2525 !important;
            color:white !important;
            border:0;
            padding:8px 12px;
            border-radius:8px;
            cursor:pointer;
        }

        .admin-form-card {
            background:#fff;
            border:1px solid #e8dfd6;
            padding:20px;
            border-radius:16px;
            margin:15px 0 25px;
            display:flex;
            flex-direction:column;
            gap:12px;
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

        .form-buttons button:not(.primary-button) {
            padding:10px 15px;
            border:1px solid #ddd;
            background:#fff;
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
            margin:0 0 6px;
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

        .admin-error {
            padding:25px;
            background:#fff0f0;
            border:1px solid #e0aaaa;
            border-radius:14px;
            color:#7b2222;
        }

        .module-loading {
            padding:30px;
            text-align:center;
            color:#777;
        }

        @media(max-width:700px) {

            .admin-manager {
                padding:15px;
            }

            .admin-manager-header,
            .module-header {
                flex-direction:column;
                align-items:flex-start;
            }

            .admin-item-card {
                flex-direction:column;
                align-items:flex-start;
            }

            .photo-grid {
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
            }

            .photo-admin-card > img {
                height:160px;
            }

        }

    `;

    document.head.appendChild(style);
}


/* ---------------------------------------------------------
   GLOBAL FUNCTIONS
--------------------------------------------------------- */

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.openModule = openModule;
window.closeModule = closeModule;

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
