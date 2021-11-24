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
import { checkMeasurement, parseUrl } from "../../utils/helpers";

import "./accordion.css";

export default class DetailsTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { headings, items } = this.props.details;
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
              } else if (key === 'source') {
                const { value, additionalValue } = parseUrl(item['url']);
                return (
                  <TableRowCell additionalValue={`${additionalValue}`}>
                    <Link to={item["url"]}>{value}</Link>
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
  }
}