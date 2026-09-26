/*
  MANJU'S THE WORLD OF GLAMOUR — ADMIN PANEL
  Schema-matched admin.js
  Works with the existing admin.html and existing Supabase schema.
*/

(() => {
  'use strict';

  const sb = window.supabaseClient;
  const $ = (id) => document.getElementById(id);

  const els = {
    loginSection: $('loginSection'),
    adminPanel: $('adminPanel'),
    loginForm: $('loginForm'),
    adminEmail: $('adminEmail'),
    adminPassword: $('adminPassword'),
    loginMessage: $('loginMessage'),
    logoutBtn: $('logoutBtn'),
    moduleArea: $('moduleArea'),
    moduleTitle: $('moduleTitle'),
    moduleDescription: $('moduleDescription'),
    moduleContent: $('moduleContent')
  };

  let currentUser = null;
  let currentModule = 'dashboard';
  let categoriesCache = [];

  const MODULE_META = {
    dashboard: ['Dashboard', 'Overview of your salon website data.'],
    appointments: ['Appointments', 'Review and update customer appointment requests.'],
    services: ['Services', 'Manage services, categories, pricing and visibility.'],
    offers: ['Offers', 'Manage current and upcoming offers.'],
    gallery: ['Gallery', 'Manage portfolio and work images.'],
    bride_gallery: ['Bride Gallery', 'Manage bridal and bride/girls photos.'],
    customer_gallery: ['Customer Gallery', 'Manage customer photos and consent.'],
    before_after: ['Before / After', 'Manage transformation images.'],
    bridal_packages: ['Bridal Packages', 'Manage bridal packages and enquiry pricing.'],
    team: ['Team', 'Manage team members shown publicly.'],
    testimonials: ['Testimonials', 'Manage customer testimonials.'],
    faqs: ['FAQs', 'Manage frequently asked questions.'],
    settings: ['Settings', 'Manage business contact and website settings.']
  };

  function esc(value) {
    if (value === null || value === undefined) return '';

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function money(value) {
    if (value === null || value === undefined || value === '') {
      return 'Price on enquiry';
    }

    const n = Number(value);

    return Number.isFinite(n)
      ? `₹${n.toLocaleString('en-IN')}`
      : esc(value);
  }

  function dateOnly(value) {
    if (!value) return '—';

    const s = String(value).slice(0, 10);
    const d = new Date(`${s}T00:00:00`);

    if (Number.isNaN(d.getTime())) return esc(value);

    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function dateTime(value) {
    if (!value) return '—';

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return esc(value);

    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function setLoginMessage(message, error = false) {
    if (!els.loginMessage) return;

    els.loginMessage.textContent = message || '';

    els.loginMessage.style.color = error
      ? '#b42318'
      : '#176b45';
  }

  function toast(message, type = 'success') {
    let box = $('adminToast');

    if (!box) {
      box = document.createElement('div');

      box.id = 'adminToast';

      Object.assign(box.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: '99999',
        maxWidth: '420px',
        padding: '13px 16px',
        borderRadius: '12px',
        font: '14px/1.45 Arial,sans-serif',
        boxShadow: '0 12px 30px rgba(0,0,0,.15)'
      });

      document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.background =
      type === 'error'
        ? '#fff0f0'
        : '#eefbf3';

    box.style.color =
      type === 'error'
        ? '#a11a1a'
        : '#176b45';

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
      box.remove();
    }, 4500);
  }

  function setLoading(message = 'Loading…') {
    if (!els.moduleContent) return;

    els.moduleContent.innerHTML = `
      <div
        class="admin-loading"
        style="padding:40px;text-align:center"
      >
        ${esc(message)}
      </div>
    `;
  }

  function setModuleHeader(moduleName) {
    const meta =
      MODULE_META[moduleName] ||
      MODULE_META.dashboard;

    if (els.moduleTitle) {
      els.moduleTitle.textContent = meta[0];
    }

    if (els.moduleDescription) {
      els.moduleDescription.textContent = meta[1];
    }
  }

  function showModuleError(
    error,
    title = 'Something went wrong'
  ) {
    console.error(`[Admin] ${title}:`, error);

    const message =
      error?.message ||
      String(error || 'Unknown error');

    if (!els.moduleContent) return;

    els.moduleContent.innerHTML = `
      <div
        style="
          padding:24px;
          border:1px solid #f1c5c5;
          background:#fff7f7;
          border-radius:14px
        "
      >
        <h3 style="margin:0 0 8px">
          ${esc(title)}
        </h3>

        <p style="margin:0;color:#8d2b2b">
          ${esc(message)}
        </p>

        <button
          class="secondary-btn"
          style="margin-top:14px"
          data-retry="${esc(currentModule)}"
        >
          Retry
        </button>
      </div>
    `;
  }

  async function requireClient() {
    if (!sb || !sb.auth) {
      throw new Error(
        'Supabase client is not available. Check supabase-config.js and script order.'
      );
    }

    return sb;
  }

  async function checkAuth() {
    try {
      await requireClient();

      const {
        data,
        error
      } = await sb.auth.getSession();

      if (error) throw error;

      if (data?.session?.user) {
        currentUser = data.session.user;
        showAdmin();
      } else {
        showLogin();
      }

    } catch (error) {
      console.error(error);

      showLogin();

      setLoginMessage(
        error.message ||
        'Could not check login session.',
        true
      );
    }
  }

  function showLogin() {
    if (els.loginSection) {
      els.loginSection.style.display = 'flex';
    }

    if (els.adminPanel) {
      els.adminPanel.style.display = 'none';
    }
  }

  function showAdmin() {
    if (els.loginSection) {
      els.loginSection.style.display = 'none';
    }

    if (els.adminPanel) {
      els.adminPanel.style.display = '';
    }

    openModule('dashboard');
  }

  async function handleLogin(event) {
    event.preventDefault();

    setLoginMessage('Signing in…');

    const email =
      els.adminEmail?.value?.trim();

    const password =
      els.adminPassword?.value || '';

    if (!email || !password) {
      setLoginMessage(
        'Enter your email and password.',
        true
      );

      return;
    }

    try {
      const {
        data,
        error
      } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user;

      setLoginMessage('');

      showAdmin();

    } catch (error) {
      console.error(error);

      setLoginMessage(
        error.message || 'Login failed.',
        true
      );
    }
  }

  async function handleLogout() {
    try {
      const {
        error
      } = await sb.auth.signOut();

      if (error) throw error;

    } catch (error) {
      toast(
        error.message || 'Logout failed.',
        'error'
      );

      return;
    }

    currentUser = null;

    showLogin();
  }

  async function openModule(moduleName) {
    if (!els.moduleContent) {
      console.error(
        'admin.html is missing #moduleContent.'
      );

      return;
    }

    currentModule =
      moduleName || 'dashboard';

    setModuleHeader(currentModule);

    setLoading();

    try {
      switch (currentModule) {

        case 'dashboard':
          return await loadDashboard();

        case 'appointments':
          return await loadAppointments();

        case 'services':
          return await loadServices();

        case 'offers':
          return await loadOffers();

        case 'gallery':
          return await loadGallery();

        case 'bride_gallery':
          return await loadBrideGallery();

        case 'customer_gallery':
          return await loadCustomerGallery();

        case 'before_after':
          return await loadBeforeAfter();

        case 'bridal_packages':
          return await loadBridalPackages();

        case 'team':
          return await loadTeam();

        case 'testimonials':
          return await loadTestimonials();

        case 'faqs':
          return await loadFaqs();

        case 'settings':
          return await loadSettings();

        default:
          return await loadDashboard();
      }

    } catch (error) {
      showModuleError(
        error,
        `Could not load ${
          MODULE_META[currentModule]?.[0] ||
          currentModule
        }`
      );
    }
  }

  window.openModule = openModule;

  async function count(table, filter) {
    let q = sb
      .from(table)
      .select('*', {
        count: 'exact',
        head: true
      });

    if (filter) {
      q = filter(q);
    }

    const {
      count: c,
      error
    } = await q;

    if (error) throw error;

    return c || 0;
  }

  async function loadDashboard() {

    const names = [
      'appointments',
      'services',
      'offers',
      'gallery',
      'bride_gallery',
      'customer_gallery',
      'before_after',
      'bridal_packages',
      'team',
      'testimonials',
      'faqs'
    ];

    const values = await Promise.all(
      names.map(n => count(n))
    );

    const c = Object.fromEntries(
      names.map((n, i) => [
        n,
        values[i]
      ])
    );

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <div
          class="dashboard-grid"
          style="
            display:grid;
            grid-template-columns:
              repeat(auto-fit,minmax(170px,1fr));
            gap:14px
          "
        >

          ${names.map(n => `
            <button
              type="button"
              class="dashboard-card"
              data-open-module="${n}"
              style="
                text-align:left;
                cursor:pointer
              "
            >

              <h3
                style="
                  margin:0 0 5px
                "
              >
                ${c[n]}
              </h3>

              <p style="margin:0">
                ${esc(MODULE_META[n][0])}
              </p>

            </button>
          `).join('')}

        </div>

        <div
          style="
            margin-top:20px;
            padding:16px;
            border-radius:12px;
            background:#faf7f2
          "
        >
          <strong>Signed in:</strong>
          ${esc(
            currentUser?.email ||
            'Authenticated user'
          )}
        </div>

      </div>
    `;
  }

  async function loadAppointments() {

    const [
      appointmentResult,
      serviceResult
    ] = await Promise.all([

      sb
        .from('appointments')
        .select('*')
        .order(
          'created_at',
          { ascending: false }
        ),

      sb
        .from('services')
        .select('id,name')
    ]);

    if (appointmentResult.error) {
      throw appointmentResult.error;
    }

    if (serviceResult.error) {
      throw serviceResult.error;
    }

    const serviceNames =
      Object.fromEntries(
        (serviceResult.data || [])
          .map(service => [
            service.id,
            service.name
          ])
      );

    const data =
      appointmentResult.data || [];

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <div
          class="admin-table-wrap"
          style="overflow:auto"
        >

          <table
            class="admin-table"
            style="
              min-width:1000px;
              width:100%
            "
          >

            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>WhatsApp</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              ${
                data.length
                  ? data.map(row => `
                    <tr>

                      <td>
                        ${esc(
                          row.customer_name ||
                          '—'
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.phone ||
                          '—'
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.email ||
                          '—'
                        )}
                      </td>

                      <td>
                        ${esc(
                          serviceNames[
                            row.service_id
                          ] ||
                          '—'
                        )}
                      </td>

                      <td>
                        ${dateOnly(
                          row.appointment_date
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.appointment_time ||
                          '—'
                        )}
                      </td>

                      <td>

                        <select
                          data-appointment-status
                          data-id="${esc(row.id)}"
                        >

                          ${
                            [
                              'New',
                              'Confirmed',
                              'Completed',
                              'Cancelled',
                              'No-show'
                            ]
                            .map(status => `
                              <option
                                value="${esc(status)}"
                                ${
                                  row.status === status
                                    ? 'selected'
                                    : ''
                                }
                              >
                                ${esc(status)}
                              </option>
                            `)
                            .join('')
                          }

                        </select>

                      </td>

                      <td>
                        ${
                          row.whatsapp_requested
                            ? 'Yes'
                            : 'No'
                        }
                      </td>

                      <td>
                        ${dateTime(
                          row.created_at
                        )}
                      </td>

                      <td>

                        <button
                          class="delete-btn"
                          data-delete-table="appointments"
                          data-delete-id="${esc(row.id)}"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td
                        colspan="10"
                        style="text-align:center;padding:30px"
                      >
                        No appointment requests yet.
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>
    `;

    els.moduleContent
      .querySelectorAll(
        '[data-appointment-status]'
      )
      .forEach(select => {

        select.addEventListener(
          'change',
          async event => {

            const id =
              event.target.dataset.id;

            const status =
              event.target.value;

            try {

              const {
                error
              } = await sb
                .from('appointments')
                .update({
                  status
                })
                .eq('id', id);

              if (error) throw error;

              toast(
                'Appointment status updated.'
              );

            } catch (error) {

              toast(
                error.message,
                'error'
              );

            }

          }
        );

      });
  }

  async function loadCategories() {

    const {
      data,
      error
    } = await sb
      .from('categories')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'name',
        { ascending: true }
      );

    if (error) throw error;

    categoriesCache = data || [];

    return categoriesCache;
  }

  async function loadServices() {

    const [
      serviceResult,
      categoryResult
    ] = await Promise.all([

      sb
        .from('services')
        .select('*')
        .order(
          'display_order',
          { ascending: true }
        )
        .order(
          'created_at',
          { ascending: false }
        ),

      sb
        .from('categories')
        .select('*')
        .order(
          'display_order',
          { ascending: true }
        )
        .order(
          'name',
          { ascending: true }
        )
    ]);

    if (serviceResult.error) {
      throw serviceResult.error;
    }

    if (categoryResult.error) {
      throw categoryResult.error;
    }

    categoriesCache =
      categoryResult.data || [];

    const data =
      serviceResult.data || [];

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <div
          style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
            margin-bottom:16px
          "
        >

          <button
            class="primary-btn"
            id="newServiceBtn"
          >
            + Add Service
          </button>

          <button
            class="secondary-btn"
            id="newCategoryBtn"
          >
            + Add Category
          </button>

        </div>

        <div id="serviceFormArea"></div>

        <div
          id="categoryFormArea"
          style="margin-bottom:16px"
        ></div>

        <div
          class="admin-table-wrap"
          style="overflow:auto"
        >

          <table
            class="admin-table"
            style="
              min-width:900px;
              width:100%
            "
          >

            <thead>
              <tr>
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

              ${
                data.length
                  ? data.map(row => {

                      const category =
                        categoriesCache.find(
                          c =>
                            c.id ===
                            row.category_id
                        );

                      return `
                        <tr>

                          <td>
                            ${esc(row.name)}
                          </td>

                          <td>
                            ${esc(
                              category?.name ||
                              '—'
                            )}
                          </td>

                          <td>
                            ${money(
                              row.price
                            )}
                          </td>

                          <td>
                            ${
                              row.duration_minutes
                                ? `${row.duration_minutes} min`
                                : '—'
                            }
                          </td>

                          <td>
                            ${
                              row.featured
                                ? 'Yes'
                                : 'No'
                            }
                          </td>

                          <td>
                            ${
                              row.active
                                ? 'Yes'
                                : 'No'
                            }
                          </td>

                          <td>

                            <button
                              class="secondary-btn"
                              data-edit-service="${esc(row.id)}"
                            >
                              Edit
                            </button>

                            <button
                              class="delete-btn"
                              data-delete-table="services"
                              data-delete-id="${esc(row.id)}"
                            >
                              Delete
                            </button>

                          </td>

                        </tr>
                      `;

                    }).join('')
                  : `
                    <tr>
                      <td
                        colspan="7"
                        style="text-align:center;padding:30px"
                      >
                        No services added yet.
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>
    `;

    $('newServiceBtn').onclick =
      () => showServiceForm();

    $('newCategoryBtn').onclick =
      () => showCategoryForm();

    els.moduleContent
      .querySelectorAll(
        '[data-edit-service]'
      )
      .forEach(button => {

        button.onclick = () => {

          const row =
            data.find(
              item =>
                item.id ===
                button.dataset.editService
            );

          showServiceForm(row);
        };

      });
  }

  function showCategoryForm(row = null) {

    const area =
      $('categoryFormArea');

    area.innerHTML = `
      <div
        class="admin-form-card"
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px
        "
      >

        <form id="categoryForm">

          <label>
            Category name
            <input
              id="categoryName"
              required
              value="${esc(row?.name || '')}"
            >
          </label>

          <label>
            Description
            <textarea
              id="categoryDescription"
            >${esc(row?.description || '')}</textarea>
          </label>

          <label>
            Display order
            <input
              id="categoryOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            <input
              id="categoryActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>

          <div style="margin-top:12px">

            <button
              type="submit"
              class="primary-btn"
            >
              Save Category
            </button>

            <button
              type="button"
              class="secondary-btn"
              id="cancelCategory"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelCategory').onclick =
      () => {
        area.innerHTML = '';
      };

    $('categoryForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          const name =
            $('categoryName')
              .value
              .trim();

          const payload = {
            name,
            slug: slugify(name),
            description:
              $('categoryDescription')
                .value
                .trim() || null,

            display_order:
              Number(
                $('categoryOrder').value
              ) || 0,

            active:
              $('categoryActive')
                .checked
          };

          const query =
            row?.id

              ? sb
                  .from('categories')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('categories')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Category saved successfully.'
          );

          await loadServices();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  function showServiceForm(row = null) {

    const area =
      $('serviceFormArea');

    const categoryOptions =
      categoriesCache
        .map(category => `
          <option
            value="${esc(category.id)}"
            ${
              row?.category_id ===
              category.id
                ? 'selected'
                : ''
            }
          >
            ${esc(category.name)}
          </option>
        `)
        .join('');

    area.innerHTML = `
      <div
        class="admin-form-card"
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px;
          margin-bottom:16px
        "
      >

        <form id="serviceForm">

          <label>
            Service name
            <input
              id="serviceName"
              required
              value="${esc(row?.name || '')}"
            >
          </label>

          <label>
            Category
            <select id="serviceCategory">

              <option value="">
                Select category
              </option>

              ${categoryOptions}

            </select>
          </label>

          <label>
            Price
            <input
              id="servicePrice"
              type="number"
              min="0"
              step="0.01"
              value="${esc(row?.price ?? '')}"
              placeholder="Leave blank for enquiry"
            >
          </label>

          <label>
            Price label
            <input
              id="servicePriceLabel"
              value="${esc(
                row?.price_label ||
                'Price on enquiry'
              )}"
            >
          </label>

          <label>
            Duration in minutes
            <input
              id="serviceDuration"
              type="number"
              min="0"
              value="${esc(
                row?.duration_minutes ??
                ''
              )}"
            >
          </label>

          <label>
            Description
            <textarea
              id="serviceDescription"
            >${esc(
              row?.description || ''
            )}</textarea>
          </label>

          <label>
            Display order
            <input
              id="serviceOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            Service image
            <input
              id="serviceImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            <input
              id="serviceFeatured"
              type="checkbox"
              ${
                row?.featured
                  ? 'checked'
                  : ''
              }
            >
            Featured
          </label>

          <label>
            <input
              id="serviceActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>

          <div style="margin-top:12px">

            <button
              type="submit"
              class="primary-btn"
            >
              Save Service
            </button>

            <button
              type="button"
              class="secondary-btn"
              id="cancelService"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelService').onclick =
      () => {
        area.innerHTML = '';
      };

    $('serviceForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          let imageUrl =
            row?.image_url ||
            null;

          const file =
            $('serviceImage')
              .files[0];

          if (file) {
            imageUrl =
              await uploadImage(
                'services',
                file
              );
          }

          const priceValue =
            $('servicePrice').value;

          const durationValue =
            $('serviceDuration').value;

          const payload = {
            name:
              $('serviceName')
                .value
                .trim(),

            slug:
              slugify(
                $('serviceName')
                  .value
              ),

            category_id:
              $('serviceCategory')
                .value || null,

            description:
              $('serviceDescription')
                .value
                .trim() || null,

            price:
              priceValue === ''
                ? null
                : Number(priceValue),

            price_label:
              $('servicePriceLabel')
                .value
                .trim() ||
              'Price on enquiry',

            duration_minutes:
              durationValue === ''
                ? null
                : Number(durationValue),

            image_url:
              imageUrl,

            featured:
              $('serviceFeatured')
                .checked,

            active:
              $('serviceActive')
                .checked,

            display_order:
              Number(
                $('serviceOrder').value
              ) || 0
          };

          const query =
            row?.id

              ? sb
                  .from('services')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('services')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Service saved successfully.'
          );

          await loadServices();

        } catch (error) {

          console.error(error);

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadOffers() {

    const {
      data,
      error
    } = await sb
      .from('offers')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <button
          class="primary-btn"
          id="newOfferBtn"
        >
          + Add Offer
        </button>

        <div id="offerFormArea"></div>

        <div
          class="admin-table-wrap"
          style="overflow:auto;margin-top:16px"
        >

          <table
            class="admin-table"
            style="
              min-width:1000px;
              width:100%
            "
          >

            <thead>
              <tr>
                <th>Name</th>
                <th>Original</th>
                <th>Offer</th>
                <th>Valid from</th>
                <th>Valid until</th>
                <th>Active</th>
                <th>Featured</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              ${
                data?.length
                  ? data.map(row => `
                    <tr>

                      <td>
                        ${esc(row.name)}
                      </td>

                      <td>
                        ${money(
                          row.original_price
                        )}
                      </td>

                      <td>
                        ${money(
                          row.offer_price
                        )}
                      </td>

                      <td>
                        ${dateOnly(
                          row.valid_from
                        )}
                      </td>

                      <td>
                        ${dateOnly(
                          row.valid_until
                        )}
                      </td>

                      <td>
                        ${
                          row.active
                            ? 'Yes'
                            : 'No'
                        }
                      </td>

                      <td>
                        ${
                          row.featured
                            ? 'Yes'
                            : 'No'
                        }
                      </td>

                      <td>

                        <button
                          class="secondary-btn"
                          data-edit-offer="${esc(row.id)}"
                        >
                          Edit
                        </button>

                        <button
                          class="delete-btn"
                          data-delete-table="offers"
                          data-delete-id="${esc(row.id)}"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td
                        colspan="8"
                        style="text-align:center;padding:30px"
                      >
                        No offers yet.
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>
    `;

    $('newOfferBtn').onclick =
      () => showOfferForm();

    els.moduleContent
      .querySelectorAll(
        '[data-edit-offer]'
      )
      .forEach(button => {

        button.onclick = () => {

          const row =
            data.find(
              item =>
                item.id ===
                button.dataset.editOffer
            );

          showOfferForm(row);
        };

      });
  }

  function showOfferForm(row = null) {

    const area =
      $('offerFormArea');

    area.innerHTML = `
      <div
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px;
          margin:16px 0
        "
      >

        <form id="offerForm">

          <label>
            Offer name
            <input
              id="offerName"
              required
              value="${esc(row?.name || '')}"
            >
          </label>

          <label>
            Description
            <textarea
              id="offerDescription"
            >${esc(
              row?.description || ''
            )}</textarea>
          </label>

          <label>
            Original price
            <input
              id="offerOriginal"
              type="number"
              min="0"
              step="0.01"
              value="${esc(
                row?.original_price ??
                ''
              )}"
            >
          </label>

          <label>
            Offer price
            <input
              id="offerPrice"
              type="number"
              min="0"
              step="0.01"
              value="${esc(
                row?.offer_price ??
                ''
              )}"
            >
          </label>

          <label>
            Discount %
            <input
              id="offerDiscount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value="${esc(
                row?.discount_percent ??
                ''
              )}"
            >
          </label>

          <label>
            Valid from
            <input
              id="offerFrom"
              type="date"
              value="${esc(
                row?.valid_from ||
                ''
              )}"
            >
          </label>

          <label>
            Valid until
            <input
              id="offerUntil"
              type="date"
              value="${esc(
                row?.valid_until ||
                ''
              )}"
            >
          </label>

          <label>
            Included services
            <textarea
              id="offerIncluded"
            >${esc(
              row?.included_services ||
              ''
            )}</textarea>
          </label>

          <label>
            Terms
            <textarea
              id="offerTerms"
            >${esc(
              row?.terms || ''
            )}</textarea>
          </label>

          <label>
            Offer image
            <input
              id="offerImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            <input
              id="offerActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>

          <label>
            <input
              id="offerFeatured"
              type="checkbox"
              ${
                row?.featured
                  ? 'checked'
                  : ''
              }
            >
            Featured
          </label>

          <div style="margin-top:12px">

            <button
              type="submit"
              class="primary-btn"
            >
              Save Offer
            </button>

            <button
              type="button"
              class="secondary-btn"
              id="cancelOffer"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelOffer').onclick =
      () => {
        area.innerHTML = '';
      };

    $('offerForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          let imageUrl =
            row?.image_url ||
            null;

          const file =
            $('offerImage')
              .files[0];

          if (file) {
            imageUrl =
              await uploadImage(
                'offers',
                file
              );
          }

          const payload = {
            name:
              $('offerName')
                .value
                .trim(),

            description:
              $('offerDescription')
                .value
                .trim() || null,

            image_url:
              imageUrl,

            original_price:
              $('offerOriginal')
                .value === ''
                ? null
                : Number(
                    $('offerOriginal')
                      .value
                  ),

            offer_price:
              $('offerPrice')
                .value === ''
                ? null
                : Number(
                    $('offerPrice')
                      .value
                  ),

            discount_percent:
              $('offerDiscount')
                .value === ''
                ? null
                : Number(
                    $('offerDiscount')
                      .value
                  ),

            valid_from:
              $('offerFrom')
                .value || null,

            valid_until:
              $('offerUntil')
                .value || null,

            included_services:
              $('offerIncluded')
                .value
                .trim() || null,

            terms:
              $('offerTerms')
                .value
                .trim() || null,

            active:
              $('offerActive')
                .checked,

            featured:
              $('offerFeatured')
                .checked
          };

          const query =
            row?.id

              ? sb
                  .from('offers')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('offers')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Offer saved successfully.'
          );

          await loadOffers();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function uploadImage(
    bucket,
    file
  ) {

    if (!file) return null;

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.type)) {
      throw new Error(
        'Only JPG, PNG and WEBP images are allowed.'
      );
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      throw new Error(
        'Image must be 10 MB or smaller.'
      );
    }

    const extension =
      file.name
        .split('.')
        .pop()
        .toLowerCase();

    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

    const {
      error
    } = await sb
      .storage
      .from(bucket)
      .upload(
        fileName,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );

    if (error) throw error;

    const {
      data
    } = sb
      .storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function loadGallery() {

    const {
      data,
      error
    } = await sb
      .from('gallery')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderGalleryLike(
      'Gallery',
      'gallery',
      'gallery',
      data || [],
      'image_url'
    );
  }

  async function loadBrideGallery() {

    const {
      data,
      error
    } = await sb
      .from('bride_gallery')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderGalleryLike(
      'Bride Gallery',
      'bride_gallery',
      'bride-gallery',
      data || [],
      'image_url'
    );
  }

  async function loadCustomerGallery() {

    const {
      data,
      error
    } = await sb
      .from('customer_gallery')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderGalleryLike(
      'Customer Gallery',
      'customer_gallery',
      'customer-gallery',
      data || [],
      'photo_url'
    );
  }

  function renderGalleryLike(
    title,
    table,
    bucket,
    rows,
    imageField
  ) {

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <button
          class="primary-btn"
          id="newGalleryBtn"
        >
          + Add Photo
        </button>

        <div id="galleryFormArea"></div>

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(auto-fill,minmax(230px,1fr));
            gap:16px;
            margin-top:18px
          "
        >

          ${
            rows.length
              ? rows.map(row => `
                <article
                  style="
                    border:1px solid #e8e1d8;
                    border-radius:14px;
                    overflow:hidden;
                    background:white
                  "
                >

                  ${
                    row[imageField]
                      ? `
                        <img
                          src="${esc(
                            row[imageField]
                          )}"
                          alt="${esc(
                            row.title ||
                            row.customer_name ||
                            title
                          )}"
                          style="
                            width:100%;
                            height:220px;
                            object-fit:cover
                          "
                        >
                      `
                      : `
                        <div
                          style="
                            height:220px;
                            display:grid;
                            place-items:center;
                            background:#f5f2ed
                          "
                        >
                          No image
                        </div>
                      `
                  }

                  <div style="padding:14px">

                    <strong>
                      ${esc(
                        row.title ||
                        row.customer_name ||
                        'Untitled'
                      )}
                    </strong>

                    <p
                      style="
                        margin:7px 0;
                        color:#666
                      "
                    >
                      ${esc(
                        row.category ||
                        row.service ||
                        ''
                      )}
                    </p>

                    <div>

                      <button
                        class="secondary-btn"
                        data-edit-gallery="${esc(row.id)}"
                        data-gallery-table="${esc(table)}"
                      >
                        Edit
                      </button>

                      <button
                        class="delete-btn"
                        data-delete-table="${esc(table)}"
                        data-delete-id="${esc(row.id)}"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </article>
              `).join('')
              : `
                <div
                  style="
                    padding:35px;
                    text-align:center;
                    background:#faf7f2;
                    border-radius:14px
                  "
                >
                  No photos added yet.
                </div>
              `
          }

        </div>

      </div>
    `;

    $('newGalleryBtn').onclick =
      () =>
        showGalleryForm(
          table,
          bucket,
          null,
          imageField
        );

    els.moduleContent
      .querySelectorAll(
        '[data-edit-gallery]'
      )
      .forEach(button => {

        button.onclick = () => {

          const row =
            rows.find(
              item =>
                item.id ===
                button.dataset.editGallery
            );

          showGalleryForm(
            table,
            bucket,
            row,
            imageField
          );
        };

      });
  }

  function showGalleryForm(
    table,
    bucket,
    row,
    imageField
  ) {

    const area =
      $('galleryFormArea');

    const isCustomer =
      table === 'customer_gallery';

    const isBride =
      table === 'bride_gallery';

    area.innerHTML = `
      <div
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px;
          margin:16px 0
        "
      >

        <form id="galleryForm">

          ${
            isCustomer
              ? `
                <label>
                  Customer name
                  <input
                    id="galleryCustomerName"
                    value="${esc(
                      row?.customer_name ||
                      ''
                    )}"
                  >
                </label>

                <label>
                  Service
                  <input
                    id="galleryService"
                    value="${esc(
                      row?.service ||
                      ''
                    )}"
                  >
                </label>

                <label>
                  Testimonial
                  <textarea
                    id="galleryTestimonial"
                  >${esc(
                    row?.testimonial ||
                    ''
                  )}</textarea>
                </label>

                <label>
                  Rating
                  <input
                    id="galleryRating"
                    type="number"
                    min="1"
                    max="5"
                    value="${esc(
                      row?.rating ??
                      ''
                    )}"
                  >
                </label>

                <label>
                  Consent given
                  <input
                    id="galleryConsent"
                    type="checkbox"
                    ${
                      row?.consent_given
                        ? 'checked'
                        : ''
                    }
                  >
                </label>
              `
              : `
                <label>
                  Title
                  <input
                    id="galleryTitle"
                    value="${esc(
                      row?.title ||
                      ''
                    )}"
                  >
                </label>

                <label>
                  Description
                  <textarea
                    id="galleryDescription"
                  >${esc(
                    row?.description ||
                    ''
                  )}</textarea>
                </label>

                <label>
                  Category
                  <input
                    id="galleryCategory"
                    value="${esc(
                      row?.category ||
                      ''
                    )}"
                  >
                </label>
              `
          }

          ${
            isBride
              ? `
                <label>
                  Photo date
                  <input
                    id="galleryDate"
                    type="date"
                    value="${esc(
                      row?.photo_date ||
                      ''
                    )}"
                  >
                </label>
              `
              : ''
          }

          <label>
            Display order
            <input
              id="galleryOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            Photo
            <input
              id="galleryFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          ${
            !isCustomer
              ? `
                <label>
                  <input
                    id="galleryFeatured"
                    type="checkbox"
                    ${
                      row?.featured
                        ? 'checked'
                        : ''
                    }
                  >
                  Featured
                </label>

                <label>
                  <input
                    id="galleryVisible"
                    type="checkbox"
                    ${
                      row?.visible !== false
                        ? 'checked'
                        : ''
                    }
                  >
                  Visible
                </label>
              `
              : `
                <label>
                  <input
                    id="galleryFeatured"
                    type="checkbox"
                    ${
                      row?.featured
                        ? 'checked'
                        : ''
                    }
                  >
                  Featured
                </label>

                <label>
                  <input
                    id="galleryVisible"
                    type="checkbox"
                    ${
                      row?.visible !== false
                        ? 'checked'
                        : ''
                    }
                  >
                  Visible
                </label>
              `
          }

          <div style="margin-top:12px">

            <button
              class="primary-btn"
              type="submit"
            >
              Save
            </button>

            <button
              class="secondary-btn"
              type="button"
              id="cancelGallery"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelGallery').onclick =
      () => {
        area.innerHTML = '';
      };

    $('galleryForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          let imageUrl =
            row?.[imageField] ||
            null;

          const file =
            $('galleryFile')
              .files[0];

          if (file) {
            imageUrl =
              await uploadImage(
                bucket,
                file
              );
          }

          if (!imageUrl) {
            throw new Error(
              'Please select an image.'
            );
          }

          let payload;

          if (table === 'gallery') {

            payload = {
              title:
                $('galleryTitle')
                  .value
                  .trim() || null,

              description:
                $('galleryDescription')
                  .value
                  .trim() || null,

              image_url:
                imageUrl,

              category:
                $('galleryCategory')
                  .value
                  .trim() || null,

              featured:
                $('galleryFeatured')
                  .checked,

              visible:
                $('galleryVisible')
                  .checked,

              display_order:
                Number(
                  $('galleryOrder').value
                ) || 0
            };

          } else if (
            table === 'bride_gallery'
          ) {

            payload = {
              title:
                $('galleryTitle')
                  .value
                  .trim() || null,

              description:
                $('galleryDescription')
                  .value
                  .trim() || null,

              image_url:
                imageUrl,

              category:
                $('galleryCategory')
                  .value
                  .trim() || null,

              photo_date:
                $('galleryDate')
                  .value || null,

              featured:
                $('galleryFeatured')
                  .checked,

              visible:
                $('galleryVisible')
                  .checked,

              display_order:
                Number(
                  $('galleryOrder').value
                ) || 0
            };

          } else {

            payload = {
              customer_name:
                $('galleryCustomerName')
                  .value
                  .trim() || null,

              photo_url:
                imageUrl,

              service:
                $('galleryService')
                  .value
                  .trim() || null,

              testimonial:
                $('galleryTestimonial')
                  .value
                  .trim() || null,

              rating:
                $('galleryRating')
                  .value === ''
                  ? null
                  : Number(
                      $('galleryRating').value
                    ),

              featured:
                $('galleryFeatured')
                  .checked,

              visible:
                $('galleryVisible')
                  .checked,

              consent_given:
                $('galleryConsent')
                  .checked,

              display_order:
                Number(
                  $('galleryOrder').value
                ) || 0
            };

          }

          const query =
            row?.id

              ? sb
                  .from(table)
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from(table)
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Photo saved successfully.'
          );

          await openModule(table);

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadBeforeAfter() {

    const {
      data,
      error
    } = await sb
      .from('before_after')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <button
          class="primary-btn"
          id="newBeforeAfter"
        >
          + Add Before / After
        </button>

        <div id="beforeAfterFormArea"></div>

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(auto-fill,minmax(260px,1fr));
            gap:16px;
            margin-top:18px
          "
        >

          ${
            data?.length
              ? data.map(row => `
                <article
                  style="
                    border:1px solid #e8e1d8;
                    border-radius:14px;
                    overflow:hidden
                  "
                >

                  <div
                    style="
                      display:grid;
                      grid-template-columns:1fr 1fr
                    "
                  >

                    <img
                      src="${esc(
                        row.before_image_url
                      )}"
                      alt="Before"
                      style="
                        width:100%;
                        height:180px;
                        object-fit:cover
                      "
                    >

                    <img
                      src="${esc(
                        row.after_image_url
                      )}"
                      alt="After"
                      style="
                        width:100%;
                        height:180px;
                        object-fit:cover
                      "
                    >

                  </div>

                  <div style="padding:14px">

                    <strong>
                      ${esc(
                        row.title ||
                        'Before / After'
                      )}
                    </strong>

                    <p>
                      ${esc(
                        row.category ||
                        ''
                      )}
                    </p>

                    <button
                      class="secondary-btn"
                      data-edit-before-after="${esc(row.id)}"
                    >
                      Edit
                    </button>

                    <button
                      class="delete-btn"
                      data-delete-table="before_after"
                      data-delete-id="${esc(row.id)}"
                    >
                      Delete
                    </button>

                  </div>

                </article>
              `).join('')
              : `
                <div
                  style="
                    padding:35px;
                    text-align:center;
                    background:#faf7f2;
                    border-radius:14px
                  "
                >
                  No before/after entries yet.
                </div>
              `
          }

        </div>

      </div>
    `;

    $('newBeforeAfter').onclick =
      () => showBeforeAfterForm();

    els.moduleContent
      .querySelectorAll(
        '[data-edit-before-after]'
      )
      .forEach(button => {

        button.onclick = () => {

          const row =
            data.find(
              item =>
                item.id ===
                button.dataset
                  .editBeforeAfter
            );

          showBeforeAfterForm(row);
        };

      });
  }

  function showBeforeAfterForm(row = null) {

    const area =
      $('beforeAfterFormArea');

    area.innerHTML = `
      <div
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px;
          margin:16px 0
        "
      >

        <form id="beforeAfterForm">

          <label>
            Title
            <input
              id="baTitle"
              value="${esc(
                row?.title || ''
              )}"
            >
          </label>

          <label>
            Description
            <textarea
              id="baDescription"
            >${esc(
              row?.description || ''
            )}</textarea>
          </label>

          <label>
            Category
            <input
              id="baCategory"
              value="${esc(
                row?.category || ''
              )}"
            >
          </label>

          <label>
            Before image
            <input
              id="baBefore"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            After image
            <input
              id="baAfter"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            Display order
            <input
              id="baOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            <input
              id="baFeatured"
              type="checkbox"
              ${
                row?.featured
                  ? 'checked'
                  : ''
              }
            >
            Featured
          </label>

          <label>
            <input
              id="baVisible"
              type="checkbox"
              ${
                row?.visible !== false
                  ? 'checked'
                  : ''
              }
            >
            Visible
          </label>

          <div style="margin-top:12px">

            <button
              class="primary-btn"
              type="submit"
            >
              Save
            </button>

            <button
              class="secondary-btn"
              type="button"
              id="cancelBA"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelBA').onclick =
      () => {
        area.innerHTML = '';
      };

    $('beforeAfterForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          let beforeUrl =
            row?.before_image_url ||
            null;

          let afterUrl =
            row?.after_image_url ||
            null;

          const beforeFile =
            $('baBefore')
              .files[0];

          const afterFile =
            $('baAfter')
              .files[0];

          if (beforeFile) {
            beforeUrl =
              await uploadImage(
                'before-after',
                beforeFile
              );
          }

          if (afterFile) {
            afterUrl =
              await uploadImage(
                'before-after',
                afterFile
              );
          }

          if (!beforeUrl || !afterUrl) {
            throw new Error(
              'Both before and after images are required.'
            );
          }

          const payload = {
            title:
              $('baTitle')
                .value
                .trim() || null,

            description:
              $('baDescription')
                .value
                .trim() || null,

            before_image_url:
              beforeUrl,

            after_image_url:
              afterUrl,

            category:
              $('baCategory')
                .value
                .trim() || null,

            featured:
              $('baFeatured')
                .checked,

            visible:
              $('baVisible')
                .checked,

            display_order:
              Number(
                $('baOrder').value
              ) || 0
          };

          const query =
            row?.id

              ? sb
                  .from('before_after')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('before_after')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Before/after saved.'
          );

          await loadBeforeAfter();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadBridalPackages() {

    const {
      data,
      error
    } = await sb
      .from('bridal_packages')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderCrudTable(
      'Bridal Packages',
      data || [],
      [
        'Name',
        'Price',
        'Duration',
        'Active'
      ],
      row => `
        <td>
          ${esc(row.name)}
        </td>

        <td>
          ${money(row.price)}
        </td>

        <td>
          ${esc(
            row.duration ||
            '—'
          )}
        </td>

        <td>
          ${
            row.active
              ? 'Yes'
              : 'No'
          }
        </td>
      `,
      () =>
        showBridalPackageForm(),
      row =>
        showBridalPackageForm(row),
      'bridal_packages'
    );
  }

  function showBridalPackageForm(
    row = null
  ) {

    const form =
      basicForm(
        'bridal_packagesFormArea',

        `
          <label>
            Name
            <input
              id="bpName"
              required
              value="${esc(
                row?.name || ''
              )}"
            >
          </label>

          <label>
            Description
            <textarea
              id="bpDescription"
            >${esc(
              row?.description || ''
            )}</textarea>
          </label>

          <label>
            Price
            <input
              id="bpPrice"
              type="number"
              min="0"
              step="0.01"
              value="${esc(
                row?.price ??
                ''
              )}"
            >
          </label>

          <label>
            Price label
            <input
              id="bpPriceLabel"
              value="${esc(
                row?.price_label ||
                'Price on enquiry'
              )}"
            >
          </label>

          <label>
            Included services
            <textarea
              id="bpIncluded"
            >${esc(
              row?.included_services ||
              ''
            )}</textarea>
          </label>

          <label>
            Duration
            <input
              id="bpDuration"
              value="${esc(
                row?.duration ||
                ''
              )}"
            >
          </label>

          <label>
            Display order
            <input
              id="bpOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            Image
            <input
              id="bpImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            <input
              id="bpFeatured"
              type="checkbox"
              ${
                row?.featured
                  ? 'checked'
                  : ''
              }
            >
            Featured
          </label>

          <label>
            <input
              id="bpActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>
        `,

        'Save Package'
      );

    form.onsubmit =
      async event => {

        event.preventDefault();

        try {

          let imageUrl =
            row?.image_url ||
            null;

          const file =
            $('bpImage')
              .files[0];

          if (file) {
            imageUrl =
              await uploadImage(
                'gallery',
                file
              );
          }

          const payload = {
            name:
              $('bpName')
                .value
                .trim(),

            description:
              $('bpDescription')
                .value
                .trim() || null,

            image_url:
              imageUrl,

            price:
              $('bpPrice')
                .value === ''
                ? null
                : Number(
                    $('bpPrice').value
                  ),

            price_label:
              $('bpPriceLabel')
                .value
                .trim() ||
              'Price on enquiry',

            included_services:
              $('bpIncluded')
                .value
                .trim() || null,

            duration:
              $('bpDuration')
                .value
                .trim() || null,

            featured:
              $('bpFeatured')
                .checked,

            active:
              $('bpActive')
                .checked,

            display_order:
              Number(
                $('bpOrder').value
              ) || 0
          };

          const query =
            row?.id

              ? sb
                  .from('bridal_packages')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('bridal_packages')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Bridal package saved.'
          );

          await loadBridalPackages();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadTeam() {

    const {
      data,
      error
    } = await sb
      .from('team')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderCrudTable(
      'Team',
      data || [],
      [
        'Name',
        'Role',
        'Active'
      ],
      row => `
        <td>
          ${esc(row.name)}
        </td>

        <td>
          ${esc(row.role || '—')}
        </td>

        <td>
          ${
            row.active
              ? 'Yes'
              : 'No'
          }
        </td>
      `,
      () => showTeamForm(),
      row => showTeamForm(row),
      'team'
    );
  }

  function showTeamForm(row = null) {

    const form =
      basicForm(
        'teamFormArea',

        `
          <label>
            Name
            <input
              id="tmName"
              required
              value="${esc(
                row?.name || ''
              )}"
            >
          </label>

          <label>
            Role
            <input
              id="tmRole"
              value="${esc(
                row?.role || ''
              )}"
            >
          </label>

          <label>
            Bio
            <textarea
              id="tmBio"
            >${esc(
              row?.bio || ''
            )}</textarea>
          </label>

          <label>
            Instagram URL
            <input
              id="tmInstagram"
              value="${esc(
                row?.instagram_url ||
                ''
              )}"
            >
          </label>

          <label>
            Display order
            <input
              id="tmOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            Photo
            <input
              id="tmFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            <input
              id="tmActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>
        `,

        'Save Team'
      );

    form.onsubmit =
      async event => {

        event.preventDefault();

        try {

          let image =
            row?.image_url ||
            null;

          const file =
            $('tmFile')
              .files[0];

          if (file) {
            image =
              await uploadImage(
                'team',
                file
              );
          }

          const payload = {
            name:
              $('tmName')
                .value
                .trim(),

            role:
              $('tmRole')
                .value
                .trim() || null,

            bio:
              $('tmBio')
                .value
                .trim() || null,

            image_url:
              image,

            instagram_url:
              $('tmInstagram')
                .value
                .trim() || null,

            display_order:
              Number(
                $('tmOrder').value
              ) || 0,

            active:
              $('tmActive')
                .checked
          };

          const query =
            row?.id

              ? sb
                  .from('team')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('team')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Team member saved.'
          );

          await loadTeam();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadTestimonials() {

    const {
      data,
      error
    } = await sb
      .from('testimonials')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderCrudTable(
      'Testimonials',
      data || [],
      [
        'Customer',
        'Rating',
        'Service',
        'Visible'
      ],
      row => `
        <td>
          ${esc(
            row.customer_name
          )}
        </td>

        <td>
          ${esc(
            row.rating ?? '—'
          )}
        </td>

        <td>
          ${esc(
            row.service || '—'
          )}
        </td>

        <td>
          ${
            row.visible
              ? 'Yes'
              : 'No'
          }
        </td>
      `,
      () => showTestimonialForm(),
      row =>
        showTestimonialForm(row),
      'testimonials'
    );
  }

  function showTestimonialForm(
    row = null
  ) {

    const form =
      basicForm(
        'testimonialsFormArea',

        `
          <label>
            Customer name
            <input
              id="tsName"
              required
              value="${esc(
                row?.customer_name ||
                ''
              )}"
            >
          </label>

          <label>
            Testimonial
            <textarea
              id="tsText"
              required
            >${esc(
              row?.testimonial ||
              ''
            )}</textarea>
          </label>

          <label>
            Rating
            <input
              id="tsRating"
              type="number"
              min="1"
              max="5"
              value="${row?.rating ?? ''}"
            >
          </label>

          <label>
            Service
            <input
              id="tsService"
              value="${esc(
                row?.service ||
                ''
              )}"
            >
          </label>

          <label>
            Photo
            <input
              id="tsFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >
          </label>

          <label>
            <input
              id="tsFeatured"
              type="checkbox"
              ${
                row?.featured
                  ? 'checked'
                  : ''
              }
            >
            Featured
          </label>

          <label>
            <input
              id="tsVisible"
              type="checkbox"
              ${
                row?.visible !== false
                  ? 'checked'
                  : ''
              }
            >
            Visible
          </label>
        `,

        'Save Testimonial'
      );

    form.onsubmit =
      async event => {

        event.preventDefault();

        try {

          let image =
            row?.image_url ||
            null;

          const file =
            $('tsFile')
              .files[0];

          if (file) {
            image =
              await uploadImage(
                'customer-gallery',
                file
              );
          }

          const ratingValue =
            $('tsRating')
              .value;

          const payload = {
            customer_name:
              $('tsName')
                .value
                .trim(),

            testimonial:
              $('tsText')
                .value
                .trim(),

            rating:
              ratingValue === ''
                ? null
                : Number(
                    ratingValue
                  ),

            service:
              $('tsService')
                .value
                .trim() || null,

            image_url:
              image,

            featured:
              $('tsFeatured')
                .checked,

            visible:
              $('tsVisible')
                .checked
          };

          const query =
            row?.id

              ? sb
                  .from('testimonials')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('testimonials')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'Testimonial saved.'
          );

          await loadTestimonials();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  function basicForm(
    id,
    html,
    buttonText
  ) {

    let area = $(id);

    if (!area) {

      area =
        document.createElement(
          'div'
        );

      area.id = id;

      els.moduleContent.prepend(
        area
      );
    }

    area.innerHTML = `
      <div
        class="admin-form-card"
        style="
          padding:18px;
          border:1px solid #e8e1d8;
          border-radius:14px;
          margin:16px 0
        "
      >

        <form id="genericForm">

          ${html}

          <div
            style="margin-top:12px"
          >

            <button
              class="primary-btn"
              type="submit"
            >
              ${esc(buttonText)}
            </button>

            <button
              class="secondary-btn"
              type="button"
              id="cancelGeneric"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    `;

    $('cancelGeneric').onclick =
      () => {
        area.innerHTML = '';
      };

    return $('genericForm');
  }

  function renderCrudTable(
    title,
    rows,
    heads,
    cells,
    onNew,
    onEdit,
    table
  ) {

    const singular =
      title.replace(/s$/, '');

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <button
          class="primary-btn"
          id="newGeneric"
        >
          + Add ${esc(singular)}
        </button>

        <div
          id="${table}FormArea"
        ></div>

        <div
          class="admin-table-wrap"
          style="
            overflow:auto;
            margin-top:16px
          "
        >

          <table
            class="admin-table"
            style="
              min-width:700px;
              width:100%
            "
          >

            <thead>

              <tr>

                ${
                  heads
                    .map(
                      h =>
                        `<th>${esc(h)}</th>`
                    )
                    .join('')
                }

                <th></th>

              </tr>

            </thead>

            <tbody>

              ${
                rows.length

                  ? rows.map(row => `
                    <tr>

                      ${cells(row)}

                      <td>

                        <button
                          class="secondary-btn"
                          data-edit-generic="${esc(row.id)}"
                        >
                          Edit
                        </button>

                        <button
                          class="delete-btn"
                          data-delete-table="${esc(table)}"
                          data-delete-id="${esc(row.id)}"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  `).join('')

                  : `
                    <tr>

                      <td
                        colspan="${
                          heads.length + 1
                        }"
                        style="
                          text-align:center;
                          padding:30px
                        "
                      >
                        No ${
                          esc(
                            title.toLowerCase()
                          )
                        } yet.
                      </td>

                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>
    `;

    $('newGeneric').onclick =
      onNew;

    els.moduleContent
      .querySelectorAll(
        '[data-edit-generic]'
      )
      .forEach(button => {

        button.onclick = () => {

          const row =
            rows.find(
              item =>
                item.id ===
                button.dataset
                  .editGeneric
            );

          onEdit(row);
        };

      });
  }

  async function loadFaqs() {

    const {
      data,
      error
    } = await sb
      .from('faqs')
      .select('*')
      .order(
        'display_order',
        { ascending: true }
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (error) throw error;

    renderCrudTable(
      'FAQs',
      data || [],
      [
        'Question',
        'Active'
      ],
      row => `
        <td>
          ${esc(row.question)}
        </td>

        <td>
          ${
            row.active
              ? 'Yes'
              : 'No'
          }
        </td>
      `,
      () => showFaqForm(),
      row => showFaqForm(row),
      'faqs'
    );
  }

  function showFaqForm(row = null) {

    const form =
      basicForm(
        'faqsFormArea',

        `
          <label>
            Question
            <input
              id="fqQuestion"
              required
              value="${esc(
                row?.question ||
                ''
              )}"
            >
          </label>

          <label>
            Answer
            <textarea
              id="fqAnswer"
              required
            >${esc(
              row?.answer ||
              ''
            )}</textarea>
          </label>

          <label>
            Display order
            <input
              id="fqOrder"
              type="number"
              value="${row?.display_order ?? 0}"
            >
          </label>

          <label>
            <input
              id="fqActive"
              type="checkbox"
              ${
                row?.active !== false
                  ? 'checked'
                  : ''
              }
            >
            Active
          </label>
        `,

        'Save FAQ'
      );

    form.onsubmit =
      async event => {

        event.preventDefault();

        try {

          const payload = {
            question:
              $('fqQuestion')
                .value
                .trim(),

            answer:
              $('fqAnswer')
                .value
                .trim(),

            display_order:
              Number(
                $('fqOrder').value
              ) || 0,

            active:
              $('fqActive')
                .checked
          };

          const query =
            row?.id

              ? sb
                  .from('faqs')
                  .update(payload)
                  .eq('id', row.id)

              : sb
                  .from('faqs')
                  .insert(payload);

          const {
            error
          } = await query;

          if (error) throw error;

          toast(
            'FAQ saved successfully.'
          );

          await loadFaqs();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }

      };
  }

  async function loadSettings() {

    const {
      data,
      error
    } = await sb
      .from('settings')
      .select('*')
      .order(
        'setting_key',
        { ascending: true }
      );

    if (error) throw error;

    const map =
      Object.fromEntries(
        (data || []).map(row => [
          row.setting_key,
          row.setting_value
        ])
      );

    const keys = [
      'business_name',
      'artist_name',
      'phone',
      'whatsapp',
      'email',
      'address'
    ];

    els.moduleContent.innerHTML = `
      <div class="admin-module">

        <form id="settingsForm">

          <div
            class="form-grid"
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(250px,1fr)
                );
              gap:12px
            "
          >

            ${
              keys.map(key => `
                <label>
                  ${esc(
                    key
                      .replace(
                        /_/g,
                        ' '
                      )
                      .replace(
                        /\b\w/g,
                        m =>
                          m.toUpperCase()
                      )
                  )}

                  <input
                    id="set_${key}"
                    value="${esc(
                      map[key] || ''
                    )}"
                  >

                </label>
              `).join('')
            }

          </div>

          <button
            class="primary-btn"
            type="submit"
          >
            Save Settings
          </button>

        </form>

        <p
          style="
            margin-top:16px;
            color:#666
          "
        >
          Settings use the existing
          <code>setting_key</code> /
          <code>setting_value</code>
          columns.
        </p>

      </div>
    `;

    $('settingsForm').onsubmit =
      async event => {

        event.preventDefault();

        try {

          for (const key of keys) {

            const value =
              $(`set_${key}`)
                .value
                .trim();

            const {
              data: existing,
              error: findError
            } = await sb
              .from('settings')
              .select('id')
              .eq(
                'setting_key',
                key
              )
              .maybeSingle();

            if (findError) {
              throw findError;
            }

            if (existing?.id) {

              const {
                error
              } = await sb
                .from('settings')
                .update({
                  setting_value: value
                })
                .eq(
                  'id',
                  existing.id
                );

              if (error) {
                throw error;
              }

            } else {

              const {
                error
              } = await sb
                .from('settings')
                .insert({
                  setting_key: key,
                  setting_value: value
                });

              if (error) {
                throw error;
              }
            }
          }

          toast(
            'Settings saved successfully.'
          );

          await loadSettings();

        } catch (error) {

          toast(
            error.message,
            'error'
          );

        }
      };
  }

  document.addEventListener(
    'click',
    event => {

      const nav =
        event.target.closest(
          '[data-module]'
        );

      if (nav) {

        event.preventDefault();

        document
          .querySelectorAll(
            '.nav-btn'
          )
          .forEach(item =>
            item.classList.remove(
              'active'
            )
          );

        nav.classList.add('active');

        openModule(
          nav.dataset.module
        );

        return;
      }

      const open =
        event.target.closest(
          '[data-open-module]'
        );

      if (open) {
        openModule(
          open.dataset.openModule
        );

        return;
      }

      const retry =
        event.target.closest(
          '[data-retry]'
        );

      if (retry) {

        openModule(
          retry.dataset.retry
        );

        return;
      }

      const del =
        event.target.closest(
          '[data-delete-table][data-delete-id]'
        );

      if (del) {

        if (
          !confirm(
            'Delete this item?'
          )
        ) {
          return;
        }

        sb
          .from(
            del.dataset.deleteTable
          )
          .delete()
          .eq(
            'id',
            del.dataset.deleteId
          )
          .then(
            ({
              error
            }) => {

              if (error) {
                throw error;
              }

              toast(
                'Deleted successfully.'
              );

              return openModule(
                currentModule
              );

            }
          )
          .catch(
            error => {
              toast(
                error.message,
                'error'
              );
            }
          );
      }
    }
  );

  els.loginForm?.addEventListener(
    'submit',
    handleLogin
  );

  els.logoutBtn?.addEventListener(
    'click',
    handleLogout
  );

  if (!sb) {

    console.error(
      'supabaseClient is missing.'
    );

    showLogin();

    setLoginMessage(
      'Supabase is not connected. Check supabase-config.js.',
      true
    );

  } else {

    sb.auth.onAuthStateChange(
      (_event, session) => {

        currentUser =
          session?.user ||
          null;

        if (currentUser) {
          showAdmin();
        } else {
          showLogin();
        }

      }
    );

    checkAuth();
  }

})();
