"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    const services = strapi.services["company"];
    const model = strapi.models["company"];
    const { current, pageSize } = ctx.query;

    const getDataSource = async () => {
      const entities = ctx.query._q
        ? await services.search(ctx.query)
        : await services.find(ctx.query);

      return entities.map((entity) => {
        const company = sanitizeEntity(entity, { model });
        delete company.created_at;
        delete company.updated_at;
        delete company.published_at;
        return company;
      });
    };

    if (current) {
      ctx.query._start = (current - 1) * pageSize;
      ctx.query._limit = pageSize;
      delete ctx.query.type;
      delete ctx.query.current;
      delete ctx.query.pageSize;

      const total = await services.count();
      const data = await getDataSource();

      return { data, total, success: true, pageSize, current };
    }
    return await getDataSource();
  },
};
