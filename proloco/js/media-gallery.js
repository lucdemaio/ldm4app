/**
 * MediaGalleryManager - Gestione Foto, Video e Gallery
 */
class MediaGalleryManager {
  constructor() {
    this.storageKey = 'media-gallery';
    this.mediaItems = this.loadMedia();
  }

  loadMedia() {
    return storage.get(this.storageKey) || [];
  }

  saveMedia() {
    storage.set(this.storageKey, this.mediaItems);
  }

  // ===== MEDIA MANAGEMENT =====

  addMediaItem(item) {
    item.id = Date.now();
    item.createdAt = new Date().toISOString();
    this.mediaItems.push(item);
    this.saveMedia();
    return item;
  }

  updateMediaItem(id, updates) {
    const item = this.mediaItems.find(m => m.id === id);
    if (item) {
      Object.assign(item, updates);
      this.saveMedia();
      return item;
    }
    return null;
  }

  deleteMediaItem(id) {
    this.mediaItems = this.mediaItems.filter(m => m.id !== id);
    this.saveMedia();
  }

  getMediaItem(id) {
    return this.mediaItems.find(m => m.id === id);
  }

  getAllMedia() {
    return [...this.mediaItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== FILTERING =====

  getMediaByType(type) {
    // Types: 'photo', 'video'
    return this.mediaItems.filter(m => m.type === type);
  }

  getMediaByEvent(eventId) {
    return this.mediaItems.filter(m => m.eventId === eventId);
  }

  getMediaByTag(tag) {
    return this.mediaItems.filter(m => m.tags?.includes(tag));
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.mediaItems.length,
      photos: this.getMediaByType('photo').length,
      videos: this.getMediaByType('video').length,
      totalSize: this.mediaItems.reduce((sum, m) => sum + (m.fileSize || 0), 0)
    };
  }

  // ===== RENDERING =====

  renderGalleryPage() {
    const allMedia = this.getAllMedia();
    const photos = this.getMediaByType('photo');
    const videos = this.getMediaByType('video');
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Galleria Foto & Video</h2>
            <p>Totale: ${stats.total} | Foto: ${stats.photos} | Video: ${stats.videos}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchGalleryTab('all')">📸 Tutte (${stats.total})</button>
            <button class="btn btn-secondary" onclick="switchGalleryTab('photos')">🖼️ Foto (${stats.photos})</button>
            <button class="btn btn-secondary" onclick="switchGalleryTab('videos')">🎬 Video (${stats.videos})</button>
          </div>
        </div>

        <!-- UPLOAD SECTION -->
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px dashed var(--border);">
          <h3 style="margin-top: 0;">📤 Carica Media</h3>
          <div class="form-group">
            <label>Tipo Evento (opzionale)</label>
            <select id="media-event-select">
              <option value="">-- Nessun evento --</option>
              <!-- Events popolate da JS -->
            </select>
          </div>
          <div class="form-group">
            <label>Seleziona File</label>
            <input type="file" id="media-file-input" multiple accept="image/*,video/*" onchange="handleMediaUpload(event)">
          </div>
        </div>

        <!-- ALL MEDIA SECTION -->
        <div id="gallery-all-section">
          <h3>Tutte le Foto e Video (${allMedia.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${allMedia.length > 0 ? 
              allMedia.map(m => this.renderMediaThumbnail(m)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light); text-align: center;">Nessun media caricato</p>'
            }
          </div>
        </div>

        <!-- PHOTOS SECTION -->
        <div id="gallery-photos-section" style="display: none;">
          <h3>Foto (${photos.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${photos.length > 0 ? 
              photos.map(m => this.renderMediaThumbnail(m)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light); text-align: center;">Nessuna foto</p>'
            }
          </div>
        </div>

        <!-- VIDEOS SECTION -->
        <div id="gallery-videos-section" style="display: none;">
          <h3>Video (${videos.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${videos.length > 0 ? 
              videos.map(m => this.renderMediaThumbnail(m)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light); text-align: center;">Nessun video</p>'
            }
          </div>
        </div>
      </div>
    `;
  }

  renderMediaThumbnail(media) {
    const isVideo = media.type === 'video';
    const previewUrl = media.dataUrl || (isVideo ? '🎬' : '📸');

    return `
      <div style="
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s;
        cursor: pointer;
        height: 200px;
      " 
      onmouseover="this.style.transform='scale(1.05)';"
      onmouseout="this.style.transform='scale(1)';"
      >
        ${isVideo ? `
          <video src="${previewUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px;">▶️</div>
        ` : `
          <img src="${previewUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${media.name}">
        `}
        
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 8px; color: white; font-size: 12px;">
          <p style="margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${media.name}</p>
          <p style="margin: 4px 0 0 0; opacity: 0.8;">${new Date(media.createdAt).toLocaleDateString('it-IT')}</p>
        </div>

        <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px;">
          <button class="btn btn-sm btn-secondary" onclick="shareMedia('${media.id}')" title="Condividi" style="padding: 4px 8px;">📤</button>
          <button class="btn btn-sm btn-danger" onclick="deleteMediaItem('${media.id}')" title="Elimina" style="padding: 4px 8px;">🗑️</button>
        </div>
      </div>
    `;
  }

  renderArchiveTimeline() {
    const byDate = {};
    this.getAllMedia().forEach(m => {
      const date = m.createdAt.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(m);
    });

    return `
      <div class="page-container">
        <div class="page-header">
          <h2>Archivio Storico</h2>
          <p>Timeline di tutti i media caricati</p>
        </div>

        ${Object.entries(byDate).map(([date, items]) => `
          <div style="margin-bottom: 30px;">
            <h3 style="color: var(--primary); margin-bottom: 15px;">📅 ${new Date(date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
              ${items.map(m => `
                <div style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <img src="${m.dataUrl}" style="width: 100%; height: 120px; object-fit: cover;" alt="${m.name}">
                  <div style="padding: 8px; background: white;">
                    <p style="margin: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.name}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Istanza globale
const mediaGalleryManager = new MediaGalleryManager();

// ===== GLOBAL FUNCTIONS =====

function switchGalleryTab(tab) {
  document.getElementById('gallery-all-section').style.display = tab === 'all' ? 'block' : 'none';
  document.getElementById('gallery-photos-section').style.display = tab === 'photos' ? 'block' : 'none';
  document.getElementById('gallery-videos-section').style.display = tab === 'videos' ? 'block' : 'none';
}

function handleMediaUpload(event) {
  const files = event.target.files;
  const eventId = document.getElementById('media-event-select').value;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const isVideo = file.type.startsWith('video');
      
      const mediaItem = {
        name: file.name,
        type: isVideo ? 'video' : 'photo',
        mimeType: file.type,
        fileSize: file.size,
        dataUrl: e.target.result,
        eventId: eventId || null,
        tags: []
      };

      mediaGalleryManager.addMediaItem(mediaItem);
    };
    reader.readAsDataURL(file);
  });

  // Reset input
  event.target.value = '';
  navigationManager.loadPageContent('gallery');
  Utils.showAlert(`${files.length} file caricati!`, 'success');
}

function shareMedia(mediaId) {
  const media = mediaGalleryManager.getMediaItem(mediaId);
  if (media) {
    // Copia link o condividi
    const text = `Guarda questo media: ${media.name} - caricato il ${new Date(media.createdAt).toLocaleDateString('it-IT')}`;
    navigator.clipboard.writeText(text).then(() => {
      Utils.showAlert('Copiato negli appunti!', 'success');
    });
  }
}

function deleteMediaItem(mediaId) {
  if (confirm('Elimina questo media?')) {
    mediaGalleryManager.deleteMediaItem(mediaId);
    navigationManager.loadPageContent('gallery');
    Utils.showAlert('Media eliminato!', 'success');
  }
}
