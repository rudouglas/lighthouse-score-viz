import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
  Link,
  Table,
  TableHeaderCell,
  TableRow,
  TableHeader,
  TableRowCell,
} from "nr1";
import Accordion from "../../src/components/Accordion";
import { mainThresholds } from "../../utils/attributes";
import { checkMeasurement, parseUrl } from "../../utils/helpers";
export default class LighthousePerformanceVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    /**
     * A fill color to override the default fill color. This is an example of
     * a custom chart configuration.
     */
    fill: PropTypes.string,

    /**
     * A stroke color to override the default stroke color. This is an example of
     * a custom chart configuration.
     */
    stroke: PropTypes.string,
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
  createOpportunityTable = (details) => {
    const { headings, items } = details;
    const tableKeys = headings.map((heading) => {
      return heading.key;
    });
    return (
      <Table items={items} multivalue>
        <TableHeader>
          {headings.map((heading) => (
            <TableHeaderCell
              value={({ item }) => item[heading.key]}
              width={heading.key === 'node' ? "5%" : heading.key === 'url' ? "60%" : "20%"}
            >
              {heading.label}
            </TableHeaderCell>
          ))}
        </TableHeader>

        {({ item }) => (
          <TableRow>
            {tableKeys.map((key) => {
              if (key === "url" && item[key].startsWith("http")) {
                const { value, additionalValue } = parseUrl(item[key]);
                  return (
                    <TableRowCell
                      additionalValue={`${additionalValue}`}
                    ><Link to={item['url']}>{value}</Link></TableRowCell>
                  );
              } else if (key === 'node') {
                console.log(item['url'])
                return <TableRowCell><img src={item['url']} style={{ width: '24px', height: '24px'}}/></TableRowCell>;
              }
              const {valueType} = headings.filter((heading) => heading.key === key)[0];
              const measurement = checkMeasurement(valueType, item[key]);
              console.log({valueType})
              return <TableRowCell>{`${measurement}`}</TableRowCell>;
            
            })}
          </TableRow>
        )}
      </Table>
    );
  };
  transformData = (rawData) => {
    // console.log({ rawData });
    const auditRefs = Object.keys(rawData)
      .filter((key) => key.includes("auditRefs_"))
      .reduce((res, key) => ((res[key] = rawData[key]), res), {});
    // console.log({ auditRefs });
    const auditRefString = Object.keys(auditRefs).map(
      (key, index) => auditRefs[`auditRefs_${index}`]
    );
    // console.log({ auditRefString });
    const auditRefObject = JSON.parse(auditRefString.join(""));
    const allOpportunities = auditRefObject.filter(
      (audit) => audit.details && audit.details.type == "opportunity"
    );
    const opportunities = allOpportunities.filter(opp => opp.score > 0 && opp.score < (mainThresholds.good / 100) );
    // console.log({ opportunities });
    const passed = allOpportunities.filter(opp => opp.score >= (mainThresholds.good / 100) );
    const skipped = allOpportunities.filter(opp => !opp.score);
    return { auditRefObject, opportunities, passed, skipped };
  };

  /**
   * Format the given axis tick's numeric value into a string for display.
   */
  formatTick = (value) => {
    return value.toLocaleString();
  };

  render() {
    const { nrqlQueries, stroke, fill } = this.props;

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
                score,
                title,
                userAgent,
                x,
              } = resultData;
              // fs.writeFileSync('thing.json', String(resultData))
              const metadata = data[0].metadata;
              // console.log(JSON.stringify(metadata))
              const { auditRefObject, opportunities, passed, skipped } =
                this.transformData(resultData);
              // console.log({ auditRefObject, opportunities });
              return skipped.map((opportunity) => {
                return (
                  <Accordion
                    {...opportunity}
                  >
                    {Object.entries(opportunity).map((opp) => (
                      <p>{JSON.stringify(opp)}</p>
                    ))}
                    {
                      <div>
                        {this.createOpportunityTable(opportunity.details)}
                      </div>
                    }
                  </Accordion>
                );
              });
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
      <code>FROM NrUsage SELECT sum(usage) FACET metric SINCE 1 week ago</code>
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
