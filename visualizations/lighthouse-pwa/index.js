import React from "react";
import PropTypes from "prop-types";
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
import Opportunities from "../../src/components/Opportunities";
import Skipped from "../../src/components/Skipped";
import Passed from "../../src/components/Passed";
import Diagnostics from "../../src/components/Diagnostics";
import TreemapButton from "../../src/components/TreemapButton";
import Lighthouse from "../../src/components/Lighthouse";
import GenericGroup from "../../src/components/GenericGroup";
import { mainThresholds } from "../../utils/attributes";
import { convertAuditRef, getMainColor } from "../../utils/helpers";
import ScoreVisualization from "../../src/components/ScoreVisualization";
const zlib = require("zlib");

export default class LighthousePWAVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    showNull: PropTypes.Boolean,
    showManual: PropTypes.Boolean,
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
   * [{'key':'url','valueType':'url','label':'URL'},{'valueType':'bytes','key':'totalBytes','label':'Transfer Size'},{'key':'wastedMs','label':'Potential Savings','valueType':'timespanMs'}
   */

  transformData = (rawData) => {
    const auditRefObject = convertAuditRef(rawData);

    const pwaOptimized = auditRefObject.filter(
      (audit) =>
        !["manual", "notApplicable"].includes(audit.scoreDisplayMode) &&
        !["installable-manifest"].includes(audit.id)
    );
    const manualGroup = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "manual"
    );
    const notApplicable = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "notApplicable"
    );
    const installable = auditRefObject.filter(
      (audit) => audit.id === "installable-manifest"
    );
    return {
      pwaOptimized,
      installable,
      manualGroup,
      notApplicable,
    };
  };

  render() {
    const { nrqlQueries, showPassed, showManual, showNotApplicable } =
      this.props;

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
              const { manualGroup, notApplicable, installable, pwaOptimized } =
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
                        Progressive Web App
                      </HeadingText>
                      <BlockText
                        style={{ fontSize: "12px" }}
                        spacingType={[BlockText.SPACING_TYPE.MEDIUM]}
                      >
                        These checks validate the aspects of a Progressive Web
                        App.{" "}
                        <Link to="https://developers.google.com/web/progressive-web-apps/checklist">
                          Learn More.
                        </Link>
                      </BlockText>
                      <Lighthouse />
                    </StackItem>
                  </Stack>
                  <GenericGroup
                    group={installable}
                    title="Installable"
                    description=""
                  />
                  <GenericGroup
                    group={pwaOptimized}
                    title="PWA Optimized"
                    description=""
                  />
                  {showNotApplicable && (
                    <GenericGroup
                      group={notApplicable}
                      title="Not Applicable"
                      description=""
                    />
                  )}
                  {showManual && (
                    <GenericGroup
                      group={manualGroup}
                      title="Additional items to check manually"
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
