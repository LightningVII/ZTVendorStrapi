"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

const V_G_VALUE = "vendor_categories.value";
const V_G_NULL = "vendor_categories_null";

const V_T_VALUE = "vendor_types.value";
const V_T_NULL = "vendor_types_null";

module.exports = {
  async find(ctx) {
    const categoriesServices = strapi.services["vendor-categories"];
    const typesServices = strapi.services["vendor-types"];
    const services = strapi.services["company"];
    const model = strapi.models["company"];
    const { current, pageSize, keyword } = ctx.query;

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

    if (keyword) {
      ctx.query._start = (current - 1) * pageSize;
      ctx.query._limit = pageSize;

      const categories = await categoriesServices.find({
        name_contains: keyword,
      });
      const types = await typesServices.find({
        name_contains: keyword,
      });
      const _or = [];
      const categoriesQuery = "vendor_categories.id_in";
      const typesQuery = "vendor_types.id_in";
      const categoriesIds = categories.map(({ id }) => id);
      const typeIds = types.map(({ id }) => id);
      if (categoriesIds.length) _or.push({ [categoriesQuery]: categoriesIds });
      if (typeIds.length) _or.push({ [typesQuery]: typeIds });
      _or.push({ name_contains: keyword });
      _or.push({ main_products_contains: keyword });

      delete ctx.query.keyword;
      delete ctx.query.type;
      delete ctx.query.current;
      delete ctx.query.pageSize;
      ctx.query = { _where: { _or } };
      const total = await services.count(ctx.query);
      const data = await getDataSource();

      return { data, total, success: true, pageSize, current };
    } else if (current) {
      const categoriesValue = ctx.query[V_G_VALUE];
      const typesValue = ctx.query[V_T_VALUE];
      ctx.query._start = (current - 1) * pageSize;
      ctx.query._limit = pageSize;
      delete ctx.query.keyword;
      delete ctx.query.type;
      delete ctx.query.current;
      delete ctx.query.pageSize;
      if (categoriesValue === "other") ctx.query[V_G_NULL] = true;
      if (["all", "other"].includes(categoriesValue))
        delete ctx.query[V_G_VALUE];

      if (Array.isArray(typesValue)) {
        if (typesValue.includes("other")) {
          const realTypesValue = typesValue.filter((item) => item !== "other");
          const filterCondition =
            realTypesValue.length === 1
              ? { [V_T_VALUE]: realTypesValue[0] }
              : { [`${V_T_VALUE}_in`]: realTypesValue };
          const _or = [{ [V_T_NULL]: true }, filterCondition];
          ctx.query = { _where: { _or } };
        } else ctx.query[V_T_VALUE + "_in"] = typesValue;
        delete ctx.query[V_T_VALUE];
      } else {
        if (typesValue === "other") {
          ctx.query[V_T_NULL] = true;
          delete ctx.query[V_T_VALUE];
        }
      }

      const total = await services.count(ctx.query);
      const data = await getDataSource();

      return { data, total, success: true, pageSize, current };
    }
    return await getDataSource();
  },
};
