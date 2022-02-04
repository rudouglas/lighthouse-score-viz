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
import GenericGroup from "../../src/components/GenericGroup";
import Passed from "../../src/components/Passed";
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
    showNotApplicable: PropTypes.Boolean,
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
    console.log({ auditRefObject });
    const allOpportunities = auditRefObject.filter(
      (audit) => audit.details && audit.details.type == "opportunity"
    );
    console.log({ allOpportunities });
    const opportunities = allOpportunities.filter(
      (opp) => opp.score > 0 && opp.score < mainThresholds.good / 100
    );
    const notApplicable = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "notApplicable"
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

    const generalGroup = diagnostics.filter(
      (audit) => audit.group === "best-practices-general"
    );
    const browserCompatGroup = diagnostics.filter(
      (audit) => audit.group === "best-practices-browser-compat"
    );
    const uxGroup = diagnostics.filter(
      (audit) => audit.group === "best-practices-ux"
    );
    const trustSafetyGroup = diagnostics.filter(
      (audit) => audit.group === "best-practices-trust-safety"
    );
    console.log({
      generalGroup,
      browserCompatGroup,
      uxGroup,
      trustSafetyGroup,
    });
    const passed = auditRefObject.filter(
      (audit) => audit.score && audit.score >= mainThresholds.good / 100
    );

    return {
      generalGroup,
      notApplicable,
      browserCompatGroup,
      uxGroup,
      trustSafetyGroup,
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
    const { nrqlQueries, showPassed, showNotApplicable } = this.props;

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

              const { title } = resultData;
              let score = resultData.score * 100;
              console.log({ score });
              const color = getMainColor(score);
              console.log({ color });
              const series = [
                { x: "progress", y: score, color },
                { x: "remainder", y: 100 - score, color: "transparent" },
              ];
              const metadata = data[0].metadata;
              // console.log(JSON.stringify(metadata))
              const {
                generalGroup,
                browserCompatGroup,
                uxGroup,
                trustSafetyGroup,
                notApplicable,
                opportunities,
                passed,
              } = this.transformData(resultData);
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
                        score={score}
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
                  {generalGroup.length > 0 && (
                    <GenericGroup
                      group={generalGroup}
                      title="General"
                      description=""
                    />
                  )}
                  {browserCompatGroup.length > 0 && (
                    <GenericGroup
                      group={browserCompatGroup}
                      title="Browser Compatibility"
                      description=""
                    />
                  )}
                  {uxGroup.length > 0 && (
                    <GenericGroup group={uxGroup} title="UX" description="" />
                  )}
                  {trustSafetyGroup.length > 0 && (
                    <GenericGroup
                      group={trustSafetyGroup}
                      title="Trust & Safety"
                      description=""
                    />
                  )}
                  {showPassed && <Passed passed={passed} />}
                  {showNotApplicable && notApplicable.length > 0 && (
                    <GenericGroup
                      group={notApplicable}
                      title="Not applicable"
                      description=""
                    />
                  )}
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
