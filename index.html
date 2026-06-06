// Dashboard API - Supabase Version (Standalone)
var DASHBOARD_API = {
    // ── Supabase Configuration ─────────────────────
    _SUPABASE_URL: 'https://eogdtpkiwzlarllnxsrj.supabase.co',
    _SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZ2R0cGtpd3psYXJsbG54c3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODg0NzMsImV4cCI6MjA4OTY2NDQ3M30.eZPbYTuaDerKL9SOEa4ctkxSlU1PiEAU9l42czgYOyI',

    // ── Helper: Supabase Client ─────────────────
    _getClient: function() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded!');
            return null;
        }
        return supabase.createClient(this._SUPABASE_URL, this._SUPABASE_ANON_KEY);
    },

    // ── Helper: Format dari Editor ke Supabase ────────
    _toSupabaseFormat: function(film) {
        var formatted = {};
        formatted.id = film.id;
        formatted.title = film.title;
        formatted.slug = film.slug;
        formatted.type = film.type;
        formatted.featured = film.featured === 'TRUE' || film.featured === true;
        formatted.popular = film.popular === 'TRUE' || film.popular === true;
        formatted.year = parseInt(film.year) || null;
        formatted.genre = film.genre;
        formatted.rating = parseFloat(film.rating) || null;
        formatted.duration = film.duration;
        formatted.director = film.director;
        formatted.cast = film.cast;
        formatted.poster = film.poster;
        formatted.backdrop = film.backdrop;
        formatted.synopsis = film.synopsis;
        formatted.trailer = film.trailer;
        
        // Handle URL fields
        if (film.type === 'series') {
            // Untuk series: simpan sebagai JSON string (text) - langsung pakai dari editor
            formatted.embed_url = film.embed_url || '[]';
            formatted.download_url = film.download_url || '[]';
            formatted.mirror_url = film.mirror_url || '[]';
            formatted.subtitle_url = film.subtitle_url || '[]';
        } else {
            // Untuk movie: string biasa
            formatted.embed_url = film.embed_url || '';
            formatted.download_url = film.download_url || '';
            formatted.mirror_url = film.mirror_url || '';
            formatted.subtitle_url = film.subtitle_url || '';
        }
        
        return formatted;
    },

    // ── Helper: Format dari Supabase ke Editor ────────
    _fromSupabaseFormat: function(film) {
        var formatted = {};
        formatted.id = film.id;
        formatted.title = film.title;
        formatted.slug = film.slug;
        formatted.type = film.type;
        formatted.featured = film.featured ? 'TRUE' : 'FALSE';
        formatted.popular = film.popular ? 'TRUE' : 'FALSE';
        formatted.year = film.year;
        formatted.genre = film.genre;
        formatted.rating = film.rating;
        formatted.duration = film.duration;
        formatted.director = film.director;
        formatted.cast = film.cast;
        formatted.poster = film.poster;
        formatted.backdrop = film.backdrop;
        formatted.synopsis = film.synopsis;
        formatted.trailer = film.trailer;
        
        // Untuk series: data dari Supabase sudah dalam format JSON string (text)
        // Langsung kirim ke editor apa adanya
        if (film.type === 'series') {
            formatted.embed_url = film.embed_url || '[]';
            formatted.download_url = film.download_url || '[]';
            formatted.mirror_url = film.mirror_url || '[]';
            formatted.subtitle_url = film.subtitle_url || '[]';
        } else {
            formatted.embed_url = film.embed_url || '';
            formatted.download_url = film.download_url || '';
            formatted.mirror_url = film.mirror_url || '';
            formatted.subtitle_url = film.subtitle_url || '';
        }
        
        return formatted;
    },

    // ── CRUD Operations ──────────────────────────
    getAll: async function() {
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var { data, error } = await client
            .from('PirateStudio21_DB')
            .select('*')
            .order('year', { ascending: false });
        
        if (error) return { status: 'error', message: error.message };
        var films = data.map(this._fromSupabaseFormat);
        return { status: 'success', data: films };
    },

    getById: async function(id) {
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var { data, error } = await client
            .from('PirateStudio21_DB')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return { status: 'error', message: error.message };
        var film = this._fromSupabaseFormat(data);
        return { status: 'success', data: film };
    },

    search: async function(q) {
        if (!q || q.trim() === '') return { status: 'success', data: [] };
        
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var searchTerm = '%' + q.toLowerCase() + '%';
        var { data, error } = await client
            .from('PirateStudio21_DB')
            .select('*')
            .or(`title.ilike.${searchTerm},genre.ilike.${searchTerm}`);
        
        if (error) return { status: 'error', message: error.message };
        var films = data.map(this._fromSupabaseFormat);
        return { status: 'success', data: films };
    },

    add: async function(data) {
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var formatted = this._toSupabaseFormat(data);
        
        var { error } = await client
            .from('PirateStudio21_DB')
            .insert([formatted]);
        
        if (error) return { status: 'error', message: error.message };
        
        if (typeof API !== 'undefined' && API.clearCache) API.clearCache();
        
        return { status: 'success', message: 'Film berhasil ditambahkan' };
    },

    update: async function(data) {
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var formatted = this._toSupabaseFormat(data);
        
        var { error } = await client
            .from('PirateStudio21_DB')
            .update(formatted)
            .eq('id', data.id);
        
        if (error) return { status: 'error', message: error.message };
        
        if (typeof API !== 'undefined' && API.clearCache) API.clearCache();
        
        return { status: 'success', message: 'Film berhasil diupdate' };
    },

    delete: async function(id) {
        var client = this._getClient();
        if (!client) return { status: 'error', message: 'Supabase client error' };
        
        var { error } = await client
            .from('PirateStudio21_DB')
            .delete()
            .eq('id', id);
        
        if (error) return { status: 'error', message: error.message };
        
        if (typeof API !== 'undefined' && API.clearCache) API.clearCache();
        
        return { status: 'success', message: 'Film berhasil dihapus' };
    },

    // ── Google Drive Upload ──────────────────────────
    _APPSCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxNamdlH6zSVDK_-eC6KWYjb6E2Ob3ivI2kcZRD9XkwxKleb0bTZbKT8xXhQPVsgv0P/exec',

    uploadImage: function(file) {
        return new Promise(function(resolve) {
            var reader = new FileReader();
            reader.onload = async function() {
                try {
                    var base64 = reader.result.split(',')[1];
                    var ext = (file.name || 'img').split('.').pop() || 'jpg';
                    var fileName = 'ps21_' + Date.now() + '.' + ext;
                    
                    var response = await fetch(DASHBOARD_API._APPSCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                            action: 'uploadImage',
                            image: base64,
                            fileName: fileName,
                            mimeType: file.type || 'image/jpeg'
                        })
                    });
                    resolve(await response.json());
                } catch (err) {
                    resolve({ status: 'error', message: err.message });
                }
            };
            reader.readAsDataURL(file);
        });
    },

    fetchGET: async function(action, params) {
        params = params || {};
        var url = this._APPSCRIPT_URL + '?action=' + encodeURIComponent(action);
        for (var key in params) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }
        }
        try {
            var response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('❌ GET Error:', error);
            return { status: 'error', message: 'Gagal terhubung ke server' };
        }
    },

    listImages: function() {
        return this.fetchGET('listImages');
    }
};