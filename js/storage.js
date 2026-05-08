window.AssertHub = window.AssertHub || {};

let onFileLoadCallback = null;
window.AssertHub.setOnFileLoadCallback = function(cb) {
  onFileLoadCallback = cb;
};

window.AssertHub.RecentFilesManager = {
  STORAGE_KEY: 'assert_true_recent_files',
  OLD_STORAGE_KEY: 'assert_hub_recent_files',
  MAX_FILES: 10,
  activeTag: null,

  save(metadata, content) {
    const files = this.getAll();
    const newFile = {
      name: metadata.name,
      version: metadata.version,
      tags: metadata.tags || '',
      content: content,
      lastModified: new Date().toISOString()
    };

    const existingIndex = files.findIndex(f => f.name === newFile.name && f.version === newFile.version);
    if (existingIndex !== -1) {
      files[existingIndex] = newFile;
    } else {
      files.unshift(newFile);
    }

    if (files.length > this.MAX_FILES) {
      files.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    this.render();
  },

  saveCurrentState() {
    const state = window.AssertHub.state;
    if (state.metadataErrors.length > 0) return;
    const md = window.AssertHub.generateMarkdown(state.currentMetadata, state.currentTests, state.currentPreconditions, false);
    this.save(state.currentMetadata, md);
  },

  getAll() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    
    // Fallback for migration from Assert Hub
    const oldStored = localStorage.getItem(this.OLD_STORAGE_KEY);
    if (oldStored) {
      localStorage.setItem(this.STORAGE_KEY, oldStored);
      // We keep the old one for a while just in case, or remove it
      // localStorage.removeItem(this.OLD_STORAGE_KEY); 
      return JSON.parse(oldStored);
    }
    return [];
  },

  load(name, version) {
    const files = this.getAll();
    const file = files.find(f => f.name === name && f.version === version);
    if (file && onFileLoadCallback) {
      const data = window.AssertHub.parseTests(file.content);
      onFileLoadCallback(data, file.content, false); // false = don't save again
    }
  },

  render() {
    const files = this.getAll();
    const container = document.getElementById('recentFilesContainer');
    const list = document.getElementById('recentFilesList');
    const filtersContainer = document.getElementById('tagFilters');
    
    if (files.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = '';
    filtersContainer.innerHTML = '';

    // Extract unique tags
    const allTags = new Set();
    files.forEach(f => {
      if (f.tags) {
        f.tags.split(',').forEach(t => allTags.add(t.trim().toLowerCase()));
      }
    });

    if (allTags.size > 0) {
      // Add "All" filter
      const allBtn = document.createElement('button');
      allBtn.className = `text-[0.75rem] px-3 py-1 rounded-full border transition-all duration-300 ${!this.activeTag ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-slate-900 border-none font-bold' : 'bg-black/5 dark:bg-white/5 border-card-border-light dark:border-card-border-dark'}`;
      allBtn.textContent = 'All Files';
      allBtn.onclick = () => {
        this.activeTag = null;
        this.render();
      };
      filtersContainer.appendChild(allBtn);

      Array.from(allTags).sort().forEach(tag => {
        const btn = document.createElement('button');
        const isActive = this.activeTag === tag;
        btn.className = `text-[0.75rem] px-3 py-1 rounded-full border transition-all duration-300 ${isActive ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-slate-900 border-none font-bold' : 'bg-black/5 dark:bg-white/5 border-card-border-light dark:border-card-border-dark'}`;
        btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
        btn.onclick = () => {
          this.activeTag = isActive ? null : tag;
          this.render();
        };
        filtersContainer.appendChild(btn);
      });
    }

    const filteredFiles = this.activeTag 
      ? files.filter(f => f.tags && f.tags.toLowerCase().includes(this.activeTag))
      : files;

    if (filteredFiles.length === 0) {
      list.innerHTML = '<p class="col-span-full opacity-60 text-center py-8 italic">No files match the selected tag.</p>';
      return;
    }

    filteredFiles.forEach(file => {
      const item = document.createElement('div');
      item.className = 'dark:bg-card-bg-dark bg-card-bg-light p-4 rounded-xl border dark:border-card-border-dark border-card-border-light cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md group flex flex-col gap-2';
      
      let tagsHtml = '';
      if (file.tags) {
        const tags = file.tags.split(',').map(t => t.trim()).filter(t => t);
        tagsHtml = `
          <div class="flex flex-wrap gap-1 mt-1">
            ${tags.map(t => `<span class="text-[0.6rem] px-1.5 py-0.5 rounded bg-accent-light/10 dark:bg-accent-dark/10 dark:text-accent-dark text-accent-light border border-accent-light/20 dark:border-accent-dark/20">${t}</span>`).join('')}
          </div>
        `;
      }

      item.innerHTML = `
        <div class="flex justify-between items-start">
          <h3 class="font-bold dark:text-accent-dark text-accent-light group-hover:underline line-clamp-1">${file.name}</h3>
          <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 opacity-70">v${file.version}</span>
        </div>
        ${tagsHtml}
        <div class="text-[0.75rem] opacity-60 mt-auto">Last opened: ${new Date(file.lastModified).toLocaleDateString()}</div>
      `;
      item.onclick = () => this.load(file.name, file.version);
      list.appendChild(item);
    });
  }
};
