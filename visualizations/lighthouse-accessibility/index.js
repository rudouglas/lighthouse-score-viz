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
  Stack,
  StackItem,
} from "nr1";
import Opportunities from "../../src/components/Opportunities";
import Skipped from "../../src/components/Skipped";
import Passed from "../../src/components/Passed";
import Diagnostics from "../../src/components/Diagnostics";
import TreemapButton from "../../src/components/TreemapButton";
import Lighthouse from "../../src/components/Lighthouse";
import ManualGroup from "../../src/components/ManualGroup";
import GenericGroup from "../../src/components/GenericGroup";
import { mainThresholds } from "../../utils/attributes";
import { getMainColor } from "../../utils/helpers";
import ScoreVisualization from "../../src/components/ScoreVisualization";
import { manual } from "prismjs/components/prism-core";
const zlib = require("zlib");

export default class LighthouseAccessibilityVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    showPassed: PropTypes.Boolean,
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
    console.log({ diagnostics });
    const ariaGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-aria"
    );
    const namesLabelsGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-names-labels"
    );
    const contrastGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-color-contrast"
    );
    const navigationGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-navigation"
    );
    const languageGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-language"
    );
    const tablesListsGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-tables-lists"
    );
    const manualGroup = auditRefObject.filter(
      (audit) => audit.scoreDisplayMode === "manual"
    );
    const bestPracticeGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-best-practices"
    );
    const audioVideoGroup = diagnostics.filter(
      (audit) => audit.group === "a11y-audio-video"
    );
    const groups1 = diagnostics.map((audit) => audit.group);
    const groups2 = [...new Set(auditRefObject.map((audit) => audit.group))];
    console.log({ groups1, groups2 });
    const passed = auditRefObject.filter(
      (audit) => audit.score && audit.score >= mainThresholds.good / 100
    );
    return {
      notApplicable,
      ariaGroup,
      namesLabelsGroup,
      contrastGroup,
      navigationGroup,
      languageGroup,
      tablesListsGroup,
      manualGroup,
      bestPracticeGroup,
      auditRefObject,
      passed,
      audioVideoGroup,
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
              const { title } = resultData;
              let score = resultData.score * 100;
              console.log({ score });
              const color = getMainColor(score);
              console.log({ color });
              const series = [
                { x: "progress", y: score, color },
                { x: "remainder", y: 100 - score, color: "transparent" },
              ];
              // fs.writeFileSync('thing.json', String(resultData))
              const metadata = data[0].metadata;
              // console.log(JSON.stringify(metadata))
              const {
                notApplicable,
                ariaGroup,
                namesLabelsGroup,
                contrastGroup,
                navigationGroup,
                languageGroup,
                tablesListsGroup,
                manualGroup,
                bestPracticeGroup,
                audioVideoGroup,
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
                        Accessibility
                      </HeadingText>
                      <BlockText
                        style={{ fontSize: "1.4em", lineHeight: "2em" }}
                        spacingType={[BlockText.SPACING_TYPE.MEDIUM]}
                      >
                        These checks highlight opportunities to{" "}
                        <Link to="https://developers.google.com/web/fundamentals/accessibility?utm_source=lighthouse&utm_medium=node">
                          improve the accessibility of your web app
                        </Link>
                        . Only a subset of accessibility issues can be
                        automatically detected so manual testing is also
                        encouraged.{" "}
                      </BlockText>
                      <Lighthouse />
                    </StackItem>
                  </Stack>
                  {namesLabelsGroup.length > 0 && (
                    <GenericGroup
                      group={namesLabelsGroup}
                      title="Names and Labels"
                      description=""
                    />
                  )}
                  {ariaGroup.length > 0 && (
                    <GenericGroup
                      group={ariaGroup}
                      title="Aria"
                      description=""
                    />
                  )}
                  {contrastGroup.length > 0 && (
                    <GenericGroup
                      group={contrastGroup}
                      title="Contrast"
                      description=""
                    />
                  )}
                  {navigationGroup.length > 0 && (
                    <GenericGroup
                      group={navigationGroup}
                      title="Navigation"
                      description=""
                    />
                  )}
                  {languageGroup.length > 0 && (
                    <GenericGroup
                      group={languageGroup}
                      title="Language"
                      description=""
                    />
                  )}
                  {tablesListsGroup.length > 0 && (
                    <GenericGroup
                      group={tablesListsGroup}
                      title="Tables and Lists"
                      description=""
                    />
                  )}
                  {bestPracticeGroup.length > 0 && (
                    <GenericGroup
                      group={bestPracticeGroup}
                      title="Best Practices"
                      description=""
                    />
                  )}
                  {audioVideoGroup.length > 0 && (
                    <GenericGroup
                      group={audioVideoGroup}
                      title="Audio and Video"
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
        FROM lighthouseAccessibility SELECT * WHERE requestedUrl =
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
