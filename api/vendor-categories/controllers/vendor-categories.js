"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    const services = strapi.services["vendor-categories"];
    const model = strapi.models["vendor-categories"];
    const entities = ctx.query._q
      ? await services.search(ctx.query)
      : await services.find(ctx.query);

    return entities.map((entity) => {
      const vendorCategory = sanitizeEntity(entity, { model });
      delete vendorCategory.created_at;
      delete vendorCategory.updated_at;
      delete vendorCategory.published_at;

      vendorCategory.vendor_types = vendorCategory.vendor_types.map((item) => {
        delete item.created_at;
        delete item.updated_at;
        delete item.published_at;
        return item;
      });

      return vendorCategory;
    });
  },
};
