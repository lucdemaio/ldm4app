// Simple conversion UI handler
let pendingConversion = null;

// define possible formats per category
const conversionMap = {
    archivi: ['zip','tar.gz','7z','rar','iso','folder'],
    ebook: ['epub','mobi','pdf'],
    immagini: ['jpeg','png','webp','bmp','tiff'],
    video: ['mp4','mkv','avi','webm'],
    audio: ['mp3','wav','flac'],
    documenti: ['docx','pdf','xlsx','csv'],
    pdf: ['pdf','doc','docx','ppt','pptx','xls','xlsx','jpg','jpeg','png','html','pdfa'],
    altro: ['csv','json','ttf','otf']
};

// detailed conversion definitions for cards
const categoryConversions = {
    archivi: [
        {label:'ZIP ⇄ TAR.GZ',from:'zip',to:'tar.gz',icon:'assets/icons/zip.svg'},
        {label:'7Z ⇄ RAR',from:'7z',to:'rar',icon:'assets/icons/zip.svg'},
        {label:'ISO → cartella',from:'iso',to:'folder',icon:'assets/icons/zip.svg'}
    ],
    ebook: [
        {label:'EPUB ⇄ MOBI',from:'epub',to:'mobi',icon:'assets/icons/epub.svg'} ,
        {label:'PDF → EPUB',from:'pdf',to:'epub',icon:'assets/icons/pdf.svg'}
    ],
    immagini: [
        {label:'JPEG ⇄ PNG',from:'jpeg',to:'png',icon:'assets/icons/jpg.svg'} ,
        {label:'PNG ⇄ WEBP',from:'png',to:'webp',icon:'assets/icons/png.svg'} ,
        {label:'BMP ⇄ PNG',from:'bmp',to:'png',icon:'assets/icons/png.svg'} ,
        {label:'TIFF ⇄ JPEG',from:'tiff',to:'jpeg',icon:'assets/icons/jpg.svg'}
    ],
    video: [
        {label:'MP4 ⇄ MKV',from:'mp4',to:'mkv',icon:'assets/icons/mp4.svg'} ,
        {label:'AVI → MP4',from:'avi',to:'mp4',icon:'assets/icons/mp4.svg'} ,
        {label:'WebM ⇄ MP4',from:'webm',to:'mp4',icon:'assets/icons/mp4.svg'}
    ],
    audio: [
        {label:'MP3 ⇄ WAV',from:'mp3',to:'wav',icon:'assets/icons/mp3.svg'} ,
        {label:'FLAC ⇄ WAV',from:'flac',to:'wav',icon:'assets/icons/mp3.svg'}
    ],
    documenti: [
        {label:'DOCX ⇄ PDF',from:'docx',to:'pdf',icon:'assets/icons/word.svg'} ,
        {label:'XLSX ⇄ CSV',from:'xlsx',to:'csv',icon:'assets/icons/excel.svg'}
    ],
    pdf: [
        {label:'PDF ⇄ Word',from:'pdf',to:'docx',icon:'assets/icons/word.svg'},
        {label:'PDF ⇄ PowerPoint',from:'pdf',to:'pptx',icon:'assets/icons/ppt.svg'},
        {label:'PDF ⇄ Excel',from:'pdf',to:'xlsx',icon:'assets/icons/excel.svg'},
        {label:'PDF ⇄ JPG/PNG',from:'pdf',to:'jpg',icon:'assets/icons/jpg.svg'},
        {label:'HTML → PDF',from:'html',to:'pdf',icon:'assets/icons/pdf.svg'},
        {label:'PDF → PDF/A',from:'pdf',to:'pdfa',icon:'assets/icons/pdf.svg'}
    ],
    altro: [
        {label:'CSV ⇄ JSON',from:'csv',to:'json',icon:'assets/icons/jpg.svg'},
        {label:'TTF ⇄ OTF',from:'ttf',to:'otf',icon:'assets/icons/jpg.svg'}
    ]
};

function showCategoryCards(category) {
    const panel = document.getElementById('cards-panel');
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    const list = categoryConversions[category] || [];
    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        let iconElem;
        if (item.icon && item.icon.endsWith('.svg')) {
            iconElem = document.createElement('img');
            iconElem.src = item.icon;
            iconElem.className = 'card-icon';
        } else {
            iconElem = document.createElement('i');
            iconElem.className = 'fas ' + item.icon;
            if (item.color) iconElem.style.color = item.color;
        }
        const label = document.createElement('div');
        label.className = 'card-label';
        label.textContent = item.label;
        card.appendChild(iconElem);
        card.appendChild(label);
        card.onclick = () => {
            panel.style.display = 'none';
            startConversion(category, item.from, item.to);
        };
        container.appendChild(card);
    });
    panel.style.display = 'flex';
    // hide panel when clicking outside container
    panel.onclick = (e) => {
        if (e.target === panel) panel.style.display = 'none';
    };
}

window.showCategoryCards = showCategoryCards;

function startConversion(category, fromExt, toExt) {
    // only category matters
    pendingConversion = { category };
    const input = document.getElementById('file-input');
    input.value = null; // reset
    input.onchange = handleFileChange;
    input.click();
}

function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file || !pendingConversion) return;

    // show a preview of the selected file
    showPreview(file);

    // determine file extension
    const originalExt = getExtension(file.name);
    const category = pendingConversion.category;

    // build option buttons for all possible targets except original
    const optsArea = document.getElementById('options-area');
    optsArea.innerHTML = '';
    const options = conversionMap[category] || [];
    options.forEach(ext => {
        if (ext === originalExt) return; // skip same
        const btn = document.createElement('a');
        btn.href = URL.createObjectURL(file);
        btn.download = deriveNewName(file.name, ext);
        btn.textContent = ext.toUpperCase();
        btn.className = 'option-button';
        optsArea.appendChild(btn);
    });

    // if there is at least one option, show the download button as well if desired
    const downloadBtn = document.getElementById('download-btn');
    if (options.length > 1) {
        downloadBtn.style.display = 'none';
    } else {
        downloadBtn.style.display = 'inline-block';
        downloadBtn.href = URL.createObjectURL(file);
        downloadBtn.download = deriveNewName(file.name, options[0] || originalExt);
        downloadBtn.textContent = 'Scarica ' + downloadBtn.download;
    }

    // clear pending conversion after setting up
    pendingConversion = null;
}

function getExtension(filename) {
    const dot = filename.lastIndexOf('.');
    if (dot === -1) return '';
    return filename.substring(dot+1).toLowerCase();
}

function deriveNewName(originalName, toExt) {
    const dotIndex = originalName.lastIndexOf('.');
    const base = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    // if toExt == 'folder' just keep original name (no extension)
    if (toExt === 'folder') return base;
    return base + '.' + toExt;
}

function showPreview(file) {
    const preview = document.getElementById('preview-area');
    preview.innerHTML = '';
    const type = file.type;
    if (type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
    } else if (type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = URL.createObjectURL(file);
        vid.controls = true;
        preview.appendChild(vid);
    } else if (type.startsWith('audio/')) {
        const aud = document.createElement('audio');
        aud.src = URL.createObjectURL(file);
        aud.controls = true;
        preview.appendChild(aud);
    } else {
        const p = document.createElement('p');
        p.textContent = file.name;
        preview.appendChild(p);
    }
}

// optional: you could add more helper functions per category here

// expose functions globally
window.startConversion = startConversion;

function showGuide() {
    const panel = document.getElementById('guide-panel');
    if (!panel) return;
    panel.style.display = 'flex';
    // hide when clicking outside content
    panel.onclick = (e) => {
        if (e.target === panel) panel.style.display = 'none';
    };
    // automatically disappear after a few seconds
    setTimeout(() => {
        panel.style.display = 'none';
    }, 5000);
}

window.showGuide = showGuide;