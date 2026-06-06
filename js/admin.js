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
// DASHBOARD TABLE FUNCTIONS
// =============================================

async function loadDashboard() {
    var tableBody = document.getElementById('table-body');
    if (!tableBody) {
        console.error('table-body not found');
        return;
    }
    tableBody.innerHTML = '<tr><td colspan="4" class="table-loading">Memuat data...</td></tr>';
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

        html += '<tr>';
        html += '<td style="width:28px;text-align:center;color:var(--admin-text3);font-size:0.75rem;">' + (start + i + 1) + '</td>';
        html += '<td style="width:54px;">';
        html += '<div class="cover-wrap">';
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
        html += '</div></td>';
        html += '<td>';
        html += '<div class="table-title">' + (film.title || '—');
        if (isDraft) html += ' <span class="draft-badge">DRAFT</span>';
        html += '</div>';
        html += '<div class="table-meta">';
        html += '<span>' + (film.year || '—') + '</span>';
        if (film.rating) html += '<span>&#9733; ' + film.rating + '</span>';
        if (genres.length > 0) html += '<span>' + genres.slice(0,2).join(', ') + (genres.length > 2 ? '...' : '') + '</span>';
        html += '</div>';
        html += '<div style="font-size:0.68rem;color:var(--admin-text3);margin-top:2px;">' + (film.id || '') + '</div>';
        html += '</td>';
        html += '<td style="width:76px;">';
        html += '<div class="table-actions">';
        html += '<a href="editor.html?id=' + encodeURIComponent(film.id) + '" class="admin-btn admin-btn-sm admin-btn-secondary" title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></a>';
        html += '<button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteFilmById(\'' + film.id.replace(/'/g, "\\'") + '\')" title="Hapus"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>';
        html += '</div></td>';
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

// Tambah episode di BAWAH (C+1 = copy dari D, D tetap 4, E tetap 5)
function addEpisodeBelow(btn) {
    var episodeItem = btn.closest('.episode-item');
    var container = document.getElementById('episode-list');
    var currentNum = parseInt(episodeItem.dataset.ep);
    var newNum = currentNum + 1;
    
    // Ambil episode AFTER current (yaitu D) untuk di-copy nilainya
    var nextItem = episodeItem.nextSibling;
    var nextEpisodeData = null;
    
    if (nextItem) {
        // Jika ada episode D, copy nilainya
        nextEpisodeData = {
            ep: newNum,  // nomor baru C+1
            embed: nextItem.querySelector('.ep-embed')?.value || '',
            download: nextItem.querySelector('.ep-download')?.value || '',
            mirror: nextItem.querySelector('.ep-mirror')?.value || '',
            subtitle: nextItem.querySelector('.ep-subtitle')?.value || ''
        };
    } else {
        // Jika tidak ada episode D (berarti ini episode terakhir)
        // Maka episode baru kosong
        nextEpisodeData = {
            ep: newNum,
            embed: '',
            download: '',
            mirror: '',
            subtitle: ''
        };
    }
    
    var newDiv = createEpisodeElement(nextEpisodeData);
    
    // Insert setelah episode saat ini (C)
    if (nextItem) {
        container.insertBefore(newDiv, nextItem);
    } else {
        container.appendChild(newDiv);
    }
    
    // ✅ TIDAK menggeser episode D, E, dll
    // Hanya update episodeCount tanpa sorting ulang
    episodeCount = document.querySelectorAll('.episode-item').length;
    
    // Scroll ke episode baru
    setTimeout(function() {
        newDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newDiv.style.transition = 'background 0.3s';
        newDiv.style.background = '#2a2a3a';
        setTimeout(function() {
            newDiv.style.background = '';
        }, 800);
    }, 50);
}

// Sisipkan episode di ATAS (C-1 = copy dari B, B tetap 2)
function insertEpisodeAbove(btn) {
    var episodeItem = btn.closest('.episode-item');
    var container = document.getElementById('episode-list');
    var currentNum = parseInt(episodeItem.dataset.ep);
    var newNum = currentNum - 1;
    
    if (newNum < 1) {
        showToast('Nomor episode minimal 1', 'error');
        return;
    }
    
    // Ambil episode BEFORE current (yaitu B) untuk di-copy nilainya
    var prevItem = episodeItem.previousSibling;
    var prevEpisodeData = null;
    
    if (prevItem) {
        // Jika ada episode B, copy nilainya
        prevEpisodeData = {
            ep: newNum,  // nomor baru C-1
            embed: prevItem.querySelector('.ep-embed')?.value || '',
            download: prevItem.querySelector('.ep-download')?.value || '',
            mirror: prevItem.querySelector('.ep-mirror')?.value || '',
            subtitle: prevItem.querySelector('.ep-subtitle')?.value || ''
        };
    } else {
        // Jika tidak ada episode B (berarti ini episode pertama)
        // Maka episode baru kosong
        prevEpisodeData = {
            ep: newNum,
            embed: '',
            download: '',
            mirror: '',
            subtitle: ''
        };
    }
    
    var newDiv = createEpisodeElement(prevEpisodeData);
    
    // Insert SEBELUM episode saat ini (C)
    container.insertBefore(newDiv, episodeItem);
    
    // ✅ TIDAK menggeser episode C, D, E, dll
    // Episode C tetap bernomor sama, tidak berubah
    
    episodeCount = document.querySelectorAll('.episode-item').length;
    
    // Scroll ke episode baru
    setTimeout(function() {
        newDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newDiv.style.transition = 'background 0.3s';
        newDiv.style.background = '#2a2a3a';
        setTimeout(function() {
            newDiv.style.background = '';
        }, 800);
    }, 50);
}

// Tambah episode global (di akhir: C+1)
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
    
    // Scroll ke episode baru (tanpa pindah ke atas dulu)
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

// Hapus episode - episode di bawahnya TIDAK berubah nomornya
function removeEpisode(btn) {
    var item = btn.closest('.episode-item');
    var nextItem = item.nextSibling;
    var prevItem = item.previousSibling;
    var scrollTarget = nextItem || prevItem || null;
    item.remove();
    
    episodeCount = document.querySelectorAll('.episode-item').length;
    
    // Scroll ke episode terdekat (tanpa pindah ke atas dulu)
    if (scrollTarget) {
        setTimeout(function() {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            scrollTarget.style.transition = 'background 0.3s';
            scrollTarget.style.background = '#2a2a3a';
            setTimeout(function() {
                if (scrollTarget) scrollTarget.style.background = '';
            }, 800);
        }, 50);
    }
}

function editEpisodeNumber(btn) {
    var numArea = btn.closest('.episode-num-area');
    if (!numArea) return;
    
    var textSpan = numArea.querySelector('.episode-num-text');
    var currentNum = parseInt(textSpan.textContent.replace('Episode ', ''));
    
    if (numArea.dataset.editing === 'true') return;
    
    numArea.dataset.originalNum = currentNum;
    numArea.dataset.editing = 'true';
    
    var inputHtml = '<input type="number" class="episode-num-input" value="' + currentNum + '" min="1" step="1">';
    inputHtml += '<button type="button" class="episode-save-btn" onclick="saveEpisodeNumber(this)">';
    inputHtml += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    inputHtml += '</button>';
    
    numArea.innerHTML = inputHtml;
    
    var input = numArea.querySelector('input');
    if (input) input.focus();
}

function saveEpisodeNumber(btn) {
    var numArea = btn.closest('.episode-num-area');
    if (!numArea) return;
    
    var input = numArea.querySelector('input');
    var newNum = parseInt(input.value);
    if (isNaN(newNum) || newNum < 1) newNum = 1;
    
    var episodeItem = numArea.closest('.episode-item');
    episodeItem.dataset.ep = newNum;
    
    // Kembalikan ke tampilan teks
    numArea.dataset.editing = 'false';
    numArea.innerHTML = [
        '<span class="episode-num-text">Episode ' + newNum + '</span>',
        '<button type="button" class="episode-edit-btn" onclick="editEpisodeNumber(this)">',
        '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        '</button>'
    ].join('');
    
    sortEpisodesByNumber();
}

function sortEpisodesByNumber() {
    var container = document.getElementById('episode-list');
    if (!container) return;
    
    var items = Array.from(container.querySelectorAll('.episode-item'));
    items.sort(function(a, b) {
        return parseInt(a.dataset.ep) - parseInt(b.dataset.ep);
    });
    
    // Simpan posisi scroll saat ini
    var scrollContainer = container.parentElement;
    var scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    for (var i = 0; i < items.length; i++) {
        container.appendChild(items[i]);
    }
    
    // Kembalikan posisi scroll
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollTop;
    }
    
    episodeCount = items.length;
}

function getEpisodes() {
    var items = document.querySelectorAll('.episode-item');
    var episodes = [];
    items.forEach(function(item) {
        var epNum = parseInt(item.dataset.ep);
        if (!isNaN(epNum)) {
            episodes.push({
                ep: epNum,
                embed:    item.querySelector('.ep-embed')?.value.trim()    || '',
                download: item.querySelector('.ep-download')?.value.trim() || '',
                mirror:   item.querySelector('.ep-mirror')?.value.trim()   || '',
                subtitle: item.querySelector('.ep-subtitle')?.value.trim() || ''
            });
        }
    });
    episodes.sort(function(a, b) { return a.ep - b.ep; });
    return episodes;
}

function loadEpisodes(embedData, downloadData, mirrorData, subtitleData) {
    var container = document.getElementById('episode-list');
    if (!container) return;
    
    container.innerHTML = '';
    episodeCount = 0;
    
    var embedArray = [];
    var downloadArray = [];
    var mirrorArray = [];
    var subtitleArray = [];
    
    try {
        if (embedData && embedData !== '[]' && embedData !== '') {
            embedArray = typeof embedData === 'string' ? JSON.parse(embedData) : embedData;
        }
        if (downloadData && downloadData !== '[]' && downloadData !== '') {
            downloadArray = typeof downloadData === 'string' ? JSON.parse(downloadData) : downloadData;
        }
        if (mirrorData && mirrorData !== '[]' && mirrorData !== '') {
            mirrorArray = typeof mirrorData === 'string' ? JSON.parse(mirrorData) : mirrorData;
        }
        if (subtitleData && subtitleData !== '[]' && subtitleData !== '') {
            subtitleArray = typeof subtitleData === 'string' ? JSON.parse(subtitleData) : subtitleData;
        }
    } catch(e) {
        console.error('Error parsing episode data:', e);
    }
    
    var episodeMap = {};
    
    for (var i = 0; i < embedArray.length; i++) {
        var ep = embedArray[i].ep;
        if (!episodeMap[ep]) episodeMap[ep] = { embed: '', download: '', mirror: '', subtitle: '' };
        episodeMap[ep].embed = embedArray[i].embed || '';
    }
    for (var i = 0; i < downloadArray.length; i++) {
        var ep = downloadArray[i].ep;
        if (!episodeMap[ep]) episodeMap[ep] = { embed: '', download: '', mirror: '', subtitle: '' };
        episodeMap[ep].download = downloadArray[i].download || '';
    }
    for (var i = 0; i < mirrorArray.length; i++) {
        var ep = mirrorArray[i].ep;
        if (!episodeMap[ep]) episodeMap[ep] = { embed: '', download: '', mirror: '', subtitle: '' };
        episodeMap[ep].mirror = mirrorArray[i].mirror || '';
    }
    for (var i = 0; i < subtitleArray.length; i++) {
        var ep = subtitleArray[i].ep;
        if (!episodeMap[ep]) episodeMap[ep] = { embed: '', download: '', mirror: '', subtitle: '' };
        episodeMap[ep].subtitle = subtitleArray[i].subtitle || '';
    }
    
    var episodes = [];
    for (var epNum in episodeMap) {
        episodes.push({
            ep: parseInt(epNum),
            embed: episodeMap[epNum].embed,
            download: episodeMap[epNum].download,
            mirror: episodeMap[epNum].mirror,
            subtitle: episodeMap[epNum].subtitle
        });
    }
    episodes.sort(function(a, b) { return a.ep - b.ep; });
    
    for (var i = 0; i < episodes.length; i++) {
        var newDiv = createEpisodeElement(episodes[i]);
        container.appendChild(newDiv);
        episodeCount++;
    }
}

// Override untuk tombol "Tambah Episode" di bawah
window.addEpisode = function(data) {
    addEpisodeToEnd();
};

// =============================================
// LOAD FILM DATA FOR EDITOR
// =============================================

async function loadFilmData(id) {
    try {
        var res = await DASHBOARD_API.getById(id);
        if (res.status !== 'success' || !res.data) { 
            showToast('Tidak ditemukan', 'error'); 
            return; 
        }
        var f = res.data;
        
        setVal('film-id', f.id);
        setVal('film-type', f.type);
        setVal('film-title', f.title);
        setVal('film-slug', f.slug);
        setVal('film-year', f.year);
        setVal('film-rating', f.rating);
        setVal('film-duration', f.duration);
        setVal('film-genre', f.genre);
        setVal('film-synopsis', f.synopsis);
        setVal('film-director', f.director);
        setVal('film-cast', f.cast);
        setVal('film-poster', f.poster);
        setVal('film-backdrop', f.backdrop);
        setVal('film-trailer', f.trailer);
        
        var featuredCheck = document.getElementById('film-featured');
        var popularCheck = document.getElementById('film-popular');
        if (featuredCheck) featuredCheck.checked = f.featured === 'TRUE';
        if (popularCheck) popularCheck.checked = f.popular === 'TRUE';
        
        if (f.poster) showPreview(document.getElementById('poster-preview'), f.poster);
        if (f.backdrop) showPreview(document.getElementById('backdrop-preview'), f.backdrop);
        
        if (f.type === 'series') {
            if (typeof toggleSeriesPanel === 'function') toggleSeriesPanel();
            loadEpisodes(f.embed_url, f.download_url, f.mirror_url, f.subtitle_url);
        } else {
            setVal('film-embed', f.embed_url || '');
            setVal('film-download', f.download_url || '');
            setVal('film-mirror', f.mirror_url || '');
            setVal('film-subtitle', f.subtitle_url || '');
        }
        
        showToast('Data dimuat', 'success');
    } catch (e) { 
        console.error('Error loadFilmData:', e);
        showToast('Gagal load data: ' + e.message, 'error'); 
    }
}

// =============================================
// SUBMIT FILM
// =============================================

async function submitFilm(action) {
    try {
        var idField = document.getElementById('film-id');
        var id = idField ? idField.value.trim() : '';
        if (!id) id = document.getElementById('original-id')?.value.trim() || '';
        
        if (!id) { showToast('ID diperlukan!', 'error'); return; }

        var type = document.getElementById('film-type')?.value || 'movie';
        var isSeries = (type === 'series');
        
        var data = {
            id: id,
            title: document.getElementById('film-title')?.value.trim() || '',
            slug: document.getElementById('film-slug')?.value.trim() || '',
            type: type,
            year: document.getElementById('film-year')?.value || '',
            rating: document.getElementById('film-rating')?.value || '',
            duration: document.getElementById('film-duration')?.value.trim() || '',
            genre: document.getElementById('film-genre')?.value.trim() || '',
            synopsis: document.getElementById('film-synopsis')?.value.trim() || '',
            director: document.getElementById('film-director')?.value.trim() || '',
            cast: document.getElementById('film-cast')?.value.trim() || '',
            poster: document.getElementById('film-poster')?.value.trim() || '',
            backdrop: document.getElementById('film-backdrop')?.value.trim() || '',
            trailer: document.getElementById('film-trailer')?.value.trim() || '',
            featured: document.getElementById('film-featured')?.checked ? 'TRUE' : 'FALSE',
            popular: document.getElementById('film-popular')?.checked ? 'TRUE' : 'FALSE',
            status: action === 'publish' ? 'published' : 'draft'
        };
        
        if (!data.title) { showToast('Judul wajib diisi!', 'error'); return; }
        
        if (isSeries) {
            var episodes = getEpisodes();
            var embedOnly = [];
            var downloadOnly = [];
            var mirrorOnly = [];
            var subtitleOnly = [];
            
            for (var i = 0; i < episodes.length; i++) {
                var ep = episodes[i];
                if (ep.embed) embedOnly.push({ ep: ep.ep, embed: ep.embed });
                if (ep.download) downloadOnly.push({ ep: ep.ep, download: ep.download });
                if (ep.mirror) mirrorOnly.push({ ep: ep.ep, mirror: ep.mirror });
                if (ep.subtitle) subtitleOnly.push({ ep: ep.ep, subtitle: ep.subtitle });
            }
            
            data.embed_url = embedOnly.length > 0 ? JSON.stringify(embedOnly) : '[]';
            data.download_url = downloadOnly.length > 0 ? JSON.stringify(downloadOnly) : '[]';
            data.mirror_url = mirrorOnly.length > 0 ? JSON.stringify(mirrorOnly) : '[]';
            data.subtitle_url = subtitleOnly.length > 0 ? JSON.stringify(subtitleOnly) : '[]';
        } else {
            data.embed_url = document.getElementById('film-embed')?.value.trim() || '';
            data.download_url = document.getElementById('film-download')?.value.trim() || '';
            data.mirror_url = document.getElementById('film-mirror')?.value.trim() || '';
            data.subtitle_url = document.getElementById('film-subtitle')?.value.trim() || '';
        }
        
        if (action === 'draft') {
            localStorage.setItem('ps21_draft', JSON.stringify(data));
            showDraftStatus('draft');
            showToast('Draft tersimpan!', 'info');
            return;
        }
        
        var btn = document.getElementById('btn-publish');
        if (btn) {
            btn.textContent = '⏳...';
            btn.disabled = true;
        }
        
        var mode = document.getElementById('form-mode')?.value || 'add';
        var res;
        if (mode === 'edit') {
            res = await DASHBOARD_API.update(data);
        } else {
            res = await DASHBOARD_API.add(data);
        }
        
        if (res.status === 'success') {
            localStorage.removeItem('ps21_draft');
            showDraftStatus('published');
            showToast('Berhasil dirilis!', 'success');
            setTimeout(function() { window.location.href = 'index.html'; }, 1500);
        } else {
            showToast('' + (res.message || 'Gagal'), 'error');
        }
        
        if (btn) {
            btn.textContent = 'Rilis';
            btn.disabled = false;
        }
        
    } catch (e) {
        console.error('ERROR:', e.message);
        showToast('Error: ' + e.message, 'error');
        var btn = document.getElementById('btn-publish');
        if (btn) {
            btn.textContent = 'Rilis';
            btn.disabled = false;
        }
    }
}

async function deleteFilm() {
    var id = document.getElementById('original-id')?.value;
    if (!id) return;
    if (!confirm('Yakin hapus "' + id + '"?')) return;
    try {
        var res = await DASHBOARD_API.delete(id);
        if (res.status === 'success') {
            localStorage.removeItem('ps21_draft');
            showToast('Dihapus!', 'success');
            setTimeout(function() { window.location.href = 'index.html'; }, 1000);
        } else showToast('' + (res.message || 'Gagal'), 'error');
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
}

// =============================================
// DRAFT FUNCTIONS
// =============================================

function checkDraft() {
    var d = localStorage.getItem('ps21_draft');
    if (d) {
        try {
            var data = JSON.parse(d);
            if (confirm('Ditemukan draft. Lanjutkan?')) {
                loadDraftData(data);
                showDraftStatus('draft');
            } else {
                localStorage.removeItem('ps21_draft');
            }
        } catch (e) { localStorage.removeItem('ps21_draft'); }
    }
}

function loadDraftData(data) {
    setVal('film-id', data.id || '');
    setVal('film-type', data.type || 'movie');
    setVal('film-title', data.title || '');
    setVal('film-slug', data.slug || '');
    setVal('film-year', data.year || '');
    setVal('film-rating', data.rating || '');
    setVal('film-duration', data.duration || '');
    setVal('film-genre', data.genre || '');
    setVal('film-synopsis', data.synopsis || '');
    setVal('film-director', data.director || '');
    setVal('film-cast', data.cast || '');
    setVal('film-poster', data.poster || '');
    setVal('film-backdrop', data.backdrop || '');
    setVal('film-trailer', data.trailer || '');
    
    if (data.type === 'series') {
        if (typeof toggleSeriesPanel === 'function') toggleSeriesPanel();
        loadEpisodes(data.embed_url, data.download_url, data.mirror_url, data.subtitle_url);
    } else {
        setVal('film-embed', data.embed_url || '');
        setVal('film-download', data.download_url || '');
        setVal('film-mirror', data.mirror_url || '');
        setVal('film-subtitle', data.subtitle_url || '');
    }
    
    var featuredCheck = document.getElementById('film-featured');
    var popularCheck = document.getElementById('film-popular');
    if (featuredCheck) featuredCheck.checked = data.featured === 'TRUE';
    if (popularCheck) popularCheck.checked = data.popular === 'TRUE';
    if (data.poster) showPreview(document.getElementById('poster-preview'), data.poster);
    if (data.backdrop) showPreview(document.getElementById('backdrop-preview'), data.backdrop);
}

function showDraftStatus(status) {
    var el = document.getElementById('draft-status');
    if (!el) return;
    if (status === 'draft') {
        el.style.display = 'block';
        el.className = 'draft-status draft';
        el.textContent = 'Status: Draft (lokal)';
    } else if (status === 'published') {
        el.style.display = 'block';
        el.className = 'draft-status published';
        el.textContent = 'Status: Dirilis';
    } else {
        el.style.display = 'none';
    }
}

// =============================================
// UPLOAD MEDIA FUNCTIONS
// =============================================

async function uploadMedia(inputId, previewId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async function() {
        var file = fileInput.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Maks 5MB', 'error'); return; }

        var btn = input.parentElement ? input.parentElement.querySelector('.media-upload-btn') : null;
        if (btn) { btn.disabled = true; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>'; }
        showToast('Mengupload gambar...', 'info');

        try {
            var result = await DASHBOARD_API.uploadImage(file);
            if (result.status === 'success' && result.url) {
                input.value = result.url;
                var preview = document.getElementById(previewId);
                if (preview) showPreview(preview, result.url);
                showToast('Upload berhasil!', 'success');
            } else {
                showToast('' + (result.message || 'Gagal upload'), 'error');
            }
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        }
    };

    fileInput.click();
}

// =============================================
// INITIALIZATION
// =============================================

async function initEditor() {
    var filmId = getParam('id');
    setupPreview('film-poster', 'poster-preview');
    setupPreview('film-backdrop', 'backdrop-preview');
    
    var form = document.getElementById('film-form');
    if (form) {
        form.addEventListener('submit', function(e) { e.preventDefault(); });
    }
    
    var titleEl = document.getElementById('film-title');
    var slugEl = document.getElementById('film-slug');
    var yearEl = document.getElementById('film-year');
    if (titleEl && slugEl) {
        titleEl.addEventListener('input', function() {
            if (!slugEl.dataset.manual) {
                var s = titleEl.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (yearEl && yearEl.value) s += '-' + yearEl.value;
                slugEl.value = s;
            }
        });
        slugEl.addEventListener('focus', function() { slugEl.dataset.manual = 'true'; });
    }

    if (filmId) {
        var pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Film';
        document.getElementById('form-mode').value = 'edit';
        document.getElementById('original-id').value = filmId;
        var deleteBtn = document.getElementById('btn-delete');
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        var idInput = document.getElementById('film-id');
        if (idInput) idInput.readOnly = true;
        await loadFilmData(filmId);
    } else {
        var pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = 'Tambah Film';
        checkDraft();
    }
}

// =============================================
// START DASHBOARD
// =============================================

if (document.getElementById('table-body')) {
    document.addEventListener('DOMContentLoaded', function() { 
        setupFilters(); 
        loadDashboard(); 
    });
}

if (document.getElementById('film-form')) {
    document.addEventListener('DOMContentLoaded', function() {
        initEditor();
    });
}