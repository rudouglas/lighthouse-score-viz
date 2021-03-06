import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  Spinner,
  Grid,
  GridItem,
  Link,
  navigation,
  BlockText,
  Button,
  Select,
  SelectItem,
  CheckboxGroup,
  Checkbox,
  TextField,
  Form,
  CardSection,
  AccountPicker,
} from "nr1";
import { scoreScript } from "../../../src/utils/constants";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
export default class BuildScriptModal extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      hidden: true,
      freqValue: "15",
      strategy: "desktop",
      selectedAudits: [
        "performance",
        "accessibility",
        "best-practices",
        "pwa",
        "seo",
      ],
      url: "",
      monitorName:
        "LighthouseScores - https://www.example.com (Desktop)",
      nrLicenseKey: "",
      pageSpeedApiKey: "",
      isValid: true,
      urlStatus: 0,
      code: scoreScript,
      scriptLoading: false,
    };
  }

  _onClose = () => {
    this.setState({
      hidden: true,
    });
  };
  _onSelectAudits = (evt, value) => {
    this.setState({ selectedAudits: value });
  };
  _onSelectStrategy = (evt, value) => {
    const { url } = this.state;

    this.setState({
      strategy: value,
      monitorName: `LighthouseScores - ${url} (${value})`,
    });
  };

  _setUrl = (evt) => {
    const { value } = evt.target;
    const { strategy } = this.state;
    this.setState({
      url: value,
      monitorName: `LighthouseScores - ${value} (${strategy
        .charAt(0)
        .toUpperCase()}${strategy.slice(1)})`,
    });
  };

  _onSelectLocation = (evt, value) => {
    this.setState({ selectedLocation: value });
  };

  _setMonitorName = (evt) => {
    const { value } = evt.target;
    this.setState({
      monitorName: value,
    });
  };

  _setAccountId = (evt, value) => {
    this.setState({
      accountId: value,
    });
  };

  _setPageSpeedApiKey = (evt) => {
    const { value } = evt.target;
    this.setState({
      pageSpeedApiKey: value,
    });
  };

  _setNrLicenseKey = (evt) => {
    const { value } = evt.target;
    this.setState({
      nrLicenseKey: value,
    });
  };

  _buildScript = async () => {
    const { hostname } = window.location;
    this.setState({ scriptLoading: true });
    const { selectedAudits, url, strategy, nrLicenseKey, pageSpeedApiKey } =
      this.state;
    const { accountId } = this.props;
    let isValid =
      Object.values({
        url,
        nrLicenseKey,
        accountId,
        pageSpeedApiKey,
        accountId,
      }).filter((v) => v.length === 0).length === 0;

    try {
      if (url) {
        const res = await fetch(url, {
          method: "GET",
        });
        this.setState({ urlStatus: res.status });

        if (res.status >= 400) {
          isValid = false;
          this.setState({ isValid: false });
        }
      } else {
        isValid = false;
        this.setState({ isValid: false });
      }
    } catch (e) {
      isValid = false;
      this.setState({ isValid: false, urlStatus: e.message });
    }

    if (!isValid) {
      return this.setState({ isValid });
    }

    const staging =
      hostname.includes("staging") || !hostname.includes("newrelic.com")
        ? "staging-"
        : "";
    const geo = hostname.includes("eu") ? "eu01.nr-data.net" : "newrelic.com";
    const event_url = `https://${staging}insights-collector.${geo}/v1/accounts/${accountId}/events`;

    const newScript = `const categories = [${selectedAudits.map(
      (aud) => `"${aud}"`
    )}];
const url = "${url}";
const strategy = '${strategy}';
const USER_API_KEY = ${
      nrLicenseKey.startsWith("$secure") ? nrLicenseKey : `'${nrLicenseKey}'`
    };
const PAGE_SPEED_KEY = ${
      pageSpeedApiKey.startsWith("$secure")
        ? pageSpeedApiKey
        : `'${pageSpeedApiKey}'`
    };
const ACCOUNT_ID = '${accountId}';
const EVENT_URL = '${event_url}';
      ${scoreScript}
    `;

    this.setState({ code: newScript, showScript: true, scriptLoading: false });
  };

  render() {
    const {
      strategy,
      selectedAudits,
      url,
      monitorName,
      nrLicenseKey,
      pageSpeedApiKey,
      isValid,
      urlStatus,
      code,
      showScript,
      scriptLoading,
    } = this.state;
    const { accountId } = this.props;

    return (
      <Card>
        <CardBody>
          <HeadingText
            spacingType={[HeadingText.SPACING_TYPE.LARGE]}
            type={HeadingText.TYPE.HEADING_2}
          >
            Build your script
          </HeadingText>
          <CardSection />
          <Card>
            <CardBody>
              <Grid>
                <GridItem columnSpan={4}>
                  <Form>
                    <AccountPicker
                      value={accountId}
                      onChange={this._setAccountId}
                      label="Account"
                      invalid={
                        !isValid && !accountId ? "Please select an account" : ""
                      }
                      required
                    />
                    <TextField
                      placeholder="https://www.example.com"
                      value={url}
                      onChange={this._setUrl}
                      label="URL"
                      style={{ width: "100%" }}
                      invalid={
                        (!isValid && !url) ||
                        urlStatus >= 400 ||
                        typeof urlStatus !== "number"
                          ? "Please enter a valid URL"
                          : ""
                      }
                      description={urlStatus && `Status: ${urlStatus}`}
                      required
                      autoFocus
                    />
                    <Select
                      description="Description value"
                      label="Select strategy"
                      info="Info value"
                      value={strategy}
                      onChange={this._onSelectStrategy}
                    >
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </Select>
                    <CheckboxGroup
                      label="Select Audits"
                      value={selectedAudits}
                      onChange={this._onSelectAudits}
                      required
                    >
                      <Checkbox
                        disabled
                        label="Performance"
                        value="performance"
                      />
                      <Checkbox label="Accessibility" value="accessibility" />
                      <Checkbox label="Best Practices" value="best-practices" />
                      <Checkbox label="PWA" value="pwa" />
                      <Checkbox label="SEO" value="seo" />
                    </CheckboxGroup>
                    <Link
                      onClick={() =>
                        navigation.openLauncher({
                          id: "api-keys-ui.home",
                        })
                      }
                      target="_blank"
                    >
                      Get License Key
                    </Link>
                    <TextField
                      label="New Relic License Key"
                      placeholder="NRAK-XXX or $secure.LICENSE_KEY"
                      value={nrLicenseKey}
                      invalid={
                        !isValid &&
                        !nrLicenseKey &&
                        "Please enter a New Relic License Key"
                      }
                      info="This is for the account you want the Events to report to"
                      style={{ width: "100%" }}
                      onChange={this._setNrLicenseKey}
                      required
                    />
                    <Link to="https://developers.google.com/speed/docs/insights/v5/get-started#APIKey">
                      Generate PageSpeed API Key
                    </Link>
                    <TextField
                      label="PageSpeed API Key"
                      placeholder="XXX or $secure.PAGESPEED_API_KEY"
                      value={pageSpeedApiKey}
                      invalid={
                        !isValid &&
                        !pageSpeedApiKey &&
                        "Please enter a PageSpeed API key"
                      }
                      style={{ width: "100%" }}
                      onChange={this._setPageSpeedApiKey}
                      required
                    />

                    <TextField
                      label="Suggested monitor name"
                      placeholder="XXX or $secure.PAGESPEED_API_KEY"
                      value={monitorName}
                      style={{ width: "100%" }}
                      readOnly
                    />
                  </Form>
                </GridItem>
                <GridItem columnSpan={1}>
                  <Card>
                    <CardBody>
                      <Button
                        iconType={
                          Button.ICON_TYPE
                            .INTERFACE__CHEVRON__CHEVRON_RIGHT__WEIGHT_BOLD__SIZE_8
                        }
                        type={Button.TYPE.PRIMARY}
                        onClick={this._buildScript}
                      >
                        Build
                      </Button>
                    </CardBody>
                  </Card>
                </GridItem>
                <GridItem columnSpan={7}>
                  {scriptLoading && <Spinner type={Spinner.TYPE.DOT} />}
                  {showScript && (
                    <Card>
                      <CardBody>
                        <HeadingText
                          spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                          type={HeadingText.TYPE.HEADING_4}
                        >
                          Scripted API monitor
                        </HeadingText>
                        <BlockText
                          spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                        >
                          Create a Synthetics scripted API monitor with the
                          settings you've provided to ensure we can perform the
                          correct data correlation
                        </BlockText>
                        <Editor
                          className="language-javascript"
                          value={code}
                          onValueChange={(code) => this.setState({ code })}
                          highlight={(code) => highlight(code, languages.js)}
                          padding={10}
                          style={{
                            backgroundColor: "#f5f5f5",
                            maxHeight: "450px",
                            overflow: "auto",
                            fontFamily:
                              "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                            fontSize: 12,
                          }}
                        />
                      </CardBody>
                    </Card>
                  )}
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </CardBody>
      </Card>
    );
  }
}
