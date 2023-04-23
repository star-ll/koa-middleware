function getType(type) {
  return Object.prototype.toString.call(type).slice(8, -1);
}

function checkOptions(options) {
  if (
    !["string", "function", "boolean", "undefined"].includes(typeof options.origin) &&
    !Array.isArray(options.origin) &&
    !(options.origin instanceof RegExp)
  ) {
    throw new Error(`options.origin应该是一个 Array | string | Function | RegExp | undefined`);
  }

  if (!["string", "undefined"].includes(typeof options.methods) && !Array.isArray(options.methods)) {
    throw new Error(`options.methods应该是一个 Array | string | undefined`);
  }

  if (!["string", "undefined"].includes(typeof options.allowedHeaders) && !Array.isArray(options.allowedHeaders)) {
    throw new Error(`options.allowedHeaders应该是一个 Array | string | undefined`);
  }

  if (!["string", "undefined"].includes(typeof options.exposedHeaders) && !Array.isArray(options.exposedHeaders)) {
    throw new Error(`options.exposedHeaders应该是一个 Array | string`);
  }

  if (!["boolean", "undefined"].includes(typeof options.credentials)) {
    throw new Error(`options.credentials应该是一个 boolean`);
  }

  if (!["number", "undefined"].includes(typeof options.credentials)) {
    throw new Error(`options.maxAge应该是一个 number`);
  }
}

/**
 *
 * @param {Object} options
 * @param {Array | string | Function | RegExp | boolean} options.origin
 * @param {Array | string} options.methods
 * @param {Array | string} options.allowedHeaders
 * @param {Array | string} options.exposedHeaders
 * @param {boolean} options.credentials
 * @param {Object} options.maxAge
 * @returns
 */
exports.cors = function cors(options = {}) {
  // 检查参数是否正确
  checkOptions(options);

  const {
    origin = "*",
    methods = "POST, GET, DELETE, PATCH, HEAD",
    allowedHeaders = "Content-Type, Authorization",
    credentials,
    maxAge,
    exposedHeaders,
  } = options;

  let headers = {};

  function isAllowOrigin(origin, requestOrigin) {
    if (typeof origin === "function") {
      return !!origin(requestOrigin);
    }
    if (origin instanceof RegExp) {
      return origin.test(requestOrigin);
    }
    if (typeof origin === "boolean") {
      return origin;
    }

    return false;
  }

  function handleOrigin(origin, requestOrigin) {
    if (!origin || origin === "*") {
      headers["Access-Control-Allow-Origin"] = "*";
    } else {
      if (Array.isArray(origin)) {
        headers["Access-Control-Allow-Origin"] = origin.join(",");
      } else if (typeof origin === "string") {
        headers["Access-Control-Allow-Origin"] = origin;
      } else {
        headers["Access-Control-Allow-Origin"] = isAllowOrigin(origin, requestOrigin) ? requestOrigin : false;
      }

      headers["Vary"] = "Origin";
    }
  }

  function handleMethods(methods) {
    console.log(methods);
    if (Array.isArray(methods)) {
      return (headers["Access-Control-Allow-Methods"] = methods.join(","));
    } else if (typeof methods === "string") {
      return (headers["Access-Control-Allow-Methods"] = methods);
    }

    headers["Access-Control-Allow-Methods"] = false;
  }

  function handleHeaders(allowedHeaders) {
    if (Array.isArray(allowedHeaders)) {
      headers["Access-Control-Allow-Headers"] = allowedHeaders.join(", ");
    } else if (typeof allowedHeaders === "string") {
      headers["Access-Control-Allow-Headers"] = allowedHeaders;
    } else {
      headers["Access-Control-Allow-Headers"] = false;
    }
  }

  function handleExposedHeaders(exposedHeaders) {
    if (Array.isArray(exposedHeaders)) {
      headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
    } else if (typeof exposedHeaders === "string") {
      headers["Access-Control-Expose-Headers"] = exposedHeaders;
    } else {
      headers["Access-Control-Expose-Headers"] = false;
    }
  }

  function handleMaxAge(maxAge) {
    if (maxAge != null) {
      headers["Access-Control-Max-Age"] = maxAge.toString();
    }
  }

  function handleCredentials(credentials) {
    if (credentials === true) {
      headers["Access-Control-Allow-Credentials"] = true;
    }

    return null;
  }

  function applyHeaders(ctx, headers) {
    for (const key of Object.keys(headers)) {
      ctx.response.set(key, headers[key]);
    }
  }

  return async function handleCors(ctx, next) {
    await next();

    if (ctx.request.method.toLowerCase() === "options") {
      // preflight 预检测请求
      handleOrigin(origin, ctx.origin);
      handleMethods(methods);
      handleHeaders(allowedHeaders);
      handleMaxAge(maxAge);
      handleCredentials(credentials);
      handleExposedHeaders(exposedHeaders);
    } else {
      // actual response
      handleOrigin(origin, ctx.origin);
      handleCredentials(credentials);
      handleExposedHeaders(exposedHeaders);
    }

    // add header to response
    applyHeaders(ctx, headers);
    headers = {};
  };
};
