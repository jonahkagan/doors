import React from "react";
import _ from "lodash";

import FourSquare from "./FourSquare";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <FourSquare />;
  }
}
