import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  Grid,
  GridItem,
  NrqlQuery,
  Spinner,
  AutoSizer,
  Tile,
  Link,
  Table,
  TableHeaderCell,
  TableRow,
  TableHeader,
  TableRowCell,
} from "nr1";
import Accordion from "../../src/components/Accordion";
import { checkMeasurement, parseUrl, sortDetails } from "../../utils/helpers";
import DetailsTable from "./DetailsTable";

import "./accordion.css";

export default class Diagnostics extends React.Component {
  constructor(props) {
    super(props);
  }
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
              width={
                heading.key === "node"
                  ? "5%"
                  : heading.key === "url"
                  ? "60%"
                  : "20%"
              }
            >
              {heading.label || heading.text}
            </TableHeaderCell>
          ))}
        </TableHeader>

        {({ item }) => (
          <TableRow>
            {tableKeys.map((key) => {
              if (key === "url" && item[key].startsWith("http")) {
                const { value, additionalValue } = parseUrl(item[key]);
                return (
                  <TableRowCell additionalValue={`${additionalValue}`}>
                    <Link to={item["url"]}>{value}</Link>
                  </TableRowCell>
                );
              } else if (key === "node") {
                console.log(item["url"]);
                return (
                  <TableRowCell>
                    <img
                      src={item["url"]}
                      style={{ width: "24px", height: "24px" }}
                    />
                  </TableRowCell>
                );
              }
              const { valueType } = headings.filter(
                (heading) => heading.key === key
              )[0];
              const measurement = checkMeasurement(valueType, item[key]);
              console.log({ valueType });
              return <TableRowCell>{`${measurement}`}</TableRowCell>;
            })}
          </TableRow>
        )}
      </Table>
    );
  };

  render() {
    const { diagnostics: unsorted } = this.props;
    console.log({ unsorted });
    const diagnostics = sortDetails(unsorted);
    console.log({ diagnostics });
    return (
      <>
        <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]}>
          diagnostics
        </HeadingText>
        {diagnostics.map((diagnostic) => {
          return (
            <Accordion {...diagnostic}>
              {Object.entries(diagnostic).map((diag) => (
                <p>{JSON.stringify(diag)}</p>
              ))}
              {
                <div>
                  {diagnostic.details?.type === "table" && (
                    <DetailsTable details={diagnostic.details} />
                  )}
                </div>
              }
            </Accordion>
          );
        })}
      </>
    );
  }
}
