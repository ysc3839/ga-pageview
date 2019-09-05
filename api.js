/**
 * @typedef {import('express').Request} request
 * @typedef {import('express').Response} response
 */

const {URL} = require('url');
const {google} = require('googleapis');
const analyticsreporting = google.analyticsreporting({version: 'v4'});

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

module.exports = function(config) {
  const reqParams = {
    viewId: config.viewId,
    dateRanges: [{
      startDate: '2005-01-01',
      endDate: '9999-12-31',
    }],
    samplingLevel: 'LARGE',
    hideTotals: true,
    hideValueRanges: true,
  };

  /**
   * @param {request} req
   * @param {response} res
   */
  async function handler(req, res) {
    let path;
    try {
      const url = new URL(req.header('referer'));

      let pass = false;
      if (typeof config.refererHost === 'string') {
        pass = (url.hostname === config.refererHost);
      } else if (config.refererHost instanceof Array) {
        pass = config.refererHost.includes(url.hostname);
      }

      if (pass) {
        path = url.pathname;
        if (config.defaultPage && path[path.length - 1] === '/') {
          path += config.defaultPage;
        }
      }
    } catch (e) {}
    if (!path) {
      res.status(400).end();
      return;
    }

    try {
      const report = await analyticsreporting.reports.batchGet({
        auth: auth,
        requestBody: {
          reportRequests: [
            {
              metrics: [
                {expression: 'ga:pageviews'},
                {expression: 'ga:uniquePageviews'},
              ],
              ...reqParams,
            },
            {
              dimensionFilterClauses: [{
                filters: [{
                  dimensionName: 'ga:pagePath',
                  operator: 'BEGINS_WITH',
                  expressions: [path],
                  caseSensitive: true,
                }],
              }],
              metrics: [{expression: 'ga:pageviews'}],
              ...reqParams,
            },
          ],
        },
      });
      const [sitePv, siteUv] =
      report.data.reports[0].data.rows[0].metrics[0].values.map(Number);
      const pagePv =
      Number(report.data.reports[1].data.rows[0].metrics[0].values[0]);
      res.jsonp({
        site_uv: siteUv,
        page_pv: pagePv,
        site_pv: sitePv,
      });
    } catch (e) {
      res.status(500).end();
      console.log(e);
    }
  }

  return handler;
};
