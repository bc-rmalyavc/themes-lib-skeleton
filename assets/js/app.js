import stencilUtils from 'bigcommerce/stencil-utils';
import async from 'caolan/async';
import account from './theme/account';
import auth from './theme/auth';
import blog from './theme/blog';
import brand from './theme/brand';
import brands from './theme/brands';
import cart from './theme/cart';
import category from './theme/category';
import compare from './theme/compare';
import errors from './theme/errors';
import giftCertificate from './theme/gift-certificate';
import global from './theme/global';
import home from './theme/home';
import orderComplete from './theme/order-complete';
import page from './theme/page';
import product from './theme/product';
import search from './theme/search';
import sitemap from './theme/sitemap';
import subscribe from './theme/subscribe';
import wishlist from './theme/wishlist';

let PageClasses = {
    mapping: {
        "account": account,
        "auth": auth,
        "blog": blog,
        "brand": brand,
        "brands": brand,
        "cart": cart,
        "category": category,
        "compare": compare,
        "errors": errors,
        "gift-certificate": giftCertificate,
        "global": global,
        "home": home,
        "order-complete": orderComplete,
        "page": page,
        "product": product,
        "search": search,
        "sitemap": sitemap,
        "subscribe": subscribe,
        "wishlist": wishlist
    },
    /**
     * Getter method to ensure a good page type is accessed.
     * @param page
     * @returns {*}
     */
    get: function(page) {
        if (this.mapping[page]) {
            return this.mapping[page];
        }
        return false;
    }
};

/**
 *
 * @param {Object} pageObj
 */
function series(pageObj) {
    async.series([
        pageObj.before.bind(pageObj), // Executed first after constructor()
        pageObj.loaded.bind(pageObj), // Main module logic
        pageObj.after.bind(pageObj) // Clean up method that can be overridden for cleanup.
    ], function (err) {
        if (err) {
            throw new Error(err);
        }
    })
}

/**
 * Loads the global module that gets executed on every page load.
 * Code that you want to run on every page goes in the global module.
 * @param {object} pages
 * @returns {*}
 */
function loadGlobal(pages) {
    let global = pages.get('global');
    return new global;
}

/**
 *
 * @param {function} pageFunc
 * @param {} pages
 */
function loader(pageFunc, pages) {
    if (pages.get('global')) {
        series(loadGlobal(pages));
    }
    series(pageFunc);
}

/**
 * This is the function that gets exported to JSPM
 * Gets the templateFile name passed in from the JSPM loader
 * @param templateFile String
 * @returns {*}
 */
export default function (templateFile) {
    let pages = PageClasses;

    return {
        load() {
            let pageTypeFn = pages.get(templateFile); // Finds the appropriate module from the pageType object and store the result as a function.
            if (pageTypeFn) {
                let pageType = new pageTypeFn();
                return loader(pageType, pages);
            } else {
                throw new Error(templateFile + ' Module not found')
            }
        }
    }
};
