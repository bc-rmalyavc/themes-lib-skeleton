import Filters from './Filters';
import Loading from 'bc-loading';
import Alert from '../components/Alert';

export default class Listing {
  /**
   * Manages product listings.
   *
   * This class glues together different components, taking care of any
   * theme-specifc logic and UI.
   */

  /**

     TODO:
     - make Filters work
     - clean out any opinionated / excess code

    */
  constructor(templateNamespace, frontmatter) {
    this.$body = $(document.body);
    this.$filters = $('[data-filters]');
    this.$filtersContainer = $('[data-filters-container]');
    this.$filtersToggle = $('[data-filters-toggle]');
    this.$alerts = $('[data-product-grid-alerts]');

    this.templateNamespace = templateNamespace;
    this.filters = new Filters(frontmatter);
    this.alert = new Alert(this.$alerts);
    this.loader = new Loading({}, true);

    this._bindEvents();
  }

  _bindEvents() {
    // Toggle filters
    this.$filtersToggle.on('click', (event) => {
      this.$filters.slideToggle();
      this.$filtersToggle.toggleClass('is-active');
      this._toggleFilterText();
    });

    // Update filters
    this.filters.addTemplate(`${this.templateNamespace}/filters`, (content) => {
      const wasVisible = this.$filters.is(':visible');

      const $newFilters = $(content).find('[data-filters]');
      this.$filters.replaceWith($newFilters);
      this.$filters = $newFilters;

      if (wasVisible) {
        this.$filters.show();
      }
    });

    // Update product listing
    this.filters.addTemplate(`${this.templateNamespace}/products`, (content) => {
      this.grid.replaceItems(
        $(content).filter('.product-item')
      );
    });

    // Pagination links
    this.$body.on('click', '[data-listing-pagination-link]', (event) => {
      event.preventDefault();
      this._scrollToTop();

      // Update filter state
      const $el = $(event.currentTarget);
      const url = $el.attr('href');
      this.filters.updateState(url);
    });

    // Update pagination
    this.filters.addTemplate(`${this.templateNamespace}/pagination`, (content) => {
      $('[data-listing-pagination]').replaceWith(content);
    });

    // UI feedback

    this.filters.on('fetch', (state) => {
      this.loader.show();
      this.grid.getItems().addClass('is-removing');
    });

    this.filters.on('update', (state) => {
      this.loader.hide();
      this.alert.clear();
    });

    this.filters.on('error', (error, state) => {
      this.loader.hide();
      this.alert.error(error);
    });
  }

  _toggleFilterText() {
    const currentText = this.$filtersToggle.text();
    const toggledText = this.$filtersToggle.attr('data-toggle-text');

    this.$filtersToggle
      .text(toggledText)
      .attr('data-toggle-text', currentText);
  }

  _scrollToTop() {
    const scrollTop = this.$alerts.offset().top;
    $('html,body').animate({ scrollTop });
  }
}
