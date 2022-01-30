import React from "react";
import PropTypes from "prop-types";
import { VictoryPie, VictoryAnimation, VictoryLabel } from "victory";

import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
  Button,
  BlockText,
  Link,
  Table,
  TableHeaderCell,
  TableRow,
  TableHeader,
  TableRowCell,
  Stack,
  StackItem,
} from "nr1";
import { baseLabelStyles } from "../../src/theme";
import Opportunities from "../../src/components/Opportunities";
import Skipped from "../../src/components/Skipped";
import Passed from "../../src/components/Passed";
import Diagnostics from "../../src/components/Diagnostics";
import TreemapButton from "../../src/components/TreemapButton";
import Lighthouse from "../../src/components/Lighthouse";
import ScoreVisualization from "../../src/components/ScoreVisualization";
import { mainThresholds } from "../../utils/attributes";
import { getMainColor } from "../../utils/helpers";
const zlib = require("zlib");
import { QUANTILE_AT_VALUE } from "../../utils/math.js";
const BOUNDS = {
  X: 300,
  Y: 300,
};

const LABEL_SIZE = 20;
const LABEL_PADDING = 10;
const CHART_WIDTH = BOUNDS.X + LABEL_PADDING * 2;
const CHART_HEIGHT = BOUNDS.Y + LABEL_SIZE;

export default class LighthousePerformanceVisualization extends React.Component {
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
   * [{'key':'url','valueType':'url','label':'URL'},{'valueType':'bytes','key':'totalBytes','label':'Transfer Size'},{'key':'wastedMs','label':'Potential Savings','valueType':'timespanMs'}
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
              console.log({ score });
              const scoreBy100 = score * 100;
              const color = getMainColor(scoreBy100);
              console.log({ color });
              const series = [
                { x: "progress", y: scoreBy100, color },
                { x: "remainder", y: 100 - scoreBy100, color: "transparent" },
              ];
              // fs.writeFileSync('thing.json', String(resultData))
              const metadata = data[0].metadata;
              // console.log(JSON.stringify(metadata))
              const { treemapData, diagnostics, opportunities, passed } =
                this.transformData(resultData);
              // console.log({ auditRefObject, opportunities });
              return (
                <>
                  <Stack
                    directionType={Stack.DIRECTION_TYPE.VERTICAL}
                    style={{ textAlign: "center", width: "100%", alignItems: "center", paddingTop: "15px" }}
                  >
                    <StackItem style={{width: "200px"}}>
                      <ScoreVisualization score={scoreBy100} color={color} series={series} />
                    </StackItem>
                    <StackItem>
                      <HeadingText
                        type={HeadingText.TYPE.HEADING_1}
                        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                      >
                        Performance
                      </HeadingText>
                      <BlockText
                        style={{ fontSize: "12px" }}
                        spacingType={[BlockText.SPACING_TYPE.MEDIUM]}
                      >
                        Values are estimated and may vary. The{" "}
                        <Link to="https://web.dev/performance-scoring/?utm_source=lighthouse&utm_medium=node">
                          performance score is calculated
                        </Link>{" "}
                        directly from these metrics.{" "}
                        <Link to="https://googlechrome.github.io/lighthouse/scorecalc/#FCP=3603&SI=4617&LCP=3758&TTI=23188&TBT=4641&CLS=0&FMP=3603&device=mobile&version=8.6.0">
                          See calculator
                        </Link>
                        .
                      </BlockText>
                      <TreemapButton
                        metadata={metadata}
                        treemapData={treemapData}
                        finalUrl={finalUrl}
                        requestedUrl={requestedUrl}
                        locale={locale}
                      />
                      {"   "}
                      <Lighthouse />
                    </StackItem>
                  </Stack>

                  <Opportunities
                    opportunities={opportunities}
                    visualization="Performance"
                  />
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
        Please provide a single NRQL query & account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        An example NRQL query you can try is:
      </HeadingText>
      <code>
        FROM lighthousePerformance SELECT * WHERE requestedUrl =
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
