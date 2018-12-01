import React from "react";
import _ from "lodash";
import getBlobDuration from "get-blob-duration";
import classNames from "classnames";
import ReactCountdownClock from "react-countdown-clock";

const createObjectURL = _.memoize(URL.createObjectURL);

export default class FourSquare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recorder: null,
      recordingState: "none", // none or recording
      recording: null,
      duration: null,
      mirrored: false
    };
    this.webcam = null;

    this.onKey = this.onKey.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  async componentDidMount() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.webcam.srcObject = stream;
    this.setState({ recorder: new MediaRecorder(stream) });
  }

  componentWillMount() {
    document.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKey);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKey);
  }

  async startRecording() {
    const { recorder, recordings, duration } = this.state;

    this.setState({
      recordingState: "recording"
    });

    const data = [];
    recorder.ondataavailable = event => {
      data.push(event.data);
      if (duration) {
        this.stopRecording();
      }
    };
    recorder.start(duration && duration * 1000);

    await new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.name);
      setTimeout(resolve, 60 * 1000);
    });

    const recordedBlob = new Blob(data, { type: "video/webm" });
    if (this.state.recordingState == "recording") {
      this.setState({
        duration: !duration ? await getBlobDuration(recordedBlob) : duration,
        recording: recordedBlob
      });
    }
  }

  async stopRecording() {
    const { recorder } = this.state;
    if (recorder.state == "recording") {
      recorder.stop();
    }
  }

  onClick() {
    this.toggleRecording();
  }

  onKey(e) {
    if (e.key === " ") {
      this.toggleRecording();
      e.preventDefault();
    } else if (e.key === "m") {
      this.setState({ mirrored: !this.state.mirrored });
    }
  }

  toggleRecording() {
    const { recordingState, duration } = this.state;
    switch (recordingState) {
      case "none":
        this.startRecording();
        break;
      case "recording":
        this.stopRecording();
        if (duration) {
          this.setState({ recording: null, recordingState: "none" });
        }
        break;
    }
  }

  render() {
    const { recorder, recording, recordingState, mirrored } = this.state;

    const width = Math.floor(document.body.clientWidth / 2);
    const height = Math.floor(document.body.clientHeight);
    const style = {
      width,
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden"
    };

    return (
      <div style={{ display: "flex" }}>
        {!recorder && (
          <div style={{ marginTop: 10 }}>Waiting for webcam...</div>
        )}
        <div style={style}>
          <video
            ref={ref => (this.webcam = ref)}
            height={height}
            autoPlay
            muted
          />
        </div>
        {recording && (
          <div style={{ ...style, transform: `scaleX(${mirrored ? -1 : 1})` }}>
            <video
              src={createObjectURL(recording)}
              height={height}
              onLoadedData={() => {
                if (recordingState == "recording") {
                  this.startRecording();
                }
              }}
              onEnded={() => {}}
              autoPlay
              muted
            />
          </div>
        )}
      </div>
    );
  }
}
