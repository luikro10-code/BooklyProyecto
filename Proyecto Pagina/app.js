(() => {
  "use strict";

  const STORAGE_KEY = "bookly-demo-v1";
  const today = new Date();
  const localDate = (date) => {
    const d = date instanceof Date ? date : new Date(`${date}T12:00:00`);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const shiftDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localDate(d);
  };
  const isoToday = localDate(today);
  const dateAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return localDate(d);
  };
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const initialData = () => ({
    books: [
      { id: id(), title: "Cien años de soledad", author: "Gabriel García Márquez", isbn: "9780307474728", publisher: "Sudamericana", year: 1967, genre: "Novela", copies: 4 },
      { id: id(), title: "El principito", author: "Antoine de Saint-Exupéry", isbn: "9780156012195", publisher: "Salamandra", year: 1943, genre: "Ficción", copies: 3 },
      { id: id(), title: "Rayuela", author: "Julio Cortázar", isbn: "9788437604572", publisher: "Cátedra", year: 1963, genre: "Novela", copies: 2 },
      { id: id(), title: "Hábitos atómicos", author: "James Clear", isbn: "9780735211292", publisher: "Paidós", year: 2018, genre: "Desarrollo personal", copies: 3 },
      { id: id(), title: "La sombra del viento", author: "Carlos Ruiz Zafón", isbn: "9788408079545", publisher: "Planeta", year: 2001, genre: "Misterio", copies: 2 },
      { id: id(), title: "Sapiens", author: "Yuval Noah Harari", isbn: "9788499924217", publisher: "Debate", year: 2011, genre: "Historia", copies: 2 }
    ],
    members: [
      { id: id(), firstName: "Lucía", lastName: "Fernández", dni: "38124567", phone: "11 4567-8901", email: "lucia.fernandez@email.com", joined: dateAgo(110) },
      { id: id(), firstName: "Mateo", lastName: "González", dni: "40231876", phone: "11 5234-6789", email: "mateo.gonzalez@email.com", joined: dateAgo(82) },
      { id: id(), firstName: "Sofía", lastName: "Martínez", dni: "36789123", phone: "11 4789-1234", email: "sofia.martinez@email.com", joined: dateAgo(53) },
      { id: id(), firstName: "Tomás", lastName: "Rodríguez", dni: "41567234", phone: "11 6123-4567", email: "tomas.rodriguez@email.com", joined: dateAgo(25) }
    ],
    loans: []
  });
  let state;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state = saved ? JSON.parse(saved) : initialData();
    if (!state || !Array.isArray(state.books) || !Array.isArray(state.members) || !Array.isArray(state.loans)) throw new Error("Estructura de datos no válida.");
    if (!saved) {
      const books = state.books;
      const members = state.members;
      state.loans = [
        { id: id(), bookId: books[0].id, memberId: members[0].id, loanDate: dateAgo(3), dueDate: shiftDate(11), returnedAt: null },
        { id: id(), bookId: books[1].id, memberId: members[1].id, loanDate: dateAgo(18), dueDate: dateAgo(4), returnedAt: null },
        { id: id(), bookId: books[3].id, memberId: members[2].id, loanDate: dateAgo(2), dueDate: shiftDate(12), returnedAt: null },
        { id: id(), bookId: books[2].id, memberId: members[3].id, loanDate: dateAgo(22), dueDate: dateAgo(8), returnedAt: dateAgo(7) },
        { id: id(), bookId: books[4].id, memberId: members[0].id, loanDate: dateAgo(30), dueDate: dateAgo(16), returnedAt: dateAgo(15) }
      ];
      persist();
    }
  } catch (error) {
    console.error("No se pudieron cargar los datos de Bookly:", error);
    state = initialData();
    toast("No se pudieron leer los datos guardados. Se inició una nueva demostración.", "error");
  }

  const pages = ["inicio", "libros", "socios", "prestamos", "reportes"];
  const pageTitles = { inicio: "Inicio", libros: "Libros", socios: "Socios", prestamos: "Préstamos", reportes: "Reportes" };
  const byId = (list, itemId) => list.find((item) => item.id === itemId);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const formatDate = (date) => date ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`)) : "—";
  const normalize = (value) => String(value || "").trim().toLocaleLowerCase("es");
  const activeLoans = () => state.loans.filter((loan) => !loan.returnedAt);
  const isOverdue = (loan) => !loan.returnedAt && loan.dueDate < isoToday;
  const availability = (book) => book.copies - activeLoans().filter((loan) => loan.bookId === book.id).length;
  const save = (successMessage) => {
    try {
      persist();
      renderCurrent();
      if (successMessage) toast(successMessage, "success");
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los datos de Bookly:", error);
      toast("No se pudieron guardar los cambios en este navegador.", "error");
      return false;
    }
  };
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function toast(message, type = "success") {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3600);
  }
  const iconSearch = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
  const heading = (eyebrow, title, description, action = "") => `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
  const addButton = (label, action) => `<button class="btn btn-primary" data-action="${action}"><span aria-hidden="true">＋</span>${label}</button>`;
  const searchToolbar = (title, placeholder) => `<div class="table-toolbar"><strong>${title}</strong><div class="toolbar-right"><label class="search-wrap">${iconSearch}<input class="search-input" id="table-search" type="search" placeholder="${placeholder}" aria-label="${placeholder}"></label></div></div>`;
  const emptyRow = (columns, message) => `<tr><td colspan="${columns}"><div class="empty-state"><strong>${message}</strong>Probá con otra búsqueda o agregá un nuevo registro.</div></td></tr>`;
  const bookName = (bookId) => byId(state.books, bookId)?.title || "Libro eliminado";
  const memberName = (memberId) => {
    const member = byId(state.members, memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Socio eliminado";
  };

  function renderDashboard() {
    const open = activeLoans();
    const active = open.filter((loan) => !isOverdue(loan));
    const overdue = open.filter(isOverdue);
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - index));
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { label: monthNames[d.getMonth()], count: state.loans.filter((loan) => loan.loanDate.startsWith(monthKey)).length };
    });
    const max = Math.max(1, ...monthly.map((month) => month.count));
    const popular = state.books.map((book) => ({ book, count: state.loans.filter((loan) => loan.bookId === book.id).length })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
    const recent = [...state.loans].sort((a, b) => b.loanDate.localeCompare(a.loanDate)).slice(0, 5);
    const stats = [
      ["Libros registrados", state.books.length, "Títulos en el catálogo", "purple", '<svg viewBox="0 0 24 24"><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3H20v15H6.8A2.8 2.8 0 0 0 4 20.8V5.8Z"/><path d="M4 6v15m4-14h8"/></svg>'],
      ["Socios registrados", state.members.length, "Personas en el padrón", "green", '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>'],
      ["Préstamos activos", active.length, "Libros actualmente prestados", "orange", '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M16 3h5v5m-10 6L21 4"/></svg>'],
      ["Préstamos vencidos", overdue.length, overdue.length ? "Requieren seguimiento" : "Todo al día", "red", '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>']
    ];
    document.getElementById("page-inicio").innerHTML = `
      ${heading("RESUMEN GENERAL", "¡Buen día! 👋", "Este es el estado actual de tu biblioteca.", addButton("Nuevo préstamo", "new-loan"))}
      <div class="stats-grid">${stats.map(([label, value, note, color, icon]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`).join("")}</div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-heading"><div><h2>Actividad de préstamos</h2><p>Préstamos registrados en los últimos 6 meses</p></div><span class="legend"><i class="legend-dot"></i>Préstamos</span></div><div class="chart" aria-label="Gráfico de préstamos mensuales">${monthly.map((month) => `<div class="chart-column"><div class="chart-bar" title="${month.count} préstamos" style="height:${Math.max(4, month.count / max * 100)}%"></div><span>${month.label}</span></div>`).join("")}</div></section>
        <section class="panel"><div class="panel-heading"><div><h2>Libros más solicitados</h2><p>Según el historial de préstamos</p></div><button class="action-btn" data-page="reportes">Ver reporte →</button></div>
          <div class="popular-list">${popular.length ? popular.map(({ book, count }) => `<div class="popular-item"><div class="book-cover">${escapeHtml(book.title.slice(0, 2).toUpperCase())}</div><div class="popular-info"><strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(book.author)}</small></div><span class="popular-count">${count} ${count === 1 ? "préstamo" : "préstamos"}</span></div>`).join("") : '<div class="empty-state">Todavía no hay préstamos registrados.</div>'}</div></section>
      </div>
      <section class="table-card"><div class="table-toolbar"><strong>Actividad reciente</strong><div class="toolbar-right"><button class="action-btn" data-page="prestamos">Ver todos →</button></div></div>
        <div class="table-scroll"><table><thead><tr><th>Libro</th><th>Socio</th><th>Fecha de préstamo</th><th>Devolución prevista</th><th>Estado</th></tr></thead><tbody>${recent.length ? recent.map((loan) => loanRow(loan, false)).join("") : emptyRow(5, "Sin actividad todavía")}</tbody></table></div></section>`;
  }

  function loanStatus(loan) {
    if (loan.returnedAt) return '<span class="badge badge-gray">Devuelto</span>';
    if (isOverdue(loan)) return '<span class="badge badge-red">Vencido</span>';
    return '<span class="badge badge-green">Activo</span>';
  }
  function loanRow(loan, actions = true) {
    return `<tr><td><span class="cell-main">${escapeHtml(bookName(loan.bookId))}</span></td><td>${escapeHtml(memberName(loan.memberId))}</td><td>${formatDate(loan.loanDate)}</td><td>${formatDate(loan.dueDate)}</td><td>${loanStatus(loan)}</td>${actions ? `<td><div class="table-actions">${!loan.returnedAt ? `<button class="action-btn" data-action="return-loan" data-id="${escapeHtml(loan.id)}">Registrar devolución</button>` : ""}</div></td>` : ""}</tr>`;
  }

  function renderBooks(query = "") {
    const normalizedQuery = normalize(query);
    const books = state.books.filter((book) => [book.title, book.author, book.isbn, book.genre].some((value) => normalize(value).includes(normalizedQuery)));
    const page = document.getElementById("page-libros");
    page.innerHTML = `${heading("CATÁLOGO", "Gestión de libros", "Organizá tu catálogo y consultá la disponibilidad.", addButton("Agregar libro", "new-book"))}
      <div class="table-card">${searchToolbar(`${state.books.length} ${state.books.length === 1 ? "libro registrado" : "libros registrados"}`, "Buscar por título, autor, ISBN o género…")}
        <div class="catalog-grid" id="book-grid">${books.length ? books.map((book) => `<article class="catalog-card"><div class="catalog-top"><div class="catalog-cover">${escapeHtml(book.title.slice(0, 2).toUpperCase())}</div><span class="badge ${availability(book) > 0 ? "badge-green" : "badge-red"}">${availability(book)} disp.</span></div><h3>${escapeHtml(book.title)}</h3><p class="author">${escapeHtml(book.author)}</p><div class="catalog-meta"><span>${escapeHtml(book.genre)} · ${escapeHtml(book.year)}</span><span>${availability(book)}/${book.copies} ejemplares</span></div><div class="catalog-actions"><button class="action-btn" data-action="edit-book" data-id="${escapeHtml(book.id)}">Editar</button><button class="action-btn danger" data-action="delete-book" data-id="${escapeHtml(book.id)}">Eliminar</button></div></article>`).join("") : '<div class="empty-state" style="grid-column:1/-1"><strong>No se encontraron libros</strong>Revisá la búsqueda o agregá un nuevo título.</div>'}</div>
        <div class="table-footer"><span>Mostrando ${books.length} de ${state.books.length} libros</span><span>Disponibilidad actualizada automáticamente</span></div></div>`;
    page.querySelector("#table-search").value = query;
    page.querySelector("#table-search").addEventListener("input", (event) => {
      const value = event.target.value;
      renderBooks(value);
      const input = document.querySelector("#page-libros #table-search");
      input.focus();
      input.setSelectionRange(value.length, value.length);
    });
  }

  function renderMembers(query = "") {
    const normalizedQuery = normalize(query);
    const members = state.members.filter((member) => [member.firstName, member.lastName, member.dni, member.email, member.phone].some((value) => normalize(value).includes(normalizedQuery)));
    const rows = members.map((member) => `<tr><td><span class="cell-main">${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</span><span class="cell-sub">Alta: ${formatDate(member.joined)}</span></td><td>${escapeHtml(member.dni)}</td><td>${escapeHtml(member.phone)}</td><td>${escapeHtml(member.email)}</td><td>${activeLoans().filter((loan) => loan.memberId === member.id).length}</td><td><div class="table-actions"><button class="action-btn" data-action="member-history" data-id="${escapeHtml(member.id)}">Historial</button><button class="action-btn" data-action="edit-member" data-id="${escapeHtml(member.id)}">Editar</button><button class="action-btn danger" data-action="delete-member" data-id="${escapeHtml(member.id)}">Eliminar</button></div></td></tr>`).join("");
    const page = document.getElementById("page-socios");
    page.innerHTML = `${heading("COMUNIDAD", "Gestión de socios", "Administrá los datos de las personas asociadas.", addButton("Nuevo socio", "new-member"))}
      <div class="table-card">${searchToolbar(`${state.members.length} ${state.members.length === 1 ? "socio registrado" : "socios registrados"}`, "Buscar por nombre, DNI, teléfono o correo…")}
        <div class="table-scroll"><table><thead><tr><th>Socio</th><th>DNI</th><th>Teléfono</th><th>Correo electrónico</th><th>Préstamos activos</th><th>Acciones</th></tr></thead><tbody>${rows || emptyRow(6, "No se encontraron socios")}</tbody></table></div>
        <div class="table-footer"><span>Mostrando ${members.length} de ${state.members.length} socios</span><span>Los datos se guardan en este navegador</span></div></div>`;
    page.querySelector("#table-search").value = query;
    page.querySelector("#table-search").addEventListener("input", (event) => {
      const value = event.target.value;
      renderMembers(value);
      const input = document.querySelector("#page-socios #table-search");
      input.focus();
      input.setSelectionRange(value.length, value.length);
    });
  }

  function renderLoans(filter = "todos") {
    const loans = [...state.loans].filter((loan) => {
      if (filter === "activos") return !loan.returnedAt && !isOverdue(loan);
      if (filter === "vencidos") return isOverdue(loan);
      if (filter === "devueltos") return Boolean(loan.returnedAt);
      return true;
    }).sort((a, b) => b.loanDate.localeCompare(a.loanDate));
    const rows = loans.map((loan) => loanRow(loan)).join("");
    const page = document.getElementById("page-prestamos");
    page.innerHTML = `${heading("CIRCULACIÓN", "Gestión de préstamos", "Registrá préstamos, controlá vencimientos y devoluciones.", addButton("Registrar préstamo", "new-loan"))}
      <div class="filter-bar"><label>Estado <select class="filter-select" id="loan-filter"><option value="todos">Todos los préstamos</option><option value="activos">Activos</option><option value="vencidos">Vencidos</option><option value="devueltos">Devueltos</option></select></label><span class="report-summary">${loans.length} resultados</span></div>
      <div class="table-card"><div class="table-scroll"><table><thead><tr><th>Libro</th><th>Socio</th><th>Fecha de préstamo</th><th>Devolución prevista</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${rows || emptyRow(6, "No hay préstamos en esta vista")}</tbody></table></div><div class="table-footer"><span>${activeLoans().length} préstamos sin devolver</span><span>${activeLoans().filter(isOverdue).length} vencidos</span></div></div>`;
    page.querySelector("#loan-filter").value = filter;
    page.querySelector("#loan-filter").addEventListener("change", (event) => renderLoans(event.target.value));
  }

  function renderReports() {
    const page = document.getElementById("page-reportes");
    const bookOptions = state.books.map((book) => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title)}</option>`).join("");
    const memberOptions = state.members.map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</option>`).join("");
    const mostRequestedBook = [...state.books].sort((a, b) => state.loans.filter((loan) => loan.bookId === b.id).length - state.loans.filter((loan) => loan.bookId === a.id).length)[0];
    page.innerHTML = `${heading("ANÁLISIS", "Consultas y reportes", "Filtrá la actividad de circulación y exportá los resultados.")}
      <div class="filter-bar" id="report-filters"><label>Desde <input class="filter-date" type="date" id="report-from"></label><label>Hasta <input class="filter-date" type="date" id="report-to"></label><label>Libro <select class="filter-select" id="report-book"><option value="">Todos</option>${bookOptions}</select></label><label>Socio <select class="filter-select" id="report-member"><option value="">Todos</option>${memberOptions}</select></label><button class="btn btn-light btn-small" id="report-clear">Limpiar filtros</button><button class="btn btn-light btn-small" id="report-csv">↓ Exportar CSV</button><button class="btn btn-light btn-small" id="report-print">Imprimir</button></div>
      <div class="stats-grid">
        <article class="stat-card"><div class="stat-top"><span>Ejemplares disponibles</span><span class="stat-icon green">✓</span></div><div class="stat-value">${state.books.reduce((sum, book) => sum + availability(book), 0)}</div><div class="stat-note">En todo el catálogo</div></article>
        <article class="stat-card"><div class="stat-top"><span>Ejemplares prestados</span><span class="stat-icon orange">↗</span></div><div class="stat-value">${activeLoans().length}</div><div class="stat-note">Préstamos sin devolución</div></article>
        <article class="stat-card"><div class="stat-top"><span>Préstamos históricos</span><span class="stat-icon purple">▤</span></div><div class="stat-value">${state.loans.length}</div><div class="stat-note">Registros de circulación</div></article>
        <article class="stat-card"><div class="stat-top"><span>Libro más solicitado</span><span class="stat-icon red">★</span></div><div class="stat-value" style="font-size:16px;letter-spacing:0">${state.loans.length && mostRequestedBook ? escapeHtml(mostRequestedBook.title) : "—"}</div><div class="stat-note">Según el historial</div></article>
      </div><div class="table-card"><div class="table-toolbar"><strong>Detalle de circulación</strong><span class="report-summary" id="report-count"></span></div><div class="table-scroll"><table><thead><tr><th>Libro</th><th>Socio</th><th>Préstamo</th><th>Devolución prevista</th><th>Devolución real</th><th>Estado</th></tr></thead><tbody id="report-rows"></tbody></table></div></div>`;
    const update = () => {
      const from = page.querySelector("#report-from").value;
      const to = page.querySelector("#report-to").value;
      const book = page.querySelector("#report-book").value;
      const member = page.querySelector("#report-member").value;
      const filtered = [...state.loans].filter((loan) => (!from || loan.loanDate >= from) && (!to || loan.loanDate <= to) && (!book || loan.bookId === book) && (!member || loan.memberId === member)).sort((a,b) => b.loanDate.localeCompare(a.loanDate));
      page.querySelector("#report-rows").innerHTML = filtered.length ? filtered.map((loan) => `<tr><td><span class="cell-main">${escapeHtml(bookName(loan.bookId))}</span></td><td>${escapeHtml(memberName(loan.memberId))}</td><td>${formatDate(loan.loanDate)}</td><td>${formatDate(loan.dueDate)}</td><td>${loan.returnedAt ? formatDate(loan.returnedAt) : "—"}</td><td>${loanStatus(loan)}</td></tr>`).join("") : emptyRow(6, "No hay registros con esos filtros");
      page.querySelector("#report-count").textContent = `${filtered.length} ${filtered.length === 1 ? "registro" : "registros"}`;
      return filtered;
    };
    ["#report-from", "#report-to", "#report-book", "#report-member"].forEach((selector) => page.querySelector(selector).addEventListener("change", update));
    page.querySelector("#report-clear").addEventListener("click", () => {
      page.querySelector("#report-from").value = "";
      page.querySelector("#report-to").value = "";
      page.querySelector("#report-book").value = "";
      page.querySelector("#report-member").value = "";
      update();
    });
    page.querySelector("#report-csv").addEventListener("click", () => exportCsv(update()));
    page.querySelector("#report-print").addEventListener("click", () => window.print());
    update();
  }

  function exportCsv(loans) {
    const headers = ["Libro", "Socio", "Fecha de préstamo", "Devolución prevista", "Devolución real", "Estado"];
    const rows = loans.map((loan) => [bookName(loan.bookId), memberName(loan.memberId), loan.loanDate, loan.dueDate, loan.returnedAt || "", loan.returnedAt ? "Devuelto" : isOverdue(loan) ? "Vencido" : "Activo"]);
    const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(quote).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookly-reporte-${isoToday}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast("El reporte CSV se descargó correctamente.", "success");
  }

  const commonFields = {
    book: [
      { name: "title", label: "Título", required: true, maxLength: 120 },
      { name: "author", label: "Autor", required: true, maxLength: 100 },
      { name: "isbn", label: "ISBN", required: true, maxLength: 17, help: "Ingresá el ISBN sin guiones o con guiones." },
      { name: "publisher", label: "Editorial", required: true, maxLength: 80 },
      { name: "year", label: "Año de publicación", type: "number", required: true, min: 1000, max: today.getFullYear() },
      { name: "genre", label: "Género", required: true, maxLength: 60 },
      { name: "copies", label: "Cantidad de ejemplares", type: "number", required: true, min: 1, max: 500 }
    ],
    member: [
      { name: "firstName", label: "Nombre", required: true, maxLength: 60 },
      { name: "lastName", label: "Apellido", required: true, maxLength: 60 },
      { name: "dni", label: "DNI", required: true, minLength: 7, maxLength: 12, help: "Solo números, entre 7 y 12 dígitos." },
      { name: "phone", label: "Teléfono", required: true, maxLength: 30 },
      { name: "email", label: "Correo electrónico", type: "email", required: true, maxLength: 120 },
      { name: "joined", label: "Fecha de alta", type: "date", required: true }
    ]
  };
  function fieldMarkup(field, value = "", options = "") {
    const attrs = [
      field.required ? "required" : "",
      field.maxLength ? `maxlength="${field.maxLength}"` : "",
      field.minLength ? `minlength="${field.minLength}"` : "",
      field.min !== undefined ? `min="${field.min}"` : "",
      field.max !== undefined ? `max="${field.max}"` : "",
      field.pattern ? `pattern="${field.pattern}"` : ""
    ].filter(Boolean).join(" ");
    const type = field.type || "text";
    const safeValue = type === "select" ? "" : escapeHtml(value);
    const control = type === "select"
      ? `<select class="form-control" id="field-${field.name}" name="${field.name}" ${attrs}>${options}</select>`
      : `<input class="form-control" id="field-${field.name}" name="${field.name}" type="${type}" value="${safeValue}" ${attrs}>`;
    return `<div class="form-field"><label for="field-${field.name}">${field.label}${field.required ? " *" : ""}</label>${control}${field.help ? `<span class="form-help">${field.help}</span>` : ""}</div>`;
  }
  function openForm(type, existing = null, preset = {}) {
    const dialog = document.getElementById("form-dialog");
    const form = document.getElementById("entity-form");
    const isEdit = Boolean(existing);
    const config = {
      book: { title: isEdit ? "Editar libro" : "Agregar libro", eyebrow: "CATÁLOGO", fields: commonFields.book, data: existing || {} },
      member: { title: isEdit ? "Editar socio" : "Registrar socio", eyebrow: "COMUNIDAD", fields: commonFields.member, data: existing || { joined: isoToday } },
      loan: { title: "Registrar préstamo", eyebrow: "CIRCULACIÓN", fields: [
        { name: "bookId", label: "Libro", type: "select", required: true },
        { name: "memberId", label: "Socio", type: "select", required: true },
        { name: "loanDate", label: "Fecha de préstamo", type: "date", required: true },
        { name: "dueDate", label: "Devolución prevista", type: "date", required: true }
      ], data: { loanDate: isoToday, dueDate: shiftDate(14), ...preset } }
    }[type];
    document.getElementById("modal-title").textContent = config.title;
    document.getElementById("modal-eyebrow").textContent = config.eyebrow;
    form.innerHTML = `<div class="form-grid">${config.fields.map((field) => {
      let options = "";
      if (field.name === "bookId") options = `<option value="">Seleccioná un libro</option>${state.books.map((book) => `<option value="${escapeHtml(book.id)}" ${availability(book) <= 0 ? "disabled" : ""}>${escapeHtml(book.title)} (${availability(book)} disponibles)</option>`).join("")}`;
      if (field.name === "memberId") options = `<option value="">Seleccioná un socio</option>${state.members.map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)} · DNI ${escapeHtml(member.dni)}</option>`).join("")}`;
      return fieldMarkup(field, config.data[field.name] ?? "", options);
    }).join("")}</div><div class="form-actions"><button type="button" class="btn btn-light close-modal">Cancelar</button><button type="submit" class="btn btn-primary">${isEdit ? "Guardar cambios" : "Guardar registro"}</button></div>`;
    if (type === "loan" && (state.books.every((book) => availability(book) <= 0) || !state.members.length)) {
      toast(!state.members.length ? "Registrá al menos un socio antes de crear un préstamo." : "No hay ejemplares disponibles para prestar.", "error");
      return;
    }
    dialog.showModal();
    form.onsubmit = (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const result = submitForm(type, data, existing);
      if (result) {
        dialog.close();
        save(result);
      }
    };
  }

  function submitForm(type, data, existing) {
    if (type === "book") {
      const isbn = data.isbn.replace(/[\s-]/g, "");
      if (!/^[\dXx]{10}(\d{3})?$/.test(isbn)) return toast("El ISBN debe tener 10 o 13 caracteres válidos.", "error");
      if (state.books.some((book) => book.id !== existing?.id && book.isbn.replace(/[\s-]/g, "").toLowerCase() === isbn.toLowerCase())) return toast("Ya existe un libro registrado con ese ISBN.", "error");
      const copies = Number(data.copies);
      const loaned = existing ? activeLoans().filter((loan) => loan.bookId === existing.id).length : 0;
      if (copies < loaned) return toast(`La cantidad no puede ser menor a los ${loaned} ejemplares actualmente prestados.`, "error");
      const book = { ...data, isbn, year: Number(data.year), copies, id: existing?.id || id() };
      if (existing) state.books[state.books.findIndex((item) => item.id === existing.id)] = book;
      else state.books.push(book);
      return existing ? "Libro actualizado correctamente." : "Libro agregado correctamente.";
    }
    if (type === "member") {
      const dni = data.dni.replace(/\D/g, "");
      if (!/^\d{7,12}$/.test(dni)) return toast("El DNI debe contener entre 7 y 12 números.", "error");
      if (state.members.some((member) => member.id !== existing?.id && member.dni.replace(/\D/g, "") === dni)) return toast("Ya existe un socio registrado con ese DNI.", "error");
      if (state.members.some((member) => member.id !== existing?.id && normalize(member.email) === normalize(data.email))) return toast("Ya existe un socio registrado con ese correo electrónico.", "error");
      const member = { ...data, dni, email: data.email.trim(), firstName: data.firstName.trim(), lastName: data.lastName.trim(), id: existing?.id || id() };
      if (existing) state.members[state.members.findIndex((item) => item.id === existing.id)] = member;
      else state.members.push(member);
      return existing ? "Socio actualizado correctamente." : "Socio registrado correctamente.";
    }
    if (type === "loan") {
      const book = byId(state.books, data.bookId);
      if (!book || !byId(state.members, data.memberId)) return toast("Seleccioná un libro y un socio válidos.", "error");
      if (availability(book) <= 0) return toast("No quedan ejemplares disponibles de ese libro.", "error");
      if (data.dueDate < data.loanDate) return toast("La fecha prevista de devolución no puede ser anterior al préstamo.", "error");
      state.loans.push({ ...data, id: id(), returnedAt: null });
      return "Préstamo registrado. La disponibilidad del libro fue actualizada.";
    }
    return "";
  }

  function runAction(action, itemId) {
    if (action === "new-book") return openForm("book");
    if (action === "edit-book") return openForm("book", byId(state.books, itemId));
    if (action === "new-member") return openForm("member");
    if (action === "edit-member") return openForm("member", byId(state.members, itemId));
    if (action === "new-loan") return openForm("loan");
    if (action === "delete-book") {
      const book = byId(state.books, itemId);
      if (state.loans.some((loan) => loan.bookId === itemId)) return toast("No se puede eliminar un libro asociado a un préstamo del historial.", "error");
      if (book && window.confirm(`¿Eliminar "${book.title}" del catálogo?`)) {
        state.books = state.books.filter((item) => item.id !== itemId);
        save("Libro eliminado del catálogo.");
      }
    }
    if (action === "delete-member") {
      const member = byId(state.members, itemId);
      if (state.loans.some((loan) => loan.memberId === itemId)) return toast("No se puede eliminar un socio asociado a un préstamo del historial.", "error");
      if (member && window.confirm(`¿Eliminar al socio ${member.firstName} ${member.lastName}?`)) {
        state.members = state.members.filter((item) => item.id !== itemId);
        save("Socio eliminado correctamente.");
      }
    }
    if (action === "return-loan") {
      const loan = byId(state.loans, itemId);
      if (loan && !loan.returnedAt && window.confirm(`¿Registrar la devolución de "${bookName(loan.bookId)}"?`)) {
        loan.returnedAt = isoToday;
        save("Devolución registrada. El ejemplar ya está disponible.");
      }
    }
    if (action === "member-history") {
      const member = byId(state.members, itemId);
      if (!member) return;
      navigate("reportes");
      const select = document.getElementById("report-member");
      select.value = itemId;
      select.dispatchEvent(new Event("change"));
    }
  }

  function renderCurrent() {
    const activePage = document.querySelector(".page.active")?.id.replace("page-", "") || "inicio";
    if (activePage === "inicio") renderDashboard();
    else if (activePage === "libros") renderBooks(document.getElementById("page-libros").querySelector("#table-search")?.value || "");
    else if (activePage === "socios") renderMembers(document.getElementById("page-socios").querySelector("#table-search")?.value || "");
    else if (activePage === "prestamos") renderLoans(document.getElementById("page-prestamos").querySelector("#loan-filter")?.value || "todos");
    else renderReports();
  }
  function navigate(page) {
    if (!pages.includes(page)) return;
    document.querySelectorAll(".page").forEach((section) => section.classList.toggle("active", section.id === `page-${page}`));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    document.getElementById("breadcrumb-current").textContent = pageTitles[page];
    document.title = `Bookly — ${pageTitles[page]}`;
    renderCurrent();
    document.getElementById("sidebar").classList.remove("open");
    document.querySelector(".menu-overlay")?.remove();
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
  }

  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) return navigate(pageButton.dataset.page);
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) runAction(actionButton.dataset.action, actionButton.dataset.id);
    if (event.target.closest(".close-modal")) document.getElementById("form-dialog").close();
    if (event.target.closest("#menu-toggle")) {
      const sidebar = document.getElementById("sidebar");
      const open = sidebar.classList.toggle("open");
      document.getElementById("menu-toggle").setAttribute("aria-expanded", String(open));
      if (open) {
        const overlay = document.createElement("div");
        overlay.className = "menu-overlay";
        overlay.addEventListener("click", () => navigate(document.querySelector(".nav-item.active")?.dataset.page || "inicio"));
        document.body.append(overlay);
      } else document.querySelector(".menu-overlay")?.remove();
    }
  });
  document.getElementById("quick-add").addEventListener("click", () => openForm("loan"));
  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(today);
  renderDashboard();
})();
