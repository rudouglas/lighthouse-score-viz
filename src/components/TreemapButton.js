import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  Grid,
  GridItem,
  NrqlQuery,
  Spinner,
  Button,
  Tile,
} from "nr1";
const zlib = require("zlib");

export default class TreemapButton extends React.Component {
  constructor(props) {
    super(props);

  }
  render() {
    const {metadata, treemapData} = this.props;
    const payload = {
      lhr: {
        requestedUrl: "https://developer.newrelic.com/",
        finalUrl: "https://developer.newrelic.com/",
        audits: {
          "script-treemap-data": treemapData,
        },
        configSettings: { locale: "en-US" },
      },
    };
    console.log({ treemapData, metadata });
    var deflated = zlib.deflateSync(JSON.stringify(payload)).toString("base64");
    console.log({ deflated });
    const url = "https://googlechrome.github.io/lighthouse/treemap/?gzip=1#";

    return (
      <Button
        iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART}
        type={Button.TYPE.PRIMARY}
        to={`${url}${deflated}`}
      >
        View Treemap
      </Button>
    );
  }
}
