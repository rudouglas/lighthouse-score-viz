import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
  Stack,
  StackItem,
} from "nr1";
import Opportunities from "../../src/components/Opportunities";
import Skipped from "../../src/components/Skipped";
import Passed from "../../src/components/Passed";
import Diagnostics from "../../src/components/Diagnostics";
import TreemapButton from "../../src/components/TreemapButton";
import Lighthouse from "../../src/components/Lighthouse";
import { mainThresholds } from "../../utils/attributes";
import { getMainColor } from "../../utils/helpers";
import ScoreVisualization from "../../src/components/ScoreVisualization";

const zlib = require("zlib");

export default class LighthouseBestPracticesVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    showPassed: PropTypes.Boolean,
    showNull: PropTypes.Boolean,
    /**
     * An array of objects consisting of a nrql `query` and `accountId`.
     * This should be a standard prop for any NRQL based visualizations.
     */
    nrqlQueries: PropTypes.arrayOf(
      PropTypes.shape({
        accountId: PropTypes.number,
        query: PropTypes.string,
      })
    ),
  };

  /**
   * Restructure the data for a non-time-series, facet-based NRQL query into a
   * form accepted by the Recharts library's RadarChart.
   * (https://recharts.org/api/RadarChart).
   */
  transformData = (rawData) => {
    // console.log({ rawData });
    const { showNull } = this.props;
    const auditRefs = Object.keys(rawData)
      .filter((key) => key.includes("auditRefs_"))
      .reduce((res, key) => ((res[key] = rawData[key]), res), {});
    // console.log({ auditRefs });
    const auditRefString = Object.keys(auditRefs).map(
      (key, index) => auditRefs[`auditRefs_${index}`]
    );

    const auditRefObject = JSON.parse(auditRefString.join(""));
    const treemapData = auditRefObject.find(
      (ref) => ref.details?.type === "treemap-data"
    );
    const allOpportunities = auditRefObject.filter(
      (audit) => audit.details && audit.details.type == "opportunity"
    );
    const opportunities = allOpportunities.filter(
      (opp) => opp.score > 0 && opp.score < mainThresholds.good / 100
    );

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
    const passed = auditRefObject.filter(
      (audit) => audit.score && audit.score >= mainThresholds.good / 100
    );
    const everythingElse = auditRefObject.filter(
      (audit) => !audit.details || audit.details.type !== "opportunity"
    );
    return {
      treemapData,
      diagnostics,
      auditRefObject,
      opportunities,
      passed,
    };
  };

  /**
   * Format the given axis tick's numeric value into a string for display.
   */
  formatTick = (value) => {
    return value.toLocaleString();
  };

  render() {
    const { nrqlQueries, showPassed } = this.props;

    const nrqlQueryPropsAvailable =
      nrqlQueries &&
      nrqlQueries[0] &&
      nrqlQueries[0].accountId &&
      nrqlQueries[0].query;

    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }

    return (
      <AutoSizer>
        {({ width, height }) => (
          <NrqlQuery
            query={nrqlQueries[0].query}
            accountId={parseInt(nrqlQueries[0].accountId)}
            pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
          >
            {({ data, loading, error }) => {
              if (loading) {
                return <Spinner />;
              }

              if (error) {
                return <ErrorState />;
              }
              const resultData = data[0].data[0];
              const {
                timestamp,
                id,
                lighthouseVersion,
                customEventSource,
                requestedUrl,
                finalUrl,
                locale,
                score,
                title,
                userAgent,
                x,
              } = resultData;
              // fs.writeFileSync('thing.json', String(resultData))
              console.log({ score });
              const scoreBy100 = score * 100;
              const color = getMainColor(scoreBy100);
              console.log({ color });
              const series = [
                { x: "progress", y: scoreBy100, color },
                { x: "remainder", y: 100 - scoreBy100, color: "transparent" },
              ];
              const metadata = data[0].metadata;
              // console.log(JSON.stringify(metadata))
              const { treemapData, diagnostics, opportunities, passed } =
                this.transformData(resultData);
              // console.log({ auditRefObject, opportunities });
              return (
                <>
                  <Stack
                    directionType={Stack.DIRECTION_TYPE.VERTICAL}
                    style={{
                      textAlign: "center",
                      width: "100%",
                      alignItems: "center",
                      paddingTop: "15px",
                    }}
                  >
                    <StackItem style={{ width: "200px" }}>
                      <ScoreVisualization
                        score={scoreBy100}
                        color={color}
                        series={series}
                      />
                    </StackItem>
                    <StackItem>
                      <HeadingText
                        type={HeadingText.TYPE.HEADING_1}
                        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                      >
                        Best Practices
                      </HeadingText>
                      <Lighthouse />
                    </StackItem>
                  </Stack>

                  {opportunities.length > 0 && (
                    <Opportunities
                      opportunities={opportunities}
                      visualization="Performance"
                    />
                  )}
                  <Diagnostics
                    diagnostics={diagnostics}
                    visualization="Performance"
                  />
                  {showPassed && <Passed passed={passed} />}
                </>
              );
            }}
          </NrqlQuery>
        )}
      </AutoSizer>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide at least one NRQL query & account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        An example NRQL query you can try is:
      </HeadingText>
      <code>
        FROM lighthouseBestPractices SELECT * WHERE requestedUrl =
        'https://developer.newrelic.com/' LIMIT 1
      </code>
    </CardBody>
  </Card>
);

const ErrorState = () => (
  <Card className="ErrorState">
    <CardBody className="ErrorState-cardBody">
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Oops! Something went wrong.
      </HeadingText>
    </CardBody>
  </Card>
);
