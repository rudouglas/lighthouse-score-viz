const mainThresholds = {
  good: 90,
  moderate: 50,
}
const auditRefObject = [
      {
          "id": "is-on-https",
          "title": "Uses HTTPS",
          "description": "All sites should be protected with HTTPS, even ones that don't handle sensitive data. This includes avoiding [mixed content](https://developers.google.com/web/fundamentals/security/prevent-mixed-content/what-is-mixed-content), where some resources are loaded over HTTP despite the initial request being served over HTTPS. HTTPS prevents intruders from tampering with or passively listening in on the communications between your app and your users, and is a prerequisite for HTTP/2 and many new web platform APIs. [Learn more](https://web.dev/is-on-https/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "items": [],
              "headings": [],
              "type": "table"
          },
          "weight": 1,
          "group": "best-practices-trust-safety"
      },
      {
          "id": "geolocation-on-start",
          "title": "Avoids requesting the geolocation permission on page load",
          "description": "Users are mistrustful of or confused by sites that request their location without context. Consider tying the request to a user action instead. [Learn more](https://web.dev/geolocation-on-start/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "items": [],
              "type": "table",
              "headings": []
          },
          "weight": 1,
          "group": "best-practices-trust-safety"
      },
      {
          "id": "notification-on-start",
          "title": "Avoids requesting the notification permission on page load",
          "description": "Users are mistrustful of or confused by sites that request to send notifications without context. Consider tying the request to user gestures instead. [Learn more](https://web.dev/notification-on-start/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "headings": [],
              "items": []
          },
          "weight": 1,
          "group": "best-practices-trust-safety"
      },
      {
          "id": "no-vulnerable-libraries",
          "title": "Avoids front-end JavaScript libraries with known security vulnerabilities",
          "description": "Some third-party scripts may contain known security vulnerabilities that are easily identified and exploited by attackers. [Learn more](https://web.dev/no-vulnerable-libraries/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "headings": [],
              "items": [],
              "summary": {}
          },
          "weight": 1,
          "group": "best-practices-trust-safety"
      },
      {
          "id": "csp-xss",
          "title": "Ensure CSP is effective against XSS attacks",
          "description": "A strong Content Security Policy (CSP) significantly reduces the risk of cross-site scripting (XSS) attacks. [Learn more](https://web.dev/csp-xss/)",
          "score": null,
          "scoreDisplayMode": "informative",
          "details": {
              "type": "table",
              "items": [
                  {
                      "description": "script-src directive is missing. This can allow the execution of unsafe scripts.",
                      "directive": "script-src",
                      "severity": "High"
                  },
                  {
                      "description": "Missing object-src allows the injection of plugins that execute unsafe scripts. Consider setting object-src to 'none' if you can.",
                      "severity": "High",
                      "directive": "object-src"
                  }
              ],
              "headings": [
                  {
                      "subItemsHeading": {
                          "key": "description"
                      },
                      "key": "description",
                      "text": "Description",
                      "itemType": "text"
                  },
                  {
                      "text": "Directive",
                      "key": "directive",
                      "itemType": "code",
                      "subItemsHeading": {
                          "key": "directive"
                      }
                  },
                  {
                      "subItemsHeading": {
                          "key": "severity"
                      },
                      "key": "severity",
                      "itemType": "text",
                      "text": "Severity"
                  }
              ]
          },
          "weight": 0,
          "group": "best-practices-trust-safety"
      },
      {
          "id": "password-inputs-can-be-pasted-into",
          "title": "Allows users to paste into password fields",
          "description": "Preventing password pasting undermines good security policy. [Learn more](https://web.dev/password-inputs-can-be-pasted-into/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "items": [],
              "headings": [],
              "type": "table"
          },
          "weight": 1,
          "group": "best-practices-ux"
      },
      {
          "id": "image-aspect-ratio",
          "title": "Displays images with correct aspect ratio",
          "description": "Image display dimensions should match natural aspect ratio. [Learn more](https://web.dev/image-aspect-ratio/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "items": [],
              "headings": []
          },
          "weight": 1,
          "group": "best-practices-ux"
      },
      {
          "id": "image-size-responsive",
          "title": "Serves images with appropriate resolution",
          "description": "Image natural dimensions should be proportional to the display size and the pixel ratio to maximize image clarity. [Learn more](https://web.dev/serve-responsive-images/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "items": [],
              "headings": []
          },
          "weight": 1,
          "group": "best-practices-ux"
      },
      {
          "id": "preload-fonts",
          "title": "Fonts with `font-display: optional` are preloaded",
          "description": "Preload `optional` fonts so first-time visitors may use them. [Learn more](https://web.dev/preload-optional-fonts/)",
          "score": null,
          "scoreDisplayMode": "notApplicable",
          "weight": 0,
          "group": "best-practices-ux"
      },
      {
          "id": "doctype",
          "title": "Page has the HTML doctype",
          "description": "Specifying a doctype prevents the browser from switching to quirks-mode. [Learn more](https://web.dev/doctype/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "weight": 1,
          "group": "best-practices-browser-compat"
      },
      {
          "id": "charset",
          "title": "Properly defines charset",
          "description": "A character encoding declaration is required. It can be done with a `<meta>` tag in the first 1024 bytes of the HTML or in the Content-Type HTTP response header. [Learn more](https://web.dev/charset/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "weight": 1,
          "group": "best-practices-browser-compat"
      },
      {
          "id": "no-unload-listeners",
          "title": "Registers an `unload` listener",
          "description": "The `unload` event does not fire reliably and listening for it can prevent browser optimizations like the Back-Forward Cache. Consider using the `pagehide` or `visibilitychange` events instead. [Learn more](https://developers.google.com/web/updates/2018/07/page-lifecycle-api#the-unload-event)",
          "score": 0,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "items": [
                  {
                      "source": {
                          "column": 24075,
                          "type": "source-location",
                          "urlProvider": "network",
                          "line": 12,
                          "url": "https://developer.newrelic.com/"
                      }
                  }
              ],
              "headings": [
                  {
                      "key": "source",
                      "text": "Source",
                      "itemType": "source-location"
                  }
              ]
          },
          "weight": 1,
          "group": "best-practices-general"
      },
      {
          "id": "js-libraries",
          "title": "Detected JavaScript libraries",
          "description": "All front-end JavaScript libraries detected on the page. [Learn more](https://web.dev/js-libraries/).",
          "score": null,
          "scoreDisplayMode": "informative",
          "details": {
              "debugData": {
                  "type": "debugdata",
                  "stacks": [
                      {
                          "id": "react",
                          "version": "17.0.2"
                      },
                      {
                          "id": "react-fast",
                          "version": "17.0.2"
                      },
                      {
                          "id": "lodash",
                          "version": "4.17.21"
                      },
                      {
                          "version": "3.5.17",
                          "id": "d3"
                      },
                      {
                          "id": "gatsby"
                      },
                      {
                          "version": "core-js-global@3.19.1; core-js-pure@2.6.12",
                          "id": "corejs"
                      }
                  ]
              },
              "items": [
                  {
                      "npm": "react",
                      "version": "17.0.2",
                      "name": "React"
                  },
                  {
                      "npm": "lodash",
                      "version": "4.17.21",
                      "name": "Lo-Dash"
                  },
                  {
                      "name": "D3",
                      "npm": "d3",
                      "version": "3.5.17"
                  },
                  {
                      "npm": "gatsby",
                      "name": "Gatsby"
                  },
                  {
                      "version": "core-js-global@3.19.1; core-js-pure@2.6.12",
                      "name": "core-js",
                      "npm": "core-js"
                  }
              ],
              "headings": [
                  {
                      "key": "name",
                      "text": "Name",
                      "itemType": "text"
                  },
                  {
                      "itemType": "text",
                      "key": "version",
                      "text": "Version"
                  }
              ],
              "summary": {},
              "type": "table"
          },
          "weight": 0,
          "group": "best-practices-general"
      },
      {
          "id": "deprecations",
          "title": "Avoids deprecated APIs",
          "description": "Deprecated APIs will eventually be removed from the browser. [Learn more](https://web.dev/deprecations/).",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "items": [],
              "type": "table",
              "headings": []
          },
          "weight": 1,
          "group": "best-practices-general"
      },
      {
          "id": "errors-in-console",
          "title": "Browser errors were logged to the console",
          "description": "Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more](https://web.dev/errors-in-console/)",
          "score": 0,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "items": [
                  {
                      "sourceLocation": {
                          "column": 0,
                          "type": "source-location",
                          "line": 0,
                          "urlProvider": "network",
                          "url": "https://script.crazyegg.com/pages/scripts/0045/9836.js"
                      },
                      "description": "Failed to load resource: the server responded with a status of 403 (Forbidden)",
                      "source": "network"
                  },
                  {
                      "source": "network",
                      "description": "Failed to load resource: the server responded with a status of 403 (Forbidden)",
                      "sourceLocation": {
                          "url": "https://script.crazyegg.com/pages/scripts/0045/9836.js",
                          "line": 0,
                          "urlProvider": "network",
                          "column": 0,
                          "type": "source-location"
                      }
                  }
              ],
              "headings": [
                  {
                      "itemType": "source-location",
                      "text": "Source",
                      "key": "sourceLocation"
                  },
                  {
                      "key": "description",
                      "itemType": "code",
                      "text": "Description"
                  }
              ]
          },
          "weight": 1,
          "group": "best-practices-general"
      },
      {
          "id": "valid-source-maps",
          "title": "Missing source maps for large first-party JavaScript",
          "description": "Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage of these benefits. [Learn more](https://developers.google.com/web/tools/chrome-devtools/javascript/source-maps).",
          "score": 0,
          "scoreDisplayMode": "binary",
          "details": {
              "type": "table",
              "headings": [
                  {
                      "key": "scriptUrl",
                      "subItemsHeading": {
                          "key": "error"
                      },
                      "itemType": "url",
                      "text": "URL"
                  },
                  {
                      "itemType": "url",
                      "text": "Map URL",
                      "key": "sourceMapUrl"
                  }
              ],
              "items": [
                  {
                      "sourceMapUrl": "https://cli-assets.service.datanerd.us/platform/e397ce5c83e740b8.map",
                      "scriptUrl": "https://d1zobbh8kytrtv.cloudfront.net/platform/doc-app-release-3439-dev.js",
                      "subItems": {
                          "items": [
                              {
                                  "error": "Large JavaScript file is missing a source map"
                              },
                              {
                                  "error": "Error: Timed out fetching resource."
                              }
                          ],
                          "type": "subitems"
                      }
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/webpack-runtime-ce4cb4218035fb67a302.js",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      },
                      "sourceMapUrl": "https://developer.newrelic.com/webpack-runtime-ce4cb4218035fb67a302.js.map"
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/framework-320f698974a06dfed2e6.js",
                      "sourceMapUrl": "https://developer.newrelic.com/framework-320f698974a06dfed2e6.js.map",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      }
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/f0e45107-0f1cfaab7038ac6d2e22.js",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      },
                      "sourceMapUrl": "https://developer.newrelic.com/f0e45107-0f1cfaab7038ac6d2e22.js.map"
                  },
                  {
                      "sourceMapUrl": "https://developer.newrelic.com/dc6a8720040df98778fe970bf6c000a41750d3ae-90843142785621136b70.js.map",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      },
                      "scriptUrl": "https://developer.newrelic.com/dc6a8720040df98778fe970bf6c000a41750d3ae-90843142785621136b70.js"
                  },
                  {
                      "sourceMapUrl": "https://developer.newrelic.com/component---src-pages-index-js-0a1036f1ca8e37ad915e.js.map",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      },
                      "scriptUrl": "https://developer.newrelic.com/component---src-pages-index-js-0a1036f1ca8e37ad915e.js"
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/ce450489-3607b7da2fee72b858dc.js",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      },
                      "sourceMapUrl": "https://developer.newrelic.com/ce450489-3607b7da2fee72b858dc.js.map"
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/app-edc840086d60998674b4.js",
                      "sourceMapUrl": "https://developer.newrelic.com/app-edc840086d60998674b4.js.map",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      }
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/82c1d43a-5c0a05c28462e20f7884.js",
                      "sourceMapUrl": "https://developer.newrelic.com/82c1d43a-5c0a05c28462e20f7884.js.map",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      }
                  },
                  {
                      "sourceMapUrl": "https://developer.newrelic.com/58917679-15cd82f9500a9a552295.js.map",
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      },
                      "scriptUrl": "https://developer.newrelic.com/58917679-15cd82f9500a9a552295.js"
                  },
                  {
                      "sourceMapUrl": "https://developer.newrelic.com/409bd909fa356ff4879582ec5500db5853f33b9b-359819eda5c04c308c3b.js.map",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      },
                      "scriptUrl": "https://developer.newrelic.com/409bd909fa356ff4879582ec5500db5853f33b9b-359819eda5c04c308c3b.js"
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/37bf9728-a07a038c30c96a393a87.js",
                      "sourceMapUrl": "https://developer.newrelic.com/37bf9728-a07a038c30c96a393a87.js.map",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      }
                  },
                  {
                      "subItems": {
                          "type": "subitems",
                          "items": []
                      },
                      "scriptUrl": "https://developer.newrelic.com/2b74e5357b2784a0532dfb07c08053b59ed0b186-c26eb3687557f5ccf267.js",
                      "sourceMapUrl": "https://developer.newrelic.com/2b74e5357b2784a0532dfb07c08053b59ed0b186-c26eb3687557f5ccf267.js.map"
                  },
                  {
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      },
                      "sourceMapUrl": "https://developer.newrelic.com/29107295-df0f4437828253b15cc2.js.map",
                      "scriptUrl": "https://developer.newrelic.com/29107295-df0f4437828253b15cc2.js"
                  },
                  {
                      "scriptUrl": "https://developer.newrelic.com/0f86a987-a976ea7ed630109f2382.js",
                      "subItems": {
                          "items": [],
                          "type": "subitems"
                      },
                      "sourceMapUrl": "https://developer.newrelic.com/0f86a987-a976ea7ed630109f2382.js.map"
                  }
              ]
          },
          "weight": 0,
          "group": "best-practices-general"
      },
      {
          "id": "inspector-issues",
          "title": "No issues in the `Issues` panel in Chrome Devtools",
          "description": "Issues logged to the `Issues` panel in Chrome Devtools indicate unresolved problems. They can come from network request failures, insufficient security controls, and other browser concerns. Open up the Issues panel in Chrome DevTools for more details on each issue.",
          "score": 1,
          "scoreDisplayMode": "binary",
          "details": {
              "headings": [],
              "items": [],
              "type": "table"
          },
          "weight": 1,
          "group": "best-practices-general"
      }
  ];
const showNull = true;
const diagnostics = auditRefObject.filter((audit) =>
      showNull
        ? !audit.score ||
          (audit.details &&
            audit.details.type !== "opportunity" &&
            audit.score < mainThresholds.good / 100)
        : audit.score !== null &&
          audit.details &&
          audit.details.type !== "opportunity" &&
          audit.score < mainThresholds.good / 100
    );
console.log(diagnostics);