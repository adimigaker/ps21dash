// =============================================
// DASHBOARD ADMIN.JS - SUPABASE VERSION (FINAL)
// =============================================

var allFilms = [];
var filteredFilms = [];
var currentPage = 1;
var perPage = 20;

// =============================================
// UTILITY FUNCTIONS
// =============================================

function getParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function parseGenres(str) {
    if (!str) return [];
    return str.split(',').map(function(g) { return g.trim(); }).filter(Boolean);
}

function showToast(msg, type) {
    type = type || 'info';
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setVal(id, value) {
    var el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
}

// =============================================
// UPDATED_AT HELPER FUNCTIONS
// =============================================

function setUpdatedAtNow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    const input = document.getElementById('film-updated_at');
    if (input) input.value = datetimeLocal;
    showToast('Waktu diatur ke sekarang', 'info');
}

function formatUpdatedAtForDB(datetimeLocal) {
    if (!datetimeLocal) return null;
    const [date, time] = datetimeLocal.split('T');
    return `${date} ${time}:00`;
}

function formatUpdatedAtForInput(isoString) {
    if (!isoString) return '';
    // Format dari Supabase: "2026-06-08 13:07:13.9694+07"
    var cleaned = isoString.replace('T', ' ');
    var datePart = cleaned.substring(0, 10);
    var timePart = cleaned.substring(11, 16);
    return datePart + 'T' + timePart;
}

// =============================================
// DASHBOARD TABLE FUNCTIONS
// =============================================

async function loadDashboard() {
    var tableBody = document.getElementById('table-body');
    if (!tableBody) {
        console.error('table-body not found');
        return;
    }
    tableBody.innerHTML = '<td><td colspan="4" class="table-loading">Memuat data...</td></tr>';
    try {
        if (typeof DASHBOARD_API === 'undefined') {
            throw new Error('DASHBOARD_API tidak terdefinisi - cek api.js');
        }
        var res = await DASHBOARD_API.getAll();
        if (res.status !== 'success') {
            tableBody.innerHTML = '<tr><td colspan="4" class="table-loading">❌ ' + (res.message || 'Gagal') + '</td></tr>';
            return;
        }
        allFilms = res.data || [];
        filteredFilms = allFilms.slice();
        updateStats();
        populateGenreFilter();
        renderTable();
        renderPagination();
        if (allFilms.length > 0) showToast(allFilms.length + ' film dimuat', 'success');
    } catch (error) {
        console.error('loadDashboard error:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="table-loading">❌ ' + error.message + '</td></tr>';
    }
}

function updateStats() {
    var total = allFilms.length;
    var movies = 0, series = 0;
    for (var i = 0; i < allFilms.length; i++) {
        if (allFilms[i].type === 'movie') movies++;
        else if (allFilms[i].type === 'series') series++;
    }
    var elTotal = document.getElementById('stat-total');
    var elMovies = document.getElementById('stat-movies');
    var elSeries = document.getElementById('stat-series');
    if (elTotal) elTotal.textContent = total;
    if (elMovies) elMovies.textContent = movies;
    if (elSeries) elSeries.textContent = series;
}

function populateGenreFilter() {
    var select = document.getElementById('filter-genre');
    if (!select) return;
    var genres = {};
    for (var i = 0; i < allFilms.length; i++) {
        var fg = parseGenres(allFilms[i].genre);
        for (var j = 0; j < fg.length; j++) genres[fg[j]] = true;
    }
    select.innerHTML = '<option value="all">Semua Genre</option>';
    var keys = Object.keys(genres).sort();
    for (var k = 0; k < keys.length; k++) {
        select.innerHTML += '<option value="' + keys[k] + '">' + keys[k] + '</option>';
    }
}

function filterFilms() {
    var search = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    var type = document.getElementById('filter-type')?.value || 'all';
    var genre = document.getElementById('filter-genre')?.value || 'all';
    filteredFilms = [];
    for (var i = 0; i < allFilms.length; i++) {
        var film = allFilms[i];
        var matchSearch = !search || (film.title && film.title.toLowerCase().indexOf(search) !== -1) || (film.id && film.id.toLowerCase().indexOf(search) !== -1);
        var matchType = type === 'all' || film.type === type;
        var matchGenre = true;
        if (genre !== 'all') {
            matchGenre = false;
            var fg = parseGenres(film.genre);
            for (var j = 0; j < fg.length; j++) {
                if (fg[j].toLowerCase() === genre.toLowerCase()) { matchGenre = true; break; }
            }
        }
        if (matchSearch && matchType && matchGenre) filteredFilms.push(film);
    }
    currentPage = 1;
    renderTable();
    renderPagination();
}

function renderTable() {
    var tbody = document.getElementById('table-body');
    if (!tbody) return;
    if (filteredFilms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-loading">Tidak ada film</td></tr>';
        return;
    }
    var start = (currentPage - 1) * perPage;
    var end = Math.min(start + perPage, filteredFilms.length);
    var pageFilms = filteredFilms.slice(start, end);
    var html = '';
    for (var i = 0; i < pageFilms.length; i++) {
        var film = pageFilms[i];
        var genres = parseGenres(film.genre);
        var isDraft = film.status === 'draft';
        var isFeatured = film.featured === 'TRUE';
        var isPopular = film.popular === 'TRUE';
        var editUrl = 'editor.html?id=' + encodeURIComponent(film.id);

        html += '<tr>';
        html += '<td style="width:28px;text-align:center;color:var(--admin-text3);font-size:0.75rem;">' + (start + i + 1) + '</td>';
        
        // COVER - bisa diklik ke editor
        html += '<td style="width:54px;">';
        html += '<a href="' + editUrl + '" class="cover-wrap" style="display:block;text-decoration:none;">';
        if (film.poster) {
            html += '<img src="' + film.poster + '" class="table-poster" loading="lazy" onerror="this.style.opacity=0.2">';
        } else {
            html += '<div class="table-poster no-poster">—</div>';
        }
        html += '<div class="cover-badges">';
        if (isFeatured) html += '<span class="cover-badge-icon featured" title="Featured"><svg width="11" height="11" viewBox="0 0 24 24" fill="#f1c40f" stroke="#f1c40f" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>';
        if (isPopular) html += '<span class="cover-badge-icon popular" title="Popular"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>';
        html += '</div>';
        html += '<span class="cover-type ' + (film.type || 'movie') + '">' + (film.type === 'series' ? 'S' : 'M') + '</span>';
        html += '</a>';
        html += '</td>';
        
        // JUDUL & INFO - bisa diklik ke editor
        html += '<td>';
        html += '<a href="' + editUrl + '" class="table-title-link" style="text-decoration:none; color:inherit; display:block;">';
        html += '<div class="table-title">' + (film.title || '—');
        if (isDraft) html += ' <span class="draft-badge">DRAFT</span>';
        html += '</div>';
        html += '<div class="table-meta">';
        html += '<span>' + (film.year || '—') + '</span>';
        if (film.rating) html += '<span>&#9733; ' + film.rating + '</span>';
        if (genres.length > 0) html += '<span>' + genres.slice(0,2).join(', ') + (genres.length > 2 ? '...' : '') + '</span>';
        html += '</div>';
        html += '<div style="font-size:0.68rem;color:var(--admin-text3);margin-top:2px;">' + (film.id || '') + '</div>';
        html += '</a>';
        html += '</td>';
        
        // TOMBOL AKSI (Edit & Hapus)
        html += '<td style="width:76px;">';
        html += '<div class="table-actions">';
        html += '<a href="' + editUrl + '" class="admin-btn admin-btn-sm admin-btn-secondary" title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></a>';
        html += '<button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteFilmById(\'' + film.id.replace(/'/g, "\\'") + '\')" title="Hapus"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>';
        html += '</div>';
        html += '</td>';
        
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function renderPagination() {
    var container = document.getElementById('pagination');
    if (!container) return;
    var totalPages = Math.ceil(filteredFilms.length / perPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    var html = '';
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    container.innerHTML = html;
}

function goToPage(page) { currentPage = page; renderTable(); renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function deleteFilmById(id) {
    if (!confirm('Yakin hapus "' + id + '"?')) return;
    try {
        var res = await DASHBOARD_API.delete(id);
        if (res.status === 'success') { showToast('Dihapus!', 'success'); loadDashboard(); }
        else showToast('' + (res.message || 'Gagal'), 'error');
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
}

function setupFilters() {
    var si = document.getElementById('search-input');
    var ft = document.getElementById('filter-type');
    var fg = document.getElementById('filter-genre');
    if (si) si.addEventListener('input', filterFilms);
    if (ft) ft.addEventListener('change', filterFilms);
    if (fg) fg.addEventListener('change', filterFilms);
}

// =============================================
// PREVIEW FUNCTIONS
// =============================================

function setupPreview(inputId, previewId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    if (!input || !preview) return;
    if (input.value.trim()) showPreview(preview, input.value.trim());
    input.addEventListener('input', function() { showPreview(preview, this.value.trim()); });
}

function showPreview(preview, url) {
    if (url) {
        preview.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:200px;object-fit:contain;" onerror="this.onerror=null;this.parentElement.innerHTML=\'<span class=preview-placeholder>Gambar tidak ditemukan</span>\'">';
    } else {
        preview.innerHTML = '<span class="preview-placeholder">Preview akan muncul di sini</span>';
    }
}

// =============================================
// EPISODE MANAGEMENT (SERIES) - FINAL VERSION
// =============================================

var episodeCount = 0;

function createEpisodeElement(data) {
    var div = document.createElement('div');
    div.className = 'episode-item';
    div.dataset.ep = data.ep;
    div.innerHTML = [
        '<div class="episode-item-header">',
        '  <div class="episode-num-area" data-editing="false">',
        '    <span class="episode-num-text">Episode ' + data.ep + '</span>',
        '    <button type="button" class="episode-edit-btn" onclick="editEpisodeNumber(this)">',
        '      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        '    </button>',
        '  </div>',
        '  <div class="episode-action-btns">',
        '    <button type="button" class="episode-action-btn add-below" onclick="addEpisodeBelow(this)" title="Tambah episode di bawah">',
        '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>',
        '    </button>',
        '    <button type="button" class="episode-action-btn insert-above" onclick="insertEpisodeAbove(this)" title="Sisipkan episode di atas">',
        '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
        '    </button>',
        '    <button type="button" class="episode-action-btn delete" onclick="removeEpisode(this)" title="Hapus episode">',
        '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        '    </button>',
        '  </div>',
        '</div>',
        '<div class="episode-fields">',
        '  <div><label>URL Embed</label><input type="text" class="ep-embed" placeholder="https://doodstream.com/e/..." value="' + escapeAttr(data.embed) + '"></div>',
        '  <div><label>URL Download</label><input type="text" class="ep-download" placeholder="https://..." value="' + escapeAttr(data.download) + '"></div>',
        '  <div><label>URL Mirror</label><input type="text" class="ep-mirror" placeholder="https://..." value="' + escapeAttr(data.mirror) + '"></div>',
        '  <div><label>URL Subtitle</label><input type="text" class="ep-subtitle" placeholder="https://..." value="' + escapeAttr(data.subtitle) + '"></div>',
        '</div>'
    ].join('');
    return div;
}

// =============================================
// EPISODE MANAGEMENT - FIXED VERSION
// =============================================

// Tambah episode di BAWAH
function addEpisodeBelow(btn) {
    var episodeItem = btn.closest('.episode-item');
    var container = document.getElementById('episode-list');
    var currentNum = parseInt(episodeItem.dataset.ep);
    var newNum = currentNum + 1;

    var nextItem = episodeItem.nextSibling;
    var nextEpisodeData = null;

    if (nextItem) {
        nextEpisodeData = {
            ep: newNum,
            embed: nextItem.querySelector('.ep-embed')?.value || '',
            download: nextItem.querySelector('.ep-download')?.value || '',
            mirror: nextItem.querySelector('.ep-mirror')?.value || '',
            subtitle: nextItem.querySelector('.ep-subtitle')?.value || ''
        };
    } else {
        nextEpisodeData = {
            ep: newNum,
            embed: '',
            download: '',
            mirror: '',
            subtitle: ''
        };
    }

    var newDiv = createEpisodeElement(nextEpisodeData);

    if (nextItem) {
        container.insertBefore(newDiv, nextItem);
    } else {
        container.appendChild(newDiv);
    }

    episodeCount = document.querySelectorAll('.episode-item').length;

    setTimeout(function() {
        newDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newDiv.style.transition = 'background 0.3s';
        newDiv.style.background = '#2a2a3a';
        setTimeout(function() {
            newDiv.style.background = '';
        }, 800);
    }, 50);
}

// Sisipkan episode di ATAS
function insertEpisodeAbove(btn) {
    var episodeItem = btn.closest('.episode-item');
    var container = document.getElementById('episode-list');
    var currentNum = parseInt(episodeItem.dataset.ep);
    var newNum = currentNum - 1;

    if (newNum < 1) {
        showToast('Nomor episode minimal 1', 'error');
        return;
    }

    var prevItem = episodeItem.previousSibling;
    var prevEpisodeData = null;

    if (prevItem) {
        prevEpisodeData = {
            ep: newNum,
            embed: prevItem.querySelector('.ep-embed')?.value || '',
            download: prevItem.querySelector('.ep-download')?.value || '',
            mirror: prevItem.querySelector('.ep-mirror')?.value || '',
            subtitle: prevItem.querySelector('.ep-subtitle')?.value || ''
        };
    } else {
        prevEpisodeData = {
            ep: newNum,
            embed: '',
            download: '',
            mirror: '',
            subtitle: ''
        };
    }

    var newDiv = createEpisodeElement(prevEpisodeData);
    container.insertBefore(newDiv, episodeItem);

    episodeCount = document.querySelectorAll('.episode-item').length;

    setTimeout(function() {
        newDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newDiv.style.transition = 'background 0.3s';
        newDiv.style.background = '#2a2a3a';
        setTimeout(function() {
            newDiv.style.background = '';
        }, 800);
    }, 50);
}

// Tambah episode global (di akhir)
function addEpisodeToEnd() {
    var container = document.getElementById('episode-list');
    if (!container) return;

    var items = document.querySelectorAll('.episode-item');
    var lastNum = 0;
    for (var i = 0; i < items.length; i++) {
        var num = parseInt(items[i].dataset.ep);
        if (!isNaN(num) && num > lastNum) lastNum = num;
    }
    var newNum = lastNum + 1;

    var episodeData = {
        ep: newNum,
        embed: '',
        download: '',
        mirror: '',
        subtitle: ''
    };

    var newDiv = createEpisodeElement(episodeData);
    container.appendChild(newDiv);

    episodeCount = items.length + 1;

    setTimeout(function() {
        newDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newDiv.style.transition = 'background 0.3s';
        newDiv.style.background = '#2a2a3a';
        setTimeout(function() {
            newDiv.style.background = '';
        }, 800);
    }, 50);
}

function updateEpisodeNumberDisplay(item, newNum) {
    var numArea = item.querySelector('.episode-num-area');
    if (numArea && numArea.dataset.editing !== 'true') {
        var textSpan = numArea.querySelector('.episode-num-text');
        if (textSpan) textSpan.textContent = 'Episode ' + newNum;
    } else if (numArea && numArea.dataset.editing === 'true') {
        var input = numArea.querySelector('input');
        if (input) input.value = newNum;
    }
}

function removeEpisode(btn) {
    var item = btn.closest('.episode-item');
    var nextItem = item.nextSibling;
    var prevItem = item.previousSibling;
    var scrollTarget = nextItem || prevItem || null;
    item.remove();

    episodeCount = document.querySelectorAll('.episode-item').length;

    if (scrollTarget) {
        setTimeout(function() {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            scrollTarget.style.transition = 'background 0.3s';
            scrollTarget.style.background = '#2a2a3a';
            setTimeout(function() {
                if (scrollTarget) scrollTarget.style.background = '';
            }, 800);
  