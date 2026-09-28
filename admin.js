
/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   ADMIN.JS
   Stable schema-compatible admin system
   ========================================================= */

(function () {
  "use strict";

  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error(
      "Supabase client not found. Check supabase-config.js."
    );
    return;
  }

  /* =======================================================
     STATE
     ======================================================= */

  let currentUser = null;
  let currentModule = "dashboard";
  let authListener = null;

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


  /* =======================================================
     MODULE INFORMATION
     ======================================================= */

  const MODULES = {

    dashboard: {
      title: "Dashboard",
      description:
        "Overview of your Manju's The World of Glamour website."
    },

    appointments: {
      title: "Appointments",
      description:
        "View and manage customer appointment requests."
    },

    categories: {
      title: "Categories",
      description:
        "Create and manage service categories."
    },

    services: {
      title: "Services",
      description:
        "Manage services, prices, durations and visibility."
    },

    offers: {
      title: "Offers",
      description:
        "Manage offers, prices, dates and promotional content."
    },

    gallery: {
      title: "Our Work",
      description:
        "Manage your main beauty and salon gallery."
    },

    bride_gallery: {
      title: "Bride & Girls",
      description:
        "Upload and manage bridal and girls photographs."
    },

    customer_gallery: {
      title: "Customers",
      description:
        "Manage customer photographs with consent."
    },

    before_after: {
      title: "Before / After",
      description:
        "Manage transformation photographs."
    },

    bridal_packages: {
      title: "Bridal Packages",
      description:
        "Manage bridal packages and package pricing."
    },

    team: {
      title: "Team",
      description:
        "Manage team members shown on the website."
    },

    testimonials: {
      title: "Testimonials",
      description:
        "Manage customer testimonials and ratings."
    },

    faqs: {
      title: "FAQs",
      description:
        "Manage frequently asked questions."
    },

    settings: {
      title: "Settings",
      description:
        "Manage business information and website settings."
    }

  };


  /* =======================================================
     SECURITY / HTML HELPERS
     ======================================================= */

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


  function safeUrl(url) {

    if (!url) return "";

    try {

      const parsed = new URL(url);

      if (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return parsed.href;
      }

    } catch (error) {}

    return "";
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


  function formatMoney(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Price on enquiry";
    }

    return "₹" + Number(value).toLocaleString("en-IN");
  }


  function showAlert(message, type = "success") {

    const old = $(".admin-alert");

    if (old) old.remove();

    const box = document.createElement("div");

    box.className = `admin-alert ${type}`;

    box.textContent = message;

    const content = $("#moduleContent");

    if (content) {
      content.prepend(box);
    }
  }


  function showLoading(message = "Loading...") {

    $("#moduleContent").innerHTML = `
      <div class="loading">
        ${escapeHTML(message)}
      </div>
    `;
  }


  function showError(error) {

    console.error(error);

    const message =
      error?.message ||
      error?.error_description ||
      "Something went wrong.";

    $("#moduleContent").innerHTML = `
      <div class="admin-alert error">
        ${escapeHTML(message)}
      </div>
    `;
  }


  /* =======================================================
     AUTH
     ======================================================= */

  async function checkAuth() {

    try {

      const {
        data,
        error
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const session = data?.session || null;

      if (session?.user) {
        currentUser = session.user;
        showAdmin();
      } else {
        currentUser = null;
        showLogin();
      }

    } catch (error) {

      console.error("Auth check failed:", error);

      currentUser = null;

      showLogin();

      showLoginMessage(
        "Unable to check your login session. Please try again.",
        "error"
      );
    }
  }


  function showLogin() {

    $("#loginSection").classList.remove("hidden");
    $("#adminPanel").classList.add("hidden");

    $("#userEmail").textContent = "";

    closeMobileSidebar();
  }


  function showAdmin() {

    $("#loginSection").classList.add("hidden");
    $("#adminPanel").classList.remove("hidden");

    $("#userEmail").textContent =
      currentUser?.email || "";

    openModule(
      currentModule || "dashboard"
    );
  }


  function showLoginMessage(message, type) {

    const box = $("#loginMessage");

    if (!box) return;

    box.textContent = message;

    box.className =
      `message show ${type || ""}`;
  }


  async function login(event) {

    event.preventDefault();

    const email =
      $("#adminEmail").value.trim();

    const password =
      $("#adminPassword").value;

    if (!email || !password) {

      showLoginMessage(
        "Enter your email and password.",
        "error"
      );

      return;
    }

    const button = $("#loginBtn");

    button.disabled = true;
    button.textContent = "Signing in...";

    showLoginMessage("", "");

    try {

      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      currentUser = data.user;

      showLoginMessage(
        "Login successful.",
        "success"
      );

      $("#adminPassword").value = "";

      showAdmin();

    } catch (error) {

      console.error("Login error:", error);

      showLoginMessage(
        error?.message ||
        "Login failed. Check your email and password.",
        "error"
      );

    } finally {

      button.disabled = false;
      button.textContent = "Sign In";
    }
  }


  async function logout() {

    try {

      const {
        error
      } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      currentUser = null;

      showLogin();

    } catch (error) {

      console.error("Logout error:", error);

      alert(
        error?.message ||
        "Unable to sign out."
      );
    }
  }


  /* =======================================================
     NAVIGATION
     ======================================================= */

  function updateModuleHeader(module) {

    const info =
      MODULES[module] ||
      MODULES.dashboard;

    $("#moduleTitle").textContent =
      info.title;

    $("#moduleDescription").textContent =
      info.description;

    $$(".nav-btn").forEach((button) => {

      button.classList.toggle(
        "active",
        button.dataset.module === module
      );

    });
  }


  async function openModule(module) {

    if (!currentUser) {
      return;
    }

    currentModule = MODULES[module]
      ? module
      : "dashboard";

    updateModuleHeader(currentModule);

    closeMobileSidebar();

    const loaders = {

      dashboard:
        loadDashboard,

      appointments:
        loadAppointments,

      categories:
        loadCategories,

      services:
        loadServices,

      offers:
        loadOffers,

      gallery:
        loadGallery,

      bride_gallery:
        loadBrideGallery,

      customer_gallery:
        loadCustomerGallery,

      before_after:
        loadBeforeAfter,

      bridal_packages:
        loadBridalPackages,

      team:
        loadTeam,

      testimonials:
        loadTestimonials,

      faqs:
        loadFaqs,

      settings:
        loadSettings

    };

    const loader =
      loaders[currentModule];

    if (!loader) {
      loadDashboard();
      return;
    }

    try {
      await loader();
    } catch (error) {
      showError(error);
    }
  }


  /* =======================================================
     DASHBOARD
     ======================================================= */

  async function countRows(
    table,
    filter = null
  ) {

    try {

      let query = supabase
        .from(table)
        .select("*", {
          count: "exact",
          head: true
        });

      if (filter) {
        query = filter(query);
      }

      const {
        count,
        error
      } = await query;

      if (error) {
        console.warn(
          `Dashboard count failed for ${table}:`,
          error
        );

        return 0;
      }

      return count || 0;

    } catch (error) {

      console.warn(
        `Dashboard count failed for ${table}:`,
        error
      );

      return 0;
    }
  }


  async function loadDashboard() {

    showLoading("Loading dashboard...");

    const [
      appointments,
      categories,
      services,
      offers,
      gallery,
      brideGallery,
      customerGallery,
      beforeAfter,
      bridalPackages,
      team,
      testimonials,
      faqs
    ] = await Promise.all([

      countRows("appointments"),

      countRows("categories"),

      countRows("services"),

      countRows("offers"),

      countRows("gallery"),

      countRows("bride_gallery"),

      countRows("customer_gallery"),

      countRows("before_after"),

      countRows("bridal_packages"),

      countRows("team"),

      countRows("testimonials"),

      countRows("faqs")

    ]);

    $("#moduleContent").innerHTML = `

      <div class="dashboard-grid">

        ${dashboardCard(
          "Appointments",
          appointments,
          "appointments"
        )}

        ${dashboardCard(
          "Categories",
          categories,
          "categories"
        )}

        ${dashboardCard(
          "Services",
          services,
          "services"
        )}

        ${dashboardCard(
          "Offers",
          offers,
          "offers"
        )}

        ${dashboardCard(
          "Our Work",
          gallery,
          "gallery"
        )}

        ${dashboardCard(
          "Bride & Girls",
          brideGallery,
          "bride_gallery"
        )}

        ${dashboardCard(
          "Customers",
          customerGallery,
          "customer_gallery"
        )}

        ${dashboardCard(
          "Before / After",
          beforeAfter,
          "before_after"
        )}

        ${dashboardCard(
          "Bridal Packages",
          bridalPackages,
          "bridal_packages"
        )}

        ${dashboardCard(
          "Team",
          team,
          "team"
        )}

        ${dashboardCard(
          "Testimonials",
          testimonials,
          "testimonials"
        )}

        ${dashboardCard(
          "FAQs",
          faqs,
          "faqs"
        )}

      </div>

    `;

    $$(".dashboard-card").forEach((card) => {

      card.addEventListener(
        "click",
        () => openModule(card.dataset.module)
      );

    });
  }


  function dashboardCard(
    label,
    count,
    module
  ) {

    return `
      <div
        class="dashboard-card"
        data-module="${escapeHTML(module)}"
      >
        <div class="label">
          ${escapeHTML(label)}
        </div>

        <div class="count">
          ${Number(count) || 0}
        </div>
      </div>
    `;
  }


  /* =======================================================
     GENERIC DELETE
     ======================================================= */

  async function deleteRow(
    table,
    id,
    reloadModule
  ) {

    if (!id) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this item?"
      );

    if (!confirmed) return;

    try {

      const {
        error
      } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await openModule(
        reloadModule || currentModule
      );

    } catch (error) {

      console.error(
        `Delete failed: ${table}`,
        error
      );

      showAlert(
        error?.message ||
        "Delete failed.",
        "error"
      );
    }
  }


  function bindDeleteButtons() {

    $$(".delete-btn").forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteRow(
            button.dataset.table,
            button.dataset.id,
            button.dataset.module
          );

        }
      );

    });
  }


  /* =======================================================
     CATEGORIES
     Actual schema:
     id, name, slug, description, image_url,
     display_order, active, created_at
     ======================================================= */

  async function loadCategories() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("name", {
        ascending: true
      });

    if (error) {
      throw error;
    }

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Category</h3>

        <form id="categoryForm">

          <div class="form-grid">

            <div class="field">
              <label>Name</label>
              <input
                id="categoryName"
                required
              >
            </div>

            <div class="field">
              <label>Slug</label>
              <input
                id="categorySlug"
                placeholder="Example: bridal"
              >
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea
                id="categoryDescription"
              ></textarea>
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="categoryOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="categoryActive"
                type="checkbox"
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
              Save Category
            </button>

          </div>

        </form>

      </div>

      ${renderCategoriesTable(data || [])}

    `;

    $("#categoryForm")
      .addEventListener(
        "submit",
        saveCategory
      );

    bindDeleteButtons();
  }


  function renderCategoriesTable(rows) {

    if (!rows.length) {
      return emptyState(
        "No categories added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>
                  <strong>
                    ${escapeHTML(row.name)}
                  </strong>
                </td>

                <td>
                  ${escapeHTML(row.slug)}
                </td>

                <td>
                  ${row.display_order ?? 0}
                </td>

                <td>
                  <span class="status">
                    ${row.active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="categories"
                    data-id="${row.id}"
                    data-module="categories"
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


  async function saveCategory(event) {

    event.preventDefault();

    const name =
      $("#categoryName").value.trim();

    if (!name) return;

    const slug =
      $("#categorySlug").value.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const payload = {

      name,

      slug,

      description:
        $("#categoryDescription").value.trim() ||
        null,

      display_order:
        Number($("#categoryOrder").value) || 0,

      active:
        $("#categoryActive").checked

    };

    try {

      const {
        error
      } = await supabase
        .from("categories")
        .insert(payload);

      if (error) throw error;

      await loadCategories();

      showAlert(
        "Category saved successfully."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save category.",
        "error"
      );
    }
  }


  /* =======================================================
     SERVICES
     Actual schema:
     id, category_id, name, slug, description,
     price, price_label, duration_minutes,
     image_url, featured, active, display_order...
     ======================================================= */

  async function getCategories() {

    const {
      data,
      error
    } = await supabase
      .from("categories")
      .select("id,name,active")
      .order("name");

    if (error) {
      throw error;
    }

    return data || [];
  }


  async function loadServices() {

    showLoading();

    const [
      servicesResult,
      categories
    ] = await Promise.all([

      supabase
        .from("services")
        .select("*")
        .order("display_order", {
          ascending: true
        })
        .order("name", {
          ascending: true
        }),

      getCategories()

    ]);

    if (servicesResult.error) {
      throw servicesResult.error;
    }

    const services =
      servicesResult.data || [];

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Service</h3>

        <form id="serviceForm">

          <div class="form-grid">

            <div class="field">
              <label>Service name</label>
              <input
                id="serviceName"
                required
              >
            </div>

            <div class="field">
              <label>Category</label>

              <select id="serviceCategory">

                <option value="">
                  No category
                </option>

                ${categories.map(category => `

                  <option value="${category.id}">
                    ${escapeHTML(category.name)}
                  </option>

                `).join("")}

              </select>
            </div>

            <div class="field">
              <label>Slug</label>
              <input
                id="serviceSlug"
                placeholder="Example: bridal-makeup"
              >
            </div>

            <div class="field">
              <label>Price</label>
              <input
                id="servicePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave empty if enquiry only"
              >
            </div>

            <div class="field">
              <label>Price label</label>
              <input
                id="servicePriceLabel"
                value="Price on enquiry"
              >
            </div>

            <div class="field">
              <label>Duration (minutes)</label>
              <input
                id="serviceDuration"
                type="number"
                min="0"
              >
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea
                id="serviceDescription"
              ></textarea>
            </div>

            <div class="field">
              <label>Image URL</label>
              <input
                id="serviceImage"
                type="url"
                placeholder="Optional"
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="serviceOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="serviceFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="serviceActive"
                type="checkbox"
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
              Save Service
            </button>

          </div>

        </form>

      </div>

      ${renderServicesTable(
        services,
        categories
      )}

    `;

    $("#serviceForm")
      .addEventListener(
        "submit",
        saveService
      );

    bindDeleteButtons();
  }


  function renderServicesTable(
    services,
    categories
  ) {

    if (!services.length) {
      return emptyState(
        "No services added yet."
      );
    }

    const categoryMap = {};

    categories.forEach(category => {
      categoryMap[category.id] =
        category.name;
    });

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${services.map(service => `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(service.name)}
                  </strong>

                  <br>

                  <small>
                    ${escapeHTML(service.slug)}
                  </small>

                </td>

                <td>
                  ${escapeHTML(
                    categoryMap[service.category_id] ||
                    "No category"
                  )}
                </td>

                <td>
                  ${service.price !== null &&
                    service.price !== undefined &&
                    service.price !== ""
                    ? formatMoney(service.price)
                    : escapeHTML(
                        service.price_label ||
                        "Price on enquiry"
                      )}
                </td>

                <td>
                  ${
                    service.duration_minutes
                      ? `${service.duration_minutes} min`
                      : "—"
                  }
                </td>

                <td>
                  <span class="status">
                    ${service.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="services"
                    data-id="${service.id}"
                    data-module="services"
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


  async function saveService(event) {

    event.preventDefault();

    const name =
      $("#serviceName").value.trim();

    if (!name) return;

    const slug =
      $("#serviceSlug").value.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const rawPrice =
      $("#servicePrice").value.trim();

    const rawDuration =
      $("#serviceDuration").value.trim();

    const payload = {

      category_id:
        $("#serviceCategory").value ||
        null,

      name,

      slug,

      description:
        $("#serviceDescription").value.trim() ||
        null,

      price:
        rawPrice === ""
          ? null
          : Number(rawPrice),

      price_label:
        $("#servicePriceLabel").value.trim() ||
        "Price on enquiry",

      duration_minutes:
        rawDuration === ""
          ? null
          : Number(rawDuration),

      image_url:
        safeUrl(
          $("#serviceImage").value.trim()
        ) || null,

      featured:
        $("#serviceFeatured").checked,

      active:
        $("#serviceActive").checked,

      display_order:
        Number($("#serviceOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("services")
        .insert(payload);

      if (error) throw error;

      await loadServices();

      showAlert(
        "Service saved successfully."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save service.",
        "error"
      );
    }
  }


  /* =======================================================
     OFFERS
     Actual schema:
     id, name, description, image_url,
     original_price, offer_price, discount_percent,
     valid_from, valid_until, included_services,
     terms, active, featured, created_at,
     updated_at, end_date, start_date
     ======================================================= */

  async function loadOffers() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Offer</h3>

        <form id="offerForm">

          <div class="form-grid">

            <div class="field">
              <label>Offer name</label>
              <input
                id="offerName"
                required
              >
            </div>

            <div class="field">
              <label>Original price</label>
              <input
                id="offerOriginalPrice"
                type="number"
                min="0"
                step="0.01"
              >
            </div>

            <div class="field">
              <label>Offer price</label>
              <input
                id="offerPrice"
                type="number"
                min="0"
                step="0.01"
              >
            </div>

            <div class="field">
              <label>Discount %</label>
              <input
                id="offerDiscount"
                type="number"
                min="0"
                max="100"
                step="0.01"
              >
            </div>

            <div class="field">
              <label>Valid from</label>
              <input
                id="offerStart"
                type="date"
              >
            </div>

            <div class="field">
              <label>Valid until</label>
              <input
                id="offerEnd"
                type="date"
              >
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea
                id="offerDescription"
              ></textarea>
            </div>

            <div class="field full">
              <label>Included services</label>
              <textarea
                id="offerIncluded"
                placeholder="Only enter verified services."
              ></textarea>
            </div>

            <div class="field full">
              <label>Terms</label>
              <textarea
                id="offerTerms"
              ></textarea>
            </div>

            <div class="field">
              <label>Image URL</label>
              <input
                id="offerImage"
                type="url"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="offerFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="offerActive"
                type="checkbox"
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

          </div>

        </form>

      </div>

      ${renderOffersTable(data || [])}

    `;

    $("#offerForm")
      .addEventListener(
        "submit",
        saveOffer
      );

    bindDeleteButtons();
  }


  function renderOffersTable(rows) {

    if (!rows.length) {
      return emptyState(
        "No offers added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Offer</th>
              <th>Price</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(row.name)}
                  </strong>

                  <br>

                  <small>
                    ${escapeHTML(
                      row.description || ""
                    )}
                  </small>

                </td>

                <td>

                  ${
                    row.offer_price !== null
                      ? formatMoney(row.offer_price)
                      : "—"
                  }

                  ${
                    row.original_price !== null
                      ? `<br><small>
                           Original:
                           ${formatMoney(row.original_price)}
                         </small>`
                      : ""
                  }

                </td>

                <td>
                  ${formatDate(
                    row.valid_from ||
                    row.start_date
                  )}
                  →
                  ${formatDate(
                    row.valid_until ||
                    row.end_date
                  )}
                </td>

                <td>
                  <span class="status">
                    ${row.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="offers"
                    data-id="${row.id}"
                    data-module="offers"
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


  async function saveOffer(event) {

    event.preventDefault();

    const name =
      $("#offerName").value.trim();

    if (!name) return;

    const start =
      $("#offerStart").value || null;

    const end =
      $("#offerEnd").value || null;

    const original =
      $("#offerOriginalPrice").value;

    const offer =
      $("#offerPrice").value;

    const discount =
      $("#offerDiscount").value;

    const payload = {

      name,

      description:
        $("#offerDescription").value.trim() ||
        null,

      image_url:
        safeUrl(
          $("#offerImage").value.trim()
        ) || null,

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

      valid_from: start,

      valid_until: end,

      included_services:
        $("#offerIncluded").value.trim() ||
        null,

      terms:
        $("#offerTerms").value.trim() ||
        null,

      active:
        $("#offerActive").checked,

      featured:
        $("#offerFeatured").checked,

      start_date:
        start
          ? `${start}T00:00:00`
          : null,

      end_date:
        end
          ? `${end}T23:59:59`
          : null

    };

    try {

      const {
        error
      } = await supabase
        .from("offers")
        .insert(payload);

      if (error) throw error;

      await loadOffers();

      showAlert(
        "Offer saved successfully."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save offer.",
        "error"
      );
    }
  }


  /* =======================================================
     APPOINTMENTS
     Actual schema:
     id, service_id, customer_name, phone, email,
     appointment_date, appointment_time, message,
     status, whatsapp_requested, privacy_consent,
     created_at, updated_at
     ======================================================= */

  async function loadAppointments() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      ${
        data?.length
          ? `
            <div class="admin-table-wrap">

              <table>

                <thead>

                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  ${data.map(row => `

                    <tr>

                      <td>
                        <strong>
                          ${escapeHTML(
                            row.customer_name
                          )}
                        </strong>
                      </td>

                      <td>

                        ${escapeHTML(row.phone)}

                        ${
                          row.email
                            ? `<br>
                               ${escapeHTML(row.email)}`
                            : ""
                        }

                      </td>

                      <td>
                        ${formatDate(
                          row.appointment_date
                        )}
                      </td>

                      <td>
                        ${escapeHTML(
                          row.appointment_time ||
                          "—"
                        )}
                      </td>

                      <td>
                        ${escapeHTML(
                          row.message || "—"
                        )}
                      </td>

                      <td>

                        <select
                          class="appointment-status"
                          data-id="${row.id}"
                        >

                          ${[
                            "New",
                            "Confirmed",
                            "Completed",
                            "Cancelled",
                            "No-show"
                          ].map(status => `

                            <option
                              value="${status}"
                              ${row.status === status
                                ? "selected"
                                : ""}
                            >
                              ${status}
                            </option>

                          `).join("")}

                        </select>

                      </td>

                      <td>

                        <button
                          class="danger-btn small-btn delete-btn"
                          data-table="appointments"
                          data-id="${row.id}"
                          data-module="appointments"
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
          : emptyState(
              "No appointment requests yet."
            )
      }

    `;

    $$(".appointment-status")
      .forEach(select => {

        select.addEventListener(
          "change",
          () => updateAppointmentStatus(
            select.dataset.id,
            select.value
          )
        );

      });

    bindDeleteButtons();
  }


  async function updateAppointmentStatus(
    id,
    status
  ) {

    try {

      const {
        error
      } = await supabase
        .from("appointments")
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

    } catch (error) {

      console.error(error);

      alert(
        error?.message ||
        "Unable to update appointment."
      );

      await loadAppointments();
    }
  }


  /* =======================================================
     GALLERY
     ======================================================= */

  async function loadGallery() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("gallery")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Gallery Photo</h3>

        <form id="galleryForm">

          <div class="form-grid">

            <div class="field">
              <label>Title</label>
              <input id="galleryTitle">
            </div>

            <div class="field">
              <label>Category</label>
              <input
                id="galleryCategory"
                placeholder="Example: Makeup"
              >
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea
                id="galleryDescription"
              ></textarea>
            </div>

            <div class="field full">
              <label>Image URL</label>
              <input
                id="galleryImage"
                type="url"
                required
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="galleryOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="galleryFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="galleryVisible"
                type="checkbox"
                checked
              >
              Visible
            </label>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Photo
            </button>

          </div>

        </form>

      </div>

      ${renderImageTable(
        data || [],
        "gallery"
      )}

    `;

    $("#galleryForm")
      .addEventListener(
        "submit",
        saveGallery
      );

    bindDeleteButtons();
  }


  async function saveGallery(event) {

    event.preventDefault();

    const image =
      safeUrl(
        $("#galleryImage").value.trim()
      );

    if (!image) {
      showAlert(
        "Enter a valid image URL.",
        "error"
      );
      return;
    }

    const payload = {

      title:
        $("#galleryTitle").value.trim() ||
        null,

      description:
        $("#galleryDescription").value.trim() ||
        null,

      image_url: image,

      category:
        $("#galleryCategory").value.trim() ||
        null,

      featured:
        $("#galleryFeatured").checked,

      visible:
        $("#galleryVisible").checked,

      display_order:
        Number($("#galleryOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("gallery")
        .insert(payload);

      if (error) throw error;

      await loadGallery();

      showAlert(
        "Gallery photo saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save gallery photo.",
        "error"
      );
    }
  }


  function renderImageTable(
    rows,
    table
  ) {

    if (!rows.length) {
      return emptyState(
        "No photos added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  ${
                    safeUrl(row.image_url)
                      ? `
                        <img
                          class="image-thumb"
                          src="${safeUrl(row.image_url)}"
                          alt=""
                        >
                      `
                      : "—"
                  }

                </td>

                <td>
                  ${escapeHTML(
                    row.title || "Untitled"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    row.category || "—"
                  )}
                </td>

                <td>
                  <span class="status">
                    ${row.visible
                      ? "Visible"
                      : "Hidden"}
                  </span>
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="${table}"
                    data-id="${row.id}"
                    data-module="${table}"
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


  /* =======================================================
     BRIDE GALLERY
     ======================================================= */

  async function loadBrideGallery() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("bride_gallery")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Bride / Girls Photo</h3>

        <form id="brideForm">

          <div class="form-grid">

            <div class="field">
              <label>Title</label>
              <input id="brideTitle">
            </div>

            <div class="field">
              <label>Category</label>
              <input
                id="brideCategory"
                placeholder="Bride, Girls, Makeup..."
              >
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea
                id="brideDescription"
              ></textarea>
            </div>

            <div class="field">
              <label>Photo date</label>
              <input
                id="brideDate"
                type="date"
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="brideOrder"
                type="number"
                value="0"
              >
            </div>

            <div class="field full">
              <label>Image URL</label>
              <input
                id="brideImage"
                type="url"
                required
              >
            </div>

            <label class="checkbox-field">
              <input
                id="brideFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="brideVisible"
                type="checkbox"
                checked
              >
              Visible
            </label>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Photo
            </button>

          </div>

        </form>

      </div>

      ${renderBrideTable(data || [])}

    `;

    $("#brideForm")
      .addEventListener(
        "submit",
        saveBrideGallery
      );

    bindDeleteButtons();
  }


  function renderBrideTable(rows) {

    if (!rows.length) {
      return emptyState(
        "No bride or girls photos added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  ${
                    safeUrl(row.image_url)
                      ? `
                        <img
                          class="image-thumb"
                          src="${safeUrl(row.image_url)}"
                          alt=""
                        >
                      `
                      : "—"
                  }

                </td>

                <td>
                  ${escapeHTML(
                    row.title || "Untitled"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    row.category || "—"
                  )}
                </td>

                <td>
                  ${formatDate(row.photo_date)}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="bride_gallery"
                    data-id="${row.id}"
                    data-module="bride_gallery"
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


  async function saveBrideGallery(event) {

    event.preventDefault();

    const image =
      safeUrl(
        $("#brideImage").value.trim()
      );

    if (!image) return;

    const payload = {

      title:
        $("#brideTitle").value.trim() ||
        null,

      description:
        $("#brideDescription").value.trim() ||
        null,

      image_url: image,

      category:
        $("#brideCategory").value.trim() ||
        null,

      photo_date:
        $("#brideDate").value ||
        null,

      featured:
        $("#brideFeatured").checked,

      visible:
        $("#brideVisible").checked,

      display_order:
        Number($("#brideOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("bride_gallery")
        .insert(payload);

      if (error) throw error;

      await loadBrideGallery();

      showAlert(
        "Bride / girls photo saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save photo.",
        "error"
      );
    }
  }


  /* =======================================================
     CUSTOMER GALLERY
     ======================================================= */

  async function loadCustomerGallery() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("customer_gallery")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Customer Photo</h3>

        <form id="customerGalleryForm">

          <div class="form-grid">

            <div class="field">
              <label>Customer name</label>
              <input
                id="customerName"
                placeholder="Optional"
              >
            </div>

            <div class="field">
              <label>Service</label>
              <input
                id="customerService"
                placeholder="Optional"
              >
            </div>

            <div class="field full">
              <label>Photo URL</label>
              <input
                id="customerPhoto"
                type="url"
                required
              >
            </div>

            <div class="field full">
              <label>Testimonial</label>
              <textarea
                id="customerTestimonial"
              ></textarea>
            </div>

            <div class="field">
              <label>Rating</label>
              <input
                id="customerRating"
                type="number"
                min="1"
                max="5"
              >
            </div>

            <div class="field">
              <label>Photo date</label>
              <input
                id="customerDate"
                type="date"
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="customerOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="customerConsent"
                type="checkbox"
              >
              Customer consent given
            </label>

            <label class="checkbox-field">
              <input
                id="customerVisible"
                type="checkbox"
                checked
              >
              Visible
            </label>

            <label class="checkbox-field">
              <input
                id="customerFeatured"
                type="checkbox"
              >
              Featured
            </label>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Customer Photo
            </button>

          </div>

        </form>

      </div>

      ${renderCustomerTable(data || [])}

    `;

    $("#customerGalleryForm")
      .addEventListener(
        "submit",
        saveCustomerGallery
      );

    bindDeleteButtons();
  }


  function renderCustomerTable(rows) {

    if (!rows.length) {
      return emptyState(
        "No customer photos added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Photo</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Consent</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  ${
                    safeUrl(row.photo_url)
                      ? `
                        <img
                          class="image-thumb"
                          src="${safeUrl(row.photo_url)}"
                          alt=""
                        >
                      `
                      : "—"
                  }

                </td>

                <td>
                  ${escapeHTML(
                    row.customer_name || "Anonymous"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    row.service || "—"
                  )}
                </td>

                <td>
                  ${row.consent_given
                    ? "Yes"
                    : "No"}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="customer_gallery"
                    data-id="${row.id}"
                    data-module="customer_gallery"
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


  async function saveCustomerGallery(event) {

    event.preventDefault();

    const photo =
      safeUrl(
        $("#customerPhoto").value.trim()
      );

    if (!photo) return;

    const rating =
      $("#customerRating").value.trim();

    const payload = {

      customer_name:
        $("#customerName").value.trim() ||
        null,

      photo_url: photo,

      service:
        $("#customerService").value.trim() ||
        null,

      testimonial:
        $("#customerTestimonial").value.trim() ||
        null,

      rating:
        rating === ""
          ? null
          : Number(rating),

      photo_date:
        $("#customerDate").value ||
        null,

      featured:
        $("#customerFeatured").checked,

      visible:
        $("#customerVisible").checked,

      consent_given:
        $("#customerConsent").checked,

      display_order:
        Number($("#customerOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("customer_gallery")
        .insert(payload);

      if (error) throw error;

      await loadCustomerGallery();

      showAlert(
        "Customer photo saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save customer photo.",
        "error"
      );
    }
  }


  /* =======================================================
     BEFORE / AFTER
     ======================================================= */

  async function loadBeforeAfter() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("before_after")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Before / After</h3>

        <form id="beforeAfterForm">

          <div class="form-grid">

            <div class="field">
              <label>Title</label>
              <input id="beforeTitle">
            </div>

            <div class="field">
              <label>Category</label>
              <input id="beforeCategory">
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea id="beforeDescription"></textarea>
            </div>

            <div class="field">
              <label>Before image URL</label>
              <input
                id="beforeImage"
                type="url"
                required
              >
            </div>

            <div class="field">
              <label>After image URL</label>
              <input
                id="afterImage"
                type="url"
                required
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="beforeOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="beforeFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="beforeVisible"
                type="checkbox"
                checked
              >
              Visible
            </label>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Transformation
            </button>

          </div>

        </form>

      </div>

      ${renderBeforeAfterTable(data || [])}

    `;

    $("#beforeAfterForm")
      .addEventListener(
        "submit",
        saveBeforeAfter
      );

    bindDeleteButtons();
  }


  function renderBeforeAfterTable(rows) {

    if (!rows.length) {
      return emptyState(
        "No before / after entries yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Before</th>
              <th>After</th>
              <th>Title</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  <img
                    class="image-thumb"
                    src="${safeUrl(
                      row.before_image_url
                    )}"
                    alt=""
                  >

                </td>

                <td>

                  <img
                    class="image-thumb"
                    src="${safeUrl(
                      row.after_image_url
                    )}"
                    alt=""
                  >

                </td>

                <td>
                  ${escapeHTML(
                    row.title || "Untitled"
                  )}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="before_after"
                    data-id="${row.id}"
                    data-module="before_after"
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


  async function saveBeforeAfter(event) {

    event.preventDefault();

    const before =
      safeUrl(
        $("#beforeImage").value.trim()
      );

    const after =
      safeUrl(
        $("#afterImage").value.trim()
      );

    if (!before || !after) return;

    const payload = {

      title:
        $("#beforeTitle").value.trim() ||
        null,

      description:
        $("#beforeDescription").value.trim() ||
        null,

      before_image_url: before,

      after_image_url: after,

      category:
        $("#beforeCategory").value.trim() ||
        null,

      featured:
        $("#beforeFeatured").checked,

      visible:
        $("#beforeVisible").checked,

      display_order:
        Number($("#beforeOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("before_after")
        .insert(payload);

      if (error) throw error;

      await loadBeforeAfter();

      showAlert(
        "Before / after entry saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save entry.",
        "error"
      );
    }
  }


  /* =======================================================
     BRIDAL PACKAGES
     ======================================================= */

  async function loadBridalPackages() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("bridal_packages")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Bridal Package</h3>

        <form id="bridalPackageForm">

          <div class="form-grid">

            <div class="field">
              <label>Package name</label>
              <input
                id="bridalName"
                required
              >
            </div>

            <div class="field">
              <label>Price</label>
              <input
                id="bridalPrice"
                type="number"
                min="0"
              >
            </div>

            <div class="field">
              <label>Price label</label>
              <input
                id="bridalPriceLabel"
                value="Price on enquiry"
              >
            </div>

            <div class="field">
              <label>Duration</label>
              <input id="bridalDuration">
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea id="bridalDescription"></textarea>
            </div>

            <div class="field full">
              <label>Included services</label>
              <textarea id="bridalIncluded"></textarea>
            </div>

            <div class="field full">
              <label>Image URL</label>
              <input
                id="bridalImage"
                type="url"
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="bridalOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="bridalFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="bridalActive"
                type="checkbox"
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
              Save Package
            </button>

          </div>

        </form>

      </div>

      ${renderBridalPackages(data || [])}

    `;

    $("#bridalPackageForm")
      .addEventListener(
        "submit",
        saveBridalPackage
      );

    bindDeleteButtons();
  }


  function renderBridalPackages(rows) {

    if (!rows.length) {
      return emptyState(
        "No bridal packages added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Package</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(row.name)}
                  </strong>

                  <br>

                  <small>
                    ${escapeHTML(
                      row.description || ""
                    )}
                  </small>

                </td>

                <td>

                  ${
                    row.price !== null
                      ? formatMoney(row.price)
                      : escapeHTML(
                          row.price_label ||
                          "Price on enquiry"
                        )
                  }

                </td>

                <td>
                  ${escapeHTML(
                    row.duration || "—"
                  )}
                </td>

                <td>
                  <span class="status">
                    ${row.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="bridal_packages"
                    data-id="${row.id}"
                    data-module="bridal_packages"
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


  async function saveBridalPackage(event) {

    event.preventDefault();

    const name =
      $("#bridalName").value.trim();

    if (!name) return;

    const price =
      $("#bridalPrice").value.trim();

    const payload = {

      name,

      description:
        $("#bridalDescription").value.trim() ||
        null,

      image_url:
        safeUrl(
          $("#bridalImage").value.trim()
        ) || null,

      price:
        price === ""
          ? null
          : Number(price),

      price_label:
        $("#bridalPriceLabel").value.trim() ||
        "Price on enquiry",

      included_services:
        $("#bridalIncluded").value.trim() ||
        null,

      duration:
        $("#bridalDuration").value.trim() ||
        null,

      featured:
        $("#bridalFeatured").checked,

      active:
        $("#bridalActive").checked,

      display_order:
        Number($("#bridalOrder").value) || 0

    };

    try {

      const {
        error
      } = await supabase
        .from("bridal_packages")
        .insert(payload);

      if (error) throw error;

      await loadBridalPackages();

      showAlert(
        "Bridal package saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save bridal package.",
        "error"
      );
    }
  }


  /* =======================================================
     TEAM
     ======================================================= */

  async function loadTeam() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("team")
      .select("*")
      .order("display_order", {
        ascending: true
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Team Member</h3>

        <form id="teamForm">

          <div class="form-grid">

            <div class="field">
              <label>Name</label>
              <input
                id="teamName"
                required
              >
            </div>

            <div class="field">
              <label>Role</label>
              <input id="teamRole">
            </div>

            <div class="field full">
              <label>Bio</label>
              <textarea id="teamBio"></textarea>
            </div>

            <div class="field">
              <label>Image URL</label>
              <input
                id="teamImage"
                type="url"
              >
            </div>

            <div class="field">
              <label>Instagram URL</label>
              <input
                id="teamInstagram"
                type="url"
              >
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="teamOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="teamActive"
                type="checkbox"
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
              Save Team Member
            </button>

          </div>

        </form>

      </div>

      ${renderTeam(data || [])}

    `;

    $("#teamForm")
      .addEventListener(
        "submit",
        saveTeam
      );

    bindDeleteButtons();
  }


  function renderTeam(rows) {

    if (!rows.length) {
      return emptyState(
        "No team members added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>

                  ${
                    safeUrl(row.image_url)
                      ? `
                        <img
                          class="image-thumb"
                          src="${safeUrl(row.image_url)}"
                          alt=""
                        >
                      `
                      : "—"
                  }

                </td>

                <td>
                  ${escapeHTML(row.name)}
                </td>

                <td>
                  ${escapeHTML(
                    row.role || "—"
                  )}
                </td>

                <td>
                  ${row.active
                    ? "Active"
                    : "Inactive"}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="team"
                    data-id="${row.id}"
                    data-module="team"
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


  async function saveTeam(event) {

    event.preventDefault();

    const name =
      $("#teamName").value.trim();

    if (!name) return;

    const payload = {

      name,

      role:
        $("#teamRole").value.trim() ||
        null,

      bio:
        $("#teamBio").value.trim() ||
        null,

      image_url:
        safeUrl(
          $("#teamImage").value.trim()
        ) || null,

      instagram_url:
        safeUrl(
          $("#teamInstagram").value.trim()
        ) || null,

      display_order:
        Number($("#teamOrder").value) || 0,

      active:
        $("#teamActive").checked

    };

    try {

      const {
        error
      } = await supabase
        .from("team")
        .insert(payload);

      if (error) throw error;

      await loadTeam();

      showAlert(
        "Team member saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save team member.",
        "error"
      );
    }
  }


  /* =======================================================
     TESTIMONIALS
     Actual schema:
     id, customer_name, testimonial, rating,
     image_url, service, featured, visible, created_at
     ======================================================= */

  async function loadTestimonials() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add Testimonial</h3>

        <form id="testimonialForm">

          <div class="form-grid">

            <div class="field">
              <label>Customer name</label>
              <input
                id="testimonialName"
                required
              >
            </div>

            <div class="field">
              <label>Service</label>
              <input id="testimonialService">
            </div>

            <div class="field">
              <label>Rating</label>
              <input
                id="testimonialRating"
                type="number"
                min="1"
                max="5"
              >
            </div>

            <div class="field">
              <label>Image URL</label>
              <input
                id="testimonialImage"
                type="url"
              >
            </div>

            <div class="field full">
              <label>Testimonial</label>
              <textarea
                id="testimonialText"
                required
              ></textarea>
            </div>

            <label class="checkbox-field">
              <input
                id="testimonialFeatured"
                type="checkbox"
              >
              Featured
            </label>

            <label class="checkbox-field">
              <input
                id="testimonialVisible"
                type="checkbox"
                checked
              >
              Visible
            </label>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Testimonial
            </button>

          </div>

        </form>

      </div>

      ${renderTestimonials(data || [])}

    `;

    $("#testimonialForm")
      .addEventListener(
        "submit",
        saveTestimonial
      );

    bindDeleteButtons();
  }


  function renderTestimonials(rows) {

    if (!rows.length) {
      return emptyState(
        "No testimonials added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Customer</th>
              <th>Testimonial</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>
                  <strong>
                    ${escapeHTML(
                      row.customer_name
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHTML(
                    row.testimonial
                  )}
                </td>

                <td>
                  ${row.rating || "—"}
                </td>

                <td>
                  ${row.visible
                    ? "Visible"
                    : "Hidden"}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="testimonials"
                    data-id="${row.id}"
                    data-module="testimonials"
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


  async function saveTestimonial(event) {

    event.preventDefault();

    const customerName =
      $("#testimonialName").value.trim();

    const testimonial =
      $("#testimonialText").value.trim();

    if (!customerName || !testimonial) {
      return;
    }

    const rating =
      $("#testimonialRating").value.trim();

    const payload = {

      customer_name:
        customerName,

      testimonial,

      rating:
        rating === ""
          ? null
          : Number(rating),

      image_url:
        safeUrl(
          $("#testimonialImage").value.trim()
        ) || null,

      service:
        $("#testimonialService").value.trim() ||
        null,

      featured:
        $("#testimonialFeatured").checked,

      visible:
        $("#testimonialVisible").checked

    };

    try {

      const {
        error
      } = await supabase
        .from("testimonials")
        .insert(payload);

      if (error) throw error;

      await loadTestimonials();

      showAlert(
        "Testimonial saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save testimonial.",
        "error"
      );
    }
  }


  /* =======================================================
     FAQS
     ======================================================= */

  async function loadFaqs() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", {
        ascending: true
      });

    if (error) throw error;

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Add FAQ</h3>

        <form id="faqForm">

          <div class="form-grid">

            <div class="field full">
              <label>Question</label>
              <input
                id="faqQuestion"
                required
              >
            </div>

            <div class="field full">
              <label>Answer</label>
              <textarea
                id="faqAnswer"
                required
              ></textarea>
            </div>

            <div class="field">
              <label>Display order</label>
              <input
                id="faqOrder"
                type="number"
                value="0"
              >
            </div>

            <label class="checkbox-field">
              <input
                id="faqActive"
                type="checkbox"
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
              Save FAQ
            </button>

          </div>

        </form>

      </div>

      ${renderFaqs(data || [])}

    `;

    $("#faqForm")
      .addEventListener(
        "submit",
        saveFaq
      );

    bindDeleteButtons();
  }


  function renderFaqs(rows) {

    if (!rows.length) {
      return emptyState(
        "No FAQs added yet."
      );
    }

    return `

      <div class="admin-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Question</th>
              <th>Answer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(row => `

              <tr>

                <td>
                  <strong>
                    ${escapeHTML(
                      row.question
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHTML(
                    row.answer
                  )}
                </td>

                <td>
                  ${row.active
                    ? "Active"
                    : "Inactive"}
                </td>

                <td>

                  <button
                    class="danger-btn small-btn delete-btn"
                    data-table="faqs"
                    data-id="${row.id}"
                    data-module="faqs"
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


  async function saveFaq(event) {

    event.preventDefault();

    const question =
      $("#faqQuestion").value.trim();

    const answer =
      $("#faqAnswer").value.trim();

    if (!question || !answer) return;

    const payload = {

      question,

      answer,

      display_order:
        Number($("#faqOrder").value) || 0,

      active:
        $("#faqActive").checked

    };

    try {

      const {
        error
      } = await supabase
        .from("faqs")
        .insert(payload);

      if (error) throw error;

      await loadFaqs();

      showAlert(
        "FAQ saved."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save FAQ.",
        "error"
      );
    }
  }


  /* =======================================================
     SETTINGS
     Actual schema:
     id, setting_key, setting_value, updated_at
     ======================================================= */

  async function loadSettings() {

    showLoading();

    const {
      data,
      error
    } = await supabase
      .from("settings")
      .select("*")
      .order("setting_key");

    if (error) throw error;

    const map = {};

    (data || []).forEach(row => {
      map[row.setting_key] =
        row.setting_value || "";
    });

    $("#moduleContent").innerHTML = `

      <div class="admin-form-card">

        <h3>Business Information</h3>

        <form id="settingsForm">

          <div class="form-grid">

            <div class="field full">
              <label>Business name</label>
              <input
                id="settingBusinessName"
                value="${escapeHTML(
                  map.business_name || ""
                )}"
              >
            </div>

            <div class="field">
              <label>Artist name</label>
              <input
                id="settingArtist"
                value="${escapeHTML(
                  map.artist_name || ""
                )}"
              >
            </div>

            <div class="field">
              <label>Phone</label>
              <input
                id="settingPhone"
                value="${escapeHTML(
                  map.phone || ""
                )}"
              >
            </div>

            <div class="field">
              <label>WhatsApp</label>
              <input
                id="settingWhatsapp"
                value="${escapeHTML(
                  map.whatsapp || ""
                )}"
              >
            </div>

            <div class="field">
              <label>Email</label>
              <input
                id="settingEmail"
                type="email"
                value="${escapeHTML(
                  map.email || ""
                )}"
              >
            </div>

            <div class="field full">
              <label>Address</label>
              <textarea
                id="settingAddress"
              >${escapeHTML(
                map.address || ""
              )}</textarea>
            </div>

          </div>

          <div class="form-actions">

            <button
              class="primary-btn"
              type="submit"
            >
              Save Settings
            </button>

          </div>

        </form>

      </div>

      <div class="admin-form-card">

        <h3>Current Database Settings</h3>

        ${
          data?.length
            ? `
              <div class="admin-table-wrap">

                <table>

                  <thead>

                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>

                  </thead>

                  <tbody>

                    ${data.map(row => `

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

                    `).join("")}

                  </tbody>

                </table>

              </div>
            `
            : emptyState(
                "No settings found."
              )
        }

      </div>

    `;

    $("#settingsForm")
      .addEventListener(
        "submit",
        saveSettings
      );
  }


  async function saveSetting(
    key,
    value
  ) {

    const {
      data: existing,
      error: findError
    } = await supabase
      .from("settings")
      .select("id")
      .eq("setting_key", key)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existing?.id) {

      const {
        error
      } = await supabase
        .from("settings")
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      if (error) throw error;

    } else {

      const {
        error
      } = await supabase
        .from("settings")
        .insert({
          setting_key: key,
          setting_value: value
        });

      if (error) throw error;
    }
  }


  async function saveSettings(event) {

    event.preventDefault();

    try {

      const settings = {

        business_name:
          $("#settingBusinessName").value.trim(),

        artist_name:
          $("#settingArtist").value.trim(),

        phone:
          $("#settingPhone").value.trim(),

        whatsapp:
          $("#settingWhatsapp").value.trim(),

        email:
          $("#settingEmail").value.trim(),

        address:
          $("#settingAddress").value.trim()

      };

      for (
        const [key, value]
        of Object.entries(settings)
      ) {

        await saveSetting(
          key,
          value
        );

      }

      await loadSettings();

      showAlert(
        "Settings saved successfully."
      );

    } catch (error) {

      console.error(error);

      showAlert(
        error?.message ||
        "Unable to save settings.",
        "error"
      );
    }
  }


  /* =======================================================
     EMPTY STATE
     ======================================================= */

  function emptyState(message) {

    return `
      <div class="empty-state">
        ${escapeHTML(message)}
      </div>
    `;
  }


  /* =======================================================
     MOBILE SIDEBAR
     ======================================================= */

  function closeMobileSidebar() {

    const sidebar = $("#sidebar");

    if (sidebar) {
      sidebar.classList.remove("open");
    }
  }


  function toggleMobileSidebar() {

    const sidebar = $("#sidebar");

    if (sidebar) {
      sidebar.classList.toggle("open");
    }
  }


  /* =======================================================
     EVENT SETUP
     ======================================================= */

  function setupNavigation() {

    $$(".nav-btn").forEach(button => {

      button.addEventListener(
        "click",
        () => {
          openModule(
            button.dataset.module
          );
        }
      );

    });
  }


  function setupAuthEvents() {

    $("#loginForm")
      .addEventListener(
        "submit",
        login
      );

    $("#logoutBtn")
      .addEventListener(
        "click",
        logout
      );

    $("#mobileMenuBtn")
      .addEventListener(
        "click",
        toggleMobileSidebar
      );

    /*
      One and only one Supabase auth listener.
      This avoids the old double-navigation problem.
    */

    const result =
      supabase.auth.onAuthStateChange(
        (event, session) => {

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "INITIAL_SESSION"
          ) {

            if (session?.user) {

              currentUser =
                session.user;

              showAdmin();

            } else if (
              event === "INITIAL_SESSION"
            ) {

              currentUser = null;

              showLogin();
            }

          }

          if (event === "SIGNED_OUT") {

            currentUser = null;

            showLogin();
          }

        }
      );

    authListener =
      result?.data?.subscription || null;
  }


  /* =======================================================
     START
     ======================================================= */

  async function init() {

    console.log(
      "Manju Admin Panel starting..."
    );

    setupNavigation();

    setupAuthEvents();

    await checkAuth();

    console.log(
      "Manju Admin Panel ready."
    );
  }


  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
