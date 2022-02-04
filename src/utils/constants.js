export const createMonitorJson = {
  type: "SCRIPT_API",
  status: "ENABLED",
};

export const syntheticsEndpoint =
  "https://staging-synthetics.newrelic.com/synthetics/api";

export const scoreScript = `


// Do not modify code below this line!!!!
const request = require("request");
const MAX_LENGTH = 4096;

var headers = {
  "Content-Type": "json/application",
  "Api-Key": USER_API_KEY,
};
const chunkString = (str, length) => {
  return str.match(new RegExp(".{1," + length + "}", "g"));
};

const formatEventName = (name) => {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

const createEvent = (object, refs, audits) => {
  const eventType = \`lighthouse\${formatEventName(object.id)}\`;
  const newEventObject = { eventType, ...object };
  delete newEventObject.auditRefs;
  const auditRefs = refs.map((ref) => {
    const audit = audits.find((audit) => audit.id === ref.id);
    return {...audit, weight: ref.weight, group: ref.group};
  });

  const stringifiedRefs = JSON.stringify(auditRefs);
  if (stringifiedRefs.length > MAX_LENGTH) {
    const splitData = chunkString(stringifiedRefs, MAX_LENGTH);
    // console.log(splitData);
    splitData.forEach((data, index) => {
      // console.log(\`\${ref.id}.\${key}_\${index}\`)
      newEventObject[\`auditRefs_\${index}\`] = data;
      // console.log(newEventObject[\`\${ref.id}.\${key}_\${index}\`])
    });
  } else {
    newEventObject[\`auditRefs\`] = stringifiedRefs;
  }
  return newEventObject;
};

categories.forEach((cat) => {
  const settings = {
    url,
    category: cat === "score" ? "performance" : cat,
    strategy,
  };
  const options = {
    method: "GET",
    url: \`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?key=\${PAGE_SPEED_KEY}\`,
    headers: null,
    qs: settings,
    json: true,
  };
  $http(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (response.statusCode == 200) {
        const {
          lighthouseResult: {
            categories: lightouseCategories,
            audits,
            timing,
            userAgent,
            stackPacks,
            lighthouseVersion,
            requestedUrl,
            runWarnings,
            configSettings,
            categoryGroups,
            i18n,
          },
        } = body;
        console.log(cat);
        var lighthouseMetrics = audits.metrics
          ? audits.metrics.details.items[0]
          : {};
        console.log({ lighthouseMetrics });
        let coreAttributes;

        switch (cat) {
          case "score":
            coreAttributes = {
              eventType: "lighthouseScores",
              performanceScore: lightouseCategories.performance.score,
            };
            for (var attributeName in lighthouseMetrics) {
              if (
                lighthouseMetrics.hasOwnProperty(attributeName) &&
                !attributeName.includes("Ts")
              ) {
                coreAttributes = {
                  ...coreAttributes,
                  [attributeName]: lighthouseMetrics[attributeName],
                };
              }
            }
            break;
          case "performance":
            const performanceAudits = Object.keys(audits).map((key) => {
              return audits[key];
            });
            const perfAuditCategories = Object.keys(lightouseCategories).map(
              (key) => lightouseCategories[key]
            );
            const performance = perfAuditCategories.find(
              (category) => category.id === "performance"
            );
            const performanceRefs = performance.auditRefs;

            coreAttributes = createEvent(
              performance,
              performanceRefs,
              performanceAudits
            );
            break;
          case "best-practices":
            const bestPracticeAudits = Object.keys(audits).map((key) => {
              return audits[key];
            });
            const bPAuditCategories = Object.keys(lightouseCategories).map(
              (key) => lightouseCategories[key]
            );
            const bestpractices = bPAuditCategories.find(
              (category) => category.id === "best-practices"
            );
            const bestpracticesRefs = bestpractices.auditRefs;
            coreAttributes = createEvent(
              bestpractices,
              bestpracticesRefs,
              bestPracticeAudits
            );
            break;
          case "seo":
            const seoAudits = Object.keys(audits).map((key) => {
              return audits[key];
            });
            const seoAuditCategories = Object.keys(lightouseCategories).map(
              (key) => lightouseCategories[key]
            );
            const seo = seoAuditCategories.find(
              (category) => category.id === "seo"
            );
            const seoRefs = seo.auditRefs;
            coreAttributes = createEvent(seo, seoRefs, seoAudits);
            break;
          case "pwa":
            const pwaAudits = Object.keys(audits).map((key) => {
              return audits[key];
            });
            const pwaCategories = Object.keys(lightouseCategories).map(
              (key) => lightouseCategories[key]
            );
            const pwa = pwaCategories.find((category) => category.id === "pwa");
            const pwaRefs = pwa.auditRefs;
            coreAttributes = createEvent(pwa, pwaRefs, pwaAudits);
            break;
          case "accessibility":
            const accessibilityAudits = Object.keys(audits).map((key) => {
              return audits[key];
            });
            const accessibilityAuditCategories = Object.keys(
              lightouseCategories
            ).map((key) => lightouseCategories[key]);
            const accessibility = accessibilityAuditCategories.find(
              (category) => category.id === "accessibility"
            );
            const accessibilityRefs = accessibility.auditRefs;
            coreAttributes = createEvent(
              accessibility,
              accessibilityRefs,
              accessibilityAudits
            );
            break;
          default:
            break;
        }

        console.log(coreAttributes);
        request.post({
          url: EVENT_URL,
          headers: headers,
          body: JSON.stringify({
            ...coreAttributes,
            timing,
            requestedUrl,
            syntheticLocation,
            deviceType: settings.strategy,
            userAgent,
            stackPacks,
            lighthouseVersion,
            runWarnings,
            configSettings,
            categoryGroups,
            i18n,
          }),
        });
      } else {
        console.log("Non-200 HTTP response: " + response.statusCode);
      }
    } else {
      console.log("Response code: " + response.statusCode);
      console.log(error);
    }
  });
});`;
