import $ from 'jquery';
import utils from 'bigcommerce/stencil-utils';
import Tabs from 'bc-tabs';

export default class ProductUtils {
  constructor(options) {
    this.$el = $(options.el);
    this.options = options;
    this.productId = this.$el.find('[data-product-id]').val();

    this.tabs = new Tabs({
      moduleSelector: this.$el.find('[data-tabs]')
    });

    this._bindEvents();
  }

  _bindEvents() {
    this.$el.on('click', this.options.tabSelector, (event) => {
      event.preventDefault();
      this.tabs.displayTabContent($(event.currentTarget).attr('href'));
    });

    this.$el.on('click', '[data-product-quantity-change]', (event) => {
      this._updateQuantity(event);
    });
  }

  _getViewModel($el) {
    return {
      $price: $('[data-product-price]', $el),
      $rrp: $('[data-product-rrp]', $el),
      $addToCart: $('[data-button-purchase]', $el),
    }
  }

  init(context) {
    this.context = context;

    this._productOptions();
    this._addProductToCart();
  }

  _toggleLoader($form) {
    $form.find(this.options.spinnerSelector).toggleClass(this.options.visibleClass);
  }

  _updateQuantity(event) {
    const $target = $(event.currentTarget);
    const $quantity = $target.closest('[data-product-quantity]').find('[data-product-quantity-input]');
    const min = $quantity.prop('min');
    const max = $quantity.prop('max');
    let newQuantity = parseInt($quantity.val(), 10);

    if ($target.is('[data-quantity-increment]') && (!max || newQuantity < max)) {
      newQuantity = newQuantity + 1;
    } else if ($target.is('[data-quantity-decrement]') && newQuantity > min) {
      newQuantity = newQuantity - 1;
    }

    $quantity.val(newQuantity);
  }

  _updateMessage(isError, response) {
    let message = '';

    // if there is an error
    if (isError) {
      message = response;

      this.$el.find('[data-product-message]').html(message).addClass(this.options.errorClass);
      this.$el.find(`[data-product-add] this.options.loaderSelector`).removeClass(this.options.visibleClass);
    }

    else {
      message = this.context.addSuccess;
      message = message
                  .replace('*product*', this.$el.find('[data-product-details]').data('product-title'))
                  .replace('*cart_link*', `<a href=${this.context.urlsCart}>${this.context.cartLink}</a>`)
                  .replace('*continue_link*', `<a href='/'>${this.context.homeLink}</a>`)
                  .replace('*checkout_link*', `<a href=${this.context.urlsCheckout}>${this.context.checkoutLink}</a>`);

      this.$el.find('[data-product-message]').html(message).removeClass(this.options.errorClass);
      this.$el.find(`[data-product-add] this.options.loaderSelector`).removeClass(this.options.visibleClass);
    }
  }

  /**
   *
   * Handle product options changes
   *
   */
  _productOptions() {
    utils.hooks.on('product-option-change', (event, changedOption) => {
      const $changedOption = $(changedOption);
      const $form = $changedOption.parents('form');

      // Do not trigger an ajax request if it's a file or if the browser doesn't support FormData
      if ($changedOption.attr('type') === 'file' || window.FormData === undefined) {
        return;
      }

      utils.api.productAttributes.optionChange(this.productId, $form.serialize(), (err, response) => {
        const viewModel = this._getViewModel(this.$el);
        const data = response ? response.data : {};

        viewModel.$price.html(data.price);
        viewModel.$rrp.html(data.rrp);

        // TODO: Image Switching
        // if (data.image) {
        //   const mainImageUrl = utils.tools.image.getSrc(
        //     data.image.data,
        //     this.context.themeImageSizes.product
        //   );
        // }

        this.$el.find('[data-product-message]').empty();

        if (!data.purchasable || !data.instock) {
          viewModel.$addToCart
            .val(this.context.soldOut)
            .addClass(this.options.buttonDisabledClass)
            .prop('disabled', true);

        } else {
          let buttonText = this.context.addToCart;
          if (viewModel.$addToCart.is('[data-button-preorder]')) {
            buttonText = this.context.preOrder;
          }

          viewModel.$addToCart
            .val(buttonText)
            .removeClass(this.options.buttonDisabledClass)
            .prop('disabled', false);
        }
      });
    });
  }

  /**
   *
   * Add a product to cart
   *
   */
  _addProductToCart() {
    utils.hooks.on('cart-item-add', (event, form) => {
      // Do not do AJAX if browser doesn't support FormData
      if (window.FormData === undefined) {
        return;
      }

      event.preventDefault();

      if (this.options.loader) {
        this._toggleLoader($(form));
      }

      // add item to cart
      utils.api.cart.itemAdd(new FormData(form), (err, response) => {
        let isError = false;
        response = response ? response : err;

        // if there is an error
        if (err || response.data.error) {
          isError = true;
          response = err || response.data.error;
        }

        this._updateMessage(isError, response);

        if (this.options.loader) {
          this._toggleLoader($form);
        }
      });
    });
  }
}
