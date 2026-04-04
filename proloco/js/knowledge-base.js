/**
 * KnowledgeBaseManager - Base Conoscenza
 * Wiki, Documenti, FAQs, Manuali
 */
class KnowledgeBaseManager {
  constructor() {
    this.articlesKey = 'kb-articles';
    this.documentsKey = 'kb-documents';
    this.articles = this.loadArticles();
    this.documents = this.loadDocuments();
  }

  loadArticles() {
    return storage.get(this.articlesKey) || [];
  }

  saveArticles() {
    storage.set(this.articlesKey, this.articles);
  }

  loadDocuments() {
    return storage.get(this.documentsKey) || [];
  }

  saveDocuments() {
    storage.set(this.documentsKey, this.documents);
  }

  addArticle(article) {
    article.id = Date.now();
    article.createdAt = new Date().toISOString();
    article.views = 0;
    this.articles.push(article);
    this.saveArticles();
    return article;
  }

  updateArticle(id, updates) {
    const article = this.articles.find(a => a.id === id);
    if (article) {
      Object.assign(article, updates);
      this.saveArticles();
      return article;
    }
    return null;
  }

  deleteArticle(id) {
    this.articles = this.articles.filter(a => a.id !== id);
    this.saveArticles();
  }

  getArticle(id) {
    return this.articles.find(a => a.id === id);
  }

  getAllArticles() {
    return [...this.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  searchArticles(query) {
    const q = query.toLowerCase();
    return this.articles.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q)
    );
  }

  addDocument(doc) {
    doc.id = Date.now();
    doc.createdAt = new Date().toISOString();
    this.documents.push(doc);
    this.saveDocuments();
    return doc;
  }

  deleteDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    this.saveDocuments();
  }

  getAllDocuments() {
    return [...this.documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getStats() {
    return {
      articles: this.articles.length,
      documents: this.documents.length,
      totalViews: this.articles.reduce((sum, a) => sum + (a.views || 0), 0)
    };
  }

  renderKnowledgeBasePage() {
    const articles = this.getAllArticles();
    const documents = this.getAllDocuments();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Base Conoscenza</h2>
            <p>Articoli: ${stats.articles} | Documenti: ${stats.documents} | Visualizzazioni: ${stats.totalViews}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchKBTab('articles')">📝 Articoli</button>
            <button class="btn btn-secondary" onclick="switchKBTab('documents')">📄 Documenti</button>
          </div>
        </div>

        <!-- SEARCH -->
        <div style="margin-bottom: 20px;">
          <input type="text" id="kb-search" placeholder="🔍 Cerca nella base conoscenza..." onkeyup="searchKB()" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
        </div>

        <!-- ARTICLES TAB -->
        <div id="kb-articles-section" style="display: block;">
          <h3>Wiki e Articoli</h3>
          <button class="btn btn-primary" onclick="showArticleModal()" style="margin-bottom: 15px;">➕ Nuovo Articolo</button>
          
          <div class="grid grid-auto">
            ${articles.length > 0 ? 
              articles.map(a => this.renderArticleCard(a)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun articolo</p>'
            }
          </div>
        </div>

        <!-- DOCUMENTS TAB -->
        <div id="kb-documents-section" style="display: none;">
          <h3>Documenti</h3>
          <button class="btn btn-primary" onclick="showDocumentModal()" style="margin-bottom: 15px;">📤 Carica Documento</button>
          
          <div class="grid grid-auto">
            ${documents.length > 0 ? 
              documents.map(d => this.renderDocumentCard(d)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun documento</p>'
            }
          </div>
        </div>
      </div>
    `;
  }

  renderArticleCard(article) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📝 ${article.title}</div>
            <div class="card-subtitle">👁️ ${article.views} visualizzazioni</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteArticle(${article.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p style="color: var(--text-light);">${article.content.substring(0, 150)}...</p>
          <p style="font-size: 0.85rem; color: var(--text-light);">Creato: ${new Date(article.createdAt).toLocaleDateString('it-IT')}</p>
          <button class="btn btn-sm btn-primary" onclick="readArticle(${article.id})" style="margin-top: 10px;">📖 Leggi</button>
        </div>
      </div>
    `;
  }

  renderDocumentCard(doc) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📄 ${doc.name}</div>
            <div class="card-subtitle">${doc.type}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>Tipo:</strong> ${doc.type}</p>
          <p style="font-size: 0.85rem; color: var(--text-light);">Caricato: ${new Date(doc.createdAt).toLocaleDateString('it-IT')}</p>
          <button class="btn btn-sm btn-secondary" onclick="downloadDocument(${doc.id})" style="margin-top: 10px;">⬇️ Scarica</button>
        </div>
      </div>
    `;
  }
}

const knowledgeBaseManager = new KnowledgeBaseManager();

function switchKBTab(tab) {
  document.getElementById('kb-articles-section').style.display = tab === 'articles' ? 'block' : 'none';
  document.getElementById('kb-documents-section').style.display = tab === 'documents' ? 'block' : 'none';
}

function searchKB() {
  const query = document.getElementById('kb-search').value;
  if (query.length > 0) {
    const results = knowledgeBaseManager.searchArticles(query);
    console.log('Risultati ricerca:', results);
  }
}

function showArticleModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Articolo</h3>
          <button class="modal-close" onclick="closeArticleModal()">✕</button>
        </div>
        <form onsubmit="saveArticle(event);">
          <div class="form-group">
            <label>Titolo *</label>
            <input type="text" id="article-title" required>
          </div>
          <div class="form-group">
            <label>Categoria *</label>
            <select id="article-category" required>
              <option value="">-- Seleziona --</option>
              <option value="Guide">Guide</option>
              <option value="FAQ">FAQ</option>
              <option value="Procedura">Procedure</option>
              <option value="Manuale">Manuale</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contenuto *</label>
            <textarea id="article-content" rows="10" required></textarea>
          </div>
          <div class="form-group">
            <label>Tag (comma-separated)</label>
            <input type="text" id="article-tags" placeholder="tag1, tag2, tag3">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeArticleModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Articolo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeArticleModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveArticle(event) {
  event.preventDefault();
  const article = {
    title: document.getElementById('article-title').value,
    category: document.getElementById('article-category').value,
    content: document.getElementById('article-content').value,
    tags: document.getElementById('article-tags').value.split(',').map(t => t.trim())
  };
  knowledgeBaseManager.addArticle(article);
  closeArticleModal();
  navigationManager.loadPageContent('knowledge-base');
  Utils.showAlert('Articolo salvato!', 'success');
}

function readArticle(articleId) {
  const article = knowledgeBaseManager.getArticle(articleId);
  if (article) {
    article.views = (article.views || 0) + 1;
    knowledgeBaseManager.updateArticle(articleId, article);
    Utils.showAlert(`${article.title}\n\n${article.content}`, 'info');
  }
}

function deleteArticle(articleId) {
  if (confirm('Eliminare questo articolo?')) {
    knowledgeBaseManager.deleteArticle(articleId);
    navigationManager.loadPageContent('knowledge-base');
    Utils.showAlert('Articolo eliminato!', 'success');
  }
}

function showDocumentModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Carica Documento</h3>
          <button class="modal-close" onclick="closeDocumentModal()">✕</button>
        </div>
        <form onsubmit="saveDocument(event);">
          <div class="form-group">
            <label>Nome Documento *</label>
            <input type="text" id="document-name" required>
          </div>
          <div class="form-group">
            <label>Tipo Documento *</label>
            <select id="document-type" required>
              <option value="">-- Seleziona --</option>
              <option value="PDF">PDF</option>
              <option value="Word">Word</option>
              <option value="Excel">Excel</option>
              <option value="Presentazione">Presentazione</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="document-description" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>File</label>
            <input type="file" id="document-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeDocumentModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Carica Documento</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeDocumentModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveDocument(event) {
  event.preventDefault();
  const doc = {
    name: document.getElementById('document-name').value,
    type: document.getElementById('document-type').value,
    description: document.getElementById('document-description').value
  };
  knowledgeBaseManager.addDocument(doc);
  closeDocumentModal();
  navigationManager.loadPageContent('knowledge-base');
  Utils.showAlert('Documento caricato!', 'success');
}

function deleteDocument(docId) {
  if (confirm('Eliminare questo documento?')) {
    knowledgeBaseManager.deleteDocument(docId);
    navigationManager.loadPageContent('knowledge-base');
    Utils.showAlert('Documento eliminato!', 'success');
  }
}

function downloadDocument(docId) {
  Utils.showAlert('Download disponibile prossimamente', 'info');
}
