class DesignerList extends HTMLElement {
  constructor() {
    super();
    this.handleShowAll = this.showAll.bind(this);
    this.buttonHandlers = new Map();
  }

  connectedCallback() {
    // Get designers data from JSON script tag within the component
    const designerDataScript = this.querySelector('script[type="application/json"]');
    this.designers = designerDataScript ? JSON.parse(designerDataScript.textContent) : [];

    this.list = this.querySelector('[data-collection-list]');
    this.filterButtons = this.querySelectorAll('[data-filter]');
    this.showAllButton = this.querySelector('[data-show-all]');

    // Process and render initial state
    this.processedDesigners = this.processData(this.designers);
    this.renderCollections(this.processedDesigners, true);

    // Add event listeners
    this.filterButtons.forEach(button => {
      const handler = () => this.filterByLetter(button.dataset.filter);
      this.buttonHandlers.set(button, handler);
      button.addEventListener('click', handler);
    });

    this.showAllButton.addEventListener('click', this.handleShowAll);
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.filterButtons.forEach(button => {
      const handler = this.buttonHandlers.get(button);
      if (handler) {
        button.removeEventListener('click', handler);
        this.buttonHandlers.delete(button);
      }
    });

    this.showAllButton.removeEventListener('click', this.handleShowAll);
  }

  processData(data) {
    const grouped = {};

    data.forEach(({title, url}) => {
      const key = /^[0-9]/.test(title) ? '#' : title.charAt(0).toUpperCase();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({ title, url });
    });

    // Convert to array format and sort
    return Object.entries(grouped)
      .map(([key, collections]) => ({
        key,
        collections: collections.sort((a, b) =>
          a.title.localeCompare(b.title)
        )
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  filterByLetter(letter) {
    this.showAllButton.classList.remove('is-active');
    this.filterButtons.forEach(btn => btn.classList.remove('is-active'));

    const filteredDesigners = this.processedDesigners.find(
      (el) => el.key === letter
    );

    this.renderCollections(filteredDesigners ? [filteredDesigners] : [], false, letter);
    this.querySelector(`[data-filter="${letter}"]`).classList.add('is-active');
  }

  showAll() {
    this.filterButtons.forEach(btn => btn.classList.remove('is-active'));
    this.showAllButton.classList.add('is-active');
    this.renderCollections(this.processedDesigners, true);
  }

  renderCollections(data, showHeading = false, currentLetter = null) {
    // Add or remove the empty state class
    this.list.classList.toggle('designer-list__collections--empty', data.length === 0 && currentLetter);

    if (data.length === 0 && currentLetter) {
      this.list.innerHTML = `
        <li class="designer-list__no-results">
          No designers found for '${currentLetter}'
        </li>
      `;
      return;
    }

    this.list.innerHTML = data
      .map((category) => {
        if (!category || !category.collections) return '';
        if (category.collections.length === 0) return '';

        const collectionsList = category.collections
          .map(
            (collection) => `
              <li>
                <a href="${collection.url}"
                   class="designer-list__collection-link">
                  ${collection.title}
                </a>
              </li>
            `
          )
          .join('');

        return `
          <div class="designer-list__letter-group">
            ${
              showHeading
                ? `<div class="designer-list__letter-heading"><span>${category.key}</span></div>`
                : ''
            }
            <ul class="designer-list__letter-items">
              ${collectionsList}
            </ul>
          </div>
        `;
      })
      .join('');
  }
}

customElements.define('designer-list', DesignerList);