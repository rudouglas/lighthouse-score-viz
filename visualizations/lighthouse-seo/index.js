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
import Passed from "../../src/components/Passed";
import Diagnostics from "../../src/components/Diagnostics";
import Lighthouse from "../../src/components/Lighthouse";
import GenericGroup from "../../src/components/GenericGroup";
import { mainThresholds } from "../../utils/attributes";
import { convertAuditRef, getMainColor } from "../../utils/helpers";
import ScoreVisualization from "../../src/components/ScoreVisualization";
const zlib = require("zlib");

export default class LighthouseSeoVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    showPassed: PropTypes.Boolean,
    showManual: PropTypes.Boolean,
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
   * [{'key':'url','valueType':'url','label':'URL'},{'valueType':'bytes','key':'totalBytes','label':'Transfer Size'},{'key':'wastedMs','label':'Potential Savings','valueType':'timespanMs'}
   */

  transformData = (rawData) => {
    const { showNull } = this.props;
    const auditRefObject = convertAuditRef(rawData);
    console.log({ auditRefObject });
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
    console.log({ diagnostics });
    const contentGroup = auditRefObject.filter(
      (audit) =>
        audit.group === "seo-content" &&
        audit.score !== null &&
        audit.score < mainThresholds.good / 100
    );
    const crawlGroup = auditRefObject.filter(
      (audit) =>
        audit.group === "seo-crawl" &&
        audit.score !== null &&
        audit.score < mainThresholds.good / 100
    );
    const mobileGroup = auditRefObject.filter(
      (audit) =>
        audit.group === "seo-mobile" &&
        audit.score !== null &&
        audit.score < mainThresholds.good / 100
    );
    const groups1 = [...new Set(diagnostics.map((audit) => audit.group))];
    const groups2 = [...new Set(auditRefObject.map((audit) => audit.group))];
    console.log({ groups1, groups2 });
    const passed = auditRefObject.filter(
      (audit) => audit.score && audit.score >= mainThresholds.good / 100
    );

    const manualGroup = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "manual"
    );
    const notApplicable = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "notApplicable"
    );
    return {
      auditRefObject,
      opportunities,
      passed,
      manualGroup,
      notApplicable,
      contentGroup,
      crawlGroup,
      mobileGroup,
    };
  };

  render() {
    const { nrqlQueries, showPassed, showNotApplicable, showManual } =
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
              const {
                opportunities,
                passed,
                manualGroup,
                notApplicable,
                contentGroup,
                crawlGroup,
                mobileGroup,
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
                        SEO
                      </HeadingText>
                      <BlockText
                        style={{ fontSize: "1.4em", lineHeight: "2em" }}
                        spacingType={[BlockText.SPACING_TYPE.MEDIUM]}
                      >
                        These checks ensure that your page is following basic
                        search engine optimization advice. There are many
                        additional factors Lighthouse does not score here that
                        may affect your search ranking, including performance on{" "}
                        <Link to="https://web.dev/learn-web-vitals/">
                          Core Web Vitals
                        </Link>
                        .{" "}
                        <Link to="https://support.google.com/webmasters/answer/35769">
                          Learn more
                        </Link>
                        .
                      </BlockText>
                      <Lighthouse />
                    </StackItem>
                  </Stack>
                  {contentGroup.length > 0 && (
                    <GenericGroup
                      group={contentGroup}
                      title="Content Best Practices"
                      description=""
                    />
                  )}
                  {crawlGroup.length > 0 && (
                    <GenericGroup
                      group={crawlGroup}
                      title="Crawl Best Practices"
                      description=""
                    />
                  )}
                  {mobileGroup.length > 0 && (
                    <GenericGroup
                      group={mobileGroup}
                      title="Mobile Friendly"
                      description=""
                    />
                  )}
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
        FROM lighthouseSeo SELECT * WHERE requestedUrl =
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
