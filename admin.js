// ============================================================
// MANJU'S THE WORLD OF GLAMOUR
// ADMIN PANEL
// Supabase-powered admin dashboard
// ============================================================

"use strict";


// ============================================================
// GLOBALS
// ============================================================

let currentModule = "dashboard";

const moduleContent =
    document.getElementById("moduleContent");


// ============================================================
// BASIC HELPERS
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


function escapeAttribute(value) {
    return escapeHTML(value);
}


function safeJSON(value) {

    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/'/g, "\\u0027");
}


function showMessage(message, type = "success") {

    let box =
        document.getElementById("adminMessage");

    if (!box) {

        box = document.createElement("div");

        box.id = "adminMessage";

        box.style.position = "fixed";
        box.style.top = "20px";
        box.style.right = "20px";
        box.style.zIndex = "99999";
        box.style.maxWidth = "420px";
        box.style.padding = "14px 18px";
        box.style.borderRadius = "10px";
        box.style.fontFamily = "Arial, sans-serif";
        box.style.fontSize = "14px";
        box.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.15)";

        document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.background =
        type === "error"
            ? "#b42318"
            : "#1f7a4d";

    box.style.color = "#fff";

    box.style.display = "block";

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {

        box.style.display = "none";

    }, 4000);
}


function showDatabaseError(error) {

    console.error(error);

    if (!moduleContent) return;

    moduleContent.innerHTML = `

        <div class="admin-module">

            <h2>Database Error</h2>

            <p>
                ${escapeHTML(
                    error?.message ||
                    "Something went wrong."
                )}
            </p>

        </div>

    `;
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function checkAdminSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }

        const session = data?.session;

        const loginSection =
            document.getElementById(
                "loginSection"
            );

        const adminPanel =
            document.getElementById(
                "adminPanel"
            );

        if (session) {

            if (loginSection) {
                loginSection.style.display =
                    "none";
            }

            if (adminPanel) {
                adminPanel.style.display =
                    "block";
            }

            await initializeAdmin();

        } else {

            if (loginSection) {
                loginSection.style.display =
                    "flex";
            }

            if (adminPanel) {
                adminPanel.style.display =
                    "none";
            }
        }

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );
    }
}


async function loginAdmin(email, password) {

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return false;
    }

    showMessage(
        "Login successful."
    );

    await checkAdminSession();

    return true;
}


async function logoutAdmin() {

    const {
        error
    } = await supabaseClient.auth.signOut();

    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }

    window.location.reload();
}


// ============================================================
// AUTH FORM
// ============================================================

function setupLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    if (!loginForm) return;

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                document
                    .getElementById("adminEmail")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("adminPassword")
                    ?.value;

            if (!email || !password) {

                showMessage(
                    "Enter email and password.",
                    "error"
                );

                return;
            }

            await loginAdmin(
                email,
                password
            );
        }
    );
}


// ============================================================
// ADMIN INITIALIZATION
// ============================================================

async function initializeAdmin() {

    setupNavigation();

    setupLogout();

    await openModule(
        "dashboard"
    );
}


function setupLogout() {

    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            logoutAdmin
        );

    });
}


function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            "[data-open-module]"
        );

    buttons.forEach(button => {

        if (
            button.dataset
                .navigationBound
        ) {
            return;
        }

        button.dataset.navigationBound =
            "true";

        button.addEventListener(
            "click",
            async () => {

                const module =
                    button.dataset.openModule;

                if (module) {

                    await openModule(
                        module
                    );
                }

            }
        );

    });
}


// ============================================================
// MODULE ROUTER
// ============================================================

async function openModule(moduleName) {

    currentModule =
        moduleName;

    if (!moduleContent) {

        console.error(
            "moduleContent not found."
        );

        return;
    }

    moduleContent.innerHTML = `

        <div
            style="
                padding:40px;
                text-align:center;
            "
        >
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
                    "Upload work and gallery images."
                );

                break;


            case "bride_gallery":

                await loadImageGallery(
                    "bride_gallery",
                    "Bride Gallery",
                    "bride-gallery",
                    "Upload bridal and bride images."
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
                    "Manage team members and artists."
                );

                break;


            case "testimonials":

                await loadSimpleTable(
                    "testimonials",
                    "Testimonials",
                    "Manage customer testimonials."
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

        console.error(
            "Module error:",
            error
        );

        showDatabaseError(error);
    }
}


// ============================================================
// DASHBOARD
// ============================================================

async function getCount(table) {

    const {
        count,
        error
    } = await supabaseClient
        .from(table)
        .select("*", {
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

            <div class="module-header">

                <div>

                    <h2>Dashboard</h2>

                    <p>
                        Manage Manju's The World of Glamour.
                    </p>

                </div>

            </div>


            <div class="dashboard-grid">


                ${dashboardCard(
                    counts.appointments,
                    "Appointments",
                    "appointments"
                )}


                ${dashboardCard(
                    counts.services,
                    "Services",
                    "services"
                )}


                ${dashboardCard(
                    counts.offers,
                    "Offers",
                    "offers"
                )}


                ${dashboardCard(
                    counts.gallery,
                    "Gallery",
                    "gallery"
                )}


                ${dashboardCard(
                    counts.bride_gallery,
                    "Bride Gallery",
                    "bride_gallery"
                )}


                ${dashboardCard(
                    counts.customer_gallery,
                    "Customer Gallery",
                    "customer_gallery"
                )}


                ${dashboardCard(
                    counts.before_after,
                    "Before / After",
                    "before_after"
                )}


                ${dashboardCard(
                    counts.bridal_packages,
                    "Bridal Packages",
                    "bridal_packages"
                )}


                ${dashboardCard(
                    counts.team,
                    "Team",
                    "team"
                )}


                ${dashboardCard(
                    counts.testimonials,
                    "Testimonials",
                    "testimonials"
                )}


                ${dashboardCard(
                    counts.faqs,
                    "FAQs",
                    "faqs"
                )}


                <div
                    class="dashboard-card"
                    data-open-module="settings"
                >

                    <h3>⚙</h3>

                    <p>Settings</p>

                </div>


            </div>

        </div>

    `;

    setupNavigation();
}


function dashboardCard(
    count,
    title,
    module
) {

    return `

        <div
            class="dashboard-card"
            data-open-module="${escapeAttribute(
                module
            )}"
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


// ============================================================
// APPOINTMENTS
// ============================================================

async function loadAppointments() {

    const {
        data,
        error
    } = await supabaseClient
        .from("appointments")
        .select(`
            *,
            services (
                id,
                name
            )
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>Appointments</h2>

                    <p>
                        Manage appointment requests.
                    </p>

                </div>

            </div>


            ${
                data?.length
                    ? `

                <div class="admin-table-wrap">

                    <table class="admin-table">

                        <thead>

                            <tr>

                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Service</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Action</th>

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
                                            item.services?.name ||
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

                                        <select
                                            onchange="updateAppointmentStatus(
                                                '${escapeAttribute(
                                                    item.id
                                                )}',
                                                this.value
                                            )"
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
                                                            item.status ===
                                                            status
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

                                        <button
                                            class="delete-btn"
                                            data-delete-table="appointments"
                                            data-delete-id="${escapeAttribute(
                                                item.id
                                            )}"
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

    attachDeleteButtons();
}


async function updateAppointmentStatus(
    id,
    status
) {

    const {
        error
    } = await supabaseClient
        .from("appointments")
        .update({
            status,
            updated_at:
                new Date().toISOString()
        })
        .eq("id", id);

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


// ============================================================
// SERVICES
// ============================================================

async function loadServices() {

    const {
        data,
        error
    } = await supabaseClient
        .from("services")
        .select(`
            *,
            categories (
                id,
                name
            )
        `)
        .order(
            "display_order",
            {
                ascending: true
            }
        );

    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>Services</h2>

                    <p>
                        Manage beauty and salon services.
                    </p>

                </div>


                <button
                    id="addServiceBtn"
                    class="primary-btn"
                >
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
                                            ${escapeHTML(
                                                item.name ||
                                                "—"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                item.categories?.name ||
                                                "—"
                                            )}
                                        </td>

                                        <td>

                                            ${
                                                item.price !==
                                                    null &&
                                                item.price !==
                                                    undefined
                                                    ? "₹" +
                                                      escapeHTML(
                                                          String(
                                                              item.price
                                                          )
                                                      )
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
                                                        String(
                                                            item.duration_minutes
                                                        )
                                                      ) +
                                                      " min"
                                                    : "—"
                                            }

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
                                                type="button"
                                                class="primary-button"
                                                onclick='editService(${safeJSON(
                                                    item
                                                )})'
                                            >
                                                Edit
                                            </button>


                                            <button
                                                type="button"
                                                class="delete-btn"
                                                data-delete-table="services"
                                                data-delete-id="${escapeAttribute(
                                                    item.id
                                                )}"
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
        .getElementById(
            "addServiceBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showServiceForm();

            }
        );


    attachDeleteButtons();
}


async function showServiceForm(
    service = null
) {

    const area =
        document.getElementById(
            "serviceFormArea"
        );

    if (!area) return;


    const {
        data: categories,
        error
    } = await supabaseClient
        .from("categories")
        .select(
            "id, name, active"
        )
        .eq(
            "active",
            true
        )
        .order(
            "display_order",
            {
                ascending: true
            }
        );


    if (error) {

        showMessage(
            "Could not load categories: " +
            error.message,
            "error"
        );

        return;
    }


    const selectedCategoryId =
        service?.category_id ||
        "";


    area.innerHTML = `

        <div class="admin-form-card">

            <h3>

                ${
                    service
                        ? "Edit Service"
                        : "Add Service"
                }

            </h3>


            <form id="serviceForm">


                <label>
                    Service Name
                </label>

                <input
                    id="serviceName"
                    required
                    placeholder="Service name"
                    value="${escapeAttribute(
                        service?.name ||
                        ""
                    )}"
                >


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


                    ${
                        (categories || [])
                            .map(
                                category => `

                                    <option
                                        value="${escapeAttribute(
                                            category.id
                                        )}"
                                        ${
                                            selectedCategoryId ===
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
                            )
                            .join("")
                    }

                </select>


                <label>
                    Description
                </label>

                <textarea
                    id="serviceDescription"
                    rows="4"
                    placeholder="Service description"
                >${escapeHTML(
                    service?.description ||
                    ""
                )}</textarea>


                <label>
                    Price
                </label>

                <input
                    id="servicePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave empty for price on enquiry"
                    value="${
                        service?.price ??
                        ""
                    }"
                >


                <label>
                    Price Label
                </label>

                <input
                    id="servicePriceLabel"
                    placeholder="Price on enquiry"
                    value="${escapeAttribute(
                        service?.price_label ||
                        "Price on enquiry"
                    )}"
                >


                <label>
                    Duration (minutes)
                </label>

                <input
                    id="serviceDuration"
                    type="number"
                    min="0"
                    placeholder="Example: 60"
                    value="${
                        service?.duration_minutes ??
                        ""
                    }"
                >


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


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save Service
                    </button>


                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelServiceBtn"
                    >
                        Cancel
                    </button>

                </div>


            </form>

        </div>

    `;


    document
        .getElementById(
            "cancelServiceBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                area.innerHTML = "";

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

                await saveService(
                    service?.id ||
                    null
                );

            }
        );
}


async function saveService(
    id = null
) {

    const name =
        document
            .getElementById(
                "serviceName"
            )
            ?.value
            .trim();


    const categoryId =
        document
            .getElementById(
                "serviceCategory"
            )
            ?.value;


    const description =
        document
            .getElementById(
                "serviceDescription"
            )
            ?.value
            .trim();


    const priceValue =
        document
            .getElementById(
                "servicePrice"
            )
            ?.value;


    const priceLabel =
        document
            .getElementById(
                "servicePriceLabel"
            )
            ?.value
            .trim();


    const durationValue =
        document
            .getElementById(
                "serviceDuration"
            )
            ?.value;


    const featured =
        document
            .getElementById(
                "serviceFeatured"
            )
            ?.checked ||
        false;


    const active =
        document
            .getElementById(
                "serviceActive"
            )
            ?.checked !== false;


    if (!name) {

        showMessage(
            "Please enter a service name.",
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


    const slug =
        name
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    const payload = {

        name,

        slug,

        category_id:
            categoryId,

        description:
            description ||
            null,

        price:
            priceValue === ""
                ? null
                : Number(
                    priceValue
                  ),

        price_label:
            priceLabel ||
            "Price on enquiry",

        duration_minutes:
            durationValue === ""
                ? null
                : Number(
                    durationValue
                  ),

        featured,

        active

    };


    let result;


    if (id) {

        result =
            await supabaseClient
                .from("services")
                .update(payload)
                .eq(
                    "id",
                    id
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
        id
            ? "Service updated successfully."
            : "Service added successfully."
    );


    await loadServices();
}


function editService(
    service
) {

    showServiceForm(
        service
    );

    setTimeout(
        () => {

            document
                .getElementById(
                    "serviceFormArea"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        },
        50
    );
}


// ============================================================
// OFFERS
// ============================================================

async function loadOffers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("offers")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>Offers</h2>

                    <p>
                        Create and manage special offers.
                    </p>

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
                                    <th>Original</th>
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
                                            ${escapeHTML(
                                                item.name ||
                                                "—"
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                item.original_price ??
                                                "—"
                                            }
                                        </td>

                                        <td>
                                            ${
                                                item.offer_price ??
                                                "—"
                                            }
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
                                                item.active
                                                    ? "Yes"
                                                    : "No"
                                            }
                                        </td>

                                        <td>

                                            <button
                                                class="primary-button"
                                                onclick='editOffer(${safeJSON(
                                                    item
                                                )})'
                                            >
                                                Edit
                                            </button>


                                            <button
                                                class="delete-btn"
                                                data-delete-table="offers"
                                                data-delete-id="${escapeAttribute(
                                                    item.id
                                                )}"
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


function showOfferForm(
    offer = null
) {

    const area =
        document.getElementById(
            "offerFormArea"
        );

    if (!area) return;


    area.innerHTML = `

        <div class="admin-form-card">

            <h3>

                ${
                    offer
                        ? "Edit Offer"
                        : "Add Offer"
                }

            </h3>


            <form id="offerForm">


                <label>
                    Offer Name
                </label>

                <input
                    id="offerName"
                    required
                    value="${escapeAttribute(
                        offer?.name ||
                        ""
                    )}"
                >


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


                <label>
                    Start Date
                </label>

                <input
                    id="offerStartDate"
                    type="date"
                    value="${escapeAttribute(
                        offer?.start_date ||
                        ""
                    )}"
                >


                <label>
                    End Date
                </label>

                <input
                    id="offerEndDate"
                    type="date"
                    value="${escapeAttribute(
                        offer?.end_date ||
                        ""
                    )}"
                >


                <label>
                    Description
                </label>

                <textarea
                    id="offerDescription"
                    rows="4"
                >${escapeHTML(
                    offer?.description ||
                    ""
                )}</textarea>


                <label>
                    Terms
                </label>

                <textarea
                    id="offerTerms"
                    rows="3"
                >${escapeHTML(
                    offer?.terms ||
                    ""
                )}</textarea>


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


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
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
        .getElementById(
            "cancelOfferBtn"
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

                await saveOffer(
                    offer?.id ||
                    null
                );

            }
        );
}


async function saveOffer(
    id = null
) {

    const payload = {

        name:
            document
                .getElementById(
                    "offerName"
                )
                ?.value
                .trim(),

        original_price:
            document
                .getElementById(
                    "offerOriginalPrice"
                )
                ?.value || null,

        offer_price:
            document
                .getElementById(
                    "offerPrice"
                )
                ?.value || null,

        start_date:
            document
                .getElementById(
                    "offerStartDate"
                )
                ?.value ||
            null,

        end_date:
            document
                .getElementById(
                    "offerEndDate"
                )
                ?.value ||
            null,

        description:
            document
                .getElementById(
                    "offerDescription"
                )
                ?.value
                .trim() ||
            null,

        terms:
            document
                .getElementById(
                    "offerTerms"
                )
                ?.value
                .trim() ||
            null,

        active:
            document
                .getElementById(
                    "offerActive"
                )
                ?.checked ||
            false

    };


    if (!payload.name) {

        showMessage(
            "Offer name is required.",
            "error"
        );

        return;
    }


    let result;


    if (id) {

        result =
            await supabaseClient
                .from("offers")
                .update(payload)
                .eq(
                    "id",
                    id
                );

    } else {

        result =
            await supabaseClient
                .from("offers")
                .insert(
                    payload
                );

    }


    if (result.error) {

        showMessage(
            result.error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Offer saved successfully."
    );


    await loadOffers();
}


function editOffer(
    offer
) {

    showOfferForm(
        offer
    );
}


// ============================================================
// IMAGE GALLERY
// ============================================================

async function loadImageGallery(
    table,
    title,
    bucket,
    description
) {

    const {
        data,
        error
    } = await supabaseClient
        .from(table)
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

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

                            <div
                                class="admin-gallery-card"
                            >

                                ${
                                    item.image_url
                                        ? `

                                        <img
                                            src="${escapeAttribute(
                                                item.image_url
                                            )}"
                                            alt="${escapeAttribute(
                                                item.title ||
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


                                <div
                                    class="admin-gallery-info"
                                >

                                    <h4>
                                        ${escapeHTML(
                                            item.title ||
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
                                        data-delete-table="${escapeAttribute(
                                            table
                                        )}"
                                        data-delete-id="${escapeAttribute(
                                            item.id
                                        )}"
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
        .getElementById(
            "addGalleryBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showGalleryForm(
                    table,
                    bucket
                );

            }
        );


    attachDeleteButtons();
}


function showGalleryForm(
    table,
    bucket
) {

    const area =
        document.getElementById(
            "galleryFormArea"
        );

    if (!area) return;


    area.innerHTML = `

        <div class="admin-form-card">

            <h3>
                Add Image
            </h3>


            <form id="galleryForm">


                <label>
                    Title
                </label>

                <input
                    id="galleryTitle"
                    required
                    placeholder="Image title"
                >


                <label>
                    Category
                </label>

                <input
                    id="galleryCategory"
                    placeholder="Bridal, Makeup, Hair, etc."
                >


                <label>
                    Description
                </label>

                <textarea
                    id="galleryDescription"
                    rows="3"
                ></textarea>


                <label>
                    Photo
                </label>

                <input
                    id="galleryFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                >


                <label>

                    <input
                        type="checkbox"
                        id="galleryFeatured"
                    >

                    Featured

                </label>


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
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
        .getElementById(
            "cancelGalleryBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                area.innerHTML = "";

            }
        );


    document
        .getElementById(
            "galleryForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await uploadGalleryImage(
                    table,
                    bucket
                );

            }
        );
}


async function uploadGalleryImage(
    table,
    bucket
) {

    try {

        const file =
            document
                .getElementById(
                    "galleryFile"
                )
                ?.files[0];


        if (!file) {

            throw new Error(
                "Please select an image."
            );
        }


        const imageUrl =
            await uploadStorageFile(
                bucket,
                file
            );


        if (!imageUrl) return;


        const payload = {

            title:
                document
                    .getElementById(
                        "galleryTitle"
                    )
                    ?.value
                    .trim() ||
                "",

            category:
                document
                    .getElementById(
                        "galleryCategory"
                    )
                    ?.value
                    .trim() ||
                "",

            description:
                document
                    .getElementById(
                        "galleryDescription"
                    )
                    ?.value
                    .trim() ||
                "",

            featured:
                document
                    .getElementById(
                        "galleryFeatured"
                    )
                    ?.checked ||
                false,

            image_url:
                imageUrl

        };


        /*
         * IMPORTANT:
         *
         * The current database schemas for
         * gallery / bride_gallery / customer_gallery
         * support the fields above.
         *
         * We intentionally do NOT send:
         * - date
         *
         * because that caused the previous
         * missing-column error.
         */


        const {
            error
        } = await supabaseClient
            .from(table)
            .insert(
                payload
            );


        if (error) {

            throw error;
        }


        showMessage(
            "Image uploaded successfully."
        );


        await loadImageGallery(
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
// STORAGE
// ============================================================

async function uploadStorageFile(
    bucket,
    file
) {

    if (!file) {

        throw new Error(
            "Please select an image."
        );
    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Maximum file size is 10 MB."
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
            "Only JPG, PNG and WEBP images are allowed."
        );
    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}.${extension}`;


    const {
        error
    } = await supabaseClient
        .storage
        .from(bucket)
        .upload(
            fileName,
            file,
            {
                cacheControl:
                    "3600",
                upsert:
                    false,
                contentType:
                    file.type
            }
        );


    if (error) {

        throw error;
    }


    const {
        data
    } = supabaseClient
        .storage
        .from(bucket)
        .getPublicUrl(
            fileName
        );


    return data.publicUrl;
}


// ============================================================
// BEFORE / AFTER
// ============================================================

async function loadBeforeAfter() {

    const {
        data,
        error
    } = await supabaseClient
        .from("before_after")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>
                        Before / After
                    </h2>

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


            <div
                id="beforeAfterFormArea"
            ></div>


            ${
                data?.length
                    ? `

                    <div
                        class="admin-gallery-grid"
                    >

                        ${data.map(item => `

                            <div
                                class="admin-gallery-card"
                            >

                                <div
                                    class="before-after-preview"
                                >

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


                                <div
                                    class="admin-gallery-info"
                                >

                                    <h4>
                                        ${escapeHTML(
                                            item.title ||
                                            "Transformation"
                                        )}
                                    </h4>


                                    <button
                                        class="delete-btn"
                                        data-delete-table="before_after"
                                        data-delete-id="${escapeAttribute(
                                            item.id
                                        )}"
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
            showBeforeAfterForm
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

            <h3>
                Add Transformation
            </h3>


            <form id="beforeAfterForm">


                <label>
                    Title
                </label>

                <input
                    id="beforeAfterTitle"
                    required
                >


                <label>
                    Before Image
                </label>

                <input
                    id="beforeAfterBefore"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                >


                <label>
                    After Image
                </label>

                <input
                    id="beforeAfterAfter"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                >


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Upload
                    </button>


                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelBeforeAfterBtn"
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

                await saveBeforeAfter();

            }
        );
}


async function saveBeforeAfter() {

    try {

        const title =
            document
                .getElementById(
                    "beforeAfterTitle"
                )
                ?.value
                .trim();


        const beforeFile =
            document
                .getElementById(
                    "beforeAfterBefore"
                )
                ?.files[0];


        const afterFile =
            document
                .getElementById(
                    "beforeAfterAfter"
                )
                ?.files[0];


        if (!title) {

            throw new Error(
                "Title is required."
            );
        }


        if (!beforeFile ||
            !afterFile) {

            throw new Error(
                "Please select both images."
            );
        }


        const beforeUrl =
            await uploadStorageFile(
                "before-after",
                beforeFile
            );


        const afterUrl =
            await uploadStorageFile(
                "before-after",
                afterFile
            );


        const {
            error
        } = await supabaseClient
            .from("before_after")
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


        await loadBeforeAfter();


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


// ============================================================
// BRIDAL PACKAGES
// ============================================================

async function loadBridalPackages() {

    const {
        data,
        error
    } = await supabaseClient
        .from("bridal_packages")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>
                        Bridal Packages
                    </h2>

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


            <div
                id="bridalPackageFormArea"
            ></div>


            ${
                data?.length
                    ? `

                    <div class="admin-table-wrap">

                        <table class="admin-table">

                            <thead>

                                <tr>

                                    <th>Name</th>
                                    <th>Price</th>
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
                                                item.title ||
                                                "—"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                item.price ??
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

                                            <button
                                                class="delete-btn"
                                                data-delete-table="bridal_packages"
                                                data-delete-id="${escapeAttribute(
                                                    item.id
                                                )}"
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

                        No bridal packages added yet.

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
            showBridalPackageForm
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

            <h3>
                Add Bridal Package
            </h3>


            <form id="bridalPackageForm">


                <label>
                    Package Name
                </label>

                <input
                    id="bridalPackageName"
                    required
                >


                <label>
                    Price
                </label>

                <input
                    id="bridalPackagePrice"
                    type="number"
                    min="0"
                    step="0.01"
                >


                <label>
                    Description
                </label>

                <textarea
                    id="bridalPackageDescription"
                    rows="5"
                ></textarea>


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save Package
                    </button>


                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelBridalPackageBtn"
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
                            ?.value
                            .trim(),

                    price:
                        document
                            .getElementById(
                                "bridalPackagePrice"
                            )
                            ?.value ||
                        null,

                    description:
                        document
                            .getElementById(
                                "bridalPackageDescription"
                            )
                            ?.value
                            .trim() ||
                        null

                };


                const {
                    error
                } = await supabaseClient
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


// ============================================================
// SIMPLE TABLES
// TEAM / TESTIMONIALS
// ============================================================

async function loadSimpleTable(
    table,
    title,
    description
) {

    const {
        data,
        error
    } = await supabaseClient
        .from(table)
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

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


            <div
                id="simpleFormArea"
            ></div>


            ${
                data?.length
                    ? `

                    <div class="admin-table-wrap">

                        <table class="admin-table">

                            <thead>

                                <tr>

                                    <th>Name</th>
                                    <th>Details</th>
                                    <th>Action</th>

                                </tr>

                            </thead>


                            <tbody>

                                ${data.map(item => `

                                    <tr>

                                        <td>
                                            ${escapeHTML(
                                                item.name ||
                                                item.title ||
                                                item.customer_name ||
                                                "—"
                                            )}
                                        </td>

                                        <td>

                                            ${escapeHTML(
                                                item.role ||
                                                item.message ||
                                                item.description ||
                                                "—"
                                            )}

                                        </td>

                                        <td>

                                            <button
                                                class="delete-btn"
                                                data-delete-table="${escapeAttribute(
                                                    table
                                                )}"
                                                data-delete-id="${escapeAttribute(
                                                    item.id
                                                )}"
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

                        No records added yet.

                    </div>

                `
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


    const isTeam =
        table === "team";


    area.innerHTML = `

        <div class="admin-form-card">

            <h3>
                Add ${escapeHTML(title)}
            </h3>


            <form id="simpleForm">


                <label>
                    ${
                        isTeam
                            ? "Name"
                            : "Customer Name"
                    }
                </label>

                <input
                    id="simpleName"
                    required
                >


                ${
                    isTeam
                        ? `

                            <label>
                                Role
                            </label>

                            <input
                                id="simpleRole"
                                placeholder="Makeup Artist"
                            >

                        `
                        : `

                            <label>
                                Rating
                            </label>

                            <input
                                id="simpleRating"
                                type="number"
                                min="1"
                                max="5"
                            >

                        `
                }


                <label>
                    ${
                        isTeam
                            ? "Bio"
                            : "Review"
                    }
                </label>

                <textarea
                    id="simpleDescription"
                    rows="5"
                    required
                ></textarea>


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save
                    </button>


                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelSimpleBtn"
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


                let payload;


                if (isTeam) {

                    /*
                     * IMPORTANT:
                     * Do not send "description".
                     * The previous database error showed
                     * that team.description does not exist.
                     */

                    payload = {

                        name:
                            document
                                .getElementById(
                                    "simpleName"
                                )
                                ?.value
                                .trim(),

                        role:
                            document
                                .getElementById(
                                    "simpleRole"
                                )
                                ?.value
                                .trim() ||
                            null

                    };

                } else {

                    /*
                     * Testimonials use "message".
                     */

                    payload = {

                        customer_name:
                            document
                                .getElementById(
                                    "simpleName"
                                )
                                ?.value
                                .trim(),

                        rating:
                            document
                                .getElementById(
                                    "simpleRating"
                                )
                                ?.value ||
                            null,

                        message:
                            document
                                .getElementById(
                                    "simpleDescription"
                                )
                                ?.value
                                .trim()

                    };

                }


                const {
                    error
                } = await supabaseClient
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


                await loadSimpleTable(
                    table,
                    title,
                    ""
                );

            }
        );
}


// ============================================================
// FAQ
// ============================================================

async function loadFAQs() {

    const {
        data,
        error
    } = await supabaseClient
        .from("faqs")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

        return;
    }


    moduleContent.innerHTML = `

        <div class="admin-module">

            <div class="module-header">

                <div>

                    <h2>FAQs</h2>

                    <p>
                        Manage frequently asked questions.
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
                                                item.question ||
                                                "—"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                item.answer ||
                                                "—"
                                            )}
                                        </td>

                                        <td>

                                            <button
                                                class="delete-btn"
                                                data-delete-table="faqs"
                                                data-delete-id="${escapeAttribute(
                                                    item.id
                                                )}"
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
            showFAQForm
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

            <h3>
                Add FAQ
            </h3>


            <form id="faqForm">


                <label>
                    Question
                </label>

                <input
                    id="faqQuestion"
                    required
                >


                <label>
                    Answer
                </label>

                <textarea
                    id="faqAnswer"
                    rows="5"
                    required
                ></textarea>


                <div class="form-buttons">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save FAQ
                    </button>


                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelFaqBtn"
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
                            ?.value
                            .trim(),

                    answer:
                        document
                            .getElementById(
                                "faqAnswer"
                            )
                            ?.value
                            .trim()

                };


                const {
                    error
                } = await supabaseClient
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


// ============================================================
// SETTINGS
// ============================================================

async function loadSettings() {

    const {
        data,
        error
    } = await supabaseClient
        .from("settings")
        .select(
            "id, setting_key, setting_value, updated_at"
        )
        .order(
            "updated_at",
            {
                ascending: false
            }
        );


    if (error) {

        showDatabaseError(error);

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

            <div class="module-header">

                <div>

                    <h2>Settings</h2>

                    <p>
                        Manage business contact information.
                    </p>

                </div>

            </div>


            <div class="admin-form-card">

                <form id="settingsForm">


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


                    <label>
                        Artist Name
                    </label>

                    <input
                        id="settingArtistName"
                        value="${escapeAttribute(
                            settings.artist_name ||
                            ""
                        )}"
                    >


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


                    <label>
                        Address
                    </label>

                    <textarea
                        id="settingAddress"
                        rows="4"
                    >${escapeHTML(
                        settings.address ||
                        ""
                    )}</textarea>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save Settings
                    </button>


                </form>

            </div>

        </div>

    `;


    document
        .getElementById(
            "settingsForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const values = {

                    business_name:
                        document
                            .getElementById(
                                "settingBusinessName"
                            )
                            ?.value
                            .trim(),

                    artist_name:
                        document
                            .getElementById(
                                "settingArtistName"
                            )
                            ?.value
                            .trim(),

                    phone:
                        document
                            .getElementById(
                                "settingPhone"
                            )
                            ?.value
                            .trim(),

                    whatsapp:
                        document
                            .getElementById(
                                "settingWhatsapp"
                            )
                            ?.value
                            .trim(),

                    email:
                        document
                            .getElementById(
                                "settingEmail"
                            )
                            ?.value
                            .trim(),

                    address:
                        document
                            .getElementById(
                                "settingAddress"
                            )
                            ?.value
                            .trim()

                };


                for (
                    const [
                        key,
                        value
                    ]
                    of Object.entries(
                        values
                    )
                ) {

                    const {
                        data: existing
                    } = await supabaseClient
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
                                .from(
                                    "settings"
                                )
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
                                .from(
                                    "settings"
                                )
                                .insert({

                                    setting_key:
                                        key,

                                    setting_value:
                                        value

                                });

                    }


                    if (result.error) {

                        showMessage(
                            result.error.message,
                            "error"
                        );

                        return;
                    }

                }


                showMessage(
                    "Settings saved successfully."
                );


                await loadSettings();

            }
        );
}


// ============================================================
// DELETE
// ============================================================

function attachDeleteButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-delete-table]"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset
                    .deleteBound
            ) {
                return;
            }


            button.dataset.deleteBound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const table =
                        button.dataset
                            .deleteTable;

                    const id =
                        button.dataset
                            .deleteId;


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
                    } = await supabaseClient
                        .from(table)
                        .delete()
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
                        "Deleted successfully."
                    );


                    await openModule(
                        currentModule
                    );

                }
            );

        }
    );
}


// ============================================================
// SUPABASE AUTH STATE
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

        const loginSection =
            document.getElementById(
                "loginSection"
            );

        const adminPanel =
            document.getElementById(
                "adminPanel"
            );


        if (session) {

            if (loginSection) {
                loginSection.style.display =
                    "none";
            }

            if (adminPanel) {
                adminPanel.style.display =
                    "block";
            }

            setTimeout(
                () => {

                    initializeAdmin();

                },
                0
            );

        } else {

            if (loginSection) {
                loginSection.style.display =
                    "flex";
            }

            if (adminPanel) {
                adminPanel.style.display =
                    "none";
            }

        }

    }
);


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupLogin();

        await checkAdminSession();

    }
);
