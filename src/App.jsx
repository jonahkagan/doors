import React from "react";
import _ from "lodash";

import FourSquare from "./FourSquare";
import Reverb from "./Reverb";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 1
    };
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentWillMount() {
    document.addEventListener("keydown", this.onKeyDown);
    console.log("mount");
  }

  onKeyDown(e) {
    const index = parseInt(e.key, 10);
    if (index > 0) {
      this.setState({ index });
    }
  }

  render() {
    switch (this.state.index) {
      case 1:
        return <Reverb />;
      case 2:
        return <FourSquare />;
      default:
        return <div style={{ marginTop: 10 }}>We can't count that high</div>;
    }
  }
}
