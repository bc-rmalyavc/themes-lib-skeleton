/*
 Import all product specific js
 */
import $ from 'jquery';
import ko from 'knockout';
import PageManager from '../page-manager';
import utils from 'bigcommerce/stencil-utils'

export default class Product extends PageManager {
    constructor() {
        super();

        this.productId = $('[name="product_id"]').val();
        this.$productView = $('.productView');

        this.viewModel = { // The knockout.js view model
            quantity: ko.observable(1),
            price: ko.observable(),
            sku: ko.observable(),
            instock: ko.observable(true),
            purchasable: ko.observable(true),
            canAddToCart: ko.pureComputed(() => {
                return this.viewModel.instock() && this.viewModel.purchasable();
            })
        };
    }

    loaded(next) {
        ko.applyBindings(this.viewModel, this.$productView.get(0));

        this.productOptions();

        this.quantityChange();

        this.addProductToCart();

        next();
    }

    /**
     *
     * Handle product options changes
     *
     */
    productOptions() {
        // product options
        $('body').on('change', '#product-options', (event) => {
            let $target = $(event.target),     // actual element that is clicked
                $ele = $(event.currentTarget), // the element that has the data-tag
                targetVal = $target.val(),     // value of the target
                options = {};

            if (targetVal) {
                options = this.getOptionValues($ele);

                // check inventory when the option has changed
                utils.productAttributes.optionChange(options, this.productId, (err, data) => {
                    this.viewModel.price(data.price);
                    this.viewModel.sku(data.sku);
                    this.viewModel.instock(data.instock);
                    this.viewModel.purchasable(data.purchasable);
                });
            }
        });
    }

    /**
     *
     * Handle action when the shopper clicks on + / - for quantity
     *
     */
    quantityChange() {
        $('#product-quantity').on('click', 'button', (event) => {
            event.preventDefault();
            let qty = this.viewModel.quantity(),
                $target = $(event.target);

            if ($target.data('action') === 'inc') {
                qty++;
            } else if (qty > 1) {
                qty--;
            }

            this.viewModel.quantity(qty);
        });
    }

    /**
     *
     * Add a product to cart
     *
     */
    addProductToCart() {
        utils.hooks.on('cart-item-add', (event, ele) => {
            event.preventDefault();

            let quantity = this.$productView.find('#product-quantity [name=qty\\[\\]]').val(),
                $optionsContainer = this.$productView.find('#product-options'),
                options;

            options = this.getOptionValues($optionsContainer);

            // add item to cart
            utils.cart.itemAdd(this.productId, quantity, options, (err, data) => {
                // if there is an error
                if (err || data.error) {
                    // TODO: display error
                    return;
                }

                // fetch cart to display in cart preview
                utils.cart.getContent({render_with: 'cart/preview'}, (err, content) => {
                    $('[data-cart-preview]').html(content);
                });
            });
        });
    }

    /**
     *
     * Get product options
     *
     * @param {jQuery} $container
     * @returns Object
     */
    getOptionValues($container) {
        // What does this query mean?
        //
        // :input:radio:checked
        //      Get all radios that are checked (since they are grouped together by name).
        //      If the query is just :input alone, it will return all radios (even the ones that aren't selected).
        //
        // :input:not(:radio)
        //      This is to retrieve all text, hidden, dropdown fields that don't have "groups".
        let $optionValues = $container.find(':input:radio:checked, :input:not(:radio)'),
            params = {};

        // iterate over values
        $optionValues.each((index, ele) => {
            let $ele = $(ele),
                name = $ele.attr('name'),
                val = $ele.val();

            params[name] = val;
        });

        return params;
    }
}
